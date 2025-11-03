require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🧪 Testing Gemini API Key...\n');

// Check if key exists
const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', apiKey ? 'YES' : 'NO');
console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env!');
  process.exit(1);
}

// Test the API
const genAI = new GoogleGenerativeAI(apiKey);

async function testAPI() {
  try {
    console.log('\n📡 Testing with gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const result = await model.generateContent('Say "Hello from Gemini!"');
    const response = result.response.text();
    
    console.log('✅ API KEY IS VALID!');
    console.log('🤖 Gemini says:', response);
    console.log('\n✨ Your API key is working correctly!\n');
  } catch (error) {
    console.error('❌ API KEY IS INVALID!');
    console.error('Error:', error.message);
    console.log('\n🔑 Get a new API key from: https://aistudio.google.com/apikey\n');
  }
}

testAPI();
