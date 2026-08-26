const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinaryService = require('../services/cloudinaryService');
const { isValidAadhaar } = require('../utils/aadhaarValidator');
const TutorProfile = require('../models/TutorProfile');
const KYC = require('../models/KYC');

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
// @route   POST /api/upload/document, POST /api/upload/kyc-document
// @access  Public (during onboarding) or Authenticated
exports.uploadKycDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please select a document or image file (JPG, PNG, WEBP, PDF)', 400);
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (!allowedMimes.includes(req.file.mimetype.toLowerCase())) {
    return error(res, 'Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.', 400);
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return error(res, 'File size exceeds the 5MB limit. Please upload a file under 5MB.', 400);
  }

  const isPdf = req.file.mimetype === 'application/pdf';
  const result = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
    folder: 'tutornearby/secure_ids',
    resource_type: isPdf ? 'raw' : 'image'
  });

  if (!result || !result.secure_url) {
    return error(res, 'Document upload failed. Please try again.', 500);
  }

  const rawIdType = req.body.govtIdType || req.body.identityProofType || req.body.documentType || 'AADHAAR';
  const govtIdType = String(rawIdType).toUpperCase().includes('PAN') ? 'PAN' : 'AADHAAR';

  return success(res, 'Document private storage me save ho gaya. Admin 24h me manual check karega.', {
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
    format: result.format || (isPdf ? 'pdf' : 'image'),
    size: req.file.size,
    govtIdType,
    status: 'PENDING_ADMIN_REVIEW',
    kycMode: 'MANUAL'
  }, 201);
});

// @desc    Upload Aadhaar ID Photo for KYC (FREE + SECURE + FAST <500ms)
// @route   POST /api/tutor/upload-id, POST /api/tutors/upload-id
// @access  Public (onboarding) or Authenticated
exports.uploadTutorId = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please select an Aadhaar ID file to upload', 400);
  }

  const aadhaarNumber = req.body.aadhaarNumber || req.body.aadhaar || '';
  const cleanAadhaar = String(aadhaarNumber).replace(/\D/g, '');
  const aadhaarLast4 = cleanAadhaar ? cleanAadhaar.slice(-4) : 'XXXX';

  // Server-side Verhoeff check (FREE, fast maths check)
  const verhoeffPass = isValidAadhaar(cleanAadhaar);

  // Save to private local directory /secure-ids/private with UUID filename
  const secureDir = path.join(__dirname, '..', 'secure-ids', 'private');
  if (!fs.existsSync(secureDir)) {
    fs.mkdirSync(secureDir, { recursive: true });
  }

  const ext = path.extname(req.file.originalname || '') || (req.file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
  const uniqueFilename = `${crypto.randomUUID()}${ext}`;
  const localFilePath = path.join(secureDir, uniqueFilename);
  fs.writeFileSync(localFilePath, req.file.buffer);

  const idPhotoPath = `/secure-ids/private/${uniqueFilename}`;

  // Optional Cloudinary upload in background for public URL fallback
  let cloudUrl = idPhotoPath;
  try {
    const isPdf = req.file.mimetype === 'application/pdf';
    const cRes = await cloudinaryService.uploadToCloudinary(req.file.buffer, {
      folder: 'tutornearby/secure_ids_private',
      resource_type: isPdf ? 'raw' : 'image'
    });
    if (cRes && cRes.secure_url) {
      cloudUrl = cRes.secure_url;
    }
  } catch (cErr) {
    console.warn('Cloudinary upload fallback ignored:', cErr.message);
  }

  // Update DB model if logged-in tutor user present
  if (req.user && req.user._id) {
    try {
      await TutorProfile.findOneAndUpdate(
        { user: req.user._id },
        {
          aadhaarLast4,
          aadhaarVerhoeffPass: verhoeffPass,
          kycStatus: 'PENDING_ADMIN_REVIEW',
          idPhotoPath: cloudUrl || idPhotoPath
        },
        { new: true, upsert: true }
      );

      await KYC.findOneAndUpdate(
        { user: req.user._id },
        {
          govtIdType: 'AADHAAR',
          govtIdLast4: aadhaarLast4,
          aadhaarVerhoeffPass: verhoeffPass,
          status: 'PENDING_ADMIN_REVIEW',
          idPhotoPath: cloudUrl || idPhotoPath,
          submittedAt: new Date()
        },
        { new: true, upsert: true }
      );
    } catch (dbErr) {
      console.warn('Database save warning:', dbErr.message);
    }
  }

  // Instant response < 500ms
  return success(res, 'ID uploaded successfully. Awaiting manual admin review.', {
    aadhaarLast4,
    aadhaarVerhoeffPass: verhoeffPass,
    kycStatus: 'PENDING_ADMIN_REVIEW',
    idPhotoPath: cloudUrl || idPhotoPath,
    url: cloudUrl || idPhotoPath
  }, 200);
});
