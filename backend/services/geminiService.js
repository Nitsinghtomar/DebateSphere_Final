const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiDebateService {
  constructor() {
    console.log('🤖 [GeminiService] Initializing Gemini Debate Service...');
    console.log('🔑 [DEBUG] API Key loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
    console.log('🔑 [DEBUG] API Key (first 15):', process.env.GEMINI_API_KEY?.substring(0, 15) + '...');
  
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.activeChats = new Map();
    
    // Configuration - CHANGE MODEL HERE ONLY!
    this.MODEL_NAME = 'gemini-2.5-flash';  // Options: gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash
    this.MAX_RAW_MESSAGES = 10;
    this.COMPRESS_THRESHOLD = 20;
    this.MAX_OUTPUT_TOKENS = 4096;
    
    console.log('✅ [GeminiService] Service initialized');
    console.log(`⚙️  [GeminiService] Config: MODEL=${this.MODEL_NAME}, MAX_RAW_MESSAGES=${this.MAX_RAW_MESSAGES}, COMPRESS_THRESHOLD=${this.COMPRESS_THRESHOLD}`);
  }

  getDebateSystemPrompt(topic, userPosition, aiPosition) {
    console.log(`📝 [GeminiService] Creating system prompt for topic: "${topic}"`);
    console.log(`   User: ${userPosition.toUpperCase()} | AI: ${aiPosition.toUpperCase()}`);
    
    // Different prompts based on position
    const positionPrompts = {
      pro: `You MUST argue in FAVOR of "${topic}". You believe it is beneficial, necessary, and positive. You will DISAGREE with anyone who opposes it. Your job is to DEFEND and SUPPORT this position with evidence.`,
      con: `You MUST argue AGAINST "${topic}". You believe it is harmful, unnecessary, and negative. You will DISAGREE with anyone who supports it. Your job is to CHALLENGE and OPPOSE this position with evidence.`
    };
    
    return `You are an expert debater participating in a structured debate on: "${topic}"
  
  CRITICAL INSTRUCTION - YOUR POSITION:
  ${positionPrompts[aiPosition]}
  
  YOUR OPPONENT'S POSITION:
  - Your opponent argues for the ${userPosition.toUpperCase()} position
  - You MUST COUNTER and DISAGREE with their arguments
  - Never agree with your opponent - you are on opposite sides!
  
  DEBATE RULES:
  1. Always respond from your assigned ${aiPosition.toUpperCase()} perspective
  2. CHALLENGE your opponent's points - do not agree with them
  3. Present counterarguments and opposing evidence
  4. Stay committed to your position throughout the entire debate
  5. Keep responses between 150-250 words
  6. Use logical reasoning and facts to support YOUR side
  7. Be respectful but firmly opposed to the other position
  
  RESPONSE STRUCTURE:
  - Acknowledge opponent's point BUT immediately counter it
  - Present YOUR opposing argument
  - Provide evidence supporting YOUR position (${aiPosition})
  - Conclude with a strong statement defending YOUR stance
  
  REMEMBER: You are ${aiPosition.toUpperCase()} on "${topic}" - argue forcefully for this position and against the opposite view!`;
  }
  
  async generateDebateTopics(count = 6) {
    console.log(`\n🎲 [GeminiService] Generating ${count} debate topics...`);
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.MODEL_NAME
      });
  
      const prompt = `Generate ${count} engaging debate topics suitable for educational debates. 
      
  REQUIREMENTS:
  - Topics should be current, relevant, and thought-provoking
  - Each topic should have clear PRO and CON positions
  - Mix of categories: Technology, Education, Society, Ethics, Environment, Health
  - Keep topics concise (3-8 words each)
  - Avoid overly controversial or sensitive topics
  
  FORMAT: Return ONLY a JSON array of strings, nothing else.
  Example: ["AI in Education", "Remote Work vs Office Work", "Space Exploration Funding"]
  
  Generate ${count} diverse topics now:`;
  
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('🔍 [DEBUG] Raw response:', responseText);
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse topics from response');
      }
      
      const topics = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ [GeminiService] Generated ${topics.length} topics:`, topics);
      
      return {
        success: true,
        topics: topics
      };
  
    } catch (error) {
      console.error('❌ [GeminiService] Topic generation failed:', error.message);
      
      // Fallback topics if AI fails
      const fallbackTopics = [
        "AI in Education",
        "Social Media Impact on Youth",
        "Electric Vehicles vs Gasoline Cars",
        "Universal Basic Income",
        "Remote Work vs Office Work",
        "Space Exploration Funding"
      ];
      
      return {
        success: true,
        topics: fallbackTopics,
        warning: 'Using fallback topics'
      };
    }
  }
  

  async compressHistory(history, topic) {
    console.log(`🗜️  [GeminiService] Starting history compression...`);
    console.log(`   Messages to compress: ${history.length}`);
    
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.MODEL_NAME
      });

      const conversationText = history.map((msg) => 
        `${msg.role === 'user' ? 'HUMAN' : 'AI'}: ${msg.parts[0].text}`
      ).join('\n\n');

      console.log(`   Conversation text length: ${conversationText.length} characters`);

      const summaryPrompt = `Summarize this debate on "${topic}" into key points. Format:

DEBATE SUMMARY:
- Main argument from HUMAN: [brief point]
- Main argument from AI: [brief point]
- Key evidence/facts mentioned: [list]
- Current debate state: [status]

Keep under 200 words. Focus on FACTS and ARGUMENTS only.

CONVERSATION:
${conversationText}`;

      console.log(`   Sending compression request to Gemini...`);
      const result = await model.generateContent(summaryPrompt);
      const summary = result.response.text();

      console.log(`✅ [GeminiService] Compression complete! Summary length: ${summary.length} characters`);

      return {
        role: 'summary',
        parts: [{ text: summary }],
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ [GeminiService] Compression error:', error.message);
      throw error;
    }
  }

  async startDebate(debateId, topic, userPosition, aiPosition) {
    console.log('\n🎯 [GeminiService] ========== STARTING NEW DEBATE ==========');
    console.log(`   Debate ID: ${debateId}`);
    console.log(`   Topic: "${topic}"`);
    console.log(`   User Position: ${userPosition.toUpperCase()}`);
    console.log(`   AI Position: ${aiPosition.toUpperCase()}`);
    
    try {
      console.log(`   Creating Gemini model (${this.MODEL_NAME})...`);
      const model = this.genAI.getGenerativeModel({
        model: this.MODEL_NAME,
        systemInstruction: this.getDebateSystemPrompt(topic, userPosition, aiPosition)
      });

      console.log(`   Starting chat session...`);
      const chat = model.startChat({
        history: [],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: this.MAX_OUTPUT_TOKENS,
        },
      });

      console.log(`   Storing chat session in memory...`);
      this.activeChats.set(debateId, {
        chat,
        topic,
        userPosition,
        aiPosition,
        buffer: [],
        summary: null,
        turnCount: 0
      });

      console.log(`✅ [GeminiService] Debate started successfully!`);
      console.log(`   Active debates: ${this.activeChats.size}`);

      return {
        success: true,
        message: `Debate on "${topic}" started. I'm arguing ${aiPosition.toUpperCase()}. Present your ${userPosition.toUpperCase()} opening argument.`,
        debateId
      };

    } catch (error) {
      console.error('❌ [GeminiService] Failed to start debate:', error.message);
      console.error('   Stack:', error.stack);
      throw new Error('Failed to initialize debate with Gemini');
    }
  }

  async sendMessage(debateId, userMessage) {
    console.log('\n💬 [GeminiService] ========== PROCESSING MESSAGE ==========');
    console.log(`   Debate ID: ${debateId}`);
    console.log(`   User message length: ${userMessage.length} characters`);
    console.log(`   Message preview: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`);
    
    try {
      const session = this.activeChats.get(debateId);
      if (!session) {
        console.error('❌ [GeminiService] Debate session not found!');
        throw new Error('Debate session not found. Please start a new debate.');
      }

      console.log(`   Session found. Current turn: ${session.turnCount}`);
      console.log(`   Buffer size: ${session.buffer.length} messages`);

      const { chat, buffer, topic, userPosition, aiPosition } = session;

      // Check if compression needed
      if (buffer.length >= this.COMPRESS_THRESHOLD) {
        console.log(`⚠️  [GeminiService] Buffer limit reached! Triggering compression...`);
        console.log(`   Current buffer: ${buffer.length} messages`);
        console.log(`   Threshold: ${this.COMPRESS_THRESHOLD} messages`);
        
        const oldMessages = buffer.slice(0, -this.MAX_RAW_MESSAGES);
        const newSummary = await this.compressHistory(oldMessages, topic);
        
        const recentMessages = buffer.slice(-this.MAX_RAW_MESSAGES);
        
        console.log(`   Creating new chat with compressed history...`);
        const model = this.genAI.getGenerativeModel({
          model: this.MODEL_NAME,
          systemInstruction: this.getDebateSystemPrompt(topic, userPosition, aiPosition)
        });

        const compressedHistory = [
          {
            role: 'user',
            parts: [{ text: `[Previous debate summary]:\n${newSummary.parts[0].text}` }]
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I remember the previous arguments. Let\'s continue.' }]
          },
          ...recentMessages
        ];

        session.chat = model.startChat({
          history: compressedHistory,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: this.MAX_OUTPUT_TOKENS,
          },
        });

        session.buffer = recentMessages;
        session.summary = newSummary;
        
        console.log(`✅ [GeminiService] Compression complete!`);
        console.log(`   Compressed: ${oldMessages.length} messages`);
        console.log(`   Kept: ${recentMessages.length} recent messages`);
      }

      // Send message to Gemini
      console.log(`   Sending message to Gemini AI...`);
      const startTime = Date.now();
      const result = await session.chat.sendMessage(userMessage);
      
      // Debug: Check full response
      console.log('🔍 [DEBUG] Response candidates:', result.response.candidates?.length || 0);
      
      const aiResponse = result.response.text();
      const responseTime = Date.now() - startTime;

      // Handle empty response (safety filters)
      if (!aiResponse || aiResponse.trim() === '') {
        console.warn('⚠️  [GeminiService] Empty response received!');
        console.log('   Safety ratings:', result.response.promptFeedback);
        console.log('   Finish reason:', result.response.candidates?.[0]?.finishReason);
        
        // Return friendly fallback
        const fallbackMessage = "I apologize, but I cannot respond to that specific phrasing due to content guidelines. Could you rephrase your argument in a more constructive manner? Let's keep the debate focused on the educational aspects of AI.";
        
        session.buffer.push(
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: fallbackMessage }] }
        );
        session.turnCount++;
        
        return {
          success: true,
          response: fallbackMessage,
          turnCount: session.turnCount,
          bufferSize: session.buffer.length,
          compressed: session.summary !== null,
          warning: 'Content filtered - fallback response'
        };
      }

      console.log(`✅ [GeminiService] AI response received in ${responseTime}ms`);
      console.log(`   Response length: ${aiResponse.length} characters`);
      console.log(`   Response preview: "${aiResponse.substring(0, 150)}${aiResponse.length > 150 ? '...' : ''}"`);

      // Update buffer
      session.buffer.push(
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: aiResponse }] }
      );
      session.turnCount++;

      console.log(`   Updated state:`);
      console.log(`   - Turn count: ${session.turnCount}`);
      console.log(`   - Buffer size: ${session.buffer.length} messages`);
      console.log(`   - Compressed: ${session.summary !== null ? 'Yes' : 'No'}`);

      return {
        success: true,
        response: aiResponse,
        turnCount: session.turnCount,
        bufferSize: session.buffer.length,
        compressed: session.summary !== null,
        responseTime: responseTime
      };

    } catch (error) {
      console.error('❌ [GeminiService] Error sending message:', error.message);
      console.error('   Stack:', error.stack);
      throw new Error('Failed to get AI response');
    }
  }

  async getDebateHistory(debateId) {
    console.log(`\n📜 [GeminiService] Fetching debate history for: ${debateId}`);
    
    const session = this.activeChats.get(debateId);
    if (!session) {
      console.error('❌ [GeminiService] Debate not found!');
      return { success: false, message: 'Debate not found' };
    }

    console.log(`✅ [GeminiService] History retrieved:`);
    console.log(`   - Total turns: ${session.turnCount}`);
    console.log(`   - Buffer size: ${session.buffer.length} messages`);
    console.log(`   - Has summary: ${session.summary ? 'Yes' : 'No'}`);

    return {
      success: true,
      summary: session.summary ? session.summary.parts[0].text : null,
      recentMessages: session.buffer.map(msg => ({
        role: msg.role,
        content: msg.parts[0].text
      })),
      turnCount: session.turnCount,
      bufferSize: session.buffer.length
    };
  }

  endDebate(debateId) {
    console.log(`\n🛑 [GeminiService] Ending debate: ${debateId}`);
    
    const session = this.activeChats.get(debateId);
    if (session) {
      console.log(`   Debate stats:`);
      console.log(`   - Total turns: ${session.turnCount}`);
      console.log(`   - Final buffer size: ${session.buffer.length}`);
      
      this.activeChats.delete(debateId);
      console.log(`✅ [GeminiService] Debate ended. Active debates: ${this.activeChats.size}`);
      
      return { 
        success: true, 
        message: 'Debate session ended',
        totalTurns: session.turnCount
      };
    }
    
    console.error('❌ [GeminiService] Debate session not found!');
    return { success: false, message: 'Debate session not found' };
  }

  async getDebateSummary(debateId) {
    console.log(`\n📊 [GeminiService] Generating debate summary for: ${debateId}`);
    
    try {
      const session = this.activeChats.get(debateId);
      if (!session) {
        console.error('❌ [GeminiService] Debate not found!');
        throw new Error('Debate session not found');
      }

      console.log(`   Requesting analysis from Gemini...`);
      const summaryPrompt = `Analyze this debate and provide:
1. Key arguments from both sides
2. Strengths and weaknesses
3. Most compelling arguments
4. Areas for improvement

Keep it concise (200-300 words).`;

      const result = await session.chat.sendMessage(summaryPrompt);
      const summary = result.response.text();

      console.log(`✅ [GeminiService] Summary generated: ${summary.length} characters`);

      return {
        success: true,
        summary: summary
      };

    } catch (error) {
      console.error('❌ [GeminiService] Summary generation failed:', error.message);
      throw new Error('Failed to generate debate summary');
    }
  }
}

console.log('🚀 [GeminiService] Module loaded');
module.exports = new GeminiDebateService();
