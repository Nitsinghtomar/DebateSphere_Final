const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config(); // To load environment variables from .env file

// --- Configuration ---
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_URL = "https://api-inference.huggingface.co/models/openai/whisper-large-v3";
// Use a small, valid audio file for testing.
// Create a file named 'test-audio.mp3' in the same directory, or change this path.
const AUDIO_FILE_PATH = path.join(__dirname, 'test-audio.mp3'); 

// --- Main Test Function ---
async function testWhisperConnection() {
  console.log("--- Starting Hugging Face Whisper API Connection Test ---");

  // 1. Check for API Key
  if (!HUGGINGFACE_API_KEY) {
    console.error("❌ ERROR: HUGGINGFACE_API_KEY not found in your .env file.");
    return;
  }
  console.log("✅ API Key found.");

  // 2. Check for Test Audio File
  if (!fs.existsSync(AUDIO_FILE_PATH)) {
    console.error(`❌ ERROR: Test audio file not found at: ${AUDIO_FILE_PATH}`);
    console.log("-> Please create a small MP3 or WAV file named 'test-audio.mp3' in the same directory.");
    return;
  }
  console.log("✅ Test audio file found.");

  // 3. Read the audio file into a buffer
  const audioBuffer = fs.readFileSync(AUDIO_FILE_PATH);
  console.log(`🎤 Read ${audioBuffer.length} bytes from audio file.`);

  // 4. Attempt to call the API
  console.log(`\n🔄 Attempting to contact model at: ${MODEL_URL}`);
  const startTime = Date.now();

  try {
    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'audio/mpeg', // Use the correct content type for your audio file
      },
      body: audioBuffer,
    });

    const duration = Date.now() - startTime;
    console.log(`\n... Received response in ${duration}ms`);
    console.log(`Status Code: ${response.status} ${response.statusText}`);

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ API call failed. Server response:");
      console.error(result);
      return;
    }

    console.log("✅ SUCCESS! Transcription received:");
    console.log(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ FETCH FAILED after ${duration}ms. This is likely a network or connection issue.`);
    console.error("Error details:", error.message);
  } finally {
    console.log("\n--- Test Complete ---");
  }
}

testWhisperConnection();