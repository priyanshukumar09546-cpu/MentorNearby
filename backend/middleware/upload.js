const multer = require('multer');

const storage = multer.memoryStorage();

const photoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const isAllowedMime = file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype === 'application/octet-stream';
  const isAllowedExt = /\.(png|jpe?g|webp|pdf)$/i.test(file.originalname);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, JPG, JPEG, and WEBP files are allowed'), false);
  }
};

const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: photoFilter
}).single('photo');

const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter
}).single('video');

const MAX_COMBO_PDF_SIZE_MB = parseInt(process.env.MAX_COMBO_PDF_SIZE_MB, 10) || 100;

const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_COMBO_PDF_SIZE_MB * 1024 * 1024 }, // 100MB (supports multi-page master combo PDFs)
  fileFilter: documentFilter
}).single('document');

module.exports = {
  uploadPhoto,
  uploadVideo,
  uploadDocument
};
