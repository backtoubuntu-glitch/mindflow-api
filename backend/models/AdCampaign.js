const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdCampaign = sequelize.define('AdCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  dailyBudget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'archived'),
    defaultValue: 'draft'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targeting: {
    type: DataTypes.JSONB,
    defaultValue: {
      grades: [1, 2, 3, 4, 5, 6, 7],
      subjects: ['mathematics', 'science', 'language'],
      locations: ['all'], // or specific regions
      ruralFocus: true,
      learningContexts: ['lesson_completion', 'achievement', 'break_time']
    }
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ruralImpact: {
    type: DataTypes.INTEGER, // Number of rural students sponsored
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = AdCampaign;