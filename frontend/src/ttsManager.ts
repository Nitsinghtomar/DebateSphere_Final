class WebSpeechTTSManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isCurrentlySpeaking: boolean = false;
  private isCurrentlyPaused: boolean = false;
  private voicesReady: Promise<void>;

  constructor() {
    console.log('🎙️ [TTS] Manager initialized');
    
    // Start loading voices immediately
    this.voicesReady = this.waitForVoices();
  }

  /**
   * Wait for voices to load (with generous timeout for Firefox)
   */
  private waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      // Check if voices already loaded
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('✅ [TTS] Voices already loaded:', voices.length);
        this.selectVoice(voices);
        resolve();
        return;
      }

      console.log('⏳ [TTS] Waiting for voices to load...');

      // Set up listener for voice loading
      const voicesChangedHandler = () => {
        const loadedVoices = speechSynthesis.getVoices();
        console.log('🔄 [TTS] Voices loaded:', loadedVoices.length);
        
        if (loadedVoices.length > 0) {
          this.selectVoice(loadedVoices);
          // Remove listener
          if (speechSynthesis.onvoiceschanged) {
            speechSynthesis.onvoiceschanged = null;
          }
          resolve();
        }
      };

      speechSynthesis.onvoiceschanged = voicesChangedHandler;

      // Fallback timeout (10 seconds for Firefox with many voices)
      setTimeout(() => {
        const voices = speechSynthesis.getVoices();
        console.log('⏰ [TTS] Timeout - forcing load with', voices.length, 'voices');
        if (voices.length > 0) {
          this.selectVoice(voices);
        }
        resolve();
      }, 10000);
    });
  }

  /**
   * Select best English voice
   */
  private selectVoice(voices: SpeechSynthesisVoice[]): void {
    console.log('🎤 [TTS] Selecting voice from', voices.length, 'options');
    
    // Get English voices
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    console.log('   English voices:', englishVoices.length);
    
    // Pick first English voice or any voice
    this.voice = englishVoices[0] || voices[0];
    
    if (this.voice) {
      console.log('✅ [TTS] Selected:', this.voice.name, '(', this.voice.lang, ')');
    }
  }

  /**
   * Speak text (waits for voices to be ready)
   */
  async speak(text: string): Promise<void> {
    console.log('🎙️ [TTS] speak() called, text length:', text.length);
    
    // Wait for voices to be ready
    await this.voicesReady;
    
    // Cancel any existing speech
    if (speechSynthesis.speaking) {
      console.log('   Cancelling existing speech');
      speechSynthesis.cancel();
      // Small delay to let cancel complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Double-check we have a voice
    if (!this.voice) {
      const voices = speechSynthesis.getVoices();
      console.log('   No voice set, re-checking:', voices.length, 'available');
      if (voices.length > 0) {
        this.selectVoice(voices);
      } else {
        console.error('❌ [TTS] Still no voices available!');
        return;
      }
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
      console.log('🗣️ [TTS] Using voice:', this.voice.name);
    }
    
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Event handlers
    utterance.onstart = () => {
      console.log('▶️ [TTS] Speech started');
      this.isCurrentlySpeaking = true;
      this.isCurrentlyPaused = false;
    };
    
    utterance.onend = () => {
      console.log('✅ [TTS] Speech ended');
      this.isCurrentlySpeaking = false;
      this.isCurrentlyPaused = false;
      this.currentUtterance = null;
    };
    
    utterance.onerror = (event) => {
      console.error('❌ [TTS] Speech error:', event.error);
      console.error('   Details:', event);
      this.isCurrentlySpeaking = false;
      this.isCurrentlyPaused = false;
      this.currentUtterance = null;
    };
    
    utterance.onpause = () => {
      console.log('⏸️ [TTS] Speech paused');
    };
    
    utterance.onresume = () => {
      console.log('▶️ [TTS] Speech resumed');
    };
    
    this.currentUtterance = utterance;
    
    // Speak!
    console.log('📢 [TTS] Starting speech...');
    speechSynthesis.speak(utterance);
  }

  pause(): void {
    console.log('⏸️ [TTS] pause() called');
    if (this.isCurrentlySpeaking && !this.isCurrentlyPaused) {
      speechSynthesis.pause();
      this.isCurrentlyPaused = true;
    }
  }

  resume(): void {
    console.log('▶️ [TTS] resume() called');
    if (this.isCurrentlyPaused) {
      speechSynthesis.resume();
      this.isCurrentlyPaused = false;
    }
  }

  stop(): void {
    console.log('⏹️ [TTS] stop() called');
    speechSynthesis.cancel();
    this.isCurrentlySpeaking = false;
    this.isCurrentlyPaused = false;
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.isCurrentlySpeaking && !this.isCurrentlyPaused;
  }

  isPaused(): boolean {
    return this.isCurrentlyPaused;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

export const ttsManager = new WebSpeechTTSManager();
