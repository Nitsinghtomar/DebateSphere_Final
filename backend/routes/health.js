const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DebateSphere Backend is running!',
    data: {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        server: 'running',
        database: 'connected',
        socketio: 'ready'
      }
    }
  });
});

module.exports = router;
