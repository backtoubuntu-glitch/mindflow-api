const KhensaniVoiceEngine = require('./voice-engine');

async function testKhensaniAI() {
  console.log('🧠 Testing Khensani AI Engine...');
  
  const khensani = new KhensaniVoiceEngine();
  
  // Test text response generation
  const response = await khensani.generateAIResponse(
    'How do I solve 2x + 5 = 15?',
    { userId: 'test-user', grade: 4 }
  );
  
  console.log('✅ Khensani Response:', response.text);
  console.log('✅ Emotional Tone:', response.emotionalTone);
  console.log('✅ Learning Suggestions:', response.suggestions);
}

testKhensaniAI().catch(console.error);