const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Debate topic is required'],
    trim: true,
    minlength: [10, 'Topic must be at least 10 characters'],
    maxlength: [200, 'Topic must be less than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description must be less than 1000 characters'],
    trim: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    position: {
      type: String,
      enum: ['pro', 'con'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished', 'cancelled'],
    default: 'waiting'
  },
  winner: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['unanimous_decision', 'time_limit', 'forfeit', 'moderator_decision']
    }
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 2,
      min: 2,
      max: 8
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30,
      min: 5,
      max: 120
    },
    turnTimeLimit: {
      type: Number, // in seconds
      default: 300,
      min: 30,
      max: 600
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    allowSpectators: {
      type: Boolean,
      default: true
    },
    moderatorRequired: {
      type: Boolean,
      default: false
    }
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  spectators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  argumentTree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArgumentTree'
  },
  analytics: {
    totalArguments: {
      type: Number,
      default: 0
    },
    fallaciesDetected: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    participantEngagement: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      argumentCount: {
        type: Number,
        default: 0
      },
      fallaciesCommitted: {
        type: Number,
        default: 0
      },
      averageStrength: {
        type: Number,
        default: 0
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
debateSchema.index({ status: 1, createdAt: -1 });
debateSchema.index({ 'participants.user': 1 });
debateSchema.index({ topic: 'text', description: 'text' });
debateSchema.index({ tags: 1 });

// Virtual for duration
debateSchema.virtual('duration').get(function() {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return null;
});

// Virtual for participant count
debateSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Instance method to add participant
debateSchema.methods.addParticipant = function(userId, position) {
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Debate is full');
  }
  
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({
    user: userId,
    position: position
  });
  
  return this.save();
};

// Instance method to start debate
debateSchema.methods.startDebate = function() {
  if (this.status !== 'waiting') {
    throw new Error('Debate cannot be started');
  }
  
  if (this.participants.length < 2) {
    throw new Error('At least 2 participants required to start debate');
  }
  
  this.status = 'active';
  this.startedAt = new Date();
  
  return this.save();
};

// Instance method to end debate
debateSchema.methods.endDebate = function(winnerId = null, reason = null) {
  if (this.status !== 'active') {
    throw new Error('Debate is not active');
  }
  
  this.status = 'finished';
  this.endedAt = new Date();
  
  if (winnerId) {
    this.winner = {
      user: winnerId,
      reason: reason
    };
  }
  
  return this.save();
};

// Static method to find public debates
debateSchema.statics.findPublic = function() {
  return this.find({ 'settings.isPublic': true, status: { $in: ['waiting', 'active'] } })
    .populate('participants.user', 'username profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to find user debates
debateSchema.statics.findUserDebates = function(userId) {
  return this.find({ 'participants.user': userId })
    .populate('participants.user', 'username profilePicture')
    .sort({ createdAt: -1 });
};

const Debate = mongoose.model('Debate', debateSchema);

module.exports = Debate;
