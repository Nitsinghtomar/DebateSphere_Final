const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't include in queries by default
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name must be less than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name must be less than 50 characters']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  stats: {
    debatesWon: {
      type: Number,
      default: 0
    },
    debatesLost: {
      type: Number,
      default: 0
    },
    totalDebates: {
      type: Number,
      default: 0
    },
    fallaciesCommitted: [{
      type: {
        type: String,
        enum: [
          'Ad Hominem', 'Strawman', 'Appeal to Ignorance', 'Hasty Generalization',
          'False Dilemma', 'Slippery Slope', 'Circular Reasoning', 'Appeal to Authority',
          'Red Herring', 'Tu Quoque', 'Bandwagon', 'No True Scotsman', 'Equivocation'
        ]
      },
      count: {
        type: Number,
        default: 0
      }
    }],
    averageArgumentStrength: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    totalArgumentsAnalyzed: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    debateReminders: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  if (this.stats.totalDebates === 0) return 0;
  return (this.stats.debatesWon / this.stats.totalDebates * 100).toFixed(1);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();

  // commented ================== MODIFIED =================
  console.log('--- Hashing Password ---');
  // commented ================== MODIFIED =================
  try {
    // Hash the password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    // commented ================== MODIFIED =================
    console.log('Password hashed successfully.');
    // commented ================== MODIFIED =================
    next();
  } catch (error) {
    // commented ================== MODIFIED =================
    console.error('Error hashing password:', error);
    // commented ================== MODIFIED =================
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
  // commented ================== MODIFIED =================
  console.log('--- Checking Password ---');
  const isMatch = await bcrypt.compare(candidatePassword, this.passwordHash);
  console.log('Password match:', isMatch);
  // commented ================== MODIFIED =================
  return isMatch;
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;