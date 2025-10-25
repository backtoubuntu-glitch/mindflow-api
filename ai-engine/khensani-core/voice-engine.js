<<<<<<< HEAD
// MIND FLOW VOICE AI 2.0 - PRODUCTION GRADE
class VoiceAI {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.pendingQuery = null;
        this.voiceEnabled = true;
        this.offlineMode = false;
        
        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
        this.setupVoiceUI();
        console.log('🎤 Voice AI 2.0 Initialized');
    }

    initSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported');
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-ZA'; // South African English
            this.recognition.maxAlternatives = 3;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI();
                console.log('🎤 Listening...');
            };

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                this.handleVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceUI();
            };

        } catch (error) {
            console.error('Speech recognition init failed:', error);
            this.offlineMode = true;
            this.setupFallbackVoice();
        }
    }

    initSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;
        
        // Get available voices
        setTimeout(() => {
            this.voices = this.synthesis.getVoices();
            // Prefer African-accented voices if available
            this.preferredVoice = this.voices.find(voice => 
                voice.lang.includes('ZA') || voice.name.includes('African')
            ) || this.voices[0];
        }, 1000);
    }

    handleVoiceCommand(transcript) {
        console.log('🎤 Voice command:', transcript);
        
        // Quick command processing
        const commands = {
            'hello khensani': () => this.speak("Hello! How can I help you learn today?"),
            'help with math': () => this.openSubject('mathematics'),
            'science lesson': () => this.openSubject('science'),
            'ai tutorial': () => this.openSubject('artificial-intelligence'),
            'robotics project': () => this.openSubject('robotics'),
            'safety check': () => this.triggerSafetyCheck(),
            'emergency': () => this.triggerEmergency(),
            'stop listening': () => this.stopListening()
        };

        const lowerTranscript = transcript.toLowerCase();
        let commandExecuted = false;

        for (const [command, action] of Object.entries(commands)) {
            if (lowerTranscript.includes(command)) {
                action();
                commandExecuted = true;
                break;
            }
        }

        if (!commandExecuted) {
            // Send to Khensani AI for processing
            this.processAIQuery(transcript);
        }
    }

    async processAIQuery(query) {
        this.showListeningIndicator(false);
        
        try {
            // Show thinking animation
            this.showThinkingIndicator(true);
            
            // Simulate AI processing (replace with actual API call)
            const response = await this.getAIResponse(query);
            
            this.speak(response);
            
        } catch (error) {
            console.error('AI processing error:', error);
            this.speak("I'm having trouble connecting right now. Please try typing your question.");
        } finally {
            this.showThinkingIndicator(false);
        }
    }

    async getAIResponse(query) {
        // Mock AI responses - REPLACE WITH ACTUAL LLM INTEGRATION
        const responses = {
            'math': "Let me help you with mathematics! We can work on algebra, geometry, or calculus. Which topic interests you?",
            'science': "Science is amazing! We have biology, chemistry, and physics modules ready. What would you like to explore?",
            'ai': "Artificial Intelligence is my specialty! Let's discuss machine learning, neural networks, or AI ethics.",
            'robotics': "Robotics combines programming and engineering! We can start with basic circuits or jump into advanced projects.",
            'default': "That's an interesting question! Let me guide you through our learning materials on that topic."
        };

        // Simple keyword matching
        for (const [keyword, response] of Object.entries(responses)) {
            if (query.toLowerCase().includes(keyword)) {
                return response;
            }
        }

        return responses.default;
    }

    speak(text, rate = 0.9) {
        if (!this.voiceEnabled || !this.synthesis) {
            this.showTextResponse(text);
            return;
        }

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.preferredVoice;
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateVoiceUI();
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateVoiceUI();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.updateVoiceUI();
                this.showTextResponse(text); // Fallback to text
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.showListeningIndicator(true);
            } catch (error) {
                console.error('Failed to start listening:', error);
                this.showVoiceError();
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.showListeningIndicator(false);
        }
    }

    // UI Management
    setupVoiceUI() {
        // Create voice interface if it doesn't exist
        if (!document.getElementById('voiceInterface')) {
            const voiceHTML = `
                <div id="voiceInterface" class="voice-interface">
                    <div class="voice-status" id="voiceStatus">
                        <span class="voice-icon">🎤</span>
                        <span class="status-text">Ready</span>
                    </div>
                    <div class="voice-controls">
                        <button id="startListeningBtn" class="voice-btn">Start Voice</button>
                        <button id="stopListeningBtn" class="voice-btn" style="display:none;">Stop</button>
                    </div>
                    <div id="voiceResponse" class="voice-response"></div>
                    <div id="thinkingIndicator" class="thinking-indicator" style="display:none;">
                        <div class="thinking-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>Khensani is thinking...</span>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', voiceHTML);
            
            // Add event listeners
            document.getElementById('startListeningBtn').addEventListener('click', () => this.startListening());
            document.getElementById('stopListeningBtn').addEventListener('click', () => this.stopListening());
            
            // Add styles
            this.injectVoiceStyles();
        }
    }

    updateVoiceUI() {
        const statusElement = document.getElementById('voiceStatus');
        const startBtn = document.getElementById('startListeningBtn');
        const stopBtn = document.getElementById('stopListeningBtn');
        
        if (statusElement) {
            if (this.isListening) {
                statusElement.innerHTML = '<span class="voice-icon">🔴</span> <span class="status-text">Listening...</span>';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else if (this.isSpeaking) {
                statusElement.innerHTML = '<span class="voice-icon">🔊</span> <span class="status-text">Speaking...</span>';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else {
                statusElement.innerHTML = '<span class="voice-icon">🎤</span> <span class="status-text">Ready</span>';
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            }
        }
    }

    showListeningIndicator(show) {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            if (show) {
                statusElement.classList.add('listening');
            } else {
                statusElement.classList.remove('listening');
            }
        }
    }

    showThinkingIndicator(show) {
        const indicator = document.getElementById('thinkingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    showTextResponse(text) {
        const responseElement = document.getElementById('voiceResponse');
        if (responseElement) {
            responseElement.textContent = text;
            responseElement.style.display = 'block';
            setTimeout(() => {
                responseElement.style.display = 'none';
            }, 5000);
        }
    }

    injectVoiceStyles() {
        const styles = `
            .voice-interface {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                border: 2px solid #667eea;
                min-width: 200px;
            }
            
            .voice-status {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .voice-icon {
                font-size: 1.2em;
            }
            
            .voice-controls {
                display: flex;
                gap: 10px;
            }
            
            .voice-btn {
                padding: 8px 15px;
                border: none;
                border-radius: 20px;
                background: #667eea;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .voice-btn:hover {
                background: #5a6fd8;
                transform: translateY(-2px);
            }
            
            .voice-response {
                margin-top: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                display: none;
            }
            
            .thinking-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
                color: #666;
            }
            
            .thinking-dots {
                display: flex;
                gap: 3px;
            }
            
            .thinking-dots span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #667eea;
                animation: bounce 1.4s infinite ease-in-out;
            }
            
            .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
            .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            .voice-status.listening {
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Emergency integration
    triggerSafetyCheck() {
        if (window.safetyTracker) {
            window.safetyTracker.triggerSafetyCheck();
        }
    }

    triggerEmergency() {
        if (window.safetyTracker) {
            window.safetyTracker.triggerFullEmergency();
        }
    }

    openSubject(subject) {
        // Navigate to subject page
        window.location.href = `curriculum.html?subject=${subject}`;
    }

    handleRecognitionError(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not available. Please check permissions.',
            'network': 'Network error. Please check your connection.',
            'not-allowed': 'Microphone permission denied. Please enable in browser settings.'
        };
        
        this.showTextResponse(errorMessages[error] || 'Voice recognition error. Please try again.');
    }

    setupFallbackVoice() {
        // Fallback voice input using text area
        console.log('Setting up fallback voice system');
    }
}

// Initialize Voice AI globally
document.addEventListener('DOMContentLoaded', function() {
    window.voiceAI = new VoiceAI();
=======
// MIND FLOW VOICE AI 2.0 - PRODUCTION GRADE
class VoiceAI {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.pendingQuery = null;
        this.voiceEnabled = true;
        this.offlineMode = false;
        
        this.init();
    }

    init() {
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
        this.setupVoiceUI();
        console.log('🎤 Voice AI 2.0 Initialized');
    }

    initSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported');
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-ZA'; // South African English
            this.recognition.maxAlternatives = 3;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI();
                console.log('🎤 Listening...');
            };

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                this.handleVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceUI();
            };

        } catch (error) {
            console.error('Speech recognition init failed:', error);
            this.offlineMode = true;
            this.setupFallbackVoice();
        }
    }

    initSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;
        
        // Get available voices
        setTimeout(() => {
            this.voices = this.synthesis.getVoices();
            // Prefer African-accented voices if available
            this.preferredVoice = this.voices.find(voice => 
                voice.lang.includes('ZA') || voice.name.includes('African')
            ) || this.voices[0];
        }, 1000);
    }

    handleVoiceCommand(transcript) {
        console.log('🎤 Voice command:', transcript);
        
        // Quick command processing
        const commands = {
            'hello khensani': () => this.speak("Hello! How can I help you learn today?"),
            'help with math': () => this.openSubject('mathematics'),
            'science lesson': () => this.openSubject('science'),
            'ai tutorial': () => this.openSubject('artificial-intelligence'),
            'robotics project': () => this.openSubject('robotics'),
            'safety check': () => this.triggerSafetyCheck(),
            'emergency': () => this.triggerEmergency(),
            'stop listening': () => this.stopListening()
        };

        const lowerTranscript = transcript.toLowerCase();
        let commandExecuted = false;

        for (const [command, action] of Object.entries(commands)) {
            if (lowerTranscript.includes(command)) {
                action();
                commandExecuted = true;
                break;
            }
        }

        if (!commandExecuted) {
            // Send to Khensani AI for processing
            this.processAIQuery(transcript);
        }
    }

    async processAIQuery(query) {
        this.showListeningIndicator(false);
        
        try {
            // Show thinking animation
            this.showThinkingIndicator(true);
            
            // Simulate AI processing (replace with actual API call)
            const response = await this.getAIResponse(query);
            
            this.speak(response);
            
        } catch (error) {
            console.error('AI processing error:', error);
            this.speak("I'm having trouble connecting right now. Please try typing your question.");
        } finally {
            this.showThinkingIndicator(false);
        }
    }

    async getAIResponse(query) {
        // Mock AI responses - REPLACE WITH ACTUAL LLM INTEGRATION
        const responses = {
            'math': "Let me help you with mathematics! We can work on algebra, geometry, or calculus. Which topic interests you?",
            'science': "Science is amazing! We have biology, chemistry, and physics modules ready. What would you like to explore?",
            'ai': "Artificial Intelligence is my specialty! Let's discuss machine learning, neural networks, or AI ethics.",
            'robotics': "Robotics combines programming and engineering! We can start with basic circuits or jump into advanced projects.",
            'default': "That's an interesting question! Let me guide you through our learning materials on that topic."
        };

        // Simple keyword matching
        for (const [keyword, response] of Object.entries(responses)) {
            if (query.toLowerCase().includes(keyword)) {
                return response;
            }
        }

        return responses.default;
    }

    speak(text, rate = 0.9) {
        if (!this.voiceEnabled || !this.synthesis) {
            this.showTextResponse(text);
            return;
        }

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.preferredVoice;
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateVoiceUI();
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateVoiceUI();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.updateVoiceUI();
                this.showTextResponse(text); // Fallback to text
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.showListeningIndicator(true);
            } catch (error) {
                console.error('Failed to start listening:', error);
                this.showVoiceError();
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.showListeningIndicator(false);
        }
    }

    // UI Management
    setupVoiceUI() {
        // Create voice interface if it doesn't exist
        if (!document.getElementById('voiceInterface')) {
            const voiceHTML = `
                <div id="voiceInterface" class="voice-interface">
                    <div class="voice-status" id="voiceStatus">
                        <span class="voice-icon">🎤</span>
                        <span class="status-text">Ready</span>
                    </div>
                    <div class="voice-controls">
                        <button id="startListeningBtn" class="voice-btn">Start Voice</button>
                        <button id="stopListeningBtn" class="voice-btn" style="display:none;">Stop</button>
                    </div>
                    <div id="voiceResponse" class="voice-response"></div>
                    <div id="thinkingIndicator" class="thinking-indicator" style="display:none;">
                        <div class="thinking-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>Khensani is thinking...</span>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', voiceHTML);
            
            // Add event listeners
            document.getElementById('startListeningBtn').addEventListener('click', () => this.startListening());
            document.getElementById('stopListeningBtn').addEventListener('click', () => this.stopListening());
            
            // Add styles
            this.injectVoiceStyles();
        }
    }

    updateVoiceUI() {
        const statusElement = document.getElementById('voiceStatus');
        const startBtn = document.getElementById('startListeningBtn');
        const stopBtn = document.getElementById('stopListeningBtn');
        
        if (statusElement) {
            if (this.isListening) {
                statusElement.innerHTML = '<span class="voice-icon">🔴</span> <span class="status-text">Listening...</span>';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else if (this.isSpeaking) {
                statusElement.innerHTML = '<span class="voice-icon">🔊</span> <span class="status-text">Speaking...</span>';
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else {
                statusElement.innerHTML = '<span class="voice-icon">🎤</span> <span class="status-text">Ready</span>';
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            }
        }
    }

    showListeningIndicator(show) {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            if (show) {
                statusElement.classList.add('listening');
            } else {
                statusElement.classList.remove('listening');
            }
        }
    }

    showThinkingIndicator(show) {
        const indicator = document.getElementById('thinkingIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    showTextResponse(text) {
        const responseElement = document.getElementById('voiceResponse');
        if (responseElement) {
            responseElement.textContent = text;
            responseElement.style.display = 'block';
            setTimeout(() => {
                responseElement.style.display = 'none';
            }, 5000);
        }
    }

    injectVoiceStyles() {
        const styles = `
            .voice-interface {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                border: 2px solid #667eea;
                min-width: 200px;
            }
            
            .voice-status {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .voice-icon {
                font-size: 1.2em;
            }
            
            .voice-controls {
                display: flex;
                gap: 10px;
            }
            
            .voice-btn {
                padding: 8px 15px;
                border: none;
                border-radius: 20px;
                background: #667eea;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .voice-btn:hover {
                background: #5a6fd8;
                transform: translateY(-2px);
            }
            
            .voice-response {
                margin-top: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                display: none;
            }
            
            .thinking-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
                color: #666;
            }
            
            .thinking-dots {
                display: flex;
                gap: 3px;
            }
            
            .thinking-dots span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #667eea;
                animation: bounce 1.4s infinite ease-in-out;
            }
            
            .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
            .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            .voice-status.listening {
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Emergency integration
    triggerSafetyCheck() {
        if (window.safetyTracker) {
            window.safetyTracker.triggerSafetyCheck();
        }
    }

    triggerEmergency() {
        if (window.safetyTracker) {
            window.safetyTracker.triggerFullEmergency();
        }
    }

    openSubject(subject) {
        // Navigate to subject page
        window.location.href = `curriculum.html?subject=${subject}`;
    }

    handleRecognitionError(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not available. Please check permissions.',
            'network': 'Network error. Please check your connection.',
            'not-allowed': 'Microphone permission denied. Please enable in browser settings.'
        };
        
        this.showTextResponse(errorMessages[error] || 'Voice recognition error. Please try again.');
    }

    setupFallbackVoice() {
        // Fallback voice input using text area
        console.log('Setting up fallback voice system');
    }
}

// Initialize Voice AI globally
document.addEventListener('DOMContentLoaded', function() {
    window.voiceAI = new VoiceAI();
>>>>>>> 47e74d6862922efadb4373ca2a0a2a41fcbfc6e0
});