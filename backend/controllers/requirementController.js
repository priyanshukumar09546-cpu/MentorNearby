const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const TuitionRequirement = require('../models/TuitionRequirement');
const StudentProfile = require('../models/StudentProfile');
const TutorRequest = require('../models/TutorRequest');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Create a tuition requirement
// @route   POST /api/v1/requirements
// @access  Private (Student & Parent only)
exports.createRequirement = asyncHandler(async (req, res, next) => {
  const userRole = (req.user.role || '').toUpperCase();
  if (userRole !== 'STUDENT' && userRole !== 'PARENT' && userRole !== 'ADMIN') {
    return error(res, 'Only students and parents can create requirements', 403);
  }

  const {
    title,
    studentName,
    studentClass,
    class: cls,
    board,
    medium,
    subjects,
    teachingMode,
    address,
    area,
    city,
    pincode,
    location,
    budget,
    preferredGender,
    requirements
  } = req.body;

  let parsedSubjects = [];
  if (Array.isArray(subjects)) {
    parsedSubjects = subjects.map(s => s.trim()).filter(Boolean);
  } else if (typeof subjects === 'string') {
    parsedSubjects = subjects.split(',').map(s => s.trim()).filter(Boolean);
  }

  const requirementPayload = {
    student: req.user.id,
    studentName: studentName || req.user.name,
    title: title || `Tuition Requirement for ${studentClass || cls || 'Student'}`,
    class: cls || studentClass || 'Class 10',
    studentClass: studentClass || cls || 'Class 10',
    board: board || 'CBSE',
    medium: medium || 'English',
    subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General Studies'],
    teachingMode: teachingMode || 'Offline',
    location: {
      city: location?.city || city || 'Not Set',
      area: location?.area || area || 'Not Set',
      pincode: location?.pincode || pincode || '000000',
      address: location?.address || address || ''
    },
    preferences: {
      tutorGender: preferredGender || 'Any',
      additionalRequirements: requirements || ''
    },
    budget: typeof budget === 'object' && budget !== null
      ? { amount: Number(budget.amount) || 5000, frequency: budget.frequency || 'Month' }
      : { amount: Number(budget) || 5000, frequency: 'Month' },
    status: 'OPEN'
  };

  const requirement = await TuitionRequirement.create(requirementPayload);

  return success(res, 'Requirement created successfully', requirement, 201);
});

// @desc    Get current student/parent requirements
// @route   GET /api/v1/requirements/me
// @access  Private (Student & Parent)
exports.getMyRequirements = asyncHandler(async (req, res, next) => {
  const userRole = (req.user.role || '').toUpperCase();
  if (userRole !== 'STUDENT' && userRole !== 'PARENT' && userRole !== 'ADMIN') {
    return error(res, 'Not authorized to access this route', 403);
  }

  const requirements = await TuitionRequirement.find({ student: req.user.id }).sort('-createdAt').lean();

  return success(res, 'Requirements retrieved successfully', {
    count: requirements.length,
    requirements,
    data: requirements
  });
});

// @desc    Get single requirement by ID
// @route   GET /api/v1/requirements/:id
// @access  Private
exports.getRequirementById = asyncHandler(async (req, res, next) => {
  const requirement = await TuitionRequirement.findById(req.params.id)
    .populate('student', 'name email phone avatar')
    .lean();

  if (!requirement) {
    return error(res, `Requirement not found with id of ${req.params.id}`, 404);
  }

  return success(res, 'Requirement retrieved successfully', { requirement, data: requirement });
});

// @desc    Update tuition requirement
// @route   PUT /api/v1/requirements/:id
// @access  Private (Owner only)
exports.updateRequirement = asyncHandler(async (req, res, next) => {
  let requirement = await TuitionRequirement.findById(req.params.id);

  if (!requirement) {
    return error(res, `Requirement not found with id of ${req.params.id}`, 404);
  }

  const userRole = (req.user.role || '').toUpperCase();
  if (requirement.student.toString() !== req.user.id && userRole !== 'ADMIN') {
    return error(res, 'Not authorized to update this requirement', 403);
  }

  const {
    title, studentName, studentClass, class: cls, board, medium, subjects,
    teachingMode, address, area, city, pincode, location, budget, preferredGender, requirements, status
  } = req.body;

  if (title) requirement.title = title;
  if (studentName) requirement.studentName = studentName;
  if (studentClass || cls) {
    requirement.class = cls || studentClass;
    requirement.studentClass = studentClass || cls;
  }
  if (board) requirement.board = board;
  if (medium) requirement.medium = medium;
  if (teachingMode) requirement.teachingMode = teachingMode;
  if (status) requirement.status = status;

  if (subjects) {
    requirement.subjects = Array.isArray(subjects)
      ? subjects.map(s => s.trim()).filter(Boolean)
      : subjects.split(',').map(s => s.trim()).filter(Boolean);
  }

  if (city || area || pincode || address || location) {
    requirement.location = {
      city: location?.city || city || requirement.location?.city || 'Not Set',
      area: location?.area || area || requirement.location?.area || 'Not Set',
      pincode: location?.pincode || pincode || requirement.location?.pincode || '000000',
      address: location?.address || address || requirement.location?.address || ''
    };
  }

  if (budget) {
    requirement.budget = typeof budget === 'object' && budget !== null
      ? { amount: Number(budget.amount) || requirement.budget?.amount || 5000, frequency: budget.frequency || requirement.budget?.frequency || 'Month' }
      : { amount: Number(budget) || requirement.budget?.amount || 5000, frequency: requirement.budget?.frequency || 'Month' };
  }

  if (preferredGender || requirements !== undefined) {
    requirement.preferences = {
      ...requirement.preferences,
      tutorGender: preferredGender || requirement.preferences?.tutorGender || 'Any',
      additionalRequirements: requirements !== undefined ? requirements : (requirement.preferences?.additionalRequirements || '')
    };
  }

  await requirement.save();

  return success(res, 'Requirement updated successfully', requirement);
});

// @desc    Delete tuition requirement
// @route   DELETE /api/v1/requirements/:id
// @access  Private (Owner only)
exports.deleteRequirement = asyncHandler(async (req, res, next) => {
  const requirement = await TuitionRequirement.findById(req.params.id);

  if (!requirement) {
    return error(res, `Requirement not found with id of ${req.params.id}`, 404);
  }

  const userRole = (req.user.role || '').toUpperCase();
  if (requirement.student.toString() !== req.user.id && userRole !== 'ADMIN') {
    return error(res, 'Not authorized to delete this requirement', 403);
  }

  await TuitionRequirement.findByIdAndDelete(req.params.id);
  await TutorRequest.deleteMany({ requirement: req.params.id });

  return success(res, 'Requirement deleted successfully');
});

// @desc    Get open tuition requirements / student inquiries (for find-students page)
// @route   GET /api/requirements
// @access  Public
exports.getRequirements = asyncHandler(async (req, res, next) => {
  const {
    subject,
    subjects,
    q,
    class: classGrade,
    studentClass,
    location,
    city,
    area,
    mode,
    teachingMode,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {
    status: { $in: ['OPEN', 'Open'] }
  };

  // Subject search (matches subject query or q query)
  const targetSubject = subject || q;
  if (targetSubject) {
    const subRegex = new RegExp(targetSubject.trim(), 'i');
    filter.$or = [
      { subjects: subRegex },
      { studentClass: subRegex },
      { class: subRegex },
      { studentName: subRegex }
    ];
  } else if (subjects) {
    const subArr = subjects.split(',').map(s => s.trim()).filter(Boolean);
    if (subArr.length > 0) {
      filter.subjects = { $in: subArr.map(s => new RegExp(s, 'i')) };
    }
  }

  // Class filter
  const targetClass = classGrade || studentClass;
  if (targetClass && targetClass !== 'ALL' && targetClass !== 'All Classes') {
    const clsRegex = new RegExp(targetClass.trim(), 'i');
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { class: clsRegex },
          { studentClass: clsRegex }
        ]
      }
    ];
  }

  // Location / City filter
  const targetLocation = location || city;
  if (targetLocation && targetLocation !== 'ALL') {
    const locRegex = new RegExp(targetLocation.trim(), 'i');
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { 'location.city': locRegex },
          { 'location.area': locRegex }
        ]
      }
    ];
  }

  if (area) {
    filter['location.area'] = new RegExp(area.trim(), 'i');
  }

  // Mode filter
  const targetMode = mode || teachingMode;
  if (targetMode && targetMode !== 'ALL' && targetMode !== 'All Modes') {
    filter.teachingMode = new RegExp(targetMode.trim(), 'i');
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await TuitionRequirement.countDocuments(filter);
  const requirements = await TuitionRequirement.find(filter)
    .populate('student', 'name avatar role phone email isVerified')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNum)
    .lean();

  return success(res, 'Requirements retrieved successfully', {
    total,
    count: requirements.length,
    requirements,
    data: requirements,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      total,
      hasNext: startIndex + requirements.length < total,
      hasPrev: pageNum > 1,
    }
  });
});

// @desc    Request a tutor for a requirement
// @route   POST /api/v1/requirements/:id/request-tutor
// @access  Private (Student only)
exports.requestTutor = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'STUDENT') {
    return error(res, 'Only students can request tutors', 403);
  }

  const requirement = await TuitionRequirement.findById(req.params.id);

  if (!requirement) {
    return error(res, `Requirement not found with id of ${req.params.id}`, 404);
  }

  // Make sure user is requirement owner
  if (requirement.student.toString() !== req.user.id) {
    return error(res, `User ${req.user.id} is not authorized to request a tutor for this requirement`, 401);
  }

  const { tutorId, message } = req.body;

  if (!tutorId) {
    return error(res, 'Please provide a tutorId', 400);
  }

  // Check if tutor exists
  const tutor = await User.findById(tutorId);
  if (!tutor || (tutor.role !== 'tutor' && tutor.role !== 'TUTOR')) {
    return error(res, `Tutor not found with id of ${tutorId}`, 404);
  }

  // Check if request already exists
  const existingRequest = await TutorRequest.findOne({
    student: req.user.id,
    tutor: tutorId,
    requirement: req.params.id
  });

  if (existingRequest) {
    return error(res, 'You have already requested this tutor for this requirement', 400);
  }

  const request = await TutorRequest.create({
    student: req.user.id,
    tutor: tutorId,
    requirement: req.params.id,
    message
  });

  // Update requirement status
  requirement.status = 'TUTOR_REQUESTED';
  await requirement.save();

  // Create notification for tutor
  await createNotification(
    tutorId,
    'New Tutor Request',
    `${req.user.name} has requested you for a tuition requirement.`,
    'SYSTEM',
    `/tutor-requests`
  );

  return success(res, 'Tutor requested successfully', request, 201);
});

// @desc    Accept/Decline tutor request
// @route   PUT /api/v1/requirements/requests/:requestId
// @access  Private (Tutor only)
exports.respondToRequest = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'tutor' && req.user.role !== 'TUTOR') {
    return error(res, 'Only tutors can respond to requests', 403);
  }

  const { status } = req.body;

  if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
    return error(res, 'Please provide a valid status (ACCEPTED, DECLINED)', 400);
  }

  const request = await TutorRequest.findById(req.params.requestId).populate('student', 'name');

  if (!request) {
    return error(res, `Request not found with id of ${req.params.requestId}`, 404);
  }

  // Make sure tutor is the one requested
  if (request.tutor.toString() !== req.user.id) {
    return error(res, `User ${req.user.id} is not authorized to update this request`, 401);
  }

  request.status = status;
  await request.save();

  // Create notification for student
  await createNotification(
    request.student._id,
    `Tutor Request ${status}`,
    `${req.user.name} has ${status.toLowerCase()} your tutor request.`,
    'SYSTEM',
    `/my-requirements`
  );

  // If accepted, we might want to update the requirement status
  if (status === 'ACCEPTED') {
    const requirement = await TuitionRequirement.findById(request.requirement);
    if (requirement) {
      requirement.status = 'TUTOR_ACCEPTED';
      await requirement.save();
    }
  }

  return success(res, 'Request updated successfully', request);
});
