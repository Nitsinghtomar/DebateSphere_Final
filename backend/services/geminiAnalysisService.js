const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


/**
 * Converts audio file to Generative Part for Gemini API
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}


/**
 * Generate comprehensive debate analysis from audio
 */
async function analyzeDebateAudio(audioFilePath, debateContext) {
  const { topic, userPosition, duration } = debateContext;
  
  console.log('🎯 [Gemini Analysis] Starting analysis...');
  console.log('   Topic:', topic);
  console.log('   Position:', userPosition);
  console.log('   Duration:', duration, 'seconds');
  
  try {
    // 🔥 Use gemini-1.5-pro for better analysis quality
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
You are an expert debate coach and speech analyst.


TASK: Analyze this debate performance audio comprehensively.


DEBATE CONTEXT:
- Topic: "${topic}"
- User Position: ${userPosition.toUpperCase()} (${userPosition === 'pro' ? 'supporting' : 'opposing'} the topic)
- Duration: ${duration} seconds


ANALYSIS REQUIREMENTS:


1. **RAW TRANSCRIPTION**: Transcribe EXACTLY what was said, including ALL filler words and disfluencies:
   - Include: "uh", "um", "ah", "like", "so", "you know", "basically", "actually", "I mean", etc.
   - Include: repetitions, false starts, incomplete sentences
   - Mark significant pauses with [pause]


2. **DISFLUENCY ANALYSIS**: Count and categorize ALL filler words precisely.


3. **SPEECH METRICS**: Calculate words per minute, pause frequency, articulation clarity.


4. **ARGUMENT QUALITY**: Identify main arguments, strengths, weaknesses, logical fallacies, evidence usage.


5. **VOCABULARY ASSESSMENT**: Evaluate lexical diversity, advanced words, overused simple words.


6. **FALLACY DETECTION AND COUNTING**: 
   ⚠️ CRITICAL: Carefully analyze the debate for logical fallacies. Count ONLY clear instances.
   
   Track these specific fallacy types:
   
   **Tier 1 (Most Common):**
   - ad_hominem: Personal attacks instead of addressing arguments
   - strawman: Misrepresenting opponent's position to make it easier to attack
   - false_dilemma: Presenting false "either-or" choices when more options exist
   - slippery_slope: Claiming one action will lead to extreme consequences without justification
   - appeal_to_authority: Relying solely on authority without proper reasoning
   - hasty_generalization: Drawing broad conclusions from insufficient evidence
   
   **Tier 2 (Moderately Common):**
   - red_herring: Diverting attention from the main topic
   - circular_reasoning: Using the conclusion as a premise (begging the question)
   - appeal_to_emotion: Using emotional manipulation instead of logic
   - bandwagon: "Everyone believes it" argument (appeal to popularity)
   - false_equivalence: Comparing two things that aren't truly comparable
   
   **Tier 3 (Less Common):**
   - tu_quoque: Whataboutism / pointing out hypocrisy instead of addressing the argument
   
   For EACH fallacy found:
   1. Add to the logicalFallacies array with type, description, and context
   2. Count each fallacy type separately
   3. Calculate total fallacies
   4. Calculate fallacy rate (fallacies per 100 words)


7. **STRUCTURE ANALYSIS**: Evaluate opening, body organization, transitions, and closing.


8. **DELIVERY & CONFIDENCE**: Assess pace, confidence indicators, tone variation.


9. **SCORES**: Rate each category 0-100 and provide overall score.


10. **RECOMMENDATIONS**: Provide specific, actionable tips for improvement.


CRITICAL OUTPUT FORMAT:
- Return ONLY pure JSON
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO additional text before or after the JSON
- Start with { and end with }
- Must be valid, parseable JSON


Return this EXACT JSON structure:


{
  "rawTranscript": "string - exact transcription with all fillers",
  "cleanedTranscript": "string - cleaned version without fillers",
  "overallScore": 0-100,
  "fluency": {
    "score": 0-100,
    "metrics": {
      "wordsPerMinute": number,
      "averagePauseLength": number,
      "pauseCount": number,
      "speechDuration": number
    },
    "disfluencies": {
      "total": number,
      "breakdown": {
        "filler_uhm": number,
        "filler_uh": number,
        "filler_ah": number,
        "filler_like": number,
        "filler_you_know": number,
        "filler_so": number,
        "filler_actually": number,
        "filler_basically": number,
        "repetitions": number,
        "false_starts": number
      }
    },
    "clarity": {
      "score": 0-100,
      "articulation": "clear|moderate|unclear",
      "mumbling_instances": number
    },
    "feedback": "string",
    "tips": ["string", "string"]
  },
  "vocabulary": {
    "score": 0-100,
    "metrics": {
      "totalWords": number,
      "uniqueWords": number,
      "lexicalDiversity": number,
      "averageWordLength": number
    },
    "advancedWords": [{"word": "string", "count": number}],
    "simpleWords": ["string"],
    "suggestions": ["string"],
    "feedback": "string",
    "tips": ["string"]
  },
  "argumentStrength": {
    "score": 0-100,
    "strengths": [{"point": "string", "reasoning": "string"}],
    "weaknesses": [{"point": "string", "reasoning": "string", "suggestion": "string"}],
    "logicalFallacies": [{"type": "string", "description": "string", "context": "string"}],
    "evidenceUsage": {
      "score": 0-100,
      "hasEvidence": boolean,
      "evidenceQuality": "strong|moderate|weak|none",
      "examples": ["string"]
    },
    "rebuttals": {
      "score": 0-100,
      "addressed_opponent": boolean,
      "rebuttal_quality": "string"
    },
    "feedback": "string",
    "tips": ["string"]
  },
  "structure": {
    "score": 0-100,
    "opening": {
      "score": 0-100,
      "hasHook": boolean,
      "statedPosition": boolean,
      "preview": boolean,
      "feedback": "string"
    },
    "body": {
      "score": 0-100,
      "mainPointsCount": number,
      "organization": "clear|moderate|unclear",
      "transitions": {
        "quality": "string",
        "examples": ["string"]
      },
      "feedback": "string"
    },
    "closing": {
      "score": 0-100,
      "hasSummary": boolean,
      "reinforcedPosition": boolean,
      "memorableEnding": boolean,
      "feedback": "string"
    },
    "tips": ["string"]
  },
  "delivery": {
    "score": 0-100,
    "pace": {
      "assessment": "too fast|good|too slow",
      "wordsPerMinute": number,
      "recommendation": "string"
    },
    "confidence": {
      "score": 0-100,
      "indicators": {
        "assertiveness": number,
        "hesitation": number,
        "filler_word_ratio": number
      }
    },
    "tone": {
      "assessment": "string",
      "variation": "string",
      "recommendation": "string"
    },
    "feedback": "string",
    "tips": ["string"]
  },
  "fallacyCount": {
    "total": number,
    "breakdown": {
      "ad_hominem": number,
      "strawman": number,
      "false_dilemma": number,
      "slippery_slope": number,
      "appeal_to_authority": number,
      "hasty_generalization": number,
      "red_herring": number,
      "circular_reasoning": number,
      "appeal_to_emotion": number,
      "bandwagon": number,
      "false_equivalence": number,
      "tu_quoque": number
    },
    "rate": number
  },
  "aiSummary": {
    "overall": "string - 2-3 paragraphs",
    "topStrengths": ["string", "string", "string"],
    "topWeaknesses": ["string", "string", "string"],
    "keyTakeaway": "string"
  },
  "recommendations": {
    "immediate": ["string"],
    "practice": ["string"],
    "advanced": ["string"]
  }
}


Be thorough, specific, and constructive. Focus on actionable feedback.
REMEMBER: Return ONLY the JSON object, nothing else. No explanatory text, no markdown formatting.
`;


    const audioPart = fileToGenerativePart(audioFilePath, 'audio/wav');
    
    console.log('📤 [Gemini Analysis] Sending request to Gemini...');
    const startTime = Date.now();
    
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [Gemini Analysis] Response received in ${processingTime}ms`);
    console.log('   Response length:', text.length, 'characters');
    
    // Parse JSON response with improved cleaning
    let analysisData;
    try {
      // 🔥 IMPROVED: Robust JSON extraction and cleaning
      let cleanedText = text.trim();
      
      console.log('🔄 [Gemini Analysis] Cleaning response...');
      console.log('   Original first 100 chars:', cleanedText.substring(0, 100));
      
        // ✅ FIXED - Remove markdown code block markers using template literals properly
        // You need to escape the backticks with backslash
        if (cleanedText.startsWith('\`\`\`json')) {
            cleanedText = cleanedText.substring(7);
        }
        if (cleanedText.startsWith('\`\`\`javascript')) {
            cleanedText = cleanedText.substring(13);
        }
        if (cleanedText.startsWith('\`\`\`')) {
            cleanedText = cleanedText.substring(3);
        }
        if (cleanedText.endsWith('\`\`\`')) {
            cleanedText = cleanedText.substring(0, cleanedText.length - 3);
        }
        cleanedText = cleanedText.trim();
  
    
      // Extract JSON object if embedded in text
      // Look for the outermost { } pair
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      console.log('🔄 [Gemini Analysis] Attempting to parse JSON...');
      console.log('   Cleaned first 150 chars:', cleanedText.substring(0, 150));
      console.log('   Cleaned last 50 chars:', cleanedText.substring(cleanedText.length - 50));
      
      analysisData = JSON.parse(cleanedText);
      
      console.log('✅ [Gemini Analysis] JSON parsed successfully');
      console.log('   Overall Score:', analysisData.overallScore);
      console.log('   Has raw transcript:', !!analysisData.rawTranscript);
      console.log('   Has cleaned transcript:', !!analysisData.cleanedTranscript);
      
      // ✅ NEW: Validate fallacyCount structure (add defaults if missing)
      if (!analysisData.fallacyCount) {
        console.warn('⚠️ [Gemini Analysis] No fallacyCount in response, adding default');
        analysisData.fallacyCount = {
          total: 0,
          breakdown: {
            ad_hominem: 0,
            strawman: 0,
            false_dilemma: 0,
            slippery_slope: 0,
            appeal_to_authority: 0,
            hasty_generalization: 0,
            red_herring: 0,
            circular_reasoning: 0,
            appeal_to_emotion: 0,
            bandwagon: 0,
            false_equivalence: 0,
            tu_quoque: 0
          },
          rate: 0
        };
      } else {
        console.log('   ✅ Fallacy Count:', analysisData.fallacyCount.total);
      }
      
    } catch (parseError) {
      console.error('❌ [Gemini Analysis] Failed to parse JSON');
      console.error('   Error:', parseError.message);
      console.error('   Error stack:', parseError.stack);
      console.error('   Response length:', text.length);
      console.error('   First 500 chars of raw response:', text.substring(0, 500));
      console.error('   Last 200 chars of raw response:', text.substring(text.length - 200));
      
      // Try to provide more context
      if (cleanedText) {
        console.error('   First 300 chars of cleaned text:', cleanedText.substring(0, 300));
        console.error('   Last 100 chars of cleaned text:', cleanedText.substring(cleanedText.length - 100));
      }
      
      throw new Error('Failed to parse Gemini response as JSON');
    }
    
    return {
      success: true,
      analysis: analysisData,
      rawTranscript: analysisData.rawTranscript || '',
      cleanedTranscript: analysisData.cleanedTranscript || '',
      processingTime
    };
    
  } catch (error) {
    console.error('❌ [Gemini Analysis] Error:', error);
    throw error;
  }
}


module.exports = {
  analyzeDebateAudio
};
