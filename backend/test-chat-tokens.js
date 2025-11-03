require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🧪 Testing Gemini Chat with System Instructions...\n');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const systemPrompt = `You are an expert debater participating in a structured debate on: "AI in Education"

YOUR ROLE:
- You argue for the CON position
- Your opponent argues for the PRO position
- Stay committed to your position throughout

DEBATE RULES:
1. Stay on topic
2. Use logical reasoning
3. Be respectful but firm
4. Keep responses between 150-250 words

Remember: Engage in rigorous intellectual debate.`;

async function testChat() {
  try {
    console.log('📊 System instruction length:', systemPrompt.length, 'characters');
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt
    });

    console.log('\n📡 Starting chat with maxOutputTokens: 400...');
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const userMessage = "AI is a brainrot to students. It promotes complacency and lethargy. Procrastination is prevalent in students who use AI.";
    console.log('💬 User message length:', userMessage.length, 'characters');
    console.log('💬 User message:', userMessage);

    const result = await chat.sendMessage(userMessage);
    
    console.log('\n📊 Response Analysis:');
    console.log('   Finish reason:', result.response.candidates?.[0]?.finishReason);
    console.log('   Has text:', result.response.text() ? 'YES' : 'NO');
    console.log('   Text length:', result.response.text().length, 'characters');
    console.log('   Usage metadata:', result.response.usageMetadata);
    
    console.log('\n🤖 AI Response:');
    console.log(result.response.text());

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChat();
