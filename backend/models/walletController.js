const { Company, Transaction } = require('../models');
const { validationResult } = require('express-validator');

// Add funds to wallet
exports.addFunds = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod, transactionId } = req.body;
    const companyId = req.user.companyId;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      companyId,
      type: 'deposit',
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      status: 'completed',
      description: `Wallet deposit of R${amount}`
    });

    // Update wallet balance
    company.walletBalance += parseFloat(amount);
    await company.save();

    res.json({
      success: true,
      message: 'Funds added to wallet successfully',
      data: {
        newBalance: company.walletBalance,
        transaction
      }
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during fund addition'
    });
  }
};

// Get wallet balance and transactions
exports.getWalletInfo = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const company = await Company.findByPk(req.user.companyId, {
      attributes: ['walletBalance', 'totalSponsored', 'ruralStudentsSponsored']
    });

    const transactions = await Transaction.findAndCountAll({
      where: { companyId: req.user.companyId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        walletBalance: company.walletBalance,
        totalSponsored: company.totalSponsored,
        ruralStudentsSponsored: company.ruralStudentsSponsored,
        transactions: transactions.rows,
        total: transactions.count,
        page: parseInt(page),
        totalPages: Math.ceil(transactions.count / limit)
      }
    });
  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Process ad view payment
exports.processAdView = async (adContentId, userId, isRural = false) => {
  try {
    const adContent = await AdContent.findByPk(adContentId);
    if (!adContent || !adContent.isActive) {
      return false;
    }

    const company = await Company.findByPk(adContent.companyId);
    if (!company || company.walletBalance < adContent.bidPerView) {
      return false;
    }

    // Deduct from wallet
    company.walletBalance -= adContent.bidPerView;
    company.totalSponsored += adContent.bidPerView;
    
    if (isRural) {
      company.ruralStudentsSponsored += 1;
      adContent.ruralViews += 1;
    }

    adContent.totalViews += 1;
    adContent.totalSpent += adContent.bidPerView;

    // Create transaction record
    await Transaction.create({
      companyId: company.id,
      type: 'ad_view',
      amount: -adContent.bidPerView,
      status: 'completed',
      description: `Ad view for "${adContent.title}" - ${isRural ? 'Rural student' : 'Urban student'}`
    });

    await company.save();
    await adContent.save();

    return true;
  } catch (error) {
    console.error('Process ad view error:', error);
    return false;
  }
};