const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { protect } = require('../middleware/auth');

console.log('🛣️  [DebateAI Routes] Loading debate AI routes...');

// All routes require authentication
// router.use(protect);

/**
 * POST /api/debate-ai/start
 */
router.post('/start', async (req, res) => {
  console.log('\n🌟 [Route: /start] ========== NEW REQUEST ==========');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   User: ${req.user?.username || 'unknown'}`);
  console.log(`   Body:`, req.body);
  
  try {
    const { debateId, topic, userPosition } = req.body;

    if (!debateId || !topic || !userPosition) {
      console.error('❌ [Route: /start] Missing required fields!');
      return res.status(400).json({
        success: false,
        message: 'debateId, topic, and userPosition are required'
      });
    }

    const aiPosition = userPosition === 'pro' ? 'con' : 'pro';
    console.log(`   AI will take ${aiPosition.toUpperCase()} position`);

    const result = await geminiService.startDebate(
      debateId,
      topic,
      userPosition,
      aiPosition
    );

    console.log('✅ [Route: /start] Success! Sending response...');
    res.json(result);

  } catch (error) {
    console.error('❌ [Route: /start] Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start AI debate'
    });
  }
});

/**
 * POST /api/debate-ai/message
 */
router.post('/message', async (req, res) => {
  console.log('\n💬 [Route: /message] ========== NEW MESSAGE ==========');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   User: ${req.user?.username || 'unknown'}`);
  console.log(`   Debate ID: ${req.body.debateId}`);
  
  try {
    const { debateId, message } = req.body;

    if (!debateId || !message) {
      console.error('❌ [Route: /message] Missing required fields!');
      return res.status(400).json({
        success: false,
        message: 'debateId and message are required'
      });
    }

    const result = await geminiService.sendMessage(debateId, message);

    console.log('✅ [Route: /message] Success! Sending response...');
    res.json(result);

  } catch (error) {
    console.error('❌ [Route: /message] Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response'
    });
  }
});

/**
 * GET /api/debate-ai/history/:debateId
 */
router.get('/history/:debateId', async (req, res) => {
  console.log('\n📜 [Route: /history] ========== HISTORY REQUEST ==========');
  console.log(`   Debate ID: ${req.params.debateId}`);
  
  try {
    const { debateId } = req.params;
    const result = await geminiService.getDebateHistory(debateId);

    console.log('✅ [Route: /history] Success!');
    res.json(result);

  } catch (error) {
    console.error('❌ [Route: /history] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve debate history'
    });
  }
});

/**
 * POST /api/debate-ai/end
 */
router.post('/end', async (req, res) => {
  console.log('\n🛑 [Route: /end] ========== END DEBATE ==========');
  console.log(`   Debate ID: ${req.body.debateId}`);
  
  try {
    const { debateId } = req.body;

    if (!debateId) {
      console.error('❌ [Route: /end] Missing debateId!');
      return res.status(400).json({
        success: false,
        message: 'debateId is required'
      });
    }

    const result = geminiService.endDebate(debateId);

    console.log('✅ [Route: /end] Success!');
    res.json(result);

  } catch (error) {
    console.error('❌ [Route: /end] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to end debate'
    });
  }
});

/**
 * GET /api/debate-ai/summary/:debateId
 */
router.get('/summary/:debateId', async (req, res) => {
  console.log('\n📊 [Route: /summary] ========== SUMMARY REQUEST ==========');
  console.log(`   Debate ID: ${req.params.debateId}`);
  
  try {
    const { debateId } = req.params;
    const result = await geminiService.getDebateSummary(debateId);

    console.log('✅ [Route: /summary] Success!');
    res.json(result);

  } catch (error) {
    console.error('❌ [Route: /summary] Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary'
    });
  }
});

/**
 * GET /api/debate-ai/topics
 * Generate debate topics using AI
 */
router.get('/topics', async (req, res) => {
    console.log('\n🎲 [Route: /topics] ========== TOPIC GENERATION REQUEST ==========');
    
    try {
      const count = parseInt(req.query.count) || 6;
      console.log(`   Requested topics: ${count}`);
      
      const result = await geminiService.generateDebateTopics(count);
      
      console.log('✅ [Route: /topics] Success!');
      res.json(result);
  
    } catch (error) {
      console.error('❌ [Route: /topics] Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to generate topics'
      });
    }
  });
  

console.log('✅ [DebateAI Routes] Routes loaded successfully!');
module.exports = router;


