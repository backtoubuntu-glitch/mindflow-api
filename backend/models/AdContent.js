const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdContent = sequelize.define('AdContent', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER, // in bytes
    allowNull: false
  },
  fileFormat: {
    type: DataTypes.ENUM('mp4', 'webm'),
    allowNull: false
  },
  targetGrades: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [1, 2, 3, 4, 5, 6, 7]
  },
  targetSubjects: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['mathematics', 'science', 'language']
  },
  educationalContext: {
    type: DataTypes.TEXT, // How this ad provides educational value
    allowNull: false
  },
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'needs_review'),
    defaultValue: 'pending'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.UUID, // Moderator user ID
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bidPerView: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 2.00
  },
  totalViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  ruralViews: {
    type: DataTypes.INTEGER,
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

module.exports = AdContent;