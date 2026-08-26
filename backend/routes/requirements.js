const express = require('express');
const {
  createRequirement,
  getMyRequirements,
  getRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  requestTutor,
  respondToRequest
} = require('../controllers/requirementController');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// PUBLIC Routes (Browsing Open Requirements / Student Leads)
router.get('/', getRequirements);
router.get('/featured', getRequirements);
router.get('/public', getRequirements);
router.get('/:id', getRequirementById);

// Protected routes below
router.use(protect);

router.post('/', authorize('STUDENT', 'PARENT', 'ADMIN'), createRequirement);
router.get('/me', authorize('STUDENT', 'PARENT', 'ADMIN'), getMyRequirements);
router.get('/my-requirements', authorize('STUDENT', 'PARENT', 'ADMIN'), getMyRequirements);

router.put('/:id', authorize('STUDENT', 'PARENT', 'ADMIN'), updateRequirement);
router.delete('/:id', authorize('STUDENT', 'PARENT', 'ADMIN'), deleteRequirement);

router.post('/:id/request-tutor', authorize('STUDENT', 'PARENT'), requestTutor);
router.put('/requests/:requestId', authorize('TUTOR'), respondToRequest);

module.exports = router;
