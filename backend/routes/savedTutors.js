const express = require('express');
const router = express.Router();
const {
  saveTutor,
  removeSavedTutor,
  checkIsSaved,
  getMySavedTutors,
} = require('../controllers/savedTutorController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMySavedTutors);
router.get('/check/:tutorId', checkIsSaved);
router.post('/:tutorId', saveTutor);
router.post('/', saveTutor);
router.delete('/:tutorId', removeSavedTutor);

module.exports = router;

