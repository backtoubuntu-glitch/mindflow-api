const { Chess } = require('chess.js');

class EducationalChessAI {
  constructor() {
    this.game = new Chess();
    this.difficultyLevels = {
      beginner: { depth: 1, randomness: 0.3 },
      intermediate: { depth: 3, randomness: 0.1 },
      advanced: { depth: 5, randomness: 0.05 }
    };
    this.learningObjectives = this.setupLearningObjectives();
  }

  setupLearningObjectives() {
    return {
      beginner: [
        'control_center',
        'develop_pieces', 
        'castle_early',
        'avoid_piece_loss'
      ],
      intermediate: [
        'pawn_structure',
        'piece_coordination',
        'tactical_patterns',
        'basic_endgames'
      ],
      advanced: [
        'strategic_planning',
        'positional_sacrifices',
        'complex_endgames',
        'opening_repertoire'
      ]
    };
  }

  // Educational move selection
  async getEducationalMove(studentLevel, currentObjective) {
    const possibleMoves = this.game.moves({ verbose: true });
    const scoredMoves = [];
    
    for (const move of possibleMoves) {
      let score = await this.evaluateMove(move, studentLevel, currentObjective);
      
      // Add some randomness based on difficulty
      const randomness = this.difficultyLevels[studentLevel].randomness;
      score += (Math.random() - 0.5) * randomness * 100;
      
      scoredMoves.push({ move, score });
    }
    
    // Select best move for educational value
    scoredMoves.sort((a, b) => b.score - a.score);
    
    const bestMove = scoredMoves[0];
    const explanation = this.generateMoveExplanation(bestMove.move, currentObjective);
    
    return {
      move: bestMove.move.san,
      explanation,
      learningObjective: currentObjective,
      alternatives: scoredMoves.slice(1, 4).map(m => ({
        move: m.move.san,
        reason: 'Good alternative'
      }))
    };
  }

  async evaluateMove(move, studentLevel, objective) {
    let score = 0;
    
    // Make the move temporarily
    this.game.move(move);
    
    // Evaluate based on educational objective
    switch(objective) {
      case 'control_center':
        score = this.evaluateCenterControl();
        break;
      case 'develop_pieces':
        score = this.evaluatePieceDevelopment();
        break;
      case 'avoid_piece_loss':
        score = this.evaluateMaterialSafety();
        break;
      default:
        score = this.evaluatePosition();
    }
    
    // Undo the move
    this.game.undo();
    
    return score;
  }

  evaluateCenterControl() {
    const centerSquares = ['e4', 'e5', 'd4', 'd5'];
    let control = 0;
    
    centerSquares.forEach(square => {
      const piece = this.game.get(square);
      if (piece && piece.color === this.game.turn()) {
        control += piece.type === 'p' ? 1 : 2;
      }
    });
    
    return control;
  }

  evaluatePieceDevelopment() {
    const developedPieces = ['b', 'c', 'g', 'f']; // Knight and bishop files
    let development = 0;
    
    developedPieces.forEach(file => {
      const pieces = this.game.board().flat().filter(p => 
        p && p.color === this.game.turn() && p.square.startsWith(file)
      );
      development += pieces.length;
    });
    
    return development;
  }

  evaluateMaterialSafety() {
    const currentMaterial = this.calculateMaterial();
    this.game.move(this.game.moves()[0]); // Make first possible move
    const newMaterial = this.calculateMaterial();
    this.game.undo();
    
    return currentMaterial - newMaterial; // Positive if material is safe
  }

  calculateMaterial() {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let material = 0;
    
    this.game.board().flat().forEach(piece => {
      if (piece && piece.color === this.game.turn()) {
        material += values[piece.type] || 0;
      }
    });
    
    return material;
  }

  generateMoveExplanation(move, objective) {
    const explanations = {
      'control_center': `This move helps control the center of the board, which is important for controlling the game.`,
      'develop_pieces': `Developing your pieces to active squares gives you more options and control.`,
      'avoid_piece_loss': `This move keeps your pieces safe while maintaining a good position.`,
      'pawn_structure': `This move improves your pawn structure, which can give you long-term advantages.`
    };
    
    return explanations[objective] || `This is a good move that follows chess principles.`;
  }

  // Generate practice puzzles based on student level
  generatePracticePuzzle(studentLevel, theme) {
    const puzzles = {
      beginner: [
        {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          objective: 'Develop a knight to control the center',
          hint: 'Look for squares that attack the center'
        }
      ],
      intermediate: [
        {
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5',
          objective: 'Find a tactical sequence to win material',
          hint: 'Look for unprotected pieces'
        }
      ]
    };
    
    return puzzles[studentLevel]?.[0] || puzzles.beginner[0];
  }

  // Analyze student's game for learning insights
  analyzeGamePerformance(moves, studentLevel) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      accuracy: this.calculateMoveAccuracy(moves)
    };
    
    // Analyze opening choices
    const openingEvaluation = this.evaluateOpening(moves);
    if (openingEvaluation.score < 40) {
      analysis.weaknesses.push('opening_understanding');
      analysis.recommendations.push('Practice basic opening principles');
    }
    
    // Analyze tactical awareness
    const tacticalMoves = this.identifyTacticalOpportunities(moves);
    if (tacticalMoves.missed > 3) {
      analysis.weaknesses.push('tactical_vision');
      analysis.recommendations.push('Solve tactical puzzles daily');
    }
    
    return analysis;
  }

  calculateMoveAccuracy(moves) {
    // Simplified accuracy calculation
    let accurateMoves = 0;
    const totalMoves = moves.length;
    
    // This would normally use stockfish or similar
    // For now, use a simple heuristic
    moves.forEach((move, index) => {
      if (index < 10) { // First 10 moves
        if (this.isDevelopingMove(move)) accurateMoves++;
      } else {
        // Later moves - simpler check
        if (!this.isBlunder(move)) accurateMoves++;
      }
    });
    
    return (accurateMoves / totalMoves) * 100;
  }

  isDevelopingMove(move) {
    const developingPieces = ['b', 'c', 'g', 'f']; // Knight and bishop files
    return developingPieces.some(file => move.from.startsWith(file));
  }

  isBlunder(move) {
    // Simple blunder detection
    this.game.move(move);
    const isCheckmate = this.game.isCheckmate();
    const materialBefore = this.calculateMaterial();
    this.game.undo();
    
    return isCheckmate || materialBefore - this.calculateMaterial() > 3;
  }
}

module.exports = EducationalChessAI;