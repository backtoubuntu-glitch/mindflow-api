import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

class User {
  // Create new user
  static async create(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      userType = 'student',
      gradeLevel = null,
      dateOfBirth = null,
      phoneNumber = null,
      learningGoals = [],
      interests = [],
      safetyFeaturesEnabled = true
    } = userData;

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    try {
      const result = await query(
        `INSERT INTO users (
          id, email, password_hash, first_name, last_name, user_type, 
          grade_level, date_of_birth, phone_number, learning_goals, 
          interests, safety_features_enabled, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId, email, hashedPassword, firstName, lastName, userType,
          gradeLevel, dateOfBirth, phoneNumber, JSON.stringify(learningGoals),
          JSON.stringify(interests), safetyFeaturesEnabled, now, now
        ]
      );

      const user = result.rows[0];
      return this.sanitizeUser(user);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = TRUE',
        [userId]
      );
      
      return result.rows[0] ? this.sanitizeUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const allowedFields = [
      'firstName', 'lastName', 'gradeLevel', 'avatarUrl', 'dateOfBirth',
      'phoneNumber', 'learningGoals', 'interests', 'safetyFeaturesEnabled'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        const dbField = key === 'firstName' ? 'first_name' : 
                       key === 'lastName' ? 'last_name' : 
                       key === 'gradeLevel' ? 'grade_level' : 
                       key === 'avatarUrl' ? 'avatar_url' : 
                       key === 'dateOfBirth' ? 'date_of_birth' : 
                       key === 'phoneNumber' ? 'phone_number' : 
                       key === 'learningGoals' ? 'learning_goals' : 
                       key === 'safetyFeaturesEnabled' ? 'safety_features_enabled' : 
                       key;
        
        updates.push(`${dbField} = $${paramCount}`);
        
        // Handle JSON fields
        if (key === 'learningGoals' || key === 'interests') {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('updated_at = $' + paramCount);
    values.push(new Date().toISOString());
    values.push(userId);

    try {
      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows[0] ? this.sanitizeUser(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(userId) {
    try {
      await query(
        'UPDATE users SET last_login = $1 WHERE id = $2',
        [new Date().toISOString(), userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Change password
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    try {
      await query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
        [hashedPassword, new Date().toISOString(), userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user account
  static async deactivate(userId) {
    try {
      await query(
        'UPDATE users SET is_active = FALSE, updated_at = $1 WHERE id = $2',
        [new Date().toISOString(), userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Add parent-child relationship
  static async addParentChild(parentId, childId, relationshipType = 'parent') {
    try {
      const result = await query(
        `INSERT INTO parent_children (parent_id, child_id, relationship_type) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [parentId, childId, relationshipType]
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Relationship already exists');
      }
      throw error;
    }
  }

  // Get user's children (for parents)
  static async getChildren(parentId) {
    try {
      const result = await query(
        `SELECT u.*, pc.relationship_type 
         FROM users u 
         JOIN parent_children pc ON u.id = pc.child_id 
         WHERE pc.parent_id = $1 AND u.is_active = TRUE`,
        [parentId]
      );
      
      return result.rows.map(user => this.sanitizeUser(user));
    } catch (error) {
      throw error;
    }
  }

  // Get user's parents (for students)
  static async getParents(childId) {
    try {
      const result = await query(
        `SELECT u.*, pc.relationship_type 
         FROM users u 
         JOIN parent_children pc ON u.id = pc.parent_id 
         WHERE pc.child_id = $1 AND u.is_active = TRUE`,
        [childId]
      );
      
      return result.rows.map(user => this.sanitizeUser(user));
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getStatistics(userId) {
    try {
      // Get learning progress stats
      const progressResult = await query(
        `SELECT 
           COUNT(*) as total_modules,
           AVG(progress_percentage) as average_progress,
           SUM(time_spent_minutes) as total_learning_time
         FROM learning_progress 
         WHERE user_id = $1`,
        [userId]
      );

      // Get achievements count
      const achievementsResult = await query(
        `SELECT COUNT(*) as total_achievements 
         FROM achievements 
         WHERE user_id = $1`,
        [userId]
      );

      // Get current streak
      const streakResult = await query(
        `SELECT COUNT(DISTINCT DATE(created_at)) as current_streak 
         FROM learning_progress 
         WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [userId]
      );

      return {
        totalModules: parseInt(progressResult.rows[0].total_modules) || 0,
        averageProgress: parseFloat(progressResult.rows[0].average_progress) || 0,
        totalLearningTime: parseInt(progressResult.rows[0].total_learning_time) || 0,
        totalAchievements: parseInt(achievementsResult.rows[0].total_achievements) || 0,
        currentStreak: parseInt(streakResult.rows[0].current_streak) || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Remove sensitive data from user object
  static sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Search users (for teachers/parents)
  static async searchUsers(query, userType = null, limit = 10) {
    try {
      let sql = `
        SELECT id, first_name, last_name, email, user_type, grade_level, avatar_url 
        FROM users 
        WHERE is_active = TRUE 
        AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
      `;
      
      const params = [`%${query}%`];
      let paramCount = 2;

      if (userType) {
        sql += ` AND user_type = $${paramCount}`;
        params.push(userType);
        paramCount++;
      }

      sql += ` LIMIT $${paramCount}`;
      params.push(limit);

      const result = await query(sql, params);
      return result.rows.map(user => this.sanitizeUser(user));
    } catch (error) {
      throw error;
    }
  }
}

export default User;