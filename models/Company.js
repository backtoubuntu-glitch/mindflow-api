const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  website: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  industry: {
    type: DataTypes.ENUM(
      'technology',
      'education',
      'finance',
      'healthcare',
      'retail',
      'telecom',
      'manufacturing',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  logo: {
    type: DataTypes.STRING, // URL to stored logo
    allowNull: true
  },
  taxNumber: {
    type: DataTypes.STRING, // VAT/TAX number
    allowNull: false
  },
  address: {
    type: DataTypes.JSONB, // {street, city, postalCode, country}
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending'
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'verified', 'rejected'),
    defaultValue: 'unverified'
  },
  walletBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalSponsored: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  ruralStudentsSponsored: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  preferences: {
    type: DataTypes.JSONB, // Targeting preferences
    defaultValue: {
      targetGrades: [1, 2, 3, 4, 5, 6, 7],
      targetSubjects: ['mathematics', 'science', 'language'],
      maxBidPerView: 5.00,
      dailyBudget: 100.00,
      ruralFocus: true
    }
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

module.exports = Company;