const mongoose = require('mongoose');

const aiFeedbackSchema = new mongoose.Schema({
  argument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
    required: [true, 'Argument reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  analysis: {
    fallacies: [{
      type: {
        type: String,
        enum: [
          'Ad Hominem', 'Strawman', 'Appeal to Ignorance', 'Hasty Generalization',
          'False Dilemma', 'Slippery Slope', 'Circular Reasoning', 'Appeal to Authority',
          'Red Herring', 'Tu Quoque', 'Bandwagon', 'No True Scotsman', 'Equivocation'
        ],
        required: true
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      explanation: {
        type: String,
        required: true,
        maxlength: 500
      },
      textSpan: {
        start: Number,
        end: Number
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    strengthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    coherenceScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    evidenceScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    clarityScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    }
  },
  suggestions: [{
    type: {
      type: String,
      enum: ['evidence', 'clarity', 'structure', 'logic', 'tone', 'conciseness'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 300
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  modelInfo: {
    modelName: {
      type: String,
      required: true
    },
    modelVersion: {
      type: String,
      default: '1.0.0'
    },
    processingTime: {
      type: Number, // in milliseconds
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    }
  },
  userFeedback: {
    helpful: {
      type: Boolean,
      default: null
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comments: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
aiFeedbackSchema.index({ argument: 1 });
aiFeedbackSchema.index({ user: 1, createdAt: -1 });
aiFeedbackSchema.index({ 'analysis.fallacies.type': 1 });
aiFeedbackSchema.index({ 'modelInfo.modelName': 1 });

// Virtual for overall feedback quality
aiFeedbackSchema.virtual('overallScore').get(function() {
  const { strengthScore, coherenceScore, evidenceScore, clarityScore } = this.analysis;
  return ((strengthScore + coherenceScore + evidenceScore + clarityScore) / 4).toFixed(2);
});

// Virtual for fallacy count
aiFeedbackSchema.virtual('fallacyCount').get(function() {
  return this.analysis.fallacies.length;
});

// Virtual for high severity fallacies
aiFeedbackSchema.virtual('criticalFallacies').get(function() {
  return this.analysis.fallacies.filter(f => f.severity === 'high');
});

// Instance method to add user feedback
aiFeedbackSchema.methods.addUserFeedback = function(helpful, rating, comments) {
  this.userFeedback = {
    helpful: helpful,
    rating: rating,
    comments: comments,
    submittedAt: new Date()
  };
  return this.save();
};

// Static method to get user's feedback history
aiFeedbackSchema.statics.getUserFeedbackHistory = function(userId, limit = 20) {
  return this.find({ user: userId })
    .populate('argument', 'text type createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get model performance analytics
aiFeedbackSchema.statics.getModelAnalytics = function(modelName, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'modelInfo.modelName': modelName,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        avgProcessingTime: { $avg: '$modelInfo.processingTime' },
        avgConfidence: { $avg: '$modelInfo.confidence' },
        avgUserRating: { $avg: '$userFeedback.rating' },
        helpfulCount: {
          $sum: {
            $cond: [{ $eq: ['$userFeedback.helpful', true] }, 1, 0]
          }
        },
        fallacyDistribution: {
          $push: '$analysis.fallacies.type'
        }
      }
    }
  ]);
};

// Static method to get fallacy trends
aiFeedbackSchema.statics.getFallacyTrends = function(userId = null, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const matchStage = { createdAt: { $gte: startDate } };
  
  if (userId) {
    matchStage.user = new mongoose.Types.ObjectId(userId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$analysis.fallacies' },
    {
      $group: {
        _id: '$analysis.fallacies.type',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$analysis.fallacies.confidence' },
        avgSeverity: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$analysis.fallacies.severity', 'low'] }, then: 1 },
                { case: { $eq: ['$analysis.fallacies.severity', 'medium'] }, then: 2 },
                { case: { $eq: ['$analysis.fallacies.severity', 'high'] }, then: 3 }
              ],
              default: 2
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const AIFeedback = mongoose.model('AIFeedback', aiFeedbackSchema);

module.exports = AIFeedback;
