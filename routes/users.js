const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { developmentBypass } = require('../middleware/development');

router.use(developmentBypass);
router.use(authenticate);

// Mock endpoints for development
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

router.get('/progress', (req, res) => {
  res.json({
    success: true,
    data: {
      progress: {
        mathematics: 65,
        science: 42,
        language: 78
      },
      totalLessons: 150,
      completedLessons: 87,
      currentStreak: 5,
      totalPoints: 1240
    }
  });
});

router.get('/achievements', (req, res) => {
  res.json({
    success: true,
    data: {
      achievements: [
        { name: 'First Lesson', description: 'Complete your first lesson', unlocked: true },
        { name: 'Math Whiz', description: 'Complete 10 math lessons', unlocked: true },
        { name: 'Science Explorer', description: 'Complete 5 science lessons', unlocked: false }
      ]
    }
  });
});

module.exports = router;
