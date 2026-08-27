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

const photoUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: photoFilter
});

const uploadPhoto = (req, res, next) => {
  photoUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files.find(f => ['photo', 'profilePic', 'image', 'avatar', 'file'].includes(f.fieldname)) || req.files[0];
    }
    next();
  });
};

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: videoFilter
});

const uploadVideo = (req, res, next) => {
  videoUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files.find(f => ['video', 'file', 'introVideo'].includes(f.fieldname)) || req.files[0];
    }
    next();
  });
};

const MAX_COMBO_PDF_SIZE_MB = parseInt(process.env.MAX_COMBO_PDF_SIZE_MB, 10) || 100;

const docUpload = multer({
  storage,
  limits: { fileSize: MAX_COMBO_PDF_SIZE_MB * 1024 * 1024 }, // 100MB
  fileFilter: documentFilter
});

const uploadDocument = (req, res, next) => {
  docUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (!req.file && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

module.exports = {
  uploadPhoto,
  uploadVideo,
  uploadDocument
};
