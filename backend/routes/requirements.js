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

router.use(protect);

router.route('/')
  .post(authorize('STUDENT', 'PARENT', 'ADMIN'), createRequirement)
  .get(authorize('TUTOR', 'ADMIN', 'STUDENT', 'PARENT'), getRequirements);

router.route('/me')
  .get(authorize('STUDENT', 'PARENT', 'ADMIN'), getMyRequirements);

router.route('/my-requirements')
  .get(authorize('STUDENT', 'PARENT', 'ADMIN'), getMyRequirements);

router.route('/:id')
  .get(getRequirementById)
  .put(authorize('STUDENT', 'PARENT', 'ADMIN'), updateRequirement)
  .delete(authorize('STUDENT', 'PARENT', 'ADMIN'), deleteRequirement);

router.route('/:id/request-tutor')
  .post(authorize('STUDENT', 'PARENT'), requestTutor);

router.route('/requests/:requestId')
  .put(authorize('TUTOR'), respondToRequest);

module.exports = router;
