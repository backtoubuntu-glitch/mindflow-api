const cloudinary = require('cloudinary').v2;
const { AppError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate file type
const validateFileType = (file, allowedTypes) => {
  const fileExtension = path.extname(file.name).toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// Validate file size
const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Upload to Cloudinary
const uploadToCloudinary = (file, folder = 'mindflow/ads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(new AppError('File upload failed', 500));
        } else {
          resolve(result);
        }
      }
    );

    // Check if file is buffer or has data
    if (file.data) {
      uploadStream.end(file.data);
    } else if (file.tempFilePath) {
      fs.createReadStream(file.tempFilePath).pipe(uploadStream);
    } else {
      reject(new AppError('Invalid file format', 400));
    }
  });
};

// Generate video thumbnail
const generateThumbnail = async (videoUrl, timestamp = 1) => {
  try {
    const thumbnailUrl = cloudinary.url(videoUrl, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    return thumbnailUrl;
  } catch (error) {
    throw new AppError('Thumbnail generation failed', 500);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  validateFileType,
  validateFileSize,
  uploadToCloudinary,
  generateThumbnail,
  deleteFromCloudinary,
  getPublicIdFromUrl
};