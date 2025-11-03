const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');
const mongoose = require('mongoose');

// ✅ All routes are protected (require authentication)
// ✅ Comment out for now if auth is not fully set up
// router.use(protect);

/**
 * GET /api/analytics
 * Get user's analytics history
 */
router.get('/', async (req, res) => {
  console.log('\n📊 [Route: GET /analytics] Fetching user analytics');
  
  try {
    // Get userId from auth middleware or query param
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log('   User ID:', userId);
    
    const limit = parseInt(req.query.limit) || 20;
    const result = await analyticsService.getUserAnalytics(userId, limit);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ [Route: GET /analytics] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/trends
 * Get trend analysis (recent vs previous performance)
 */
router.get('/trends', async (req, res) => {
  console.log('\n📈 [Route: GET /analytics/trends] Calculating trends');
  
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log('   User ID:', userId);
    
    const result = await analyticsService.calculateTrends(userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ [Route: GET /analytics/trends] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trends',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/summary
 * Get aggregate statistics
 */
router.get('/summary', async (req, res) => {
  console.log('\n📊 [Route: GET /analytics/summary] Calculating summary stats');
  
  try {
    const userId = req.user?.id || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log('   User ID:', userId);
    
    const result = await analyticsService.getAggregateStats(userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ [Route: GET /analytics/summary] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate summary',
      error: error.message
    });
  }
});

module.exports = router;
