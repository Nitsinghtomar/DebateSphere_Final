const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema({
  debate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: [true, 'Debate reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  text: {
    type: String,
    required: [true, 'Argument text is required'],
    trim: true,
    minlength: [10, 'Argument must be at least 10 characters'],
    maxlength: [2000, 'Argument must be less than 2000 characters']
  },
  position: {
    type: String,
    enum: ['pro', 'con'],
    required: [true, 'Position is required']
  },
  parentArgument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument'
  }],
  type: {
    type: String,
    enum: ['opening', 'rebuttal', 'counter-rebuttal', 'closing', 'clarification'],
    default: 'opening'
  },
  orderInDebate: {
    type: Number,
    required: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    originalText: String,
    editedAt: Date,
    reason: String
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['agree', 'disagree', 'strong_point', 'needs_evidence', 'unclear']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  citations: [{
    url: String,
    title: String,
    description: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  analytics: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number, // in seconds
      default: 0
    },
    complexityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    sentimentScore: {
      type: Number,
      default: 0,
      min: -1,
      max: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
argumentSchema.index({ debate: 1, orderInDebate: 1 });
argumentSchema.index({ user: 1, createdAt: -1 });
argumentSchema.index({ parentArgument: 1 });
argumentSchema.index({ text: 'text' });

// Virtual for depth level in argument tree
argumentSchema.virtual('depth').get(function() {
  // This would be calculated during population/aggregation
  return this._depth || 0;
});

// Pre-save middleware to calculate analytics
argumentSchema.pre('save', function(next) {
  if (this.isModified('text')) {
    // Calculate word count
    this.analytics.wordCount = this.text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Estimate reading time (average 200 words per minute)
    this.analytics.readingTime = Math.ceil((this.analytics.wordCount / 200) * 60);
    
    // Basic complexity score (can be enhanced with NLP)
    const sentences = this.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = this.analytics.wordCount / sentences.length || 1;
    this.analytics.complexityScore = Math.min(avgWordsPerSentence / 20, 1);
  }
  next();
});

// Instance method to add child argument
argumentSchema.methods.addChild = function(childArgumentId) {
  if (!this.children.includes(childArgumentId)) {
    this.children.push(childArgumentId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to add reaction
argumentSchema.methods.addReaction = function(userId, reactionType) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    type: reactionType
  });
  
  return this.save();
};

// Static method to get debate arguments in order
argumentSchema.statics.findDebateArguments = function(debateId) {
  return this.find({ debate: debateId })
    .populate('user', 'username profilePicture')
    .populate('parentArgument', 'text user')
    .sort({ orderInDebate: 1 });
};

// Static method to get argument thread
argumentSchema.statics.findArgumentThread = function(rootArgumentId) {
  return this.findById(rootArgumentId)
    .populate({
      path: 'children',
      populate: {
        path: 'user',
        select: 'username profilePicture'
      }
    })
    .populate('user', 'username profilePicture');
};

const Argument = mongoose.model('Argument', argumentSchema);

module.exports = Argument;
