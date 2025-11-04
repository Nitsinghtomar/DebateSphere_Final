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
const analyticsRoutes = require('./routes/analytics');

const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debatesphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error(' MongoDB connection error:', err);
  process.exit(1);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DebateSphere Backend Server Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/debates', require('./routes/debates'));
app.use('/api/debate-ai', debateAIRoutes);
app.use('/api/whisper', whisperRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const SimpleSocketManager = require('./socket/SimpleSocketManager');
const socketManager = new SimpleSocketManager(io);

app.socketManager = socketManager;

console.log('🔌 Socket.IO initialized');

