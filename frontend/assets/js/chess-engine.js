// MindFlow AI - Educational Chess Engine (Production)
// ===================================================

class EducationalChess {
    constructor() {
        this.API_BASE = 'https://mindflow-ai.onrender.com/api';
        this.game = null;
        this.board = null;
        this.currentGameId = null;
        this.isPlayerTurn = true;
        this.init();
    }

    init() {
        console.log('♟️ Educational Chess Initialized');
        this.initializeChessBoard();
        this.setupEventListeners();
        this.loadExistingGame();
    }

    // ==================== CHESS BOARD SETUP ====================

    initializeChessBoard() {
        const config = {
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            orientation: 'white', // Student always plays as white
            pieceTheme: '/assets/images/chesspieces/{piece}.png'
        };

        this.board = Chessboard('chessBoard', config);
        this.game = new Chess();
        
        this.updateGameStatus();
    }

    // ==================== GAME LOGIC ====================

    onDragStart(source, piece, position, orientation) {
        // Do not pick up pieces if it's AI's turn or game is over
        if (!this.isPlayerTurn) return false;
        
        // Only allow valid moves
        if (this.game.game_over()) return false;
        
        // Student always plays as white
        if (piece.search(/^b/) !== -1) return false;
        
        return true;
    }

    async onDrop(source, target) {
        try {
            // Attempt the move locally first
            const move = this.game.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to queen for simplicity
            });

            // If illegal move, snap back
            if (move === null) return 'snapback';

            // Update board position
            this.board.position(this.game.fen());
            
            // Check for game end
            if (this.game.game_over()) {
                this.handleGameEnd();
                return;
            }

            // Switch to AI turn
            this.isPlayerTurn = false;
            this.updateGameStatus('Thinking...');
            
            // Send move to AI backend
            await this.submitMoveToAI(source, target);

        } catch (error) {
            console.error('❌ Move error:', error);
            return 'snapback';
        }
    }

    onSnapEnd() {
        this.board.position(this.game.fen());
    }

    // ==================== AI INTEGRATION ====================

    async submitMoveToAI(from, to) {
        try {
            console.log('🤖 Sending move to AI...');
            
            const response = await fetch(`${this.API_BASE}/ai/chess/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.currentGameId,
                    move: `${from}${to}`,
                    currentFen: this.game.fen()
                })
            });

            if (!response.ok) {
                throw new Error(`AI move failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.move) {
                this.handleAIMove(data);
            } else {
                throw new Error('Invalid AI response');
            }

        } catch (error) {
            console.error('❌ AI move error:', error);
            this.handleAIFallback();
        }
    }

    handleAIMove(aiData) {
        // Make AI move on the board
        const move = this.game.move(aiData.move);
        
        if (move) {
            this.board.position(this.game.fen());
            
            // Provide educational feedback
            this.showEducationalTip(aiData.feedback);
            
            // Check for game end
            if (this.game.game_over()) {
                this.handleGameEnd();
            } else {
                // Switch back to player turn
                this.isPlayerTurn = true;
                this.updateGameStatus('Your turn!');
            }
        }
    }

    handleAIFallback() {
        // Simple fallback AI when backend is unavailable
        const moves = this.game.moves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const move = this.game.move(randomMove);
            
            this.board.position(this.game.fen());
            this.showEducationalTip("I'm using a simple strategy while learning advanced patterns!");
            
            if (this.game.game_over()) {
                this.handleGameEnd();
            } else {
                this.isPlayerTurn = true;
                this.updateGameStatus('Your turn! (Fallback AI)');
            }
        }
    }

    // ==================== EDUCATIONAL FEATURES ====================

    showEducationalTip(tip) {
        const tipElement = document.getElementById('chessTip');
        if (tipElement) {
            tipElement.innerHTML = `
                <div class="educational-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">${tip || 'Good move! Think about controlling the center.'}</span>
                </div>
            `;
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                tipElement.innerHTML = '';
            }, 8000);
        }
    }

    showLearningObjective() {
        const objectives = [
            "Learning Goal: Understand piece development",
            "Strategy Focus: Control the center squares",
            "Tactical Theme: Look for forks and pins",
            "Positional Idea: Improve your worst-placed piece"
        ];
        
        const randomObjective = objectives[Math.floor(Math.random() * objectives.length)];
        this.showEducationalTip(randomObjective);
    }

    // ==================== GAME MANAGEMENT ====================

    handleGameEnd() {
        let message = '';
        
        if (this.game.in_checkmate()) {
            message = this.game.turn() === 'w' ? 
                'Checkmate! You won! 🎉' : 'Checkmate! AI wins. Learn from this!';
        } else if (this.game.in_draw()) {
            message = 'Game drawn! Well played!';
        } else if (this.game.in_stalemate()) {
            message = 'Stalemate! Interesting endgame.';
        } else {
            message = 'Game over!';
        }

        this.updateGameStatus(message);
        this.showGameResult(message);
        
        // Disable further moves
        this.isPlayerTurn = false;
    }

    showGameResult(message) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'game-result-overlay';
        resultDiv.innerHTML = `
            <div class="game-result">
                <h3>Game Complete</h3>
                <p>${message}</p>
                <div class="result-actions">
                    <button onclick="window.chessEngine.newGame()" class="btn-primary">New Game</button>
                    <button onclick="window.chessEngine.analyzeGame()" class="btn-secondary">Analyze</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(resultDiv);
    }

    updateGameStatus(status = '') {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            const turnIndicator = this.isPlayerTurn ? 'Your turn (White)' : 'AI thinking (Black)';
            statusElement.textContent = status || turnIndicator;
        }
    }

    // ==================== GAME CONTROLS ====================

    newGame() {
        this.game = new Chess();
        this.board.start();
        this.isPlayerTurn = true;
        this.currentGameId = 'game_' + Date.now();
        
        this.updateGameStatus('New game started! Your turn.');
        
        // Remove any result overlays
        const existingResult = document.querySelector('.game-result-overlay');
        if (existingResult) existingResult.remove();
        
        // Show learning objective
        setTimeout(() => this.showLearningObjective(), 1000);
    }

    undoMove() {
        this.game.undo();
        this.game.undo(); // Undo both player and AI moves
        this.board.position(this.game.fen());
        this.isPlayerTurn = true;
        this.updateGameStatus('Move undone. Your turn again.');
    }

    analyzeGame() {
        const analysis = {
            fen: this.game.fen(),
            moves: this.game.history(),
            evaluation: this.analyzePosition(),
            suggestions: this.getLearningSuggestions()
        };
        
        this.showAnalysis(analysis);
    }

    analyzePosition() {
        // Simple position analysis
        const material = this.calculateMaterial();
        const centerControl = this.assessCenterControl();
        const development = this.assessDevelopment();
        
        return {
            materialBalance: material,
            centerControl: centerControl,
            pieceDevelopment: development,
            overall: material > 0 ? 'Advantage: White' : 'Advantage: Black'
        };
    }

    calculateMaterial() {
        // Simple material count
        let white = 0, black = 0;
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        
        this.game.board().forEach(row => {
            row.forEach(piece => {
                if (piece) {
                    if (piece.color === 'w') white += values[piece.type];
                    else black += values[piece.type];
                }
            });
        });
        
        return white - black;
    }

    // ==================== UTILITIES ====================

    loadExistingGame() {
        const savedGame = localStorage.getItem('mindflow_chess_game');
        if (savedGame) {
            try {
                const gameData = JSON.parse(savedGame);
                this.game.load_pgn(gameData.pgn);
                this.board.position(this.game.fen());
                this.currentGameId = gameData.gameId;
                console.log('✅ Loaded existing game');
            } catch (error) {
                console.error('❌ Failed to load game:', error);
                this.newGame();
            }
        } else {
            this.newGame();
        }
    }

    saveGame() {
        const gameData = {
            pgn: this.game.pgn(),
            gameId: this.currentGameId,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mindflow_chess_game', JSON.stringify(gameData));
    }
}

// ==================== GLOBAL CHESS INSTANCE ====================

document.addEventListener('DOMContentLoaded', function() {
    window.chessEngine = new EducationalChess();
});

// Global control functions
window.newChessGame = function() {
    window.chessEngine?.newGame();
};

window.undoChessMove = function() {
    window.chessEngine?.undoMove();
};

window.analyzeChessGame = function() {
    window.chessEngine?.analyzeGame();
};