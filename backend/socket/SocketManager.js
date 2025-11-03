const socketAuth = require('../middleware/auth');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.activeDebates = new Map(); // Store active debate rooms
    this.userSockets = new Map(); // Map user IDs to socket IDs
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.user.username} (${socket.id})`);
      
      // Store socket connection
      this.userSockets.set(socket.userId, socket.id);
      
      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`);
      
      // Handle debate-related events
      this.handleDebateEvents(socket);
      
      // Handle message events
      this.handleMessageEvents(socket);
      
      // Handle user events
      this.handleUserEvents(socket);
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.user.username} (${socket.id})`);
        this.userSockets.delete(socket.userId);
        
        // Leave all debate rooms
        this.leaveAllDebateRooms(socket);
      });
    });
  }

  handleDebateEvents(socket) {
    // Join a debate room
    socket.on('join_debate', async (data) => {
      try {
        const { debateId } = data;
        const Debate = require('../models/Debate');
        
        // Verify debate exists and user can join
        const debate = await Debate.findById(debateId)
          .populate('participants.user', 'username profilePicture');
        
        if (!debate) {
          return socket.emit('error', { message: 'Debate not found' });
        }

        // Check if user is participant or spectator allowed
        const isParticipant = debate.participants.some(p => p.user._id.toString() === socket.userId);
        const canSpectate = debate.settings.allowSpectators;
        
        if (!isParticipant && !canSpectate) {
          return socket.emit('error', { message: 'Not authorized to join this debate' });
        }

        // Join the debate room
        socket.join(`debate_${debateId}`);
        
        // Add to active debates tracking
        if (!this.activeDebates.has(debateId)) {
          this.activeDebates.set(debateId, {
            participants: new Set(),
            spectators: new Set(),
            debate: debate
          });
        }

        const debateRoom = this.activeDebates.get(debateId);
        
        if (isParticipant) {
          debateRoom.participants.add(socket.userId);
        } else {
          debateRoom.spectators.add(socket.userId);
        }

        // Notify others in the room
        socket.to(`debate_${debateId}`).emit('user_joined_debate', {
          user: {
            id: socket.userId,
            username: socket.user.username,
            type: isParticipant ? 'participant' : 'spectator'
          },
          timestamp: new Date()
        });

        // Send debate state to the joining user
        socket.emit('debate_joined', {
          debate: debate,
          participants: Array.from(debateRoom.participants),
          spectators: Array.from(debateRoom.spectators),
          timestamp: new Date()
        });

        console.log(`🎯 ${socket.user.username} joined debate: ${debateId}`);

      } catch (error) {
        console.error('Join debate error:', error);
        socket.emit('error', { message: 'Failed to join debate' });
      }
    });

    // Leave a debate room
    socket.on('leave_debate', async (data) => {
      try {
        const { debateId } = data;
        
        socket.leave(`debate_${debateId}`);
        
        // Remove from active debates tracking
        if (this.activeDebates.has(debateId)) {
          const debateRoom = this.activeDebates.get(debateId);
          debateRoom.participants.delete(socket.userId);
          debateRoom.spectators.delete(socket.userId);
          
          // Clean up empty debate rooms
          if (debateRoom.participants.size === 0 && debateRoom.spectators.size === 0) {
            this.activeDebates.delete(debateId);
          }
        }

        // Notify others
        socket.to(`debate_${debateId}`).emit('user_left_debate', {
          user: {
            id: socket.userId,
            username: socket.user.username
          },
          timestamp: new Date()
        });

        socket.emit('debate_left', { debateId, timestamp: new Date() });
        console.log(`🎯 ${socket.user.username} left debate: ${debateId}`);

      } catch (error) {
        console.error('Leave debate error:', error);
        socket.emit('error', { message: 'Failed to leave debate' });
      }
    });

    // Start a debate
    socket.on('start_debate', async (data) => {
      try {
        const { debateId } = data;
        const Debate = require('../models/Debate');
        
        const debate = await Debate.findById(debateId);
        if (!debate) {
          return socket.emit('error', { message: 'Debate not found' });
        }

        // Check if user can start the debate (moderator or participant)
        const isParticipant = debate.participants.some(p => p.user.toString() === socket.userId);
        const isModerator = debate.moderator?.toString() === socket.userId;
        
        if (!isParticipant && !isModerator) {
          return socket.emit('error', { message: 'Not authorized to start this debate' });
        }

        // Start the debate
        await debate.startDebate();

        // Notify all users in the debate room
        this.io.to(`debate_${debateId}`).emit('debate_started', {
          debate: debate,
          startedBy: socket.user.username,
          timestamp: new Date()
        });

        console.log(`🚀 Debate started: ${debateId} by ${socket.user.username}`);

      } catch (error) {
        console.error('Start debate error:', error);
        socket.emit('error', { message: error.message || 'Failed to start debate' });
      }
    });
  }

  handleMessageEvents(socket) {
    // Send a message/argument in a debate
    socket.on('send_message', async (data) => {
      try {
        const { debateId, text, type = 'opening', parentArgumentId = null } = data;
        
        // Validate input
        if (!text || text.trim().length < 10) {
          return socket.emit('error', { message: 'Message must be at least 10 characters long' });
        }

        if (text.length > 2000) {
          return socket.emit('error', { message: 'Message must be less than 2000 characters' });
        }

        const Debate = require('../models/Debate');
        const Argument = require('../models/Argument');

        // Verify debate exists and is active
        const debate = await Debate.findById(debateId);
        if (!debate) {
          return socket.emit('error', { message: 'Debate not found' });
        }

        if (debate.status !== 'active') {
          return socket.emit('error', { message: 'Debate is not active' });
        }

        // Check if user is a participant
        const participant = debate.participants.find(p => p.user.toString() === socket.userId);
        if (!participant) {
          return socket.emit('error', { message: 'Only participants can send messages' });
        }

        // Get the next order number for this debate
        const lastArgument = await Argument.findOne({ debate: debateId })
          .sort({ orderInDebate: -1 });
        const orderInDebate = (lastArgument?.orderInDebate || 0) + 1;

        // Create new argument
        const argument = await Argument.create({
          debate: debateId,
          user: socket.userId,
          text: text.trim(),
          position: participant.position,
          type: type,
          orderInDebate: orderInDebate,
          parentArgument: parentArgumentId
        });

        // Populate user data
        await argument.populate('user', 'username profilePicture');

        // Update parent argument if this is a response
        if (parentArgumentId) {
          const parentArgument = await Argument.findById(parentArgumentId);
          if (parentArgument) {
            await parentArgument.addChild(argument._id);
          }
        }

        // Update debate analytics
        debate.analytics.totalArguments += 1;
        await debate.save();

        // Broadcast message to all users in the debate room
        this.io.to(`debate_${debateId}`).emit('new_message', {
          argument: argument,
          timestamp: new Date()
        });

        console.log(`💬 New message in debate ${debateId} by ${socket.user.username}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Request message history
    socket.on('get_message_history', async (data) => {
      try {
        const { debateId, limit = 50, offset = 0 } = data;
        const Argument = require('../models/Argument');

        const debateArguments = await Argument.find({ debate: debateId })
          .populate('user', 'username profilePicture')
          .sort({ orderInDebate: 1 })
          .skip(offset)
          .limit(limit);

        socket.emit('message_history', {
          debateId,
          arguments: debateArguments,
          hasMore: debateArguments.length === limit,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Get message history error:', error);
        socket.emit('error', { message: 'Failed to load message history' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { debateId } = data;
      socket.to(`debate_${debateId}`).emit('user_typing', {
        user: {
          id: socket.userId,
          username: socket.user.username
        },
        isTyping: true,
        timestamp: new Date()
      });
    });

    socket.on('typing_stop', (data) => {
      const { debateId } = data;
      socket.to(`debate_${debateId}`).emit('user_typing', {
        user: {
          id: socket.userId,
          username: socket.user.username
        },
        isTyping: false,
        timestamp: new Date()
      });
    });
  }

  handleUserEvents(socket) {
    // Get online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(this.userSockets.keys());
      socket.emit('online_users', {
        count: onlineUsers.length,
        users: onlineUsers,
        timestamp: new Date()
      });
    });

    // User status updates
    socket.on('update_status', (data) => {
      const { status } = data;
      socket.user.status = status;
      
      // Broadcast to relevant rooms
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        username: socket.user.username,
        status: status,
        timestamp: new Date()
      });
    });
  }

  leaveAllDebateRooms(socket) {
    // Clean up user from all active debates
    for (const [debateId, debateRoom] of this.activeDebates) {
      if (debateRoom.participants.has(socket.userId) || debateRoom.spectators.has(socket.userId)) {
        debateRoom.participants.delete(socket.userId);
        debateRoom.spectators.delete(socket.userId);
        
        // Notify others in the room
        socket.to(`debate_${debateId}`).emit('user_left_debate', {
          user: {
            id: socket.userId,
            username: socket.user.username
          },
          timestamp: new Date()
        });
        
        // Clean up empty rooms
        if (debateRoom.participants.size === 0 && debateRoom.spectators.size === 0) {
          this.activeDebates.delete(debateId);
        }
      }
    }
  }

  // Utility methods for external use
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  sendToDebate(debateId, event, data) {
    this.io.to(`debate_${debateId}`).emit(event, data);
  }

  getActiveDebates() {
    return Array.from(this.activeDebates.keys());
  }

  getDebateParticipants(debateId) {
    const debateRoom = this.activeDebates.get(debateId);
    return debateRoom ? {
      participants: Array.from(debateRoom.participants),
      spectators: Array.from(debateRoom.spectators)
    } : null;
  }
}

module.exports = SocketManager;
