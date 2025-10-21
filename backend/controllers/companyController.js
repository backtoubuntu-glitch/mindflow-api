const { Company, User } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/helpers');

// Company registration
exports.registerCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      phone,
      website,
      industry,
      description,
      taxNumber,
      address,
      adminUser
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'Company with this email already exists'
      });
    }

    // Create company
    const company = await Company.create({
      name,
      email,
      phone,
      website,
      industry,
      description,
      taxNumber,
      address,
      status: 'pending'
    });

    // Create admin user for company
    const hashedPassword = await bcrypt.hash(adminUser.password, 12);
    const user = await User.create({
      email: adminUser.email,
      password: hashedPassword,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: 'company_admin',
      companyId: company.id,
      isVerified: false
    });

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Company registration submitted for approval',
      data: {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          status: company.status
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during company registration'
    });
  }
};

// Get company profile
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: { company }
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update company profile
exports.updateCompanyProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const allowedUpdates = [
      'name', 'phone', 'website', 'industry', 'description', 
      'taxNumber', 'address', 'preferences'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get company dashboard stats
exports.getCompanyDashboard = async (req, res) => {
  try {
    const { companyId } = req.user;
    
    const company = await Company.findByPk(companyId, {
      attributes: ['walletBalance', 'totalSponsored', 'ruralStudentsSponsored']
    });

    // Get active campaigns count
    const { AdCampaign } = require('../models');
    const activeCampaigns = await AdCampaign.count({
      where: { 
        companyId,
        status: 'active'
      }
    });

    // Get total ads
    const { AdContent } = require('../models');
    const totalAds = await AdContent.count({
      where: { companyId }
    });

    // Get recent performance (last 7 days)
    const { AdView } = require('../models');
    const recentViews = await AdView.sum('viewCount', {
      where: { 
        companyId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      success: true,
      data: {
        walletBalance: company.walletBalance,
        totalSponsored: company.totalSponsored,
        ruralStudentsSponsored: company.ruralStudentsSponsored,
        activeCampaigns,
        totalAds,
        recentViews: recentViews || 0
      }
    });
  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};