import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Generate random string
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique ID
export const generateUniqueId = () => {
  return uuidv4();
};

// Format response
export const formatResponse = (success, message, data = null) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Format duration in minutes to readable string
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
};

// Calculate progress percentage
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  return {
    token: generateRandomString(40),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file type is allowed
export const isAllowedFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Generate progress report
export const generateProgressReport = (progressData) => {
  const {
    totalModules,
    completedModules,
    averageScore,
    timeSpent,
    strengths = [],
    areasForImprovement = []
  } = progressData;

  const completionRate = Math.round((completedModules / totalModules) * 100);
  
  let performanceLevel = 'Beginner';
  if (completionRate >= 80) performanceLevel = 'Advanced';
  else if (completionRate >= 60) performanceLevel = 'Intermediate';
  else if (completionRate >= 40) performanceLevel = 'Developing';

  return {
    completionRate,
    performanceLevel,
    averageScore: Math.round(averageScore),
    totalLearningTime: formatDuration(timeSpent),
    strengths,
    areasForImprovement,
    recommendation: generateRecommendation(completionRate, strengths, areasForImprovement)
  };
};

// Generate learning recommendation
const generateRecommendation = (completionRate, strengths, areasForImprovement) => {
  if (completionRate < 40) {
    return 'Focus on building foundational knowledge. Start with basic concepts and practice regularly.';
  } else if (completionRate < 70) {
    return 'Great progress! Continue building on your strengths while addressing areas that need improvement.';
  } else {
    return 'Excellent work! Challenge yourself with advanced topics and explore related subjects.';
  }
};

// Export utilities
export default {
  generateRandomString,
  generateUniqueId,
  formatResponse,
  isValidEmail,
  calculateAge,
  formatDuration,
  calculateProgress,
  sanitizeInput,
  generatePasswordResetToken,
  formatFileSize,
  isAllowedFileType,
  generateProgressReport
};