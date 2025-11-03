const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const debateAIRoutes = require('./routes/debateAI');
const whisperRoutes = require('./routes/whisper');
const analysisRoutes = require('./routes/analysis');
const analyticsRoutes = require('./routes/analytics'); // ✅ NEW


// Load environment variables from the correct path
const envPath = path.join(__dirname, '.env');
console.log('🔧 Looking for .env at:', envPath);
require('dotenv').config({ path: envPath });


// Debug: Check if JWT_SECRET is loaded
console.log('🔐 JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('🔐 JWT_SECRET value:', process.env.JWT_SECRET ? 'PRESENT' : 'MISSING');
console.log('🔐 Current working directory:', process.cwd());
console.log('🔧 All env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
console.log('🔐 Script directory:', __dirname);


const app = express();


// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debatesphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});


// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DebateSphere Backend Server Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// Import route modules
app.use('/api', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/debates', require('./routes/debates'));
app.use('/api/debate-ai', debateAIRoutes);
app.use('/api/whisper', whisperRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/analytics', analyticsRoutes); // ✅ NEW
// app.use('/api/users', require('./routes/users'));


// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, () => {
  console.log(`🚀 DebateSphere Backend Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});


// Socket.IO setup (for real-time features)
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});


// Initialize Simple Socket Manager for testing (no auth required)
const SimpleSocketManager = require('./socket/SimpleSocketManager');
const socketManager = new SimpleSocketManager(io);


// Make socket manager available to routes
app.socketManager = socketManager;


console.log('🔌 Socket.IO server initialized with DebateSphere real-time features');


module.exports = { app, server, io, socketManager };
