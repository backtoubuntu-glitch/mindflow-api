<<<<<<< HEAD
// File: ai-engine/khensani-core/emergency-voice-engine.js
class EmergencyVoiceEngine {
    constructor() {
        this.fallbackActive = true;
        this.voiceLibrary = this.buildVoiceLibrary();
    }

    buildVoiceLibrary() {
        return {
            mathematics: {
                responses: [
                    "Mathematics is your superpower! Let's solve these fraction puzzles together.",
                    "I see you're doing great with fractions! Ready for the next challenge?",
                    "Fractions can be fun! Let me show you how they work in real life."
                ],
                suggestions: ["Try the fraction game", "Practice with pizza slices", "Watch fraction video"]
            },
            // ... rest of the code
        };
    }
}

=======
// File: ai-engine/khensani-core/emergency-voice-engine.js
class EmergencyVoiceEngine {
    constructor() {
        this.fallbackActive = true;
        this.voiceLibrary = this.buildVoiceLibrary();
    }

    buildVoiceLibrary() {
        return {
            mathematics: {
                responses: [
                    "Mathematics is your superpower! Let's solve these fraction puzzles together.",
                    "I see you're doing great with fractions! Ready for the next challenge?",
                    "Fractions can be fun! Let me show you how they work in real life."
                ],
                suggestions: ["Try the fraction game", "Practice with pizza slices", "Watch fraction video"]
            },
            // ... rest of the code
        };
    }
}

>>>>>>> 47e74d6862922efadb4373ca2a0a2a41fcbfc6e0
module.exports = EmergencyVoiceEngine;