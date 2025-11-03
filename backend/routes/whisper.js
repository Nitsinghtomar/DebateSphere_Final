const express = require('express');
const router = express.Router();
const multer = require('multer');
const WhisperService = require('../services/whisperService');

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max
    },
    fileFilter: (req, file, cb) => {
        console.log('📁 [Multer] File filter check:');
        console.log('   Mimetype:', file.mimetype);
        console.log('   Original name:', file.originalname);
        
        const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/mp4'];
        
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
            console.log('✅ [Multer] File type accepted');
            cb(null, true);
        } else {
            console.error('❌ [Multer] Invalid file type:', file.mimetype);
            cb(new Error(`Invalid file type: ${file.mimetype}. Must be audio file.`));
        }
    }
});

// Initialize Whisper service
let whisperService;
try {
    whisperService = new WhisperService();
} catch (error) {
    console.error('❌ [Whisper Route] Failed to initialize Whisper service:', error.message);
}

/**
 * POST /api/whisper/transcribe
 * Transcribe audio to text using Whisper
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    console.log('\n🎤 [Route: /whisper/transcribe] ========== NEW REQUEST ==========');
    console.log('   Time:', new Date().toISOString());
    console.log('   User:', req.user?.username || 'unknown');
    console.log('   Headers:', req.headers);
    
    try {
        // Check if Whisper service is available
        if (!whisperService) {
            console.error('❌ [Route] Whisper service not initialized');
            return res.status(500).json({
                success: false,
                message: 'Whisper service not available. Check HUGGINGFACE_API_KEY in .env'
            });
        }

        // Validate file upload
        if (!req.file) {
            console.error('❌ [Route] No audio file provided in request');
            return res.status(400).json({
                success: false,
                message: 'No audio file provided. Please send file with key "audio"'
            });
        }

        console.log('📁 [Route] File received successfully:');
        console.log('   - Field name:', req.file.fieldname);
        console.log('   - Original name:', req.file.originalname);
        console.log('   - Mime type:', req.file.mimetype);
        console.log('   - Size:', (req.file.size / 1024).toFixed(2), 'KB');
        console.log('   - Buffer length:', req.file.buffer.length, 'bytes');

        // Transcribe using Whisper
        console.log('🔄 [Route] Calling Whisper service...');
        const result = await whisperService.transcribe(req.file.buffer);

        console.log('✅ [Route] Transcription successful!');
        console.log('   Result:', result);

        res.json(result);

    } catch (error) {
        console.error('❌ [Route] Transcription failed');
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Failed to transcribe audio',
            error: error.message
        });
    }
});

module.exports = router;
