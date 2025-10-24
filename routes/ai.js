const express = require('express');
const router = express.Router();
const { developmentBypass } = require('../middleware/development');

router.use(developmentBypass);

// Mock chess AI
router.post('/chess/move', (req, res) => {
  const moves = ['e4', 'd4', 'Nf3', 'c4', 'g3'];
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  
  res.json({
    success: true,
    data: {
      move: randomMove,
      explanation: 'Developing pieces and controlling the center',
      learningObjective: 'control_center',
      alternatives: [
        { move: 'e4', reason: 'Good for center control' },
        { move: 'd4', reason: 'Solid opening choice' }
      ]
    }
  });
});

router.post('/chess/hint', (req, res) => {
  res.json({
    success: true,
    data: {
      hint: 'Try to control the center of the board with your pawns and pieces.'
    }
  });
});

router.post('/chess/analyze', (req, res) => {
  res.json({
    success: true,
    data: {
      accuracy: 75,
      strengths: ['Opening knowledge', 'Piece development'],
      weaknesses: ['Tactical awareness', 'Endgame technique'],
      recommendations: ['Practice tactical puzzles', 'Study basic endgames']
    }
  });
});

router.post('/khensani/chat', (req, res) => {
  res.json({
    success: true,
    data: {
      text: 'Hello! I am Khensani AI, your learning assistant. How can I help you with your studies today?',
      emotionalTone: 'friendly',
      suggestions: [
        'Try the mathematics curriculum',
        'Practice with chess',
        'Explore robotics simulator'
      ]
    }
  });
});

module.exports = router;
