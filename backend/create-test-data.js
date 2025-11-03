const mongoose = require('mongoose');
const Debate = require('./models/Debate');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

async function createTestData() {
  try {
    // Create test users if they don't exist
    const bcrypt = require('bcryptjs');
    const testUser1 = await User.findOne({ email: 'testuser1@example.com' });
    if (!testUser1) {
      const hashedPassword1 = await bcrypt.hash('password123', 10);
      const user1 = new User({
        username: 'debater_pro',
        email: 'testuser1@example.com',
        passwordHash: hashedPassword1,
        profilePicture: '',
      });
      await user1.save();
      console.log('✅ Created test user 1: debater_pro');
    }

    const testUser2 = await User.findOne({ email: 'testuser2@example.com' });
    if (!testUser2) {
      const hashedPassword2 = await bcrypt.hash('password123', 10);
      const user2 = new User({
        username: 'debater_con',
        email: 'testuser2@example.com',
        passwordHash: hashedPassword2,
        profilePicture: '',
      });
      await user2.save();
      console.log('✅ Created test user 2: debater_con');
    }

    // Get users
    const user1 = await User.findOne({ email: 'testuser1@example.com' });
    const user2 = await User.findOne({ email: 'testuser2@example.com' });

    // Create a test debate
    const existingDebate = await Debate.findOne({ topic: 'Should AI replace human teachers?' });
    if (!existingDebate) {
      const testDebate = new Debate({
        topic: 'Should AI replace human teachers?',
        description: 'A debate about the role of artificial intelligence in education and whether it should replace human educators.',
        creator: user1._id,
        participants: [
          {
            user: user1._id,
            position: 'pro',
            joinedAt: new Date()
          },
          {
            user: user2._id,
            position: 'con',
            joinedAt: new Date()
          }
        ],
        status: 'waiting',
        settings: {
          timeLimit: 30, // 30 minutes
          turnTimeLimit: 60, // 60 seconds per turn (minimum is 30)
          allowSpectators: true
        },
        currentTurn: user1._id,
        turnCount: 0
      });

      await testDebate.save();
      console.log('✅ Created test debate:', testDebate._id);
      console.log('🏁 Test debate topic: "Should AI replace human teachers?"');
      console.log('👥 Participants: debater_pro (PRO) vs debater_con (CON)');
      console.log('🌐 Access at: http://localhost:3000/debate/' + testDebate._id);
    } else {
      console.log('✅ Test debate already exists:', existingDebate._id);
      console.log('🌐 Access at: http://localhost:3000/debate/' + existingDebate._id);
    }

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestData();
