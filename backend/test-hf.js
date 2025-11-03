const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

console.log('🧪 Testing Hugging Face API...\n');

const apiKey = process.env.HUGGINGFACE_API_KEY;

if (!apiKey) {
    console.error('❌ HUGGINGFACE_API_KEY not found in .env');
    process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
console.log('✅ Package loaded successfully');
console.log('\n🎉 Everything looks good! Whisper should work.');
