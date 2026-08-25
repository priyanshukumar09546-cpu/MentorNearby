const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinaryService = require('../services/cloudinaryService');

// @desc    Upload tutor profile photo (used during registration or profile edit)
// @route   POST /api/upload/photo
// @access  Public
exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please upload an image file', 400);
  }

  // Upload buffer to Cloudinary
  const result = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
    folder: 'tutornearby/profile_photos',
    resource_type: 'image'
  });

  if (!result || !result.secure_url) {
    return error(res, 'Image upload failed', 500);
  }

  return success(res, 'Image uploaded successfully', {
    url: result.secure_url,
    publicId: result.public_id
  }, 201);
});

// @desc    Upload private KYC / Govt ID document (Fast & Non-blocking)
// @route   POST /api/upload/document, POST /api/tutor/upload-id, POST /api/upload/kyc-document
// @access  Public (during onboarding) or Authenticated
exports.uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please select a document or image file (JPG, PNG, WEBP, PDF)', 400);
  }

  // Basic lightweight validation
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (!allowedMimes.includes(req.file.mimetype.toLowerCase())) {
    return error(res, 'Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.', 400);
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return error(res, 'File size exceeds the 5MB limit. Please upload a file under 5MB.', 400);
  }

  // Upload to Private Secure Storage (/secure-ids)
  const isPdf = req.file.mimetype === 'application/pdf';
  const result = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
    folder: 'tutornearby/secure_ids',
    resource_type: isPdf ? 'raw' : 'image'
  });

  if (!result || !result.secure_url) {
    return error(res, 'Document upload failed. Please try again.', 500);
  }

  const govtIdType = req.body.govtIdType || req.body.identityProofType || req.body.documentType || 'Aadhaar Card';

  return success(res, 'Document private storage me save ho gaya. Admin 24h me manual check karega.', {
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
    format: result.format || (isPdf ? 'pdf' : 'image'),
    size: req.file.size,
    govtIdType,
    status: 'PENDING_MANUAL_REVIEW',
    kycMode: 'MANUAL'
  }, 201);
});


