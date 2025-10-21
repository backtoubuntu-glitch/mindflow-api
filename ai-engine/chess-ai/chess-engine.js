cat > frontend/assets/js/chess-engine.js << 'EOF'
class ChessGameEngine {
    constructor() {
        this.chess = new Chess();
        this.board = null;
        this.gameStatus = 'idle'; // idle, playing, finished
        this.difficulty = 'beginner'; // beginner, intermediate, advanced
        this.currentObjective = 'control_center';
        this.moveHistory = [];
        this.aiThinking = false;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.initBoard();
        this.updateStatus();
        this.isInitialized = true;
        
        console.log('♟️ Chess Engine Initialized');
    }

    initBoard() {
        try {
            const config = {
                draggable: true,
                position: 'start',
                onDragStart: this.onDragStart.bind(this),
                onDrop: this.onDrop.bind(this),
                onSnapEnd: this.onSnapEnd.bind(this),
                orientation: 'white', // Student plays white
                pieceTheme: '/assets/images/chesspieces/{piece}.png',
                showNotation: true
            };

            this.board = Chessboard('chessboard', config);
            console.log('🎯 Chessboard initialized');
        } catch (error) {
            console.error('❌ Chessboard initialization failed:', error);
        }
    }

    bindEvents() {
        // Game control buttons
        this.safeAddEventListener('startGame', 'click', () => this.startGame());
        this.safeAddEventListener('resetGame', 'click', () => this.resetGame());
        this.safeAddEventListener('hintButton', 'click', () => this.getHint());
        this.safeAddEventListener('analyzeButton', 'click', () => this.analyzeGame());

        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.level);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'r': // Ctrl+R to reset
                    e.preventDefault();
                    this.resetGame();
                    break;
                case 'h': // Ctrl+H for hint
                    e.preventDefault();
                    this.getHint();
                    break;
                case 'z': // Ctrl+Z to undo (if implemented)
                    e.preventDefault();
                    // this.undoMove(); // Future feature
                    break;
            }
        }
    }

    onDragStart(source, piece, position, orientation) {
        // Prevent moving if:
        // - Game not active
        // - Not player's turn (white)
        // - AI is thinking
        // - Trying to move black pieces
        if (this.gameStatus !== 'playing' || 
            this.chess.turn() !== 'w' || 
            this.aiThinking ||
            piece.startsWith('b')) {
            return false;
        }
        return true;
    }

    async onDrop(source, target) {
        try {
            // Attempt the move
            const move = this.chess.move({
                from: source,
                to: target,
                promotion: 'q' // Always promote to queen for simplicity
            });

            // Illegal move - snap back
            if (move === null) {
                this.showMessage('Invalid move! Try again.');
                return 'snapback';
            }

            // Record successful player move
            this.recordMove(move, 'player');
            this.updateGameDisplay();

            // Check for game end after player move
            if (this.chess.isGameOver()) {
                this.handleGameEnd();
                return;
            }

            // AI's turn
            await this.makeAIMove();

        } catch (error) {
            console.error('Move execution error:', error);
            this.showMessage('Move error occurred');
            return 'snapback';
        }
    }

    onSnapEnd() {
        // Update board position after piece snap
        this.board.position(this.chess.fen());
    }

    async makeAIMove() {
        this.aiThinking = true;
        this.showThinkingIndicator();

        try {
            // Call backend AI for educational move
            const response = await fetch('/api/ai/chess/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    fen: this.chess.fen(),
                    difficulty: this.difficulty,
                    objective: this.currentObjective,
                    moveHistory: this.moveHistory
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Execute AI move
                const aiMove = this.chess.move(result.data.move);
                if (aiMove) {
                    this.recordMove(aiMove, 'ai');
                    this.showEducationalFeedback(result.data);
                    this.updateGameDisplay();

                    // Check for game end after AI move
                    if (this.chess.isGameOver()) {
                        this.handleGameEnd();
                    }
                } else {
                    throw new Error('Invalid AI move received');
                }
            } else {
                throw new Error(result.message || 'AI move failed');
            }

        } catch (error) {
            console.error('AI move failed:', error);
            this.showMessage('AI difficulty: Making strategic move...');
            this.makeFallbackMove();
        } finally {
            this.aiThinking = false;
            this.hideThinkingIndicator();
        }
    }

    makeFallbackMove() {
        // Fallback: make the best legal move based on simple evaluation
        const moves = this.chess.moves({ verbose: true });
        if (moves.length === 0) return;

        // Simple evaluation: prefer captures and checks
        const ratedMoves = moves.map(move => {
            let score = 0;
            
            // Capture bonus
            if (move.captured) {
                score += this.getPieceValue(move.captured);
            }
            
            // Check bonus
            if (move.san.includes('+')) {
                score += 1;
            }
            
            // Promotion bonus
            if (move.promotion) {
                score += 8; // Queen promotion
            }
            
            return { move, score };
        });

        // Sort by score and pick best move
        ratedMoves.sort((a, b) => b.score - a.score);
        const bestMove = ratedMoves[0].move;
        
        this.chess.move(bestMove);
        this.recordMove(bestMove, 'ai');
        this.updateGameDisplay();

        if (this.chess.isGameOver()) {
            this.handleGameEnd();
        }
    }

    getPieceValue(piece) {
        const values = {
            'p': 1,  // pawn
            'n': 3,  // knight
            'b': 3,  // bishop
            'r': 5,  // rook
            'q': 9,  // queen
            'k': 0   // king (infinite value, but not used in captures)
        };
        return values[piece] || 0;
    }

    recordMove(move, player) {
        const moveRecord = {
            san: move.san,
            from: move.from,
            to: move.to,
            player: player,
            fen: this.chess.fen(),
            timestamp: new Date().toISOString(),
            piece: move.piece,
            captured: move.captured
        };

        this.moveHistory.push(moveRecord);
        this.updateMoveList();
        
        // Save game state periodically
        if (this.moveHistory.length % 5 === 0) {
            this.saveGameState();
        }
    }

    updateGameDisplay() {
        // Update board position
        this.board.position(this.chess.fen());
        
        // Update game status
        this.updateStatus();
        
        // Highlight last move
        this.highlightLastMove();
        
        // Update move count
        this.updateMoveCount();
    }

    updateStatus() {
        const statusElement = document.getElementById('gameStatus');
        if (!statusElement) return;

        let statusText = '';
        let statusClass = '';

        if (this.chess.isCheckmate()) {
            const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
            statusText = `🎉 Checkmate! ${winner} wins!`;
            statusClass = 'checkmate';
            this.gameStatus = 'finished';
        } else if (this.chess.isDraw()) {
            statusText = '🤝 Game drawn';
            statusClass = 'draw';
            this.gameStatus = 'finished';
        } else if (this.chess.isCheck()) {
            statusText = '⚡ Check!';
            statusClass = 'check';
            this.gameStatus = 'playing';
        } else if (this.aiThinking) {
            statusText = '🤖 Khensani AI is thinking...';
            statusClass = 'thinking';
        } else {
            const turn = this.chess.turn() === 'w' ? 'Your' : 'AI\\'s';
            statusText = `${turn} turn`;
            statusClass = 'active';
            this.gameStatus = 'playing';
        }

        statusElement.textContent = statusText;
        statusElement.className = `game-status ${statusClass}`;
    }

    updateMoveList() {
        const moveList = document.getElementById('moveList');
        if (!moveList) return;

        moveList.innerHTML = '';

        this.moveHistory.forEach((record, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = `move ${record.player}`;
            
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            
            if (isWhiteMove) {
                moveElement.innerHTML = `
                    <span class="move-number">${moveNumber}.</span>
                    <span class="move-san">${record.san}</span>
                `;
            } else {
                moveElement.innerHTML = `
                    <span class="move-san">${record.san}</span>
                `;
            }

            // Add capture indicator
            if (record.captured) {
                moveElement.classList.add('capture');
            }

            moveList.appendChild(moveElement);
        });

        // Auto-scroll to latest move
        moveList.scrollTop = moveList.scrollHeight;
    }

    updateMoveCount() {
        const moveCountElement = document.getElementById('moveCount');
        if (moveCountElement) {
            moveCountElement.textContent = `Moves: ${this.moveHistory.length}`;
        }
    }

    highlightLastMove() {
        // Remove previous highlights
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove) {
            const squares = [lastMove.from, lastMove.to];
            squares.forEach(square => {
                const squareElement = document.querySelector(`[data-square="${square}"]`);
                if (squareElement) {
                    squareElement.classList.add('highlight');
                }
            });
        }
    }

    async getHint() {
        if (this.gameStatus !== 'playing' || this.chess.turn() !== 'w') {
            this.showMessage('💡 Hint available only during your turn');
            return;
        }

        if (this.aiThinking) {
            this.showMessage('⏳ Please wait for AI to finish thinking');
            return;
        }

        try {
            const response = await fetch('/api/ai/chess/hint', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    fen: this.chess.fen(),
                    difficulty: this.difficulty,
                    objective: this.currentObjective
                })
            });

            if (!response.ok) throw new Error('Hint request failed');

            const result = await response.json();
            
            if (result.success) {
                this.showHint(result.data.hint);
            } else {
                this.showMessage('❌ Could not get hint');
            }
        } catch (error) {
            console.error('Hint error:', error);
            this.showMessage('🌐 Network error - using basic hint');
            this.provideBasicHint();
        }
    }

    provideBasicHint() {
        const moves = this.chess.moves({ verbose: true });
        if (moves.length === 0) return;

        // Simple hint logic based on current objective
        let hint = '';
        
        switch(this.currentObjective) {
            case 'control_center':
                hint = 'Try to move your pieces toward the center of the board (squares e4, e5, d4, d5)';
                break;
            case 'develop_pieces':
                hint = 'Bring your knights and bishops into the game from their starting positions';
                break;
            case 'castle_early':
                hint = 'Consider castling to keep your king safe';
                break;
            default:
                hint = 'Look for moves that develop your pieces and control the center';
        }

        this.showHint(hint);
    }

    showHint(hint) {
        const hintElement = document.getElementById('hintDisplay');
        if (hintElement) {
            hintElement.innerHTML = `
                <div class="hint-header">
                    <i class="fas fa-lightbulb"></i>
                    <strong>Khensani's Hint</strong>
                </div>
                <div class="hint-content">${hint}</div>
            `;
            hintElement.style.display = 'block';

            // Auto-hide after 15 seconds
            setTimeout(() => {
                hintElement.style.display = 'none';
            }, 15000);
        }
    }

    showEducationalFeedback(feedback) {
        const feedbackElement = document.getElementById('educationalFeedback');
        if (!feedbackElement) return;
        
        feedbackElement.innerHTML = `
            <div class="feedback-header">
                <i class="fas fa-robot"></i>
                <strong>Khensani AI Analysis</strong>
            </div>
            <div class="feedback-content">
                <div class="feedback-item">
                    <label>My Move:</label>
                    <span class="move-text">${feedback.move}</span>
                </div>
                <div class="feedback-item">
                    <label>Strategy:</label>
                    <span>${feedback.explanation}</span>
                </div>
                <div class="feedback-item">
                    <label>Learning Focus:</label>
                    <span class="objective">${feedback.learningObjective}</span>
                </div>
                ${feedback.alternatives && feedback.alternatives.length > 0 ? `
                <div class="feedback-item">
                    <label>Alternative Moves:</label>
                    <ul class="alternatives">
                        ${feedback.alternatives.map(alt => 
                            `<li><strong>${alt.move}:</strong> ${alt.reason}</li>`
                        ).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;

        feedbackElement.style.display = 'block';
    }

    startGame() {
        this.resetGame();
        this.gameStatus = 'playing';
        this.updateStatus();
        
        const startBtn = document.getElementById('startGame');
        if (startBtn) startBtn.disabled = true;

        this.showMessage('🎮 Game started! You play as White.');
    }

    resetGame() {
        this.chess.reset();
        this.board.start();
        this.moveHistory = [];
        this.gameStatus = 'idle';
        
        this.updateStatus();
        this.updateMoveList();
        this.updateMoveCount();
        
        const startBtn = document.getElementById('startGame');
        if (startBtn) startBtn.disabled = false;
        
        // Clear UI elements
        this.hideElement('educationalFeedback');
        this.hideElement('hintDisplay');
        this.hideElement('analysisModal');
        
        this.showMessage('🔄 Game reset - ready to play!');
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'none';
    }

    setDifficulty(level) {
        this.difficulty = level;
        
        // Update UI buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });

        // Set learning objective based on difficulty
        const objectives = {
            'beginner': 'control_center',
            'intermediate': 'develop_pieces', 
            'advanced': 'strategic_planning'
        };
        
        this.currentObjective = objectives[level] || 'control_center';
        this.showMessage(`🎯 Difficulty: ${level} | Focus: ${this.currentObjective.replace('_', ' ')}`);
    }

    showThinkingIndicator() {
        const indicator = document.getElementById('aiThinking');
        if (indicator) {
            indicator.style.display = 'flex';
        }
    }

    hideThinkingIndicator() {
        const indicator = document.getElementById('aiThinking');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    showMessage(message, duration = 3000) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.chess-toast');
        existingMessages.forEach(msg => msg.remove());

        const toast = document.createElement('div');
        toast.className = 'chess-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duration);
    }

    getAuthToken() {
        return localStorage.getItem('mindflow_token') || 'demo-token';
    }

    handleGameEnd() {
        this.gameStatus = 'finished';
        this.updateStatus();
        
        const startBtn = document.getElementById('startGame');
        if (startBtn) startBtn.disabled = false;

        // Save final game state
        this.saveGameState();
        
        // Show game result
        setTimeout(() => {
            if (this.chess.isCheckmate()) {
                this.showMessage('🏆 Game Over! ' + document.getElementById('gameStatus').textContent, 5000);
            }
        }, 1000);
    }

    saveGameState() {
        const gameState = {
            fen: this.chess.fen(),
            moves: this.moveHistory,
            difficulty: this.difficulty,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('chess_last_game', JSON.stringify(gameState));
        } catch (error) {
            console.warn('Could not save game state:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('chess_last_game');
            if (saved) {
                const gameState = JSON.parse(saved);
                this.chess.load(gameState.fen);
                this.moveHistory = gameState.moves || [];
                this.difficulty = gameState.difficulty || 'beginner';
                
                this.board.position(gameState.fen);
                this.updateMoveList();
                this.updateStatus();
                
                this.showMessage('💾 Previous game loaded');
                return true;
            }
        } catch (error) {
            console.warn('Could not load game state:', error);
        }
        return false;
    }

    async analyzeGame() {
        if (this.moveHistory.length === 0) {
            this.showMessage('📊 No moves to analyze yet');
            return;
        }

        try {
            const response = await fetch('/api/ai/chess/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    moves: this.moveHistory,
                    difficulty: this.difficulty
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            
            if (result.success) {
                this.showGameAnalysis(result.data);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showMessage('❌ Could not analyze game');
        }
    }

    showGameAnalysis(analysis) {
        // Implementation for showing detailed game analysis
        console.log('Game analysis:', analysis);
        this.showMessage('📈 Game analysis completed!', 2000);
    }

    // Public method to check if engine is ready
    isReady() {
        return this.isInitialized && this.board !== null;
    }

    // Cleanup method
    destroy() {
        if (this.board) {
            this.board.destroy();
        }
        this.isInitialized = false;
        console.log('♟️ Chess Engine Destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGameEngine();
    
    // Global error handler for chess engine
    window.addEventListener('error', (e) => {
        if (e.message.includes('chess') || e.message.includes('Chessboard')) {
            console.error('Chess Engine Error:', e.error);
        }
    });
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessGameEngine;
}
EOF