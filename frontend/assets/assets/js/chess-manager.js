// MindFlow Chess Manager - Smart Engine Switcher
class ChessManager {
    constructor() {
        this.currentEngine = null;
        this.engineType = 'auto'; // 'advanced' | 'fallback' | 'auto'
        this.advancedEngineAvailable = false;
        this.scores = { player: 0, ai: 0 };
        
        this.init();
    }

    async init() {
        console.log('🎮 Chess Manager Initializing...');
        
        // Test advanced engine availability
        await this.testAdvancedEngine();
        
        // Auto-select best engine
        await this.selectOptimalEngine();
        
        // Setup UI
        this.setupEventListeners();
        this.updateUI();
    }

    async testAdvancedEngine() {
        try {
            console.log('🔍 Testing advanced chess engine...');
            const testResponse = await fetch('https://mindflow-ai.onrender.com/api/health', {
                method: 'GET',
                timeout: 5000
            });
            
            this.advancedEngineAvailable = testResponse.ok;
            console.log(`✅ Advanced engine: ${this.advancedEngineAvailable ? 'ONLINE' : 'OFFLINE'}`);
            
        } catch (error) {
            console.log('❌ Advanced engine offline, using fallback');
            this.advancedEngineAvailable = false;
        }
    }

    async selectOptimalEngine() {
        if (this.advancedEngineAvailable) {
            await this.switchToAdvancedEngine();
        } else {
            await this.switchToFallbackEngine();
        }
    }

    async switchToAdvancedEngine() {
        try {
            if (typeof window.EducationalChess !== 'undefined') {
                this.currentEngine = new window.EducationalChess();
                this.engineType = 'advanced';
                this.updateEngineStatus('Advanced AI Engine (Online)', true);
                this.showKhensaniMessage("Connected to advanced AI! I'll provide deep strategic analysis.");
                console.log('🚀 Switched to Advanced Chess Engine');
            }
        } catch (error) {
            console.error('Failed to switch to advanced engine:', error);
            await this.switchToFallbackEngine();
        }
    }

    async switchToFallbackEngine() {
        try {
            if (typeof window.ChessGame !== 'undefined') {
                this.currentEngine = new window.ChessGame();
                this.engineType = 'fallback';
                this.updateEngineStatus('Fallback Engine (Always Available)', false);
                this.showKhensaniMessage("Using reliable fallback engine. Perfect for learning basics!");
                console.log('🛡️ Switched to Fallback Chess Engine');
            }
        } catch (error) {
            console.error('Both engines failed:', error);
            this.showKhensaniMessage("Chess system initializing... Please wait.");
        }
    }

    async switchEngine() {
        if (this.engineType === 'advanced') {
            await this.switchToFallbackEngine();
        } else {
            await this.switchToAdvancedEngine();
        }
        this.updateUI();
    }

    // Proxy methods to current engine
    newGame() {
        if (this.currentEngine && this.currentEngine.newGame) {
            this.currentEngine.newGame();
        }
    }

    getHint() {
        if (this.currentEngine && this.currentEngine.hint) {
            this.currentEngine.hint();
        } else if (this.currentEngine && this.currentEngine.showEducationalTip) {
            this.currentEngine.showEducationalTip("Try controlling the center squares!");
        }
    }

    undoMove() {
        if (this.currentEngine && this.currentEngine.undoMove) {
            this.currentEngine.undoMove();
        }
    }

    resign() {
        if (this.currentEngine) {
            if (this.currentEngine.resign) {
                this.currentEngine.resign();
            }
            // Update scores
            this.scores.ai += 5;
            this.updateScores();
        }
    }

    khensaniAdvice() {
        const tips = [
            "Remember: Knights are great in closed positions!",
            "Bishops love long diagonals - give them space!",
            "Castle early to keep your king safe!",
            "Control the center - it's like the highway of chess!",
            "Every move should have a purpose!",
            "Look for checks, captures, and threats!",
            "Don't move the same piece multiple times in opening!",
            "Develop your pieces toward the center!",
            "Keep your pawn structure solid!",
            "The threat is often stronger than the execution!"
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showKhensaniMessage(randomTip);
    }

    // UI Management
    updateEngineStatus(message, isOnline) {
        const statusElement = document.getElementById('engineStatus');
        const engineElement = document.getElementById('currentEngine');
        
        if (statusElement) {
            statusElement.textContent = isOnline ? '✅ ' + message : '🛡️ ' + message;
            statusElement.className = `engine-status ${isOnline ? 'engine-online' : 'engine-offline'}`;
        }
        
        if (engineElement) {
            engineElement.textContent = message;
        }
    }

    updateScores() {
        document.getElementById('playerScore').textContent = this.scores.player;
        document.getElementById('aiScore').textContent = this.scores.ai;
    }

    showKhensaniMessage(message) {
        const chatElement = document.getElementById('khensaniMessage');
        if (chatElement) {
            chatElement.textContent = `"${message}"`;
        }
    }

    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                this.setDifficulty(level);
            });
        });

        // Safety integration
        if (window.safetyTracker) {
            console.log('♟️ Chess manager integrated with safety system');
        }
    }

    setDifficulty(level) {
        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Set difficulty in current engine
        if (this.currentEngine && this.currentEngine.setDifficulty) {
            this.currentEngine.setDifficulty(level);
        }
        
        this.showKhensaniMessage(`Difficulty set to ${level}! Let's see what you can do!`);
    }

    updateUI() {
        this.updateScores();
        
        // Update educational tip
        const tipElement = document.getElementById('educationalTip');
        if (tipElement) {
            const tips = [
                "Control the center of the board to gain more space!",
                "Develop your knights and bishops before moving the same piece multiple times.",
                "Castle early to protect your king and connect your rooks.",
                "Don't move your f-pawn too early - it weakens your king's position."
            ];
            tipElement.textContent = tips[Math.floor(Math.random() * tips.length)];
        }
    }
}

// Initialize chess manager
document.addEventListener('DOMContentLoaded', async function() {
    window.chessManager = new ChessManager();
    
    // Global functions for buttons
    window.newChessGame = function() { window.chessManager.newGame(); };
    window.undoChessMove = function() { window.chessManager.undoMove(); };
    window.switchChessEngine = function() { window.chessManager.switchEngine(); };
});