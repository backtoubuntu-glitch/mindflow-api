class ChessGameEngine {
    constructor() {
        this.chess = new Chess();
        this.board = null;
        this.gameStatus = 'idle';
        this.difficulty = 'beginner';
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
        
        console.log('Chess Engine Initialized');
    }

    initBoard() {
        try {
            const config = {
                draggable: true,
                position: 'start',
                onDragStart: this.onDragStart.bind(this),
                onDrop: this.onDrop.bind(this),
                onSnapEnd: this.onSnapEnd.bind(this),
                orientation: 'white',
                pieceTheme: '/assets/images/chesspieces/{piece}.png',
                showNotation: true
            };

            this.board = Chessboard('chessboard', config);
            console.log('Chessboard initialized');
        } catch (error) {
            console.error('Chessboard initialization failed:', error);
        }
    }

    bindEvents() {
        this.safeAddEventListener('startGame', 'click', () => this.startGame());
        this.safeAddEventListener('resetGame', 'click', () => this.resetGame());
        this.safeAddEventListener('hintButton', 'click', () => this.getHint());
        this.safeAddEventListener('analyzeButton', 'click', () => this.analyzeGame());

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.level);
            });
        });
    }

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    onDragStart(source, piece, position, orientation) {
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
            const move = this.chess.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (move === null) {
                this.showMessage('Invalid move! Try again.');
                return 'snapback';
            }

            this.recordMove(move, 'player');
            this.updateGameDisplay();

            if (this.chess.isGameOver()) {
                this.handleGameEnd();
                return;
            }

            await this.makeAIMove();

        } catch (error) {
            console.error('Move execution error:', error);
            this.showMessage('Move error occurred');
            return 'snapback';
        }
    }

    onSnapEnd() {
        this.board.position(this.chess.fen());
    }

    async makeAIMove() {
        this.aiThinking = true;
        this.showThinkingIndicator();

        try {
            const response = await fetch('/api/ai/chess/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \Bearer \\
                },
                body: JSON.stringify({
                    fen: this.chess.fen(),
                    difficulty: this.difficulty,
                    objective: this.currentObjective,
                    moveHistory: this.moveHistory
                })
            });

            if (!response.ok) {
                throw new Error(\API error: \\);
            }

            const result = await response.json();

            if (result.success && result.data) {
                const aiMove = this.chess.move(result.data.move);
                if (aiMove) {
                    this.recordMove(aiMove, 'ai');
                    this.showEducationalFeedback(result.data);
                    this.updateGameDisplay();

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
            this.makeFallbackMove();
        } finally {
            this.aiThinking = false;
            this.hideThinkingIndicator();
        }
    }

    makeFallbackMove() {
        const moves = this.chess.moves({ verbose: true });
        if (moves.length === 0) return;

        const ratedMoves = moves.map(move => {
            let score = 0;
            
            if (move.captured) {
                score += this.getPieceValue(move.captured);
            }
            
            if (move.san.includes('+')) {
                score += 1;
            }
            
            if (move.promotion) {
                score += 8;
            }
            
            return { move, score };
        });

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
            'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
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
    }

    updateGameDisplay() {
        this.board.position(this.chess.fen());
        this.updateStatus();
        this.highlightLastMove();
        this.updateMoveCount();
    }

    updateStatus() {
        const statusElement = document.getElementById('gameStatus');
        if (!statusElement) return;

        let statusText = '';

        if (this.chess.isCheckmate()) {
            const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
            statusText = \Checkmate! \ wins!\;
            this.gameStatus = 'finished';
        } else if (this.chess.isDraw()) {
            statusText = 'Game drawn';
            this.gameStatus = 'finished';
        } else if (this.chess.isCheck()) {
            statusText = 'Check!';
            this.gameStatus = 'playing';
        } else if (this.aiThinking) {
            statusText = 'Khensani AI is thinking...';
        } else {
            const turn = this.chess.turn() === 'w' ? 'Your' : 'AI\\'s';
            statusText = \\ turn\;
            this.gameStatus = 'playing';
        }

        statusElement.textContent = statusText;
    }

    updateMoveList() {
        const moveList = document.getElementById('moveList');
        if (!moveList) return;

        moveList.innerHTML = '';

        this.moveHistory.forEach((record, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = \move \\;
            
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            
            if (isWhiteMove) {
                moveElement.innerHTML = \
                    <span class="move-number">\.</span>
                    <span class="move-san">\</span>
                \;
            } else {
                moveElement.innerHTML = \
                    <span class="move-san">\</span>
                \;
            }

            if (record.captured) {
                moveElement.classList.add('capture');
            }

            moveList.appendChild(moveElement);
        });

        moveList.scrollTop = moveList.scrollHeight;
    }

    updateMoveCount() {
        const moveCountElement = document.getElementById('moveCount');
        if (moveCountElement) {
            moveCountElement.textContent = \Moves: \\;
        }
    }

    highlightLastMove() {
        document.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove) {
            const squares = [lastMove.from, lastMove.to];
            squares.forEach(square => {
                const squareElement = document.querySelector(\[data-square="\"]\);
                if (squareElement) {
                    squareElement.classList.add('highlight');
                }
            });
        }
    }

    async getHint() {
        if (this.gameStatus !== 'playing' || this.chess.turn() !== 'w') {
            this.showMessage('Hint available only during your turn');
            return;
        }

        try {
            const response = await fetch('/api/ai/chess/hint', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': \Bearer \\
                },
                body: JSON.stringify({
                    fen: this.chess.fen(),
                    difficulty: this.difficulty,
                    objective: this.currentObjective
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showHint(result.data.hint);
            }
        } catch (error) {
            this.showMessage('Could not get hint');
        }
    }

    showHint(hint) {
        const hintElement = document.getElementById('hintDisplay');
        if (hintElement) {
            hintElement.innerHTML = \
                <div class="hint-header">
                    <i class="fas fa-lightbulb"></i>
                    <strong>Khensani's Hint</strong>
                </div>
                <div class="hint-content">\</div>
            \;
            hintElement.style.display = 'block';

            setTimeout(() => {
                hintElement.style.display = 'none';
            }, 15000);
        }
    }

    showEducationalFeedback(feedback) {
        const feedbackElement = document.getElementById('educationalFeedback');
        if (!feedbackElement) return;
        
        feedbackElement.innerHTML = \
            <div class="feedback-header">
                <i class="fas fa-robot"></i>
                <strong>Khensani AI Analysis</strong>
            </div>
            <div class="feedback-content">
                <div class="feedback-item">
                    <label>My Move:</label>
                    <span class="move-text">\</span>
                </div>
                <div class="feedback-item">
                    <label>Strategy:</label>
                    <span>\</span>
                </div>
                <div class="feedback-item">
                    <label>Learning Focus:</label>
                    <span class="objective">\</span>
                </div>
            </div>
        \;

        feedbackElement.style.display = 'block';
    }

    startGame() {
        this.resetGame();
        this.gameStatus = 'playing';
        this.updateStatus();
        
        const startBtn = document.getElementById('startGame');
        if (startBtn) startBtn.disabled = true;

        this.showMessage('Game started! You play as White.');
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
        
        this.hideElement('educationalFeedback');
        this.hideElement('hintDisplay');
        
        this.showMessage('Game reset - ready to play!');
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'none';
    }

    setDifficulty(level) {
        this.difficulty = level;
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });

        const objectives = {
            'beginner': 'control_center',
            'intermediate': 'develop_pieces', 
            'advanced': 'strategic_planning'
        };
        
        this.currentObjective = objectives[level] || 'control_center';
        this.showMessage(\Difficulty: \ | Focus: \\);
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
        const existingMessages = document.querySelectorAll('.chess-toast');
        existingMessages.forEach(msg => msg.remove());

        const toast = document.createElement('div');
        toast.className = 'chess-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

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
    }

    isReady() {
        return this.isInitialized && this.board !== null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGameEngine();
});
