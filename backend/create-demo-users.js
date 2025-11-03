const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debatesphere');
    console.log('✅ Connected to MongoDB for demo setup');

    // Demo users data
    const demoUsers = [
      {
        username: 'alice_pro',
        email: 'alice@demo.com',
        passwordHash: 'demo123456',
        firstName: 'Alice',
        lastName: 'Johnson'
      },
      {
        username: 'bob_con',
        email: 'bob@demo.com',
        passwordHash: 'demo123456',
        firstName: 'Bob',
        lastName: 'Smith'
      },
      {
        username: 'charlie_pro',
        email: 'charlie@demo.com',
        passwordHash: 'demo123456',
        firstName: 'Charlie',
        lastName: 'Brown'
      },
      {
        username: 'diana_con',
        email: 'diana@demo.com',
        passwordHash: 'demo123456',
        firstName: 'Diana',
        lastName: 'Wilson'
      },
      {
        username: 'tester',
        email: 'test@demo.com',
        passwordHash: 'demo123456',
        firstName: 'Test',
        lastName: 'User'
      }
    ];

    console.log('🎭 Creating demo users...');

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Create new user
      const newUser = await User.create(userData);
      console.log(`✅ Created user: ${newUser.username} (${newUser.email})`);
    }

    console.log('🎉 Demo users setup completed!');
    console.log('\n📋 Demo User Credentials:');
    console.log('Username: alice_pro | Password: demo123456 | Email: alice@demo.com');
    console.log('Username: bob_con   | Password: demo123456 | Email: bob@demo.com');
    console.log('Username: charlie_pro | Password: demo123456 | Email: charlie@demo.com');
    console.log('Username: diana_con | Password: demo123456 | Email: diana@demo.com');
    console.log('Username: tester    | Password: demo123456 | Email: test@demo.com');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the demo setup
createDemoUsers();