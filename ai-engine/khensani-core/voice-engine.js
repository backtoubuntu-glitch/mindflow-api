const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { WebSocketServer } = require('ws');

class KhensaniVoiceEngine {
  constructor() {
    this.speechClient = new speech.SpeechClient();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.voiceSessions = new Map();
  }

  // Real-time voice processing
  async processVoiceStream(stream, userId, language = 'en-ZA') {
    const request = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: language,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
      },
      interimResults: true,
    };

    const recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on('data', (data) => {
        const transcription = data.results[0]?.alternatives[0]?.transcript;
        if (transcription && data.results[0].isFinal) {
          this.handleVoiceCommand(transcription, userId);
        }
      })
      .on('error', (error) => {
        console.error('Voice recognition error:', error);
      });

    stream.pipe(recognizeStream);
  }

  // AI Response Generation with Context
  async generateAIResponse(userInput, context) {
    const { User, LearningProgress } = require('../../../backend/models');
    
    const user = await User.findByPk(context.userId, {
      include: [LearningProgress]
    });

    const learningContext = {
      currentGrade: user.grade,
      recentSubjects: user.LearningProgresses.slice(-5),
      learningStyle: user.learningStyle || 'visual',
      preferredLanguage: user.language || 'en-ZA',
      academicLevel: this.calculateAcademicLevel(user)
    };

    const prompt = this.buildLearningPrompt(userInput, learningContext);
    
    // Use OpenAI or local model
    const response = await this.callAIEngine(prompt);
    
    return {
      text: response,
      voice: await this.generateSpeech(response, learningContext.preferredLanguage),
      suggestions: this.generateLearningSuggestions(response, learningContext),
      emotionalTone: this.analyzeEmotionalTone(userInput)
    };
  }

  // Adaptive Learning Intelligence
  calculateAcademicLevel(user) {
    const progress = user.LearningProgresses;
    const recentScores = progress.slice(-10).map(p => p.score);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    if (avgScore >= 90) return 'advanced';
    if (avgScore >= 75) return 'intermediate';
    return 'beginner';
  }

  buildLearningPrompt(userInput, context) {
    return `
    You are Khensani, an AI learning assistant for African students. 
    
    STUDENT CONTEXT:
    - Grade: ${context.currentGrade}
    - Learning Level: ${context.academicLevel}
    - Preferred Language: ${context.preferredLanguage}
    - Learning Style: ${context.learningStyle}
    
    RECENT LEARNING:
    ${context.recentSubjects.map(sub => `- ${sub.subject}: ${sub.progress}%`).join('\n')}
    
    STUDENT QUESTION: "${userInput}"
    
    RESPONSE GUIDELINES:
    1. Use simple, encouraging language appropriate for grade ${context.currentGrade}
    2. Incorporate African cultural references where relevant
    3. Provide step-by-step explanations
    4. Suggest related learning activities
    5. Use positive reinforcement
    6. Keep responses under 150 words
    
    RESPONSE:
    `;
  }

  async callAIEngine(prompt) {
    // Option 1: Use OpenAI (if API key available)
    if (process.env.OPENAI_API_KEY) {
      const openai = require('openai');
      const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      });
      
      return response.choices[0].message.content;
    }
    
    // Option 2: Use local model (fallback)
    return this.localAIResponse(prompt);
  }

  localAIResponse(prompt) {
    // Simple rule-based responses for deployment
    const responses = {
      'math': 'Let me help you with mathematics! Remember to break problems into smaller steps.',
      'science': 'Science is amazing! Let\'s explore this concept together with a fun experiment.',
      'language': 'Language learning is exciting! Practice makes perfect.',
      'default': 'I\'m here to help you learn! Can you tell me more about what you\'re studying?'
    };

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('math')) return responses.math;
    if (lowerPrompt.includes('science')) return responses.science;
    if (lowerPrompt.includes('language')) return responses.language;
    
    return responses.default;
  }

  async generateSpeech(text, language = 'en-ZA') {
    const request = {
      input: { text },
      voice: { 
        languageCode: language,
        ssmlGender: 'FEMALE',
        name: language === 'en-ZA' ? 'en-ZA-Standard-A' : 'en-US-Standard-C'
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        pitch: 0.5
      },
    };

    const [response] = await this.ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  }
}

module.exports = KhensaniVoiceEngine;