// MindFlow AI - Advanced Voice Interaction System (Production)
// ============================================================

class VoiceAI {
    constructor() {
        this.API_BASE = 'https://mindflow-ai.onrender.com/api';
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.transcript = '';
        this.commands = new Map();
        this.init();
    }

    init() {
        console.log('🎤 Voice AI Initialized');
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.setupVoiceCommands();
        this.setupEventListeners();
        this.checkBrowserSupport();
    }

    // ==================== SPEECH RECOGNITION ====================

    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('⚠️ Speech Recognition not supported');
            this.showVoiceStatus('unsupported', 'Voice commands not available in your browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configuration
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;

        // Event handlers
        this.recognition.onstart = this.onRecognitionStart.bind(this);
        this.recognition.onresult = this.onRecognitionResult.bind(this);
        this.recognition.onerror = this.onRecognitionError.bind(this);
        this.recognition.onend = this.onRecognitionEnd.bind(this);

        console.log('✅ Speech Recognition configured');
    }

    onRecognitionStart() {
        this.isListening = true;
        this.transcript = '';
        this.showVoiceStatus('listening', 'Listening... Speak now');
        this.updateVoiceUI('active');
        console.log('🎤 Speech recognition started');
    }

    onRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Update display
        this.updateTranscriptDisplay(finalTranscript, interimTranscript);
        
        if (finalTranscript) {
            this.transcript = finalTranscript;
            this.processVoiceCommand(finalTranscript);
        }
    }

    onRecognitionError(event) {
        console.error('❌ Speech recognition error:', event.error);
        
        let errorMessage = 'Voice recognition error: ';
        switch(event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected';
                break;
            case 'audio-capture':
                errorMessage = 'No microphone found';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied';
                break;
            case 'network':
                errorMessage = 'Network error occurred';
                break;
            default:
                errorMessage = `Error: ${event.error}`;
        }
        
        this.showVoiceStatus('error', errorMessage);
        this.updateVoiceUI('error');
    }

    onRecognitionEnd() {
        this.isListening = false;
        this.showVoiceStatus('ready', 'Click microphone to speak');
        this.updateVoiceUI('ready');
        console.log('🛑 Speech recognition ended');
    }

    // ==================== SPEECH SYNTHESIS ====================

    setupSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('⚠️ Speech Synthesis not supported');
            return;
        }

        this.synthesis = window.speechSynthesis;
        this.voices = [];
        
        // Load available voices
        this.loadVoices();
        
        // Re-load voices when changed
        this.synthesis.onvoiceschanged = this.loadVoices.bind(this);

        console.log('✅ Speech Synthesis configured');
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log(`🎙️ Loaded ${this.voices.length} voices`);
        
        // Prefer natural-sounding voices
        this.preferredVoice = this.voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Natural') ||
            voice.lang.includes('en-US')
        ) || this.voices[0];
    }

    async speak(text, options = {}) {
        if (!this.synthesis || this.isSpeaking) {
            return false;
        }

        return new Promise((resolve) => {
            try {
                this.isSpeaking = true;
                
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configure voice
                if (this.preferredVoice) {
                    utterance.voice = this.preferredVoice;
                }
                
                // Configure speech properties
                utterance.rate = options.rate || 0.9;
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || 0.8;
                
                // Event handlers
                utterance.onstart = () => {
                    this.showVoiceStatus('speaking', 'Khensani is speaking...');
                    this.updateVoiceUI('speaking');
                    console.log('🗣️ Started speaking:', text);
                };
                
                utterance.onend = () => {
                    this.isSpeaking = false;
                    this.showVoiceStatus('ready', 'Click microphone to speak');
                    this.updateVoiceUI('ready');
                    console.log('✅ Finished speaking');
                    resolve(true);
                };
                
                utterance.onerror = (event) => {
                    this.isSpeaking = false;
                    console.error('❌ Speech synthesis error:', event.error);
                    this.showVoiceStatus('error', 'Speech synthesis failed');
                    this.updateVoiceUI('error');
                    resolve(false);
                };
                
                // Speak
                this.synthesis.speak(utterance);
                
            } catch (error) {
                console.error('❌ Speech error:', error);
                this.isSpeaking = false;
                resolve(false);
            }
        });
    }

    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.showVoiceStatus('ready', 'Speech stopped');
            this.updateVoiceUI('ready');
        }
    }

    // ==================== VOICE COMMANDS ====================

    setupVoiceCommands() {
        // Educational commands
        this.commands.set('help', this.handleHelpCommand.bind(this));
        this.commands.set('explain', this.handleExplainCommand.bind(this));
        this.commands.set('quiz', this.handleQuizCommand.bind(this));
        this.commands.set('hint', this.handleHintCommand.bind(this));
        
        // Navigation commands
        this.commands.set('go to', this.handleNavigationCommand.bind(this));
        this.commands.set('open', this.handleNavigationCommand.bind(this));
        this.commands.set('back', this.handleBackCommand.bind(this));
        
        // Game commands
        this.commands.set('move', this.handleChessMoveCommand.bind(this));
        this.commands.set('undo', this.handleUndoCommand.bind(this));
        this.commands.set('new game', this.handleNewGameCommand.bind(this));
        
        // System commands
        this.commands.set('stop', this.handleStopCommand.bind(this));
        this.commands.set('repeat', this.handleRepeatCommand.bind(this));
        
        console.log(`✅ ${this.commands.size} voice commands loaded`);
    }

    processVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        console.log(`🎯 Processing command: "${lowerTranscript}"`);
        
        let commandHandled = false;
        
        // Check for exact command matches first
        for (const [command, handler] of this.commands) {
            if (lowerTranscript.includes(command)) {
                handler(transcript);
                commandHandled = true;
                break;
            }
        }
        
        // If no specific command matched, send to Khensani AI
        if (!commandHandled) {
            this.handleGeneralQuery(transcript);
        }
        
        // Show visual feedback
        this.showCommandFeedback(transcript, commandHandled);
    }

    // ==================== COMMAND HANDLERS ====================

    async handleHelpCommand(transcript) {
        const helpResponses = [
            "I can help you with learning, games, and navigation. Try saying 'explain algebra' or 'start quiz'.",
            "You can ask me questions, request explanations, play chess, or navigate the platform. What would you like to do?",
            "I'm here to help you learn! You can say things like 'help with math', 'play chess', or 'go to dashboard'."
        ];
        
        const randomResponse = helpResponses[Math.floor(Math.random() * helpResponses.length)];
        await this.speak(randomResponse);
    }

    async handleExplainCommand(transcript) {
        const topic = transcript.replace('explain', '').trim();
        if (topic) {
            await this.speak(`Let me explain ${topic}. This is an educational moment where we explore concepts together.`);
            // In full implementation, this would call the AI backend
        } else {
            await this.speak("What would you like me to explain? For example, say 'explain photosynthesis'.");
        }
    }

    async handleQuizCommand(transcript) {
        await this.speak("Starting a quiz! This feature helps reinforce your learning through interactive questions.");
        // Would integrate with quiz system
    }

    async handleHintCommand(transcript) {
        await this.speak("Here's a learning hint: Break complex problems into smaller steps. This helps understanding!");
    }

    async handleNavigationCommand(transcript) {
        const destination = transcript.replace(/go to|open/i, '').trim();
        const pages = {
            'dashboard': 'dashboard.html',
            'chess': 'chess.html',
            'chat': 'khensani-platform.html',
            'safety': 'safety.html',
            'profile': 'profile.html'
        };
        
        if (pages[destination]) {
            await this.speak(`Taking you to ${destination}`);
            setTimeout(() => {
                window.location.href = pages[destination];
            }, 1000);
        } else {
            await this.speak(`I'm not sure how to navigate to ${destination}. Try saying dashboard, chess, or chat.`);
        }
    }

    async handleChessMoveCommand(transcript) {
        if (typeof window.chessEngine !== 'undefined') {
            await this.speak("Chess move command received. In the full version, I'll help you make moves verbally.");
        } else {
            await this.speak("Please open the chess game first to use voice moves.");
        }
    }

    async handleGeneralQuery(transcript) {
        // Send to Khensani AI backend
        try {
            this.showVoiceStatus('processing', 'Asking Khensani...');
            
            const response = await fetch(`${this.API_BASE}/ai/khensani/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: transcript,
                    context: 'voice_command',
                    userId: this.getCurrentUserId()
                })
            });

            if (response.ok) {
                const data = await response.json();
                await this.speak(data.response || "I understand your question. Let me think about that.");
            } else {
                throw new Error('AI service unavailable');
            }

        } catch (error) {
            console.error('❌ AI query failed:', error);
            const fallbackResponse = this.getFallbackResponse(transcript);
            await this.speak(fallbackResponse);
        }
    }

    // ==================== VOICE CONTROL ====================

    startListening() {
        if (!this.recognition) {
            this.showVoiceStatus('error', 'Speech recognition not available');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('❌ Failed to start recognition:', error);
            this.showVoiceStatus('error', 'Failed to start listening');
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    // ==================== UI MANAGEMENT ====================

    setupEventListeners() {
        // Voice toggle button
        const voiceBtn = document.getElementById('voiceToggle');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleListening());
        }

        // Stop speaking button
        const stopBtn = document.getElementById('stopSpeaking');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopSpeaking());
        }

        // Keyboard shortcut
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === ' ') { // Ctrl+Space
                event.preventDefault();
                this.toggleListening();
            }
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopListening();
                this.stopSpeaking();
            }
        });
    }

    updateVoiceUI(state) {
        const voiceBtn = document.getElementById('voiceToggle');
        if (!voiceBtn) return;

        const states = {
            ready: { emoji: '🎤', text: 'Start Voice', class: 'voice-ready' },
            listening: { emoji: '🔴', text: 'Listening...', class: 'voice-listening' },
            speaking: { emoji: '🔵', text: 'Speaking...', class: 'voice-speaking' },
            error: { emoji: '❌', text: 'Voice Error', class: 'voice-error' },
            active: { emoji: '🎤', text: 'Stop Voice', class: 'voice-active' }
        };

        const config = states[state] || states.ready;
        
        voiceBtn.innerHTML = `${config.emoji} ${config.text}`;
        voiceBtn.className = `voice-btn ${config.class}`;
    }

    showVoiceStatus(status, message = '') {
        const statusElement = document.getElementById('voiceStatus');
        const messageElement = document.getElementById('voiceMessage');
        
        if (statusElement) {
            statusElement.textContent = this.getVoiceStatusText(status);
            statusElement.className = `voice-status status-${status}`;
        }
        
        if (messageElement && message) {
            messageElement.textContent = message;
        }
    }

    updateTranscriptDisplay(final, interim) {
        const transcriptElement = document.getElementById('voiceTranscript');
        if (transcriptElement) {
            let html = '';
            if (final) {
                html += `<div class="final-transcript">${final}</div>`;
            }
            if (interim) {
                html += `<div class="interim-transcript">${interim}</div>`;
            }
            transcriptElement.innerHTML = html;
        }
    }

    showCommandFeedback(transcript, handled) {
        const feedbackElement = document.getElementById('voiceFeedback') || this.createFeedbackElement();
        
        feedbackElement.innerHTML = `
            <div class="command-feedback ${handled ? 'command-success' : 'command-general'}">
                <span class="feedback-icon">${handled ? '✅' : '💭'}</span>
                <span class="feedback-text">"${transcript}"</span>
                <span class="feedback-type">${handled ? 'Command' : 'Question'}</span>
            </div>
        `;
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (feedbackElement.parentElement) {
                feedbackElement.remove();
            }
        }, 3000);
    }

    createFeedbackElement() {
        const element = document.createElement('div');
        element.id = 'voiceFeedback';
        document.body.appendChild(element);
        return element;
    }

    // ==================== UTILITIES ====================

    checkBrowserSupport() {
        const supportsRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const supportsSynthesis = 'speechSynthesis' in window;
        
        if (!supportsRecognition && !supportsSynthesis) {
            this.showVoiceStatus('unsupported', 'Voice features not available in this browser');
            return false;
        }
        
        if (!supportsRecognition) {
            console.warn('⚠️ Speech recognition not supported');
        }
        
        if (!supportsSynthesis) {
            console.warn('⚠️ Speech synthesis not supported');
        }
        
        return true;
    }

    getVoiceStatusText(status) {
        const statusMap = {
            ready: 'Ready',
            listening: 'Listening...',
            speaking: 'Speaking...',
            processing: 'Processing...',
            error: 'Error',
            unsupported: 'Not Supported'
        };
        return statusMap[status] || 'Unknown';
    }

    getFallbackResponse(transcript) {
        const fallbacks = [
            "I heard you say something about learning. That's great!",
            "Voice commands are being enhanced. Try typing your question for now.",
            "I'm still learning to understand all voice commands. Please try the chat interface.",
            "That's an interesting question! The full voice system will be available soon."
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('mindflow_user') || '{}');
        return user.id || 'voice_user';
    }

    // ==================== COMMAND HANDLERS (CONTINUED) ====================

    async handleBackCommand() {
        await this.speak("Going back to previous page");
        window.history.back();
    }

    async handleUndoCommand() {
        if (typeof window.chessEngine !== 'undefined') {
            window.chessEngine.undoMove();
            await this.speak("Undid the last move");
        } else {
            await this.speak("No game active to undo");
        }
    }

    async handleNewGameCommand() {
        if (typeof window.chessEngine !== 'undefined') {
            window.chessEngine.newGame();
            await this.speak("Started a new chess game");
        } else {
            await this.speak("Please open the chess game first");
        }
    }

    async handleStopCommand() {
        this.stopListening();
        this.stopSpeaking();
        await this.speak("Stopped all voice activities");
    }

    async handleRepeatCommand() {
        if (this.transcript) {
            await this.speak(`You said: ${this.transcript}`);
        } else {
            await this.speak("Nothing to repeat yet");
        }
    }
}

// ==================== GLOBAL VOICE INSTANCE ====================

document.addEventListener('DOMContentLoaded', function() {
    window.voiceAI = new VoiceAI();
});

// Global voice functions
window.startVoiceListening = function() {
    window.voiceAI?.startListening();
};

window.stopVoiceListening = function() {
    window.voiceAI?.stopListening();
};

window.toggleVoiceListening = function() {
    window.voiceAI?.toggleListening();
};

window.speakText = function(text, options) {
    return window.voiceAI?.speak(text, options);
};