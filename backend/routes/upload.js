const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadPhoto, uploadDocument } = require('../middleware/upload');

// Public route for uploading profile photos during registration
router.post('/photo', uploadPhoto, uploadController.uploadProfilePhoto);

// Route for uploading private KYC / College ID documents
router.post('/document', uploadDocument, uploadController.uploadKycDocument);
router.post('/kyc-document', uploadDocument, uploadController.uploadKycDocument);

module.exports = router;
