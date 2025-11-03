const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  debateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },
  userPosition: {
    type: String,
    enum: ['pro', 'con'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  },

  // Raw transcript with all disfluencies
  rawTranscript: {
    type: String,
    default: ''
  },

  // Cleaned transcript (fillers removed)
  cleanedTranscript: {
    type: String,
    default: ''
  },

  // ✅ NEW: Fallacy count tracking for analytics
  fallacyCount: {
    total: {
      type: Number,
      default: 0
    },
    breakdown: {
      // Tier 1 - Most Common
      ad_hominem: { type: Number, default: 0 },
      strawman: { type: Number, default: 0 },
      false_dilemma: { type: Number, default: 0 },
      slippery_slope: { type: Number, default: 0 },
      appeal_to_authority: { type: Number, default: 0 },
      hasty_generalization: { type: Number, default: 0 },
      
      // Tier 2 - Moderately Common
      red_herring: { type: Number, default: 0 },
      circular_reasoning: { type: Number, default: 0 },
      appeal_to_emotion: { type: Number, default: 0 },
      bandwagon: { type: Number, default: 0 },
      false_equivalence: { type: Number, default: 0 },
      
      // Tier 3 - Less Common
      tu_quoque: { type: Number, default: 0 }
    },
    rate: {
      type: Number,
      default: 0,
      description: 'Fallacies per 100 words'
    }
  },

  // Complete analysis data (stored as flexible object)
  analysis: {
    overallScore: Number,

    fluency: {
      score: Number,
      metrics: {
        wordsPerMinute: Number,
        averagePauseLength: Number,
        pauseCount: Number,
        speechDuration: Number
      },
      disfluencies: {
        total: Number,
        breakdown: {
          filler_uhm: Number,
          filler_uh: Number,
          filler_ah: Number,
          filler_like: Number,
          filler_you_know: Number,
          filler_so: Number,
          filler_actually: Number,
          filler_basically: Number,
          repetitions: Number,
          false_starts: Number
        }
      },
      clarity: {
        score: Number,
        articulation: String,
        mumbling_instances: Number
      },
      feedback: String,
      tips: [String]
    },

    vocabulary: {
      score: Number,
      metrics: {
        totalWords: Number,
        uniqueWords: Number,
        lexicalDiversity: Number,
        averageWordLength: Number
      },
      advancedWords: [{
        word: String,
        count: Number
      }],
      simpleWords: [String],
      suggestions: [String],
      feedback: String,
      tips: [String]
    },

    argumentStrength: {
      score: Number,
      strengths: [{
        point: String,
        reasoning: String
      }],
      weaknesses: [{
        point: String,
        reasoning: String,
        suggestion: String
      }],
      // Keep this array for detailed fallacy explanations (used in AI Coach)
      logicalFallacies: [{
        type: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        context: {
          type: String,
          required: true
        }
      }],
      evidenceUsage: {
        score: Number,
        hasEvidence: Boolean,
        evidenceQuality: String,
        examples: [String]
      },
      rebuttals: {
        score: Number,
        addressed_opponent: Boolean,
        rebuttal_quality: String
      },
      feedback: String,
      tips: [String]
    },

    structure: {
      score: Number,
      opening: {
        score: Number,
        hasHook: Boolean,
        statedPosition: Boolean,
        preview: Boolean,
        feedback: String
      },
      body: {
        score: Number,
        mainPointsCount: Number,
        organization: String,
        transitions: {
          quality: String,
          examples: [String]
        },
        feedback: String
      },
      closing: {
        score: Number,
        hasSummary: Boolean,
        reinforcedPosition: Boolean,
        memorableEnding: Boolean,
        feedback: String
      },
      tips: [String]
    },

    delivery: {
      score: Number,
      pace: {
        assessment: String,
        wordsPerMinute: Number,
        recommendation: String
      },
      confidence: {
        score: Number,
        indicators: {
          assertiveness: Number,
          hesitation: Number,
          filler_word_ratio: Number
        }
      },
      tone: {
        assessment: String,
        variation: String,
        recommendation: String
      },
      feedback: String,
      tips: [String]
    },

    aiSummary: {
      overall: String,
      topStrengths: [String],
      topWeaknesses: [String],
      keyTakeaway: String
    },

    recommendations: {
      immediate: [String],
      practice: [String],
      advanced: [String]
    }
  },

  // Processing metadata
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  }

}, {
  timestamps: true
});

// Indexes for efficient queries
AnalysisSchema.index({ debateId: 1, status: 1 });
AnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', AnalysisSchema);
