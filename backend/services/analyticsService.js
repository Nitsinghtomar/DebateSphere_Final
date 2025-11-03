const AnalyticsMetrics = require('../models/AnalyticsMetrics');
const Analysis = require('../models/Analysis');
const mongoose = require('mongoose');


/**
 * Helper function to convert userId to ObjectId
 */
function convertToObjectId(userId) {
    try {
      if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
        return new mongoose.Types.ObjectId(userId);
      } else {
        // Create deterministic ObjectId from timestamp userId
        const hash = require('crypto').createHash('md5').update(userId).digest('hex');
        return new mongoose.Types.ObjectId(hash.substring(0, 24));
      }
    } catch (err) {
      console.error('❌ Failed to create ObjectId:', err);
      // Fallback: create new ObjectId
      return new mongoose.Types.ObjectId();
    }
  }

/**
 * Extract metrics from Analysis document for analytics tracking
 */
function extractMetricsFromAnalysis(analysisDoc) {
  const analysis = analysisDoc.analysis;
  const fallacyCount = analysisDoc.fallacyCount;
  
  console.log('📊 [Analytics Service] Extracting metrics from analysis...');
  
  return {
    // Core scores
    overallScore: analysis.overallScore || 0,
    fluencyScore: analysis.fluency?.score || 0,
    vocabularyScore: analysis.vocabulary?.score || 0,
    argumentScore: analysis.argumentStrength?.score || 0,
    structureScore: analysis.structure?.score || 0,
    deliveryScore: analysis.delivery?.score || 0,
    confidenceScore: analysis.delivery?.confidence?.score || 0,
    evidenceScore: analysis.argumentStrength?.evidenceUsage?.score || 0,
    rebuttalScore: analysis.argumentStrength?.rebuttals?.score || 0,
    
    // Speech metrics
    wordsPerMinute: analysis.fluency?.metrics?.wordsPerMinute || 0,
    lexicalDiversity: analysis.vocabulary?.metrics?.lexicalDiversity || 0,
    totalDisfluencies: analysis.fluency?.disfluencies?.total || 0,
    pauseCount: analysis.fluency?.metrics?.pauseCount || 0,
    averagePauseLength: analysis.fluency?.metrics?.averagePauseLength || 0,
    
    // Fallacy metrics
    totalFallacies: fallacyCount?.total || 0,
    fallacyRate: fallacyCount?.rate || 0,
    fallacyBreakdown: {
      ad_hominem: fallacyCount?.breakdown?.ad_hominem || 0,
      strawman: fallacyCount?.breakdown?.strawman || 0,
      false_dilemma: fallacyCount?.breakdown?.false_dilemma || 0,
      slippery_slope: fallacyCount?.breakdown?.slippery_slope || 0,
      appeal_to_authority: fallacyCount?.breakdown?.appeal_to_authority || 0,
      hasty_generalization: fallacyCount?.breakdown?.hasty_generalization || 0,
      red_herring: fallacyCount?.breakdown?.red_herring || 0,
      circular_reasoning: fallacyCount?.breakdown?.circular_reasoning || 0,
      appeal_to_emotion: fallacyCount?.breakdown?.appeal_to_emotion || 0,
      bandwagon: fallacyCount?.breakdown?.bandwagon || 0,
      false_equivalence: fallacyCount?.breakdown?.false_equivalence || 0,
      tu_quoque: fallacyCount?.breakdown?.tu_quoque || 0
    }
  };
}

/**
 * Update or create analytics metrics after analysis completes
 */
async function updateUserAnalytics(userId, analysisDoc) {
  try {
    console.log('📊 [Analytics Service] Updating user analytics...');
    console.log('   User ID:', userId);
    console.log('   Analysis ID:', analysisDoc._id);
    console.log('   Debate ID:', analysisDoc.debateId);
    
    // Get or create analytics document for user
    let analytics = await AnalyticsMetrics.getOrCreate(userId);
    
    // Extract metrics from analysis
    const metrics = extractMetricsFromAnalysis(analysisDoc);
    
    console.log('📊 [Analytics Service] Extracted metrics:');
    console.log('   Overall Score:', metrics.overallScore);
    console.log('   Total Fallacies:', metrics.totalFallacies);
    console.log('   Fallacy Rate:', metrics.fallacyRate);
    
    // Add new debate metrics using instance method
    await analytics.addDebateMetrics(
      analysisDoc.debateId,
      analysisDoc._id,
      metrics
    );
    
    console.log('✅ [Analytics Service] User analytics updated successfully');
    console.log('   Total debates tracked:', analytics.debateHistory.length);
    
    return {
      success: true,
      debatesTracked: analytics.debateHistory.length
    };
    
  } catch (error) {
    console.error('❌ [Analytics Service] Error updating analytics:', error);
    throw error;
  }
}

/**
 * Get user's analytics history
 */
async function getUserAnalytics(userId, limit = 20) {
    try {
      console.log('📊 [Analytics Service] Fetching user analytics...');
      console.log('   User ID:', userId);
      console.log('   Limit:', limit);
      
      // ✅ Convert userId to ObjectId
      const userObjectId = convertToObjectId(userId);
      console.log('   Converted ObjectId:', userObjectId);
      
      const analytics = await AnalyticsMetrics.findOne({ userId: userObjectId })
        .populate('debateHistory.debateId', 'topic status')
        .lean();
      
      if (!analytics) {
        console.log('⚠️ [Analytics Service] No analytics found for user');
        return {
          success: true,
          debateHistory: [],
          totalDebates: 0
        };
      }
      
      // Sort by timestamp descending (most recent first)
      const sortedHistory = analytics.debateHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      console.log('✅ [Analytics Service] Analytics fetched successfully');
      console.log('   Total debates:', analytics.debateHistory.length);
      console.log('   Returned:', sortedHistory.length);
      
      return {
        success: true,
        debateHistory: sortedHistory,
        totalDebates: analytics.debateHistory.length
      };
      
    } catch (error) {
      console.error('❌ [Analytics Service] Error fetching analytics:', error);
      throw error;
    }
  }
  

/**
 * Calculate trends and improvements
 */
async function calculateTrends(userId) {
    try {
      console.log('📊 [Analytics Service] Calculating trends...');
      console.log('   User ID:', userId);
      
      // ✅ Convert userId to ObjectId
      const userObjectId = convertToObjectId(userId);
      console.log('   Converted ObjectId:', userObjectId);
      
      const analytics = await AnalyticsMetrics.findOne({ userId: userObjectId }).lean();
      
      if (!analytics || analytics.debateHistory.length < 2) {
        console.log('⚠️ [Analytics Service] Not enough data for trends');
        return {
          success: true,
          hasEnoughData: false,
          message: 'Need at least 2 debates for trend analysis'
        };
      }
      
      // ... rest of the function stays the same ...
      const history = analytics.debateHistory
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const totalDebates = history.length;
      
      // Split into recent (last 5) and previous (5-10 debates ago)
      const recentDebates = history.slice(-5);
      const previousDebates = history.slice(-10, -5);
      
      // Calculate averages
      const calculateAverage = (debates, field) => {
        if (debates.length === 0) return 0;
        const sum = debates.reduce((acc, d) => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], d);
          return acc + (value || 0);
        }, 0);
        return sum / debates.length;
      };
      
      // Metrics to track
      const metricsToTrack = [
        'metrics.overallScore',
        'metrics.fluencyScore',
        'metrics.vocabularyScore',
        'metrics.argumentScore',
        'metrics.structureScore',
        'metrics.deliveryScore',
        'metrics.confidenceScore',
        'metrics.totalDisfluencies',
        'metrics.totalFallacies',
        'metrics.fallacyRate'
      ];
      
      const trends = {};
      
      metricsToTrack.forEach(metric => {
        const recentAvg = calculateAverage(recentDebates, metric);
        const previousAvg = previousDebates.length > 0 
          ? calculateAverage(previousDebates, metric) 
          : recentAvg;
        
        const change = recentAvg - previousAvg;
        const percentChange = previousAvg !== 0 
          ? ((change / previousAvg) * 100).toFixed(2)
          : 0;
        
        const isImprovement = metric.includes('Disfluencies') || metric.includes('Fallac')
          ? change < 0
          : change > 0;
        
        trends[metric.split('.')[1]] = {
          recentAvg: parseFloat(recentAvg.toFixed(2)),
          previousAvg: parseFloat(previousAvg.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          percentChange: parseFloat(percentChange),
          isImprovement,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      });
      
      // Identify problem areas
      const problemAreas = [];
      
      if (trends.totalFallacies.recentAvg > 2) {
        problemAreas.push({
          metric: 'Fallacy Usage',
          issue: 'High fallacy count',
          value: trends.totalFallacies.recentAvg,
          recommendation: 'Focus on logical reasoning and avoid common fallacies'
        });
      }
      
      if (trends.totalDisfluencies.recentAvg > 15) {
        problemAreas.push({
          metric: 'Fluency',
          issue: 'High disfluency count',
          value: trends.totalDisfluencies.recentAvg,
          recommendation: 'Practice reducing filler words and pauses'
        });
      }
      
      if (trends.argumentScore.recentAvg < 60) {
        problemAreas.push({
          metric: 'Argument Strength',
          issue: 'Low argument quality',
          value: trends.argumentScore.recentAvg,
          recommendation: 'Strengthen your arguments with better evidence and logic'
        });
      }
      
      console.log('✅ [Analytics Service] Trends calculated successfully');
      
      return {
        success: true,
        hasEnoughData: true,
        totalDebates,
        recentDebatesCount: recentDebates.length,
        previousDebatesCount: previousDebates.length,
        trends,
        problemAreas
      };
      
    } catch (error) {
      console.error('❌ [Analytics Service] Error calculating trends:', error);
      throw error;
    }
  }
  
/**
 * Get aggregate statistics
 */
async function getAggregateStats(userId) {
    try {
      console.log('📊 [Analytics Service] Calculating aggregate stats...');
      console.log('   User ID:', userId);
      
      // ✅ Convert userId to ObjectId
      const userObjectId = convertToObjectId(userId);
      console.log('   Converted ObjectId:', userObjectId);
      
      const analytics = await AnalyticsMetrics.findOne({ userId: userObjectId }).lean();
      
      if (!analytics || analytics.debateHistory.length === 0) {
        console.log('⚠️ [Analytics Service] No data for aggregate stats');
        return {
          success: true,
          hasData: false,
          message: 'No debates found'
        };
      }
      
      // ... rest of the function stays the same ...
      const history = analytics.debateHistory;
      const totalDebates = history.length;
      
      const calculateAvg = (field) => {
        const sum = history.reduce((acc, d) => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], d);
          return acc + (value || 0);
        }, 0);
        return (sum / totalDebates).toFixed(2);
      };
      
      const sortedByOverall = [...history].sort((a, b) => 
        (b.metrics?.overallScore || 0) - (a.metrics?.overallScore || 0)
      );
      
      const bestPerformance = sortedByOverall[0];
      const worstPerformance = sortedByOverall[sortedByOverall.length - 1];
      
      const fallacyTotals = {};
      const fallacyTypes = [
        'ad_hominem', 'strawman', 'false_dilemma', 'slippery_slope',
        'appeal_to_authority', 'hasty_generalization', 'red_herring',
        'circular_reasoning', 'appeal_to_emotion', 'bandwagon',
        'false_equivalence', 'tu_quoque'
      ];
      
      fallacyTypes.forEach(type => {
        fallacyTotals[type] = history.reduce((sum, d) => 
          sum + (d.metrics?.fallacyBreakdown?.[type] || 0), 0
        );
      });
      
      const mostCommonFallacies = Object.entries(fallacyTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));
      
      const stats = {
        totalDebates,
        averages: {
          overallScore: parseFloat(calculateAvg('metrics.overallScore')),
          fluencyScore: parseFloat(calculateAvg('metrics.fluencyScore')),
          vocabularyScore: parseFloat(calculateAvg('metrics.vocabularyScore')),
          argumentScore: parseFloat(calculateAvg('metrics.argumentScore')),
          structureScore: parseFloat(calculateAvg('metrics.structureScore')),
          deliveryScore: parseFloat(calculateAvg('metrics.deliveryScore')),
          confidenceScore: parseFloat(calculateAvg('metrics.confidenceScore')),
          wordsPerMinute: parseFloat(calculateAvg('metrics.wordsPerMinute')),
          totalDisfluencies: parseFloat(calculateAvg('metrics.totalDisfluencies')),
          totalFallacies: parseFloat(calculateAvg('metrics.totalFallacies')),
          fallacyRate: parseFloat(calculateAvg('metrics.fallacyRate'))
        },
        bestPerformance: {
          debateId: bestPerformance.debateId,
          score: bestPerformance.metrics?.overallScore,
          date: bestPerformance.timestamp
        },
        worstPerformance: {
          debateId: worstPerformance.debateId,
          score: worstPerformance.metrics?.overallScore,
          date: worstPerformance.timestamp
        },
        mostCommonFallacies
      };
      
      console.log('✅ [Analytics Service] Aggregate stats calculated successfully');
      
      return {
        success: true,
        hasData: true,
        stats
      };
      
    } catch (error) {
      console.error('❌ [Analytics Service] Error calculating aggregate stats:', error);
      throw error;
    }
  }

module.exports = {
  updateUserAnalytics,
  getUserAnalytics,
  calculateTrends,
  getAggregateStats
};
