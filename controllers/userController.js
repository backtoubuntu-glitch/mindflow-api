import User from '../models/User.js';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const userController = {
  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user statistics
      const statistics = await User.getStatistics(req.user.id);

      res.json({
        success: true,
        data: {
          user,
          statistics
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        gradeLevel,
        dateOfBirth,
        phoneNumber,
        learningGoals,
        interests,
        safetyFeaturesEnabled
      } = req.body;

      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (gradeLevel) updateData.gradeLevel = gradeLevel;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (learningGoals) updateData.learningGoals = learningGoals;
      if (interests) updateData.interests = interests;
      if (typeof safetyFeaturesEnabled === 'boolean') {
        updateData.safetyFeaturesEnabled = safetyFeaturesEnabled;
      }

      const updatedUser = await User.updateProfile(req.user.id, updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Update avatar
  updateAvatar: async (req, res, next) => {
    try {
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: 'Avatar URL is required'
        });
      }

      const updatedUser = await User.updateProfile(req.user.id, { avatarUrl });

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          user: updatedUser
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get user with password
      const user = await query(
        'SELECT * FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!user.rows[0]) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await User.verifyPassword(
        currentPassword,
        user.rows[0].password_hash
      );

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.changePassword(req.user.id, newPassword);

      // Invalidate all existing sessions except current one
      await query(
        'DELETE FROM user_sessions WHERE user_id = $1 AND token_hash != $2',
        [req.user.id, req.user.sessionTokenHash]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      next(error);
    }
  },

  // Get learning progress
  getLearningProgress: async (req, res, next) => {
    try {
      const { subject } = req.query;

      let sql = `
        SELECT * FROM learning_progress 
        WHERE user_id = $1
      `;
      const params = [req.user.id];

      if (subject) {
        sql += ' AND subject = $2';
        params.push(subject);
      }

      sql += ' ORDER BY updated_at DESC';

      const result = await query(sql, params);

      res.json({
        success: true,
        data: {
          progress: result.rows
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Update learning progress
  updateLearningProgress: async (req, res, next) => {
    try {
      const { subject, module, progressPercentage, timeSpent, quizScores } = req.body;

      if (!subject || !module) {
        return res.status(400).json({
          success: false,
          message: 'Subject and module are required'
        });
      }

      const now = new Date().toISOString();

      // Check if progress record exists
      const existingProgress = await query(
        'SELECT * FROM learning_progress WHERE user_id = $1 AND subject = $2 AND module = $3',
        [req.user.id, subject, module]
      );

      if (existingProgress.rows.length > 0) {
        // Update existing progress
        const updateFields = ['updated_at = $4'];
        const params = [req.user.id, subject, module, now];
        let paramCount = 5;

        if (progressPercentage !== undefined) {
          updateFields.push(`progress_percentage = $${paramCount}`);
          params.push(progressPercentage);
          paramCount++;
        }

        if (timeSpent !== undefined) {
          updateFields.push(`time_spent_minutes = time_spent_minutes + $${paramCount}`);
          params.push(timeSpent);
          paramCount++;
        }

        if (quizScores !== undefined) {
          updateFields.push(`quiz_scores = $${paramCount}`);
          params.push(JSON.stringify(quizScores));
          paramCount++;
        }

        updateFields.push(`last_accessed = $${paramCount}`);
        params.push(now);

        await query(
          `UPDATE learning_progress SET ${updateFields.join(', ')} 
           WHERE user_id = $1 AND subject = $2 AND module = $3`,
          params
        );
      } else {
        // Create new progress record
        await query(
          `INSERT INTO learning_progress (
            user_id, subject, module, progress_percentage, time_spent_minutes,
            quiz_scores, last_accessed, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            req.user.id, subject, module, progressPercentage || 0,
            timeSpent || 0, JSON.stringify(quizScores || []),
            now, now, now
          ]
        );
      }

      // Emit real-time progress update
      if (req.app.get('io')) {
        req.app.get('io').to(`user-${req.user.id}`).emit('progress-updated', {
          userId: req.user.id,
          subject,
          module,
          progressPercentage,
          timestamp: now
        });
      }

      res.json({
        success: true,
        message: 'Learning progress updated successfully'
      });

    } catch (error) {
      next(error);
    }
  },

  // Get achievements
  getAchievements: async (req, res, next) => {
    try {
      const result = await query(
        `SELECT * FROM achievements 
         WHERE user_id = $1 
         ORDER BY earned_at DESC`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          achievements: result.rows
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Add achievement
  addAchievement: async (req, res, next) => {
    try {
      const { achievementType, achievementName, description, pointsAwarded, metadata } = req.body;

      if (!achievementType || !achievementName) {
        return res.status(400).json({
          success: false,
          message: 'Achievement type and name are required'
        });
      }

      const achievementId = uuidv4();

      await query(
        `INSERT INTO achievements (
          id, user_id, achievement_type, achievement_name, description,
          points_awarded, metadata, earned_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          achievementId, req.user.id, achievementType, achievementName,
          description, pointsAwarded || 0, JSON.stringify(metadata || {}),
          new Date().toISOString()
        ]
      );

      // Emit achievement notification
      if (req.app.get('io')) {
        req.app.get('io').to(`user-${req.user.id}`).emit('achievement-earned', {
          userId: req.user.id,
          achievementType,
          achievementName,
          pointsAwarded: pointsAwarded || 0,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Achievement added successfully'
      });

    } catch (error) {
      next(error);
    }
  },

  // Safety features - update location
  updateLocation: async (req, res, next) => {
    try {
      const { latitude, longitude, accuracy } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const locationId = uuidv4();

      // Store location history
      await query(
        `INSERT INTO location_history (id, user_id, latitude, longitude, accuracy)
         VALUES ($1, $2, $3, $4, $5)`,
        [locationId, req.user.id, latitude, longitude, accuracy]
      );

      // Check safe zones
      const safeZones = await query(
        `SELECT * FROM safety_locations 
         WHERE user_id = $1 AND is_active = TRUE`,
        [req.user.id]
      );

      let safetyStatus = 'safe';
      let currentZone = null;

      for (const zone of safeZones.rows) {
        const distance = calculateDistance(
          latitude, longitude,
          zone.latitude, zone.longitude
        );

        if (distance <= zone.radius_meters) {
          currentZone = zone;
          break;
        } else {
          safetyStatus = 'outside_safe_zone';
        }
      }

      // Notify parents if outside safe zone
      if (safetyStatus === 'outside_safe_zone' && req.app.get('io')) {
        const parents = await User.getParents(req.user.id);
        
        parents.forEach(parent => {
          req.app.get('io').to(`user-${parent.id}`).emit('safety-alert', {
            childId: req.user.id,
            childName: `${req.user.firstName} ${req.user.lastName}`,
            latitude,
            longitude,
            safetyStatus,
            timestamp: new Date().toISOString(),
            message: 'Child is outside safe zone'
          });
        });
      }

      res.json({
        success: true,
        data: {
          safetyStatus,
          currentSafeZone: currentZone,
          location: { latitude, longitude, accuracy }
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Get safety locations
  getSafetyLocations: async (req, res, next) => {
    try {
      const result = await query(
        `SELECT * FROM safety_locations 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          locations: result.rows
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Add safety location
  addSafetyLocation: async (req, res, next) => {
    try {
      const { locationName, latitude, longitude, radiusMeters = 500 } = req.body;

      if (!locationName || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Location name, latitude, and longitude are required'
        });
      }

      const locationId = uuidv4();

      await query(
        `INSERT INTO safety_locations (id, user_id, location_name, latitude, longitude, radius_meters)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [locationId, req.user.id, locationName, latitude, longitude, radiusMeters]
      );

      res.status(201).json({
        success: true,
        message: 'Safety location added successfully'
      });

    } catch (error) {
      next(error);
    }
  },

  // Search users (for teachers/parents)
  searchUsers: async (req, res, next) => {
    try {
      const { query, userType, limit = 10 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Only allow teachers and parents to search
      if (!['teacher', 'parent', 'admin'].includes(req.user.userType)) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
      }

      const users = await User.searchUsers(query, userType, parseInt(limit));

      res.json({
        success: true,
        data: {
          users
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Deactivate account
  deactivateAccount: async (req, res, next) => {
    try {
      const { confirmation } = req.body;

      if (confirmation !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation phrase is required to deactivate account'
        });
      }

      await User.deactivate(req.user.id);

      // Invalidate all sessions
      await query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      next(error);
    }
  }
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default userController;