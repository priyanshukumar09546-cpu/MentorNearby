// ============================================================
// services/cloudinaryService.js
// Cloudinary upload/delete operations using v2 upload_stream
// (compatible with multer memoryStorage)
// ============================================================

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CLOUDINARY_AVAILABLE =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

/**
 * Upload a buffer to Cloudinary using upload_stream or upload_large (for files > 8MB up to 100MB+)
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (buffer, options = {}) => {
  if (!CLOUDINARY_AVAILABLE) {
    // Dev stub mode — return a placeholder
    console.warn('⚠️  [DEV STUB] Cloudinary not configured. Returning placeholder URL.');
    return {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      public_id: `stub_${Date.now()}`,
      resource_type: options.resource_type || 'image',
    };
  }

  const isLargeFile = buffer && buffer.length > 8 * 1024 * 1024; // > 8MB

  // For large files (> 8MB), raw PDF documents, or videos, use chunked upload_large to support files up to 100MB+
  if (isLargeFile || options.resource_type === 'raw' || options.resource_type === 'video') {
    const ext = options.format || (options.resource_type === 'raw' ? 'pdf' : 'tmp');
    const tempFilePath = path.join(os.tmpdir(), `cld_upload_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`);

    try {
      await fs.promises.writeFile(tempFilePath, buffer);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          tempFilePath,
          {
            timeout: 300000,
            chunk_size: 6000000, // 6MB chunk size for reliable multi-part chunked upload
            ...options,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
          },
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          }
        );
      });
      return result;
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    } finally {
      fs.unlink(tempFilePath, () => {});
    }
  }

  // Standard stream upload for smaller files (< 8MB)
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        timeout: 90000,
        ...options,
        use_filename: false,      // Never trust client filenames
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload profile photo
 */
const uploadProfilePhoto = async (buffer, userId) => {
  return uploadToCloudinary(buffer, {
    folder: `tutornearby/profiles/${userId}`,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    tags: ['profile-photo', `user-${userId}`],
  });
};

/**
 * Upload intro video
 */
const uploadIntroVideo = async (buffer, userId) => {
  return uploadToCloudinary(buffer, {
    folder: `tutornearby/videos/${userId}`,
    resource_type: 'video',
    transformation: [
      { width: 1280, height: 720, crop: 'limit' },
      { quality: 'auto' },
    ],
    tags: ['intro-video', `user-${userId}`],
  });
};

/**
 * Upload KYC document — stored as PRIVATE (not publicly accessible)
 * Only accessible via signed URLs generated server-side
 */
const uploadKycDocument = async (buffer, userId, docType) => {
  return uploadToCloudinary(buffer, {
    folder: `tutornearby/kyc/${userId}`,
    resource_type: 'image',
    type: 'private',            // Private access — NOT publicly accessible
    tags: ['kyc-document', `user-${userId}`, docType],
    // Never apply public transformations to private KYC docs
  });
};

/**
 * Generate a signed URL for a private KYC document
 * Only call this server-side for admin review
 */
const getPrivateDocumentUrl = (publicId, resourceType = 'image') => {
  if (!CLOUDINARY_AVAILABLE) {
    return 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'private',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    secure: true,
  });
};

/**
 * Delete an asset from Cloudinary or local storage
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return { result: 'ok' };

  // If stored locally on disk
  if (publicId.startsWith('local_')) {
    try {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'study-resources', 'combos');
      if (fs.existsSync(uploadDir)) {
        const files = await fs.promises.readdir(uploadDir);
        for (const file of files) {
          if (file.includes(publicId.replace('local_', ''))) {
            await fs.promises.unlink(path.join(uploadDir, file));
            console.log(`[STORAGE] Deleted local combo file: ${file}`);
          }
        }
      }
      return { result: 'ok' };
    } catch (err) {
      console.warn(`[STORAGE] Local file delete warning: ${err.message}`);
      return { result: 'error', error: err.message };
    }
  }

  if (!CLOUDINARY_AVAILABLE) {
    console.warn('⚠️  [DEV STUB] Cloudinary delete skipped.');
    return { result: 'ok' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
    return { result: 'error', error: error.message };
  }
};

const { detectFileType } = require('../utils/fileTypeDetector');

/**
 * Upload study resource document (PDF, PNG, JPG, JPEG, WEBP)
 * Supports both images (Formula Sheets / Notes) and raw multi-page master PDFs.
 * If Cloudinary account imposes a 10MB quota on raw files, seamlessly stores the
 * 100% original, uncompressed, uncropped multi-page PDF on local server storage.
 */
const uploadStudyDocument = async (buffer, originalFilename = '', mimeType = '') => {
  const fileInfo = detectFileType({ originalname: originalFilename, mimeType });
  const isPdf = fileInfo.isPdf || mimeType === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf');
  const resourceType = isPdf ? 'raw' : (fileInfo.isImage ? 'image' : 'raw');

  try {
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: 'tutornearby/study-resources',
      resource_type: resourceType,
      tags: ['study-resource', resourceType === 'raw' ? 'pdf-document' : 'image-formula-sheet'],
    });

    return {
      ...uploadResult,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type || resourceType,
      cloudinaryResourceType: uploadResult.resource_type || resourceType,
      cloudinaryPublicId: uploadResult.public_id,
      format: uploadResult.format || fileInfo.format || (isPdf ? 'pdf' : undefined),
      fileFormat: uploadResult.format || fileInfo.format || (isPdf ? 'pdf' : undefined),
      fileName: originalFilename,
      fileType: isPdf ? 'pdf' : fileInfo.fileType,
      mimeType: isPdf ? 'application/pdf' : fileInfo.mimeType,
      fileSize: buffer.length,
      storageType: 'cloudinary',
    };
  } catch (cloudErr) {
    // If Cloudinary rejects due to account file size limit (e.g. 10MB limit on 45MB PDF)
    console.warn(`[STORAGE] Cloudinary upload notice: ${cloudErr.message}. Storing original master file on local server storage...`);

    const uploadDir = path.join(__dirname, '..', 'uploads', 'study-resources', 'combos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanName = (originalFilename || 'master-combo.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const savedFileName = `${uniqueSuffix}_${cleanName}`;
    const fullLocalPath = path.join(uploadDir, savedFileName);

    await fs.promises.writeFile(fullLocalPath, buffer);

    const relativeUrl = `/uploads/study-resources/combos/${savedFileName}`;
    const publicId = `local_${uniqueSuffix}`;

    console.log(`[STORAGE] Successfully stored complete ${ (buffer.length / 1024 / 1024).toFixed(2) } MB original PDF at ${relativeUrl}`);

    return {
      secure_url: relativeUrl,
      fileUrl: relativeUrl,
      public_id: publicId,
      cloudinaryPublicId: publicId,
      resource_type: 'raw',
      cloudinaryResourceType: 'local',
      format: isPdf ? 'pdf' : fileInfo.format,
      fileFormat: isPdf ? 'pdf' : fileInfo.format,
      fileName: originalFilename,
      fileType: isPdf ? 'pdf' : fileInfo.fileType,
      mimeType: isPdf ? 'application/pdf' : fileInfo.mimeType,
      fileSize: buffer.length,
      storageType: 'local',
    };
  }
};

module.exports = {
  uploadProfilePhoto,
  uploadIntroVideo,
  uploadKycDocument,
  getPrivateDocumentUrl,
  deleteFromCloudinary,
  uploadToCloudinary,
  uploadStudyDocument,
};
