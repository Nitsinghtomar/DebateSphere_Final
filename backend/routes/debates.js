const express = require('express');
const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected - user must be authenticated
router.use(protect);

// Input validation middleware
const validateDebateCreation = (req, res, next) => {
  const { topic, description, settings } = req.body;
  const errors = [];

  if (!topic || topic.trim().length < 10) {
    errors.push('Topic must be at least 10 characters long');
  }
  if (topic && topic.length > 200) {
    errors.push('Topic must be less than 200 characters');
  }
  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  if (settings) {
    if (settings.maxParticipants && (settings.maxParticipants < 2 || settings.maxParticipants > 8)) {
      errors.push('Max participants must be between 2 and 8');
    }
    if (settings.timeLimit && (settings.timeLimit < 5 || settings.timeLimit > 120)) {
      errors.push('Time limit must be between 5 and 120 minutes');
    }
    if (settings.turnTimeLimit && (settings.turnTimeLimit < 30 || settings.turnTimeLimit > 600)) {
      errors.push('Turn time limit must be between 30 and 600 seconds');
    }
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

// @route   GET /api/debates
// @desc    Get debates (public debates or user's debates)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      filter = 'public', // 'public', 'my', 'all'
      status,
      limit = 20,
      page = 1,
      search,
      tags
    } = req.query;

    let query = {};
    let sort = { createdAt: -1 };

    // Apply filters
    if (filter === 'public') {
      query['settings.isPublic'] = true;
      query.status = { $in: ['waiting', 'active'] };
    } else if (filter === 'my') {
      query['participants.user'] = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [debates, totalCount] = await Promise.all([
      Debate.find(query)
        .populate('participants.user', 'username profilePicture')
        .populate('moderator', 'username')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Debate.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      results: debates.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: {
        debates
      }
    });

  } catch (error) {
    console.error('Get debates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch debates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/debates
// @desc    Create a new debate
// @access  Private
router.post('/', validateDebateCreation, async (req, res) => {
  try {
    const { topic, description, settings = {}, tags = [], position = 'pro' } = req.body;

    // Create debate
    const debate = await Debate.create({
      topic: topic.trim(),
      description: description?.trim(),
      participants: [{
        user: req.user._id,
        position: position
      }],
      settings: {
        maxParticipants: settings.maxParticipants || 2,
        timeLimit: settings.timeLimit || 30,
        turnTimeLimit: settings.turnTimeLimit || 300,
        isPublic: settings.isPublic !== false,
        allowSpectators: settings.allowSpectators !== false,
        moderatorRequired: settings.moderatorRequired || false
      },
      moderator: settings.moderatorRequired ? req.user._id : undefined,
      tags: tags.filter(tag => tag && tag.trim().length > 0),
      status: 'waiting'
    });

    // Populate the created debate
    await debate.populate('participants.user', 'username profilePicture');

    res.status(201).json({
      status: 'success',
      message: 'Debate created successfully',
      data: {
        debate
      }
    });

  } catch (error) {
    console.error('Create debate error:', error);
    
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
      message: 'Failed to create debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/debates/:id
// @desc    Get single debate with details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    const debate = await Debate.findById(id)
      .populate('participants.user', 'username profilePicture stats.totalDebates stats.debatesWon')
      .populate('moderator', 'username profilePicture')
      .populate('winner.user', 'username');

    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    // Check if user has access to this debate
    const isParticipant = debate.participants.some(p => p.user._id.toString() === req.user._id.toString());
    const isModerator = debate.moderator?._id.toString() === req.user._id.toString();
    const isPublic = debate.settings.isPublic;

    if (!isParticipant && !isModerator && !isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to this debate'
      });
    }

    // Get recent arguments for the debate
    const recentArguments = await Argument.find({ debate: id })
      .populate('user', 'username profilePicture')
      .sort({ orderInDebate: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        debate,
        recentArguments: recentArguments.reverse(), // Show in chronological order
        userRole: isParticipant ? 'participant' : isModerator ? 'moderator' : 'spectator'
      }
    });

  } catch (error) {
    console.error('Get debate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/debates/:id/join
// @desc    Join a debate as participant
// @access  Private
router.put('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    if (!position || !['pro', 'con'].includes(position)) {
      return res.status(400).json({
        status: 'error',
        message: 'Position must be either "pro" or "con"'
      });
    }

    const debate = await Debate.findById(id);

    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    if (debate.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot join debate that has already started'
      });
    }

    // Check if debate is public or user is invited
    if (!debate.settings.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'This is a private debate'
      });
    }

    // Check if user is already a participant
    const existingParticipant = debate.participants.find(p => p.user.toString() === req.user._id.toString());
    if (existingParticipant) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already a participant in this debate'
      });
    }

    // Check if position is available
    const positionTaken = debate.participants.some(p => p.position === position);
    if (positionTaken && debate.settings.maxParticipants === 2) {
      return res.status(400).json({
        status: 'error',
        message: `The ${position} position is already taken`
      });
    }

    // Add participant using the model method
    await debate.addParticipant(req.user._id, position);

    // Populate the updated debate
    await debate.populate('participants.user', 'username profilePicture');

    // Notify via Socket.IO if available
    if (req.app.socketManager) {
      req.app.socketManager.sendToDebate(id, 'participant_joined', {
        debate: debate,
        newParticipant: {
          user: req.user,
          position: position
        },
        timestamp: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined the debate',
      data: {
        debate
      }
    });

  } catch (error) {
    console.error('Join debate error:', error);
    
    if (error.message.includes('full') || error.message.includes('participant')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to join debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/debates/:id/leave
// @desc    Leave a debate
// @access  Private
router.put('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    const debate = await Debate.findById(id);

    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    // Check if user is a participant
    const participantIndex = debate.participants.findIndex(p => p.user.toString() === req.user._id.toString());
    if (participantIndex === -1) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not a participant in this debate'
      });
    }

    // Cannot leave if debate is active (would require forfeit mechanism)
    if (debate.status === 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot leave an active debate. Use forfeit instead.'
      });
    }

    // Remove participant
    debate.participants.splice(participantIndex, 1);
    await debate.save();

    // Notify via Socket.IO if available
    if (req.app.socketManager) {
      req.app.socketManager.sendToDebate(id, 'participant_left', {
        debate: debate,
        leftParticipant: {
          user: req.user
        },
        timestamp: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully left the debate',
      data: {
        debate
      }
    });

  } catch (error) {
    console.error('Leave debate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to leave debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/debates/:id/start
// @desc    Start a debate (moderator or participant)
// @access  Private
router.put('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    const debate = await Debate.findById(id);

    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    // Check authorization
    const isParticipant = debate.participants.some(p => p.user.toString() === req.user._id.toString());
    const isModerator = debate.moderator?.toString() === req.user._id.toString();

    if (!isParticipant && !isModerator) {
      return res.status(403).json({
        status: 'error',
        message: 'Only participants or moderators can start the debate'
      });
    }

    // Start the debate using model method
    await debate.startDebate();
    await debate.populate('participants.user', 'username profilePicture');

    // Notify via Socket.IO if available
    if (req.app.socketManager) {
      req.app.socketManager.sendToDebate(id, 'debate_started', {
        debate: debate,
        startedBy: req.user,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Debate started successfully',
      data: {
        debate
      }
    });

  } catch (error) {
    console.error('Start debate error:', error);
    
    if (error.message.includes('started') || error.message.includes('participants')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to start debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/debates/:id/arguments
// @desc    Get all arguments for a debate
// @access  Private
router.get('/:id/arguments', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    // Check if debate exists and user has access
    const debate = await Debate.findById(id);
    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    const isParticipant = debate.participants.some(p => p.user.toString() === req.user._id.toString());
    const isModerator = debate.moderator?.toString() === req.user._id.toString();
    const canSpectate = debate.settings.allowSpectators && debate.settings.isPublic;

    if (!isParticipant && !isModerator && !canSpectate) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied to debate arguments'
      });
    }

    // Get arguments
    const arguments = await Argument.find({ debate: id })
      .populate('user', 'username profilePicture')
      .populate('parentArgument', 'text user')
      .sort({ orderInDebate: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const totalArguments = await Argument.countDocuments({ debate: id });

    res.status(200).json({
      status: 'success',
      results: arguments.length,
      total: totalArguments,
      hasMore: arguments.length === parseInt(limit),
      data: {
        arguments
      }
    });

  } catch (error) {
    console.error('Get arguments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch arguments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/debates/:id
// @desc    Delete/Cancel a debate (creator only, before it starts)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid debate ID'
      });
    }

    const debate = await Debate.findById(id);

    if (!debate) {
      return res.status(404).json({
        status: 'error',
        message: 'Debate not found'
      });
    }

    // Check if user is the creator (first participant)
    const isCreator = debate.participants[0]?.user.toString() === req.user._id.toString();
    const isModerator = debate.moderator?.toString() === req.user._id.toString();

    if (!isCreator && !isModerator) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the debate creator or moderator can delete this debate'
      });
    }

    // Can only delete if not started
    if (debate.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a debate that has already started'
      });
    }

    // Set status to cancelled instead of deleting
    debate.status = 'cancelled';
    await debate.save();

    // Notify via Socket.IO if available
    if (req.app.socketManager) {
      req.app.socketManager.sendToDebate(id, 'debate_cancelled', {
        debate: debate,
        cancelledBy: req.user,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Debate cancelled successfully'
    });

  } catch (error) {
    console.error('Delete debate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel debate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
