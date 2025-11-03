// Simple Socket.IO handler for testing without authentication
class SimpleSocketManager {
  constructor(io) {
    this.io = io;
    this.activeDebates = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      // Handle joining a debate
      socket.on('join_debate', (data) => {
        const { debateId, username, position } = data;
        console.log(`🏟️ ${username} joining debate ${debateId} as ${position}`);
        
        socket.join(debateId);
        socket.debateId = debateId;
        socket.username = username;
        socket.position = position;

        // Track participants
        if (!this.activeDebates.has(debateId)) {
          this.activeDebates.set(debateId, {
            participants: [],
            messages: []
          });
        }

        const debate = this.activeDebates.get(debateId);
        
        // Add participant if not already exists
        const existingParticipant = debate.participants.find(p => p.username === username);
        if (!existingParticipant) {
          debate.participants.push({
            username,
            position,
            status: 'online',
            socketId: socket.id
          });

          // Add AI participant if not already present
          const aiExists = debate.participants.find(p => p.username === 'AI Assistant');
          if (!aiExists) {
            const aiPosition = position === 'PRO' ? 'CON' : 'PRO';
            debate.participants.push({
              username: 'AI Assistant',
              position: aiPosition,
              status: 'online',
              socketId: 'ai-assistant'
            });
          }
        }

        // Broadcast updated participants list
        this.io.to(debateId).emit('participants_update', debate.participants);

        // Send welcome message
        socket.emit('debate_update', {
          topic: 'Should AI replace human teachers?',
          timeRemaining: '15:00',
          status: 'active'
        });
      });

      // Handle sending messages
      socket.on('send_message', (data) => {
        const { debateId, message } = data;
        console.log(`💬 Message in ${debateId}:`, message);

        if (this.activeDebates.has(debateId)) {
          const debate = this.activeDebates.get(debateId);
          const newMessage = {
            ...message,
            id: Date.now(),
            timestamp: new Date().toISOString()
          };
          
          debate.messages.push(newMessage);
          
          // Broadcast message to all participants in the debate
          this.io.to(debateId).emit('debate_message', newMessage);

          // Auto-respond with AI if this is a human message
          if (message.username !== 'AI Assistant') {
            this.generateAIResponse(debateId, message);
          }
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.to(data.debateId).emit('user_typing', {
          username: socket.username,
          isTyping: data.isTyping
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.id}`);
        
        if (socket.debateId && this.activeDebates.has(socket.debateId)) {
          const debate = this.activeDebates.get(socket.debateId);
          debate.participants = debate.participants.filter(p => p.socketId !== socket.id);
          
          // Broadcast updated participants list
          this.io.to(socket.debateId).emit('participants_update', debate.participants);
        }
      });
    });
  }

  // AI Response Generation
  generateAIResponse(debateId, userMessage) {
    // AI responses based on position and context
    const aiResponses = {
      PRO: [
        "That's an interesting point, but consider the benefits of technological advancement in education.",
        "I understand your concern, however, AI can provide personalized learning experiences that human teachers cannot match.",
        "While human connection is important, AI can supplement and enhance the educational experience.",
        "The efficiency and accessibility that AI brings to education could help bridge educational gaps worldwide.",
        "AI can provide 24/7 support and consistent quality instruction to all students regardless of location."
      ],
      CON: [
        "I disagree - human teachers provide emotional support and understanding that AI simply cannot replicate.",
        "Education is fundamentally about human connection and empathy, which AI lacks.",
        "That perspective overlooks the importance of critical thinking and creativity that human teachers foster.",
        "AI may be efficient, but it cannot adapt to the complex emotional needs of students.",
        "We risk losing the human element that makes education meaningful and transformative."
      ]
    };

    const oppositePosition = userMessage.position === 'PRO' ? 'CON' : 'PRO';
    const responses = aiResponses[oppositePosition];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Send AI response after a delay to simulate thinking
    setTimeout(() => {
      const aiMessage = {
        username: 'AI Assistant',
        content: randomResponse,
        position: oppositePosition,
        timestamp: new Date().toISOString(),
        id: Date.now() + 1
      };

      if (this.activeDebates.has(debateId)) {
        const debate = this.activeDebates.get(debateId);
        debate.messages.push(aiMessage);
        this.io.to(debateId).emit('debate_message', aiMessage);
      }
    }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
  }

  // Public methods for external use
  getDebateParticipants(debateId) {
    return this.activeDebates.get(debateId)?.participants || [];
  }

  getDebateMessages(debateId) {
    return this.activeDebates.get(debateId)?.messages || [];
  }

  broadcastToDebate(debateId, event, data) {
    this.io.to(debateId).emit(event, data);
  }
}

module.exports = SimpleSocketManager;
