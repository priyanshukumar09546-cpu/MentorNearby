// ============================================================
// routes/reports.js
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createReport,
  getMyReports,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const reportValidation = [
  body('category')
    .isIn(['FAKE_PROFILE', 'SCAM', 'HARASSMENT', 'INAPPROPRIATE_BEHAVIOR', 'MISLEADING_INFO', 'SAFETY_CONCERN', 'OTHER'])
    .withMessage('Invalid report category'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Please provide more detail (min 20 characters)')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

router.use(protect);

router.post('/', validate(reportValidation), createReport);
router.get('/my-reports', getMyReports);

module.exports = router;
