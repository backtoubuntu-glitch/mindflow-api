const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { developmentBypass } = require('../middleware/development');

// Apply development bypass for auth routes
router.use(developmentBypass);

// Public routes
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('grade').isInt({ min: 1, max: 12 })
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], authController.resetPassword);

router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
