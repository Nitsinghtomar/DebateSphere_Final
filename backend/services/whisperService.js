const { HfInference } = require('@huggingface/inference');

class WhisperService {
    constructor() {
        console.log('🎤 [Whisper] Initializing Whisper Service...');
        
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        
        if (!apiKey) {
            console.error('❌ [Whisper] HUGGINGFACE_API_KEY not found in .env');
            throw new Error('HUGGINGFACE_API_KEY is required');
        }
        
        console.log('🔑 [Whisper] API Key loaded:', apiKey.substring(0, 10) + '...');
        
        this.client = new HfInference(apiKey);
        this.model = 'openai/whisper-large-v3';
        
        console.log('✅ [Whisper] Service initialized');
        console.log('   Model:', this.model);
    }

    async transcribe(audioBuffer) {
        console.log('\n🎤 [Whisper] ========== TRANSCRIPTION REQUEST ==========');
        console.log('   Time:', new Date().toISOString());
        console.log('   Audio buffer size:', (audioBuffer.length / 1024).toFixed(2), 'KB');
        
        const startTime = Date.now();
        
        // Try each provider in order
        const providers = [
            { name: 'Replicate', endpoint: 'https://api-inference.huggingface.co/models/' },
            { name: 'HF Inference API', endpoint: 'https://api-inference.huggingface.co/models/' },
            { name: 'fal', endpoint: 'https://api-inference.huggingface.co/models/' }
        ];
        
        for (const provider of providers) {
            try {
                console.log(`🔄 [Whisper] Trying provider: ${provider.name}...`);
                
                // Create form data for the request
                const formData = new FormData();
                const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
                formData.append('inputs', audioBlob);
                
                console.log('   Sending audio blob:', audioBlob.size, 'bytes');
                
                // Make direct API call to Hugging Face with explicit endpoint
                const response = await fetch(`${provider.endpoint}${this.model}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    },
                    body: audioBlob // Send raw audio
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    console.warn(`⚠️ [Whisper] ${provider.name} failed:`, error);
                    continue; // Try next provider
                }
                
                const result = await response.json();
                const duration = Date.now() - startTime;
                
                console.log(`✅ [Whisper] Transcription successful with ${provider.name}!`);
                console.log(`   Completed in ${duration}ms`);
                console.log('   Result:', result);
                
                // Extract text from response
                const text = result.text || result[0]?.text || '';
                
                console.log('   Transcribed text:', text);
                console.log('   Text length:', text.length, 'characters');
                
                return {
                    success: true,
                    text: text,
                    duration: duration,
                    provider: provider.name
                };
                
            } catch (error) {
                console.warn(`⚠️ [Whisper] ${provider.name} error:`, error.message);
                // Continue to next provider
            }
        }
        
        // All providers failed
        const duration = Date.now() - startTime;
        console.error(`❌ [Whisper] All providers failed after ${duration}ms`);
        throw new Error('All Hugging Face providers failed. Please try again later or use OpenAI Whisper API.');
    }
}

module.exports = WhisperService;
