const express = require('express');
const validator = require('validator');
const User = require('../models/User');
const { createSendToken, protect, createAuthLimiter } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = createAuthLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const registerLimiter = createAuthLimiter(60 * 60 * 1000, 3); // 3 attempts per hour

// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { username, email, password, confirmPassword, firstName, lastName } = req.body;
  const errors = [];

  // Required fields
  if (!username) errors.push('Username is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!confirmPassword) errors.push('Password confirmation is required');

  // Username validation
  if (username && (username.length < 3 || username.length > 30)) {
    errors.push('Username must be between 3 and 30 characters');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (email && !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (password) {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  // Password confirmation
  if (password && confirmPassword && password !== confirmPassword) {
    errors.push('Password confirmation does not match');
  }

  // Optional field validation
  if (firstName && firstName.length > 50) {
    errors.push('First name must be less than 50 characters');
  }
  if (lastName && lastName.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (email && !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, validateRegistration, async (req, res) => {
  // commented ================== MODIFIED =================
  console.log('--- Register Route Hit ---');
  console.log('Request Body:', req.body);
  // commented ================== MODIFIED =================
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      // commented ================== MODIFIED =================
      console.log('User already exists:', existingUser);
      // commented ================== MODIFIED =================
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({
        status: 'error',
        message: `A user with this ${field} already exists`
      });
    }

    // Create new user
    // commented ================== MODIFIED =================
    console.log('Creating new user...');
    // commented ================== MODIFIED =================
    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save middleware
      firstName: firstName?.trim(),
      lastName: lastName?.trim()
    });
    // commented ================== MODIFIED =================
    console.log('New user created:', newUser);
    // commented ================== MODIFIED =================

    // Update last login
    await newUser.updateLastLogin();

    // Send token
    createSendToken(newUser, 201, res, 'Account created successfully! Welcome to DebateSphere.');

  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        status: 'error',
        message: `A user with this ${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  // commented ================== MODIFIED =================
  console.log('--- Login Route Hit ---');
  console.log('Request Body:', req.body);
  // commented ================== MODIFIED =================
  try {
    const { email, password } = req.body;

    // Find user and include password field
    // commented ================== MODIFIED =================
    console.log(`Finding user with email: ${email}`);
    // commented ================== MODIFIED =================
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash');
    // commented ================== MODIFIED =================
    console.log('User found:', user);
    // commented ================== MODIFIED =================

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password))) {
      // commented ================== MODIFIED =================
      console.log('Incorrect email or password');
      // commented ================== MODIFIED =================
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      // commented ================== MODIFIED =================
      console.log('User is inactive');
      // commented ================== MODIFIED =================
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Send token
    createSendToken(user, 200, res, 'Logged in successfully!');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Log user out
// @access  Public
router.post('/logout', (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('stats.fallaciesCommitted');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.patch('/update-profile', protect, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'preferences'];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate firstName and lastName if provided
    if (updates.firstName && updates.firstName.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'First name must be less than 50 characters'
      });
    }
    if (updates.lastName && updates.lastName.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Last name must be less than 50 characters'
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/auth/change-password
// @desc    Change user password
// @access  Private
router.patch('/change-password', protect, authLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password confirmation does not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Get current user with password
    const user = await User.findById(req.user._id).select('+passwordHash');

    // Check current password
    if (!(await user.correctPassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    // Send new token
    createSendToken(user, 200, res, 'Password changed successfully!');

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/auth/delete-account
// @desc    Deactivate user account
// @access  Private
router.delete('/delete-account', protect, authLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide your password to confirm account deletion'
      });
    }

    // Get current user with password
    const user = await User.findById(req.user._id).select('+passwordHash');

    // Verify password
    if (!(await user.correctPassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Password is incorrect'
      });
    }

    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    // Clear cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Account deletion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/verify - Verify JWT token
router.get('/verify', protect, async (req, res) => {
  try {
    // If we reach here, the protect middleware has validated the token
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        valid: false,
        message: 'User not found or inactive'
      });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        stats: user.stats,
        achievements: user.achievements,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      valid: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;