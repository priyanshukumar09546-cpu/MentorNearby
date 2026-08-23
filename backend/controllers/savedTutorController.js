const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const SavedTutor = require('../models/SavedTutor');
const TutorProfile = require('../models/TutorProfile');

exports.saveTutor = asyncHandler(async (req, res, next) => {
  const tutorId = req.params.tutorId || req.body.tutorId;

  if (!tutorId) {
    return error(res, 'Tutor ID is required', 400);
  }

  const existingSave = await SavedTutor.findOne({ user: req.user.id, tutor: tutorId });
  if (existingSave) {
    return success(res, 'Tutor already saved', { isSaved: true });
  }

  await SavedTutor.create({ user: req.user.id, tutor: tutorId });
  
  await TutorProfile.findOneAndUpdate(
    { $or: [{ user: tutorId }, { _id: tutorId }] },
    { $inc: { savedCount: 1 } }
  );

  return success(res, 'Tutor saved successfully', { isSaved: true }, 201);
});

exports.removeSavedTutor = asyncHandler(async (req, res, next) => {
  const tutorId = req.params.tutorId || req.body.tutorId;

  if (!tutorId) {
    return error(res, 'Tutor ID is required', 400);
  }

  const savedRecord = await SavedTutor.findOneAndDelete({ user: req.user.id, tutor: tutorId });
  
  if (!savedRecord) {
    return success(res, 'Tutor removed from saved list', { isSaved: false });
  }

  await TutorProfile.findOneAndUpdate(
    { $or: [{ user: tutorId }, { _id: tutorId }] },
    { $inc: { savedCount: -1 } }
  );

  return success(res, 'Tutor removed from saved list', { isSaved: false });
});

exports.checkIsSaved = asyncHandler(async (req, res, next) => {
  const tutorId = req.params.tutorId;
  const isSaved = await SavedTutor.exists({ user: req.user.id, tutor: tutorId });
  return success(res, 'Saved status', { isSaved: !!isSaved });
});

exports.getMySavedTutors = asyncHandler(async (req, res, next) => {
  const savedTutors = await SavedTutor.find({ user: req.user.id })
    .populate({
      path: 'tutor',
      select: 'name emailVerified phoneVerified avatar',
    })
    .sort({ createdAt: -1 });

  return success(res, 'Saved tutors retrieved', { savedTutors });
});

