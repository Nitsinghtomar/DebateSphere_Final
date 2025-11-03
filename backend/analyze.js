// analyze.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const AudioRecorder = require('node-audiorecorder');

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
const RECORDING_DURATION = 10; // in seconds
const AUDIO_FILENAME = 'output.wav';

// Check for API Key
if (!API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY not found in .env file.');
  process.exit(1);
}

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converts a file to a Generative Part object for the Gemini API.
 * @param {string} filePath The path to the file.
 * @param {string} mimeType The MIME type of the file.
 * @returns {object} The Generative Part object.
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

/**
 * Records audio from the microphone for a specified duration.
 */
function recordAudio() {
  return new Promise((resolve, reject) => {
    // Audio recorder options
    const options = {
      program: 'sox', // Use SoX for cross-platform compatibility
      device: null, // Use default recording device
      bits: 16,
      channels: 1,
      encoding: 'signed-integer',
      rate: 16000,
      type: 'wav',
    };

    // Initialize recorder
    const audioRecorder = new AudioRecorder(options, console);
    const filePath = path.join(__dirname, AUDIO_FILENAME);
    const fileStream = fs.createWriteStream(filePath, { encoding: 'binary' });
    
    audioRecorder.start().stream().pipe(fileStream);

    console.log(`🎤 Recording for ${RECORDING_DURATION} seconds... Speak now with some 'uhms' and 'aahs'!`);

    // Stop recording after the specified duration
    setTimeout(() => {
      audioRecorder.stop();
      console.log(`✅ Recording stopped. Audio saved to ${AUDIO_FILENAME}`);
      resolve(filePath);
    }, RECORDING_DURATION * 1000);

    audioRecorder.stream().on('error', (err) => {
      console.error('⚠️ Recorder error:', err);
      console.log('\nHint: Make sure you have SoX installed on your system.');
      console.log('  - On macOS: brew install sox');
      console.log('  - On Debian/Ubuntu: sudo apt-get install sox');
      console.log('  - On Windows: Download from the SoX website.');
      reject(err);
    });
  });
}

/**
 * Sends the audio file to the Gemini API for analysis.
 * @param {string} audioFilePath The path to the recorded audio file.
 */
async function analyzeSpeech(audioFilePath) {
  try {
    console.log('\n🧠 Sending audio to Gemini for analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `
      You are a professional public speaking coach.
      1. Transcribe the user's speech from this audio file.
      2. Analyze the transcription for any disfluencies (filler words like "uh", "um", "like", "so", "you know", "basically", etc.).
      3. Provide a count of the total filler words found.
      4. List the specific filler words you detected.
      5. Give one concise, constructive tip for improvement.
      Format your response clearly using Markdown.
    `;

    const audioFile = fileToGenerativePart(audioFilePath, 'audio/wav');

    const result = await model.generateContent([prompt, audioFile]);
    const response = result.response;
    const text = response.text();

    console.log('\n--- SPEECH ANALYSIS RESULTS ---');
    console.log(text);
    console.log('-----------------------------\n');

  } catch (error) {
    console.error('❌ Error analyzing speech with Gemini:', error);
  } finally {
    // Clean up the created audio file
    fs.unlinkSync(audioFilePath);
    console.log(`🗑️  Cleaned up ${AUDIO_FILENAME}.`);
  }
}

/**
 * Main function to run the process.
 */
async function main() {
  try {
    const audioPath = await recordAudio();
    await analyzeSpeech(audioPath);
  } catch (error) {
    console.error('An error occurred during the process:', error.message);
  }
}

main();