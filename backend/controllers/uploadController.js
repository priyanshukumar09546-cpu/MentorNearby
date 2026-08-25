const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinaryService = require('../services/cloudinaryService');
const { validateGovtIdDocument } = require('../services/idOcrService');

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

// @desc    Upload private KYC / Govt ID document with OCR fraud prevention (Aadhaar / PAN)
// @route   POST /api/upload/document, POST /api/tutor/upload-id, POST /api/upload/kyc-document
// @access  Public (during onboarding) or Authenticated
exports.uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please upload a document or image file (JPG, PNG, WEBP, PDF)', 400);
  }

  const govtIdType = req.body.govtIdType || req.body.identityProofType || req.body.documentType || 'Aadhaar Card';

  // 1. Run Tesseract OCR & Authenticity Verification
  const validation = await validateGovtIdDocument({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    govtIdType,
    fileSize: req.file.size
  });

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.errorCode || 'INVALID_DOCUMENT',
      message: validation.message || 'Sahi Govt ID ki saaf photo upload karein.'
    });
  }

  // 2. Upload to Private Secure Storage
  const isPdf = req.file.mimetype === 'application/pdf';
  const result = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
    folder: 'tutornearby/secure_ids',
    resource_type: isPdf ? 'raw' : 'image'
  });

  if (!result || !result.secure_url) {
    return error(res, 'Document upload failed. Please try again.', 500);
  }

  return success(res, 'Document verified & uploaded successfully for manual review', {
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
    format: result.format || (isPdf ? 'pdf' : 'image'),
    size: req.file.size,
    govtIdType: validation.govtIdType || govtIdType,
    status: 'PENDING_MANUAL_REVIEW'
  }, 201);
});

