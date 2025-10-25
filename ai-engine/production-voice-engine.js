const KhensaniVoiceEngine = require('./voice-engine');

class ProductionVoiceSystem {
    constructor() {
        this.voiceEngine = new KhensaniVoiceEngine();
        this.isActive = false;
    }

    async initializeProduction() {
        try {
            // TEST GOOGLE CLOUD CONNECTION
            await this.testGoogleCloudConnection();
            this.isActive = true;
            console.log('🎯 KHENSANI VOICE AI - PRODUCTION READY');
            return true;
        } catch (error) {
            console.warn('⚠️ Google Cloud not ready, using enhanced fallback');
            return this.initializeEnhancedFallback();
        }
    }

    async testGoogleCloudConnection() {
        // SIMPLE TEST TO VERIFY CREDENTIALS
        const speech = require('@google-cloud/speech');
        const client = new speech.SpeechClient();
        
        // TEST CONFIGURATION - WILL THROW ERROR IF CREDENTIALS INVALID
        await client.getProjectId();
        return true;
    }
}

module.exports = ProductionVoiceSystem;