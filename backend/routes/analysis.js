const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const Debate = require('../models/Debate');
const { analyzeDebateAudio } = require('../services/geminiAnalysisService');
const analyticsService = require('../services/analyticsService'); // ✅ NEW
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for audio uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * POST /api/analysis/finish-debate
 * Finish debate and trigger analysis
 */
router.post('/finish-debate', upload.single('audio'), async (req, res) => {
  console.log('\n🏁 [Route: /finish-debate] ========== NEW REQUEST ==========');
  console.log('   Time:', new Date().toISOString());
  console.log('   User:', req.body.userId || 'unknown');
  console.log('   Debate ID:', req.body.debateId);
  
  try {
    const { debateId, userId, topic, userPosition, duration } = req.body;
    const audioFile = req.file;
    
    // Validate inputs
    if (!debateId || !userId || !topic || !userPosition || !audioFile) {
      console.error('❌ [Route: /finish-debate] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: debateId, userId, topic, userPosition, audio'
      });
    }
    
    console.log('📝 [Route: /finish-debate] Request validated');
    console.log('   Audio file:', audioFile.originalname, `(${(audioFile.size / 1024).toFixed(2)} KB)`);
    
    // 🔥 FIX: Convert userId to ObjectId if it's not already
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } else {
        // Create a deterministic ObjectId from the timestamp userId
        // This ensures same user always gets same ObjectId
        const hash = require('crypto').createHash('md5').update(userId).digest('hex');
        userObjectId = new mongoose.Types.ObjectId(hash.substring(0, 24));
      }
    } catch (err) {
      console.error('❌ Failed to create user ObjectId:', err);
      // Fallback: create a new ObjectId
      userObjectId = new mongoose.Types.ObjectId();
    }
    
    console.log('🔄 [Route: /finish-debate] User ObjectId:', userObjectId);
    
    // 🔥 IMPORTANT: Create Debate FIRST (because Analysis requires debateId)
    let debate;
    try {
      debate = new Debate({
        topic: topic,
        participants: [{
          user: userObjectId,
          position: userPosition,
          joinedAt: new Date()
        }],
        status: 'finished',
        finishedAt: new Date(),
        totalDuration: parseInt(duration) || 0,
        startedAt: new Date(Date.now() - (parseInt(duration) || 0) * 1000)
      });
      
      await debate.save();
      console.log('✅ [Route: /finish-debate] Debate record created:', debate._id);
    } catch (debateError) {
      console.error('❌ [Route: /finish-debate] Failed to create Debate record:', debateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create debate record',
        error: debateError.message
      });
    }
    
    // Now create Analysis with valid debateId
    const analysis = new Analysis({
      debateId: debate._id, // ✅ Now we have a valid debate ID
      userId: userObjectId,
      topic: topic,
      userPosition: userPosition,
      status: 'pending'
    });
    
    await analysis.save();
    console.log('✅ [Route: /finish-debate] Analysis document created:', analysis._id);
    
    // Update debate with analysis reference
    debate.analysisId = analysis._id;
    debate.analysisStatus = 'pending';
    await debate.save();
    console.log('✅ [Route: /finish-debate] Debate updated with analysis reference');
    
    // Return immediately (don't wait for processing)
    res.json({
      success: true,
      message: 'Debate finished. Analysis is being generated.',
      debateId: debate._id,
      analysisId: analysis._id,
      status: 'pending'
    });
    
    console.log('✅ [Route: /finish-debate] Response sent to client');
    console.log('🚀 [Route: /finish-debate] Starting background analysis...');
    
    // Process analysis in background (don't await)
    processAnalysisInBackground(analysis._id, audioFile.path, {
      topic,
      userPosition,
      duration: parseInt(duration) || 0
    }, userObjectId).catch(error => { // ✅ PASS userObjectId
      console.error('❌ [Background Analysis] Failed:', error);
    });
    
  } catch (error) {
    console.error('❌ [Route: /finish-debate] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finish debate',
      error: error.message
    });
  }
});

/**
 * Background processing function
 * ✅ UPDATED: Now updates analytics after completion
 */
async function processAnalysisInBackground(analysisId, audioFilePath, debateContext, userId) { // ✅ ADD userId param
  const startTime = Date.now();
  console.log(`\n🔄 [Background Analysis] Starting for analysis ${analysisId}`);
  
  try {
    // Call Gemini analysis service
    const result = await analyzeDebateAudio(audioFilePath, debateContext);
    
    if (!result.success) {
      throw new Error('Analysis failed');
    }
    
    // ✅ NEW: Include fallacyCount in update
    const updateData = {
      status: 'completed',
      rawTranscript: result.rawTranscript,
      cleanedTranscript: result.cleanedTranscript,
      analysis: result.analysis,
      processingTime: result.processingTime,
      completedAt: new Date()
    };
    
    // ✅ NEW: Add fallacyCount if it exists in analysis
    if (result.analysis.fallacyCount) {
      updateData.fallacyCount = result.analysis.fallacyCount;
    }
    
    // Update Analysis document with results
    await Analysis.findByIdAndUpdate(analysisId, updateData);
    
    // Update Debate status
    const analysis = await Analysis.findById(analysisId);
    if (analysis.debateId) {
      await Debate.findByIdAndUpdate(analysis.debateId, {
        analysisStatus: 'completed'
      });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [Background Analysis] Completed in ${totalTime}ms`);
    console.log(`   Analysis ID: ${analysisId}`);
    console.log(`   Overall Score: ${result.analysis.overallScore}/100`);
    
    // ✅ NEW: Update analytics metrics
    try {
      console.log('📊 [Background Analysis] Updating user analytics...');
      await analyticsService.updateUserAnalytics(userId, analysis);
      console.log('✅ [Background Analysis] Analytics updated successfully');
    } catch (analyticsError) {
      console.error('⚠️ [Background Analysis] Failed to update analytics:', analyticsError);
      // Don't fail the entire process if analytics update fails
    }
    
  } catch (error) {
    console.error(`❌ [Background Analysis] Failed for ${analysisId}:`, error);
    
    // Mark as failed
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'failed',
      errorMessage: error.message
    });
    
    const analysis = await Analysis.findById(analysisId);
    if (analysis?.debateId) {
      await Debate.findByIdAndUpdate(analysis.debateId, {
        analysisStatus: 'failed'
      });
    }
    
  } finally {
    // Clean up audio file
    try {
      fs.unlinkSync(audioFilePath);
      console.log('🗑️ [Background Analysis] Audio file cleaned up');
    } catch (cleanupError) {
      console.error('⚠️ [Background Analysis] Failed to delete audio file:', cleanupError);
    }
  }
}

/**
 * GET /api/analysis/status/:debateId
 * Check analysis status for a debate
 */
router.get('/status/:debateId', async (req, res) => {
  console.log('\n🔍 [Route: /status/:debateId] Checking analysis status');
  console.log('   Debate ID:', req.params.debateId);
  
  try {
    let debate;
    
    // Check if it's a valid ObjectId format
    if (mongoose.Types.ObjectId.isValid(req.params.debateId) && req.params.debateId.length === 24) {
      debate = await Debate.findById(req.params.debateId);
    }
    
    if (!debate) {
      // Try to find the most recent analysis
      const analysis = await Analysis.findOne().sort({ createdAt: -1 });
      if (analysis) {
        return res.json({
          success: true,
          status: analysis.status,
          analysisId: analysis._id,
          completedAt: analysis.completedAt || null,
          overallScore: analysis.analysis?.overallScore || null
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'No analysis found'
      });
    }
    
    const analysis = await Analysis.findById(debate.analysisId);
    
    res.json({
      success: true,
      status: debate.analysisStatus,
      analysisId: debate.analysisId,
      completedAt: analysis?.completedAt || null,
      overallScore: analysis?.analysis?.overallScore || null
    });
    
  } catch (error) {
    console.error('❌ [Route: /status] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check analysis status',
      error: error.message
    });
  }
});

/**
 * GET /api/analysis/:analysisId
 * Get full analysis results
 */
router.get('/:analysisId', async (req, res) => {
  console.log('\n📊 [Route: /analysis/:analysisId] Fetching analysis');
  console.log('   Analysis ID:', req.params.analysisId);
  
  try {
    const analysis = await Analysis.findById(req.params.analysisId)
      .populate('debateId', 'topic participants')
      .populate('userId', 'username email');
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }
    
    if (analysis.status === 'pending') {
      return res.json({
        success: true,
        status: 'pending',
        message: 'Analysis is still being generated'
      });
    }
    
    if (analysis.status === 'failed') {
      return res.json({
        success: false,
        status: 'failed',
        message: 'Analysis failed',
        error: analysis.errorMessage
      });
    }
    
    res.json({
      success: true,
      status: 'completed',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ [Route: /analysis] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis',
      error: error.message
    });
  }
});

/**
 * GET /api/analysis/user/:userId
 * Get all analyses for a user
 */
router.get('/user/:userId', async (req, res) => {
  console.log('\n👤 [Route: /user/:userId] Fetching user analyses');
  console.log('   User ID:', req.params.userId);
  
  try {
    // Try to convert userId to ObjectId
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.userId) && req.params.userId.length === 24) {
        userObjectId = new mongoose.Types.ObjectId(req.params.userId);
      } else {
        const hash = require('crypto').createHash('md5').update(req.params.userId).digest('hex');
        userObjectId = new mongoose.Types.ObjectId(hash.substring(0, 24));
      }
    } catch (err) {
      // If conversion fails, just get all recent analyses
      const analyses = await Analysis.find({})
        .populate('debateId', 'topic createdAt')
        .sort({ createdAt: -1 })
        .limit(50);
      
      return res.json({
        success: true,
        count: analyses.length,
        analyses: analyses
      });
    }
    
    const analyses = await Analysis.find({ userId: userObjectId })
      .populate('debateId', 'topic createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: analyses.length,
      analyses: analyses
    });
    
  } catch (error) {
    console.error('❌ [Route: /user] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analyses',
      error: error.message
    });
  }
});

module.exports = router;
