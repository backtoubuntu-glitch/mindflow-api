const { AdContent, Company, AdCampaign } = require('../models');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Upload ad content
exports.uploadAdContent = async (req, res) => {
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
      title,
      description,
      targetGrades,
      targetSubjects,
      educationalContext,
      bidPerView,
      campaignId
    } = req.body;

    // Check file upload
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    const videoFile = req.files.video;
    const thumbnailFile = req.files.thumbnail;

    // Validate file size (max 50MB)
    if (videoFile.size > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Video file size must be less than 50MB'
      });
    }

    // Validate file format
    const allowedFormats = ['.mp4', '.webm'];
    const fileExt = path.extname(videoFile.name).toLowerCase();
    if (!allowedFormats.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: 'Only MP4 and WebM formats are allowed'
      });
    }

    // Generate unique filenames
    const videoFileName = `ad_${Date.now()}_${videoFile.name}`;
    const thumbnailFileName = `thumb_${Date.now()}_${thumbnailFile.name}`;

    // Save files (in production, this would be to cloud storage)
    const uploadDir = path.join(__dirname, '../../uploads/ads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const videoPath = path.join(uploadDir, videoFileName);
    const thumbnailPath = path.join(uploadDir, thumbnailFileName);

    await videoFile.mv(videoPath);
    await thumbnailFile.mv(thumbnailPath);

    // Get video duration (simplified - in production use ffmpeg)
    const duration = 30; // Default, should be extracted from video

    // Create ad content
    const adContent = await AdContent.create({
      companyId: req.user.companyId,
      title,
      description,
      videoUrl: `/uploads/ads/${videoFileName}`,
      thumbnailUrl: `/uploads/ads/${thumbnailFileName}`,
      duration,
      fileSize: videoFile.size,
      fileFormat: fileExt.replace('.', ''),
      targetGrades: Array.isArray(targetGrades) ? targetGrades : JSON.parse(targetGrades),
      targetSubjects: Array.isArray(targetSubjects) ? targetSubjects : JSON.parse(targetSubjects),
      educationalContext,
      bidPerView: parseFloat(bidPerView),
      moderationStatus: 'pending'
    });

    // Associate with campaign if provided
    if (campaignId) {
      const campaign = await AdCampaign.findOne({
        where: {
          id: campaignId,
          companyId: req.user.companyId
        }
      });
      
      if (campaign) {
        await adContent.setCampaign(campaign);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ad content uploaded successfully and submitted for moderation',
      data: { adContent }
    });
  } catch (error) {
    console.error('Upload ad content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during ad upload'
    });
  }
};

// Get company's ad content
exports.getCompanyAds = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { companyId: req.user.companyId };
    if (status) {
      whereClause.moderationStatus = status;
    }

    const ads = await AdContent.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['companyId'] }
    });

    res.json({
      success: true,
      data: {
        ads: ads.rows,
        total: ads.count,
        page: parseInt(page),
        totalPages: Math.ceil(ads.count / limit)
      }
    });
  } catch (error) {
    console.error('Get company ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update ad content
exports.updateAdContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      targetGrades,
      targetSubjects,
      educationalContext,
      bidPerView
    } = req.body;

    const ad = await AdContent.findOne({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad content not found'
      });
    }

    // Reset moderation status if content is updated
    if (ad.moderationStatus === 'approved') {
      ad.moderationStatus = 'needs_review';
    }

    ad.title = title || ad.title;
    ad.description = description || ad.description;
    ad.targetGrades = targetGrades ? JSON.parse(targetGrades) : ad.targetGrades;
    ad.targetSubjects = targetSubjects ? JSON.parse(targetSubjects) : ad.targetSubjects;
    ad.educationalContext = educationalContext || ad.educationalContext;
    ad.bidPerView = bidPerView ? parseFloat(bidPerView) : ad.bidPerView;

    await ad.save();

    res.json({
      success: true,
      message: 'Ad content updated successfully',
      data: { ad }
    });
  } catch (error) {
    console.error('Update ad content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete ad content
exports.deleteAdContent = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await AdContent.findOne({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad content not found'
      });
    }

    // Delete associated files
    if (fs.existsSync(path.join(__dirname, '..', ad.videoUrl))) {
      fs.unlinkSync(path.join(__dirname, '..', ad.videoUrl));
    }
    if (fs.existsSync(path.join(__dirname, '..', ad.thumbnailUrl))) {
      fs.unlinkSync(path.join(__dirname, '..', ad.thumbnailUrl));
    }

    await ad.destroy();

    res.json({
      success: true,
      message: 'Ad content deleted successfully'
    });
  } catch (error) {
    console.error('Delete ad content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};