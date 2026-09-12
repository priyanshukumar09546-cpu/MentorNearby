// ============================================================
// routes/tutorLeads.js
// Express Router for Admin Tutor Leads Management
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLeads,
  getLeadById,
  inviteLead,
  approveLead,
  rejectLead,
} = require('../controllers/tutorLeadController');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/:id/invite', inviteLead);
router.post('/:id/approve', approveLead);
router.post('/:id/reject', rejectLead);

module.exports = router;
