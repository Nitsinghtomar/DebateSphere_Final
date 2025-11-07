import { HfInference, InferenceClientProviderApiError } from '@huggingface/inference';
import dotenv from 'dotenv';
import pkg from 'node-record-lpcm16'; // --- MODIFIED ---
const { record } = pkg; // --- MODIFIED ---
import fs from 'fs';

// 1. Load Environment Variables
dotenv.config();
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HUGGINGFACE_API_KEY) {
    console.error("🔴 ERROR: HUGGINGFACE_API_KEY not found in .env file.");
    console.log("Please create a .env file and add your key, e.g.:");
    console.log('HUGGINGFACE_API_KEY="hf_YOUR_KEY_HERE"');
    process.exit(1);
}

// 2. Initialize the Hugging Face Inference Client
const hf = new HfInference(HUGGINGFACE_API_KEY);
console.log("✅ Hugging Face client initialized.");

// 3. Define Models and Test Audio
const MODELS_TO_TEST = [
    "openai/whisper-large-v3",
    "facebook/wav2vec2-base-960h",
    "nvidia/canary-1b",
];

const TEMP_FILE_NAME = "mic_recording.wav";

/**
 * Records 5 seconds of audio from the microphone and returns a Blob.
 */
async function recordAudio() {
    console.log(`\n🎤 Starting 5-second microphone recording...`);
    console.log("   (Please ensure your microphone is connected, unmuted, and has permissions.)");
    console.log("   (NOTE: This may require 'SoX' to be installed on your system. See error if it fails.)");

    const fileStream = fs.createWriteStream(TEMP_FILE_NAME, { encoding: 'binary' });

    // Initialize the recorder with the correct package
    const recording = record({
        sampleRate: 16000,
        verbose: false, // Set to true for more detailed logs
    });

    // Start streaming to the file
    recording.stream().pipe(fileStream);
    console.log("   ...Recording...");

    // Record for 5 seconds, then stop
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                recording.stop();
                // fileStream.end() is handled by recording.stop()
                console.log(`✅ Recording finished. File saved temporarily.`);
                resolve();
            } catch (e) {
                reject(e);
            }
        }, 5000); // 5000 milliseconds = 5 seconds

        // Handle potential recording errors
        recording.stream().on('error', (e) => {
            console.error("🔴 RECORDER ERROR:", e.message);
            reject(new Error("Microphone recording failed. Do you have 'SoX' installed? (See note below)."));
        });
    });

    // Read the file back into a buffer and create a Blob
    try {
        // Wait a tiny moment for the file stream to fully close
        await new Promise(res => setTimeout(res, 100)); 

        const audioBuffer = fs.readFileSync(TEMP_FILE_NAME);
        const audioBlob = new Blob([audioBuffer]);
        
        // Clean up the temporary file
        fs.unlinkSync(TEMP_FILE_NAME);
        console.log("   (Temporary file cleaned up.)");

        return audioBlob;
    } catch (error) {
        console.error(`🔴 CRITICAL: Could not read or delete temp file ${TEMP_FILE_NAME}.`, error.message);
        process.exit(1);
    }
}

/**
 * Attempts to run speech-to-text on a single model.
 */
async function testModel(model, audioBlob) {
    console.log(`\n---------------------------------`);
    console.log(`🔬 Testing model: ${model}`);
    
    try {
        const startTime = Date.now();
        const result = await hf.automaticSpeechRecognition({
            model: model,
            data: audioBlob,
        });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`✅ SUCCESS (${duration.toFixed(2)}s)`);
        console.log(`   Model Output: "${result.text}"`);
        console.log("   (Check if the transcription above matches what you said.)");
        return true;

    } catch (error) {
        console.error(`❌ FAILED: ${model}`);
        
        if (error instanceof InferenceClientProviderApiError) {
            if (error.status === 401) {
                console.error("   🔴 DIAGNOSIS: API Key is INVALID or has wrong permissions.");
                console.error(`   Details: ${error.message}`);
                console.error("   Please check your HUGGINGFACE_API_KEY in the .env file.");
            } else if (error.status === 503) {
                console.error("   🟡 DIAGNOSIS: The model is likely DOWN or LOADING.");
                console.error("   Details: The inference provider is currently unavailable (503 Service Unavailable).");
                console.error("   This is usually temporary. Try again in a few minutes.");
            } else {
                console.error(`   🔴 DIAGNOSIS: An API error occurred (Status: ${error.status}).`);
                console.error(`   Details: ${error.message}`);
            }
        } else {
            console.error("   🔴 DIAGNOSIS: A non-API error occurred.");
            console.error(`   Details: ${error.message}`);
        }
        return false;
    }
}

/**
 * Main function to run all tests.
 */
async function main() {
    console.log("Starting Speech-to-Text API Test...");
    
    const audioBlob = await recordAudio();
    let anySuccess = false;

    for (const model of MODELS_TO_TEST) {
        if (audioBlob.size > 1000) { 
            const success = await testModel(model, audioBlob);
            if (success) {
                anySuccess = true;
            }
        } else {
            console.error("🔴 Recording seems empty, skipping API test.");
            break;
        }
    }

    console.log(`\n---------------------------------`);
    console.log("Test Summary:");
    if (anySuccess) {
        console.log("✅ At least one model succeeded. Your API key is working!");
    } else {
        console.error("❌ All models failed. Please review the error messages above.");
        console.error("   If you see 401 errors, your key is bad.");
        console.error("   If you see 503 errors, the Hugging Face services may be temporarily down.");
    }
}

main().catch(err => {
    console.error("\n\n--- UNHANDLED CRITICAL ERROR ---");
    console.error(err.message);
});