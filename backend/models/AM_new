const mongoose = require('mongoose');

const AnalyticsMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One document per user
    index: true
  },
  
  debateHistory: [{
    debateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debate',
      required: true
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    // Extracted metrics from analysis
    metrics: {
      // Core performance scores (0-100)
      overallScore: { type: Number, default: 0 },
      fluencyScore: { type: Number, default: 0 },
      vocabularyScore: { type: Number, default: 0 },
      argumentScore: { type: Number, default: 0 },
      structureScore: { type: Number, default: 0 },
      deliveryScore: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 0 },
      evidenceScore: { type: Number, default: 0 },
      rebuttalScore: { type: Number, default: 0 },
      
      // Speech metrics
      wordsPerMinute: { type: Number, default: 0 },
      lexicalDiversity: { type: Number, default: 0 },
      totalDisfluencies: { type: Number, default: 0 },
      pauseCount: { type: Number, default: 0 },
      averagePauseLength: { type: Number, default: 0 },
      
      // Fallacy metrics
      totalFallacies: { type: Number, default: 0 },
      fallacyRate: { type: Number, default: 0 }, // per 100 words
      fallacyBreakdown: {
        // Tier 1
        ad_hominem: { type: Number, default: 0 },
        strawman: { type: Number, default: 0 },
        false_dilemma: { type: Number, default: 0 },
        slippery_slope: { type: Number, default: 0 },
        appeal_to_authority: { type: Number, default: 0 },
        hasty_generalization: { type: Number, default: 0 },
        
        // Tier 2
        red_herring: { type: Number, default: 0 },
        circular_reasoning: { type: Number, default: 0 },
        appeal_to_emotion: { type: Number, default: 0 },
        bandwagon: { type: Number, default: 0 },
        false_equivalence: { type: Number, default: 0 },
        
        // Tier 3
        tu_quoque: { type: Number, default: 0 }
      }
    }
  }],
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware: Limit to 20 most recent debates
AnalyticsMetricsSchema.pre('save', function(next) {
  if (this.debateHistory.length > 20) {
    // Keep only the last 20 entries
    this.debateHistory = this.debateHistory.slice(-20);
  }
  this.lastUpdated = Date.now();
  next();
});

// Instance method: Add new debate metrics
AnalyticsMetricsSchema.methods.addDebateMetrics = function(debateId, analysisId, metrics) {
  this.debateHistory.push({
    debateId,
    analysisId,
    timestamp: new Date(),
    metrics
  });
  
  // Ensure only 20 entries
  if (this.debateHistory.length > 20) {
    this.debateHistory = this.debateHistory.slice(-20);
  }
  
  return this.save();
};

// Static method: Get or create analytics document for user
AnalyticsMetricsSchema.statics.getOrCreate = async function(userId) {
  let analytics = await this.findOne({ userId });
  
  if (!analytics) {
    analytics = await this.create({
      userId,
      debateHistory: []
    });
  }
  
  return analytics;
};

// Index for efficient queries
AnalyticsMetricsSchema.index({ userId: 1 });
AnalyticsMetricsSchema.index({ 'debateHistory.timestamp': -1 });

module.exports = mongoose.model('AnalyticsMetrics', AnalyticsMetricsSchema);
