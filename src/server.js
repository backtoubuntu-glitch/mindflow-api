const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://fabulous-flan-939cec.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =====================
// API ENDPOINTS - MIND FLOW AI
// =====================

// Health check endpoint (CRITICAL)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 MindFlow AI Backend is RUNNING!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    platform: 'MindFlow AI Learning Platform',
    mission: 'Making quality AI-powered education accessible to every African child'
  });
});

// Enterprise Authentication
app.get('/api/auth/enterprise-login', (req, res) => {
  res.json({
    success: true,
    message: 'Enterprise authentication endpoint ready',
    features: ['OAuth', 'JWT', 'Role-based access'],
    status: 'active'
  });
});

app.post('/api/auth/enterprise-login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 'user_001',
      name: 'Demo User',
      role: 'student',
      avatar: '👨‍🎓'
    },
    token: 'demo_jwt_token_mindflow_ai_2025'
  });
});

// Curriculum Structure
app.get('/api/curriculum/structure', (req, res) => {
  res.json({
    success: true,
    curriculum: {
      subjects: [
        {
          name: 'Mathematics',
          grade: 'Grade 4',
          progress: 78,
          modules: ['Basic Operations', 'Fractions', 'Geometry']
        },
        {
          name: 'Science', 
          grade: 'Grade 4',
          progress: 65,
          modules: ['Living Things', 'Forces and Motion', 'States of Matter']
        },
        {
          name: 'English',
          grade: 'Grade 4', 
          progress: 82,
          modules: ['Reading Comprehension', 'Grammar', 'Creative Writing']
        },
        {
          name: 'AI',
          grade: 'Explorer',
          progress: 40,
          modules: ['What is AI?', 'Machine Learning', 'Neural Networks']
        },
        {
          name: 'Robotics',
          grade: 'Explorer',
          progress: 30,
          modules: ['Introduction', 'Basic Programming', 'Sensors']
        },
        {
          name: 'Chess',
          grade: 'Beginner',
          progress: 45,
          modules: ['Basics', 'Opening Strategies', 'Tactical Patterns']
        }
      ]
    },
    totalStudents: 50000,
    engagementRate: 85
  });
});

// Corporate Metrics
app.get('/api/corporate/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      monthlyActiveStudents: 50000,
      partnerSchools: 200,
      learningHoursMonthly: 1000000,
      engagementRate: 85,
      corporatePartners: 15,
      revenueStreams: [
        {
          type: 'Corporate Sponsorships',
          amount: 'R2,500,000',
          growth: '+25%'
        },
        {
          type: 'Premium Features', 
          amount: 'R150,000',
          growth: '+40%'
        }
      ]
    }
  });
});

// User Management
app.get('/api/users/linked-accounts', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        id: 'user_001',
        name: 'John Student',
        role: 'student',
        avatar: '👨‍🎓',
        progress: 78,
        joined: '2024-01-15'
      },
      {
        id: 'user_002', 
        name: 'Sarah Parent',
        role: 'parent',
        avatar: '👩‍👧',
        children: 2,
        joined: '2024-02-20'
      },
      {
        id: 'user_003',
        name: 'Mr. Teacher',
        role: 'teacher', 
        avatar: '👨‍🏫',
        students: 35,
        joined: '2024-01-10'
      }
    ]
  });
});

// AI Assistant Endpoints
app.get('/api/ai/assistant', (req, res) => {
  res.json({
    success: true,
    assistant: {
      name: 'Khensani AI',
      status: 'active',
      features: ['Voice Assistance', 'Progress Tracking', 'Personalized Learning'],
      message: 'Hi! I am Khensani, your AI learning assistant. Ready to learn?'
    }
  });
});

// Safety Tracking
app.get('/api/safety/status', (req, res) => {
  res.json({
    success: true,
    safety: {
      status: 'active',
      features: ['Location Tracking', 'Emergency Contacts', 'Activity Monitoring'],
      lastCheck: new Date().toISOString()
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎯 Welcome to MindFlow AI Backend API',
    platform: 'MindFlow AI Learning Platform 2025',
    mission: 'Making quality AI-powered education accessible to every African child',
    developer: 'MindTech Industries',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/enterprise-login',
      curriculum: '/api/curriculum/structure',
      corporate: '/api/corporate/metrics',
      users: '/api/users/linked-accounts',
      ai: '/api/ai/assistant',
      safety: '/api/safety/status'
    },
    frontend: 'https://fabulous-flan-939cec.netlify.app',
    documentation: 'https://github.com/backtoubuntu-glitch/MindFlow-AI'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '🔍 Endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/auth/enterprise-login', 
      '/api/curriculum/structure',
      '/api/corporate/metrics',
      '/api/users/linked-accounts'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎉 MIND FLOW AI BACKEND SUCCESSFULLY DEPLOYED!
📍 Port: ${PORT}
📍 Environment: ${process.env.NODE_ENV || 'production'}
📍 Health Check: http://localhost:${PORT}/api/health
📍 API Ready: http://localhost:${PORT}/api/
🚀 Frontend: https://fabulous-flan-939cec.netlify.app
💼 Mission: Making quality AI-powered education accessible to every African child
🏢 Powered by: MindTech Industries
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully'); 
  process.exit(0);
});

module.exports = app;