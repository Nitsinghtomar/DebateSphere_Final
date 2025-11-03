// test-whisper.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const AudioRecorder = require('node-audiorecorder');
const WhisperService = require('./services/whisperService'); // <-- Imports your existing service

// Load environment variables
dotenv.config();

// --- Configuration ---
const RECORDING_DURATION = 10; // in seconds
const AUDIO_FILENAME = 'temp_whisper_audio.wav';

/**
 * Analyzes transcribed text for filler words.
 * @param {string} text - The transcribed text from Whisper.
 * @returns {object} An object containing the analysis results.
 */
function analyzeDisfluencies(text) {
    if (!text) {
        return { fillerWordCount: 0, fillerWordsFound: [], wordCount: 0 };
    }

    const FILLER_WORDS = [
        'ah', 'aah', 'ahh', 'eh', 'er', 'err', 'hm', 'hmm', 'huh',
        'mhm', 'mm', 'mmm', 'uh', 'uhh', 'uhm', 'um', 'umm', 'like', 
        'so', 'you know', 'i mean', 'actually', 'basically', 'literally', 'right', 'okay'
    ];

    const words = text.toLowerCase().match(/\b(\w+|you know|i mean)\b/g) || [];
    const wordCount = words.length;
    
    const fillerWordsFound = words.filter(word => FILLER_WORDS.includes(word));

    return {
        fillerWordCount: fillerWordsFound.length,
        fillerWordsFound,
        wordCount
    };
}

/**
 * Records audio from the microphone for a specified duration.
 */
function recordAudio() {
    return new Promise((resolve, reject) => {
        const options = {
            program: 'sox',
            device: null,
            bits: 16,
            channels: 1,
            encoding: 'signed-integer',
            rate: 16000,
            type: 'wav',
        };

        const audioRecorder = new AudioRecorder(options, console);
        const filePath = path.join(__dirname, AUDIO_FILENAME);
        const fileStream = fs.createWriteStream(filePath, { encoding: 'binary' });
        
        audioRecorder.start().stream().pipe(fileStream);

        console.log(`🎤 Recording for ${RECORDING_DURATION} seconds... Speak with some 'uhms' and 'aahs'!`);

        setTimeout(() => {
            audioRecorder.stop();
            console.log(`✅ Recording stopped. Audio saved to ${AUDIO_FILENAME}`);
            resolve(filePath);
        }, RECORDING_DURATION * 1000);

        audioRecorder.stream().on('error', (err) => {
            console.error('⚠️ Recorder error:', err);
            reject(err);
        });
    });
}

/**
 * Main function to run the process.
 */
async function main() {
    let whisperService;
    try {
        whisperService = new WhisperService();
    } catch (error) {
        console.error('❌ Failed to initialize Whisper service. Is HUGGINGFACE_API_KEY in your .env file?');
        return;
    }

    let audioPath;
    try {
        // 1. Record Audio
        audioPath = await recordAudio();

        // 2. Transcribe using your WhisperService
        console.log('\n🔄 Transcribing with Whisper via Hugging Face...');
        const audioBuffer = fs.readFileSync(audioPath);
        const result = await whisperService.transcribe(audioBuffer);

        if (!result.success) {
            throw new Error('Transcription failed.');
        }

        console.log('\n--- WHISPER ANALYSIS RESULTS ---');
        console.log(`🗣️ Transcription: "${result.text}"`);

        // 3. Analyze for Disfluencies
        const analysis = analyzeDisfluencies(result.text);
        console.log('\n📊 Disfluency Report:');
        console.log(`   - Total Word Count: ${analysis.wordCount}`);
        console.log(`   - Filler Word Count: ${analysis.fillerWordCount}`);
        console.log(`   - Fillers Found: [${analysis.fillerWordsFound.join(', ')}]`);
        console.log('--------------------------------\n');

    } catch (error) {
        console.error('An error occurred during the process:', error.message);
    } finally {
        // 4. Clean up the audio file
        if (audioPath) {
            fs.unlinkSync(audioPath);
            console.log(`🗑️  Cleaned up ${AUDIO_FILENAME}.`);
        }
    }
}

main();