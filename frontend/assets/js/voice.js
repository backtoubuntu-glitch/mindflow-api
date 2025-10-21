class VoiceAI {
    constructor() {
        this.speechRecognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.audioContext = null;
        this.audioQueue = [];
        this.supportedVoices = [];
        this.currentLanguage = 'en-ZA';
        this.init();
    }

    init() {
        this.checkBrowserSupport();
        this.loadVoices();
        this.setupEventListeners();
        
        console.log('Voice AI Engine Initialized');
    }

    checkBrowserSupport() {
        // Check Speech Recognition support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }

        // Check Speech Synthesis support
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            return false;
        }

        return true;
    }

    setupEventListeners() {
        // Voice control buttons
        this.safeAddEventListener('startListening', 'click', () => this.startListening());
        this.safeAddEventListener('stopListening', 'click', () => this.stopListening());
        this.safeAddEventListener('speakText', 'click', () => this.speakText());

        // Language selection
        const languageSelect = document.getElementById('voiceLanguage');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }

        // Voice selection
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect) {
            voiceSelect.addEventListener('change', (e) => {
                this.setVoice(e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === ' ') { // Ctrl+Space to toggle listening
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    loadVoices() {
        // Wait for voices to be loaded
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.supportedVoices = speechSynthesis.getVoices();
            this.populateVoiceSelect();
        });

        // Initial load
        this.supportedVoices = speechSynthesis.getVoices();
        if (this.supportedVoices.length > 0) {
            this.populateVoiceSelect();
        }
    }

    populateVoiceSelect() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;

        voiceSelect.innerHTML = '';

        this.supportedVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = \\ (\)\;
            voiceSelect.appendChild(option);
        });

        // Select a default voice (prefer South African English)
        const saVoice = this.supportedVoices.find(voice => 
            voice.lang.includes('en-ZA') || voice.lang.includes('en-GB')
        );
        if (saVoice) {
            voiceSelect.value = this.supportedVoices.indexOf(saVoice);
        }
    }

    async startListening() {
        if (this.isListening) {
            this.stopListening();
            return;
        }

        if (!this.checkBrowserSupport()) {
            this.showMessage('Voice recognition not supported in your browser', 'error');
            return;
        }

        try {
            await this.requestMicrophonePermission();
            
            this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.configureRecognition();
            
            this.speechRecognition.start();
            this.isListening = true;
            this.updateListeningUI(true);
            
            this.showMessage('Listening... Speak now!', 'info');
            
        } catch (error) {
            console.error('Failed to start listening:', error);
            this.showMessage('Failed to start voice recognition', 'error');
        }
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            throw new Error('Microphone permission denied');
        }
    }

    configureRecognition() {
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = this.currentLanguage;
        this.speechRecognition.maxAlternatives = 1;

        this.speechRecognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
        };

        this.speechRecognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            const isFinal = event.results[0].isFinal;
            
            this.handleSpeechResult(transcript, isFinal);
        };

        this.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleRecognitionError(event.error);
        };

        this.speechRecognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.updateListeningUI(false);
        };
    }

    handleSpeechResult(transcript, isFinal) {
        const resultElement = document.getElementById('speechResult');
        if (resultElement) {
            resultElement.textContent = transcript;
            resultElement.classList.toggle('interim', !isFinal);
        }

        if (isFinal && transcript.trim()) {
            this.processVoiceCommand(transcript);
        }
    }

    handleRecognitionError(error) {
        let errorMessage = 'Voice recognition error: ';
        
        switch(error) {
            case 'no-speech':
                errorMessage += 'No speech detected';
                break;
            case 'audio-capture':
                errorMessage += 'No microphone found';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone access denied';
                break;
            case 'network':
                errorMessage += 'Network error occurred';
                break;
            default:
                errorMessage += error;
        }

        this.showMessage(errorMessage, 'error');
        this.stopListening();
    }

    stopListening() {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
            this.isListening = false;
            this.updateListeningUI(false);
            this.showMessage('Stopped listening', 'info');
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    updateListeningUI(listening) {
        const startBtn = document.getElementById('startListening');
        const listeningIndicator = document.getElementById('listeningIndicator');
        
        if (startBtn) {
            startBtn.innerHTML = listening ? 
                '<i class=\"fas fa-microphone-slash\"></i> Stop' : 
                '<i class=\"fas fa-microphone\"></i> Start';
            startBtn.classList.toggle('active', listening);
        }
        
        if (listeningIndicator) {
            listeningIndicator.style.display = listening ? 'block' : 'none';
        }
    }

    async processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        
        // Show processing indicator
        this.showMessage('Processing your request...', 'info');
        
        try {
            // Send to Khensani AI backend
            const response = await window.API.getKhensaniResponse(transcript, {
                inputType: 'voice',
                language: this.currentLanguage
            });
            
            if (response.success) {
                const aiResponse = response.data;
                
                // Display text response
                this.displayAIResponse(aiResponse.text);
                
                // Speak the response
                if (aiResponse.voice) {
                    await this.speakAudio(aiResponse.voice);
                } else {
                    await this.speakText(aiResponse.text);
                }
                
                // Show suggestions if available
                if (aiResponse.suggestions) {
                    this.showSuggestions(aiResponse.suggestions);
                }
                
            } else {
                throw new Error(response.message || 'AI response failed');
            }
            
        } catch (error) {
            console.error('Voice command processing failed:', error);
            this.showMessage('Sorry, I couldn\\'t process that request', 'error');
            this.speakText('Sorry, I encountered an error. Please try again.');
        }
    }

    displayAIResponse(text) {
        const responseElement = document.getElementById('aiResponse');
        if (responseElement) {
            responseElement.innerHTML = \
                <div class=\"ai-response\">
                    <div class=\"response-header\">
                        <i class=\"fas fa-robot\"></i>
                        <strong>Khensani AI</strong>
                    </div>
                    <div class=\"response-text\">\</div>
                </div>
            \;
            responseElement.style.display = 'block';
        }
    }

    async speakText(text, options = {}) {
        if (this.isSpeaking) {
            this.stopSpeaking();
            await this.delay(100);
        }

        return new Promise((resolve, reject) => {
            if (!text || typeof text !== 'string') {
                reject(new Error('Invalid text for speech'));
                return;
            }

            this.synthesis = new SpeechSynthesisUtterance(text);
            this.configureSpeech(this.synthesis, options);

            this.synthesis.onstart = () => {
                this.isSpeaking = true;
                this.updateSpeakingUI(true);
                console.log('Started speaking:', text);
            };

            this.synthesis.onend = () => {
                this.isSpeaking = false;
                this.updateSpeakingUI(false);
                resolve();
                console.log('Finished speaking');
            };

            this.synthesis.onerror = (event) => {
                this.isSpeaking = false;
                this.updateSpeakingUI(false);
                reject(new Error(\Speech error: \\));
                console.error('Speech error:', event);
            };

            speechSynthesis.speak(this.synthesis);
        });
    }

    configureSpeech(utterance, options) {
        const voiceIndex = parseInt(options.voiceIndex) || 
                          document.getElementById('voiceSelect')?.value || 0;
        const voice = this.supportedVoices[voiceIndex];
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = this.currentLanguage;
        }

        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
    }

    async speakAudio(audioData) {
        // Implementation for playing pre-generated audio
        // This would handle audio data from the backend
        console.log('Playing pre-generated audio');
        
        // For now, fall back to text-to-speech
        if (audioData.fallbackText) {
            await this.speakText(audioData.fallbackText);
        }
    }

    stopSpeaking() {
        if (this.isSpeaking && speechSynthesis.speaking) {
            speechSynthesis.cancel();
            this.isSpeaking = false;
            this.updateSpeakingUI(false);
        }
    }

    updateSpeakingUI(speaking) {
        const speakBtn = document.getElementById('speakText');
        const speakingIndicator = document.getElementById('speakingIndicator');
        
        if (speakBtn) {
            speakBtn.disabled = speaking;
            speakBtn.innerHTML = speaking ? 
                '<i class=\"fas fa-stop\"></i> Stop' : 
                '<i class=\"fas fa-play\"></i> Speak';
        }
        
        if (speakingIndicator) {
            speakingIndicator.style.display = speaking ? 'block' : 'none';
        }
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        this.showMessage(\Language set to: \\, 'success');
        
        // Update UI if available
        const languageSelect = document.getElementById('voiceLanguage');
        if (languageSelect) {
            languageSelect.value = languageCode;
        }
    }

    setVoice(voiceIndex) {
        const voice = this.supportedVoices[voiceIndex];
        if (voice) {
            this.showMessage(\Voice set to: \\, 'success');
        }
    }

    showSuggestions(suggestions) {
        const suggestionsElement = document.getElementById('voiceSuggestions');
        if (!suggestionsElement) return;

        suggestionsElement.innerHTML = suggestions.map(suggestion => \
            <button class=\"suggestion-btn\" onclick=\"window.voiceAI.useSuggestion('\')\">
                \
            </button>
        \).join('');
        
        suggestionsElement.style.display = 'block';
    }

    useSuggestion(suggestion) {
        const inputElement = document.getElementById('speechInput');
        if (inputElement) {
            inputElement.value = suggestion;
        }
        
        this.processVoiceCommand(suggestion);
    }

    showMessage(message, type = 'info') {
        if (window.mindFlowApp) {
            window.mindFlowApp.showNotification(message, type);
        } else {
            console.log(\[\] \\);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility method to check if voice features are available
    isVoiceSupported() {
        return this.checkBrowserSupport();
    }

    // Get available languages
    getAvailableLanguages() {
        const languages = new Set();
        this.supportedVoices.forEach(voice => {
            languages.add(voice.lang);
        });
        return Array.from(languages).sort();
    }

    // Cleanup method
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        console.log('Voice AI Engine Destroyed');
    }
}

// Initialize voice AI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAI = new VoiceAI();
});
