// ============================================================
// controllers/courseController.js
// Complete Business Logic for Courses, PYQ Mastery, Video Solutions,
// Bundles, Razorpay Payments, Server-Side Progress, and Admin Management
// ============================================================

const Course = require('../models/Course');
const CoursePaper = require('../models/CoursePaper');
const CourseBundle = require('../models/CourseBundle');
const CoursePurchase = require('../models/CoursePurchase');
const CourseProgress = require('../models/CourseProgress');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const razorpayService = require('../services/razorpayService');

// Helper: Normalize class string
const normalizeClass = (cls) => {
  if (!cls) return '';
  return cls.toString().replace(/class\s*/i, '').trim();
};

// Helper: Extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

// ============================================================
// 1. PUBLIC & STUDENT: GET COURSES CATALOG
// ============================================================
exports.getCourses = asyncHandler(async (req, res, next) => {
  const {
    category,
    courseType,
    classLevel,
    subject,
    stream,
    board,
    language,
    price,
    priceType,
    search,
    q,
    query,
    sort = 'recommended',
    page = 1,
    limit = 12,
  } = req.query;

  const mongoQuery = { published: true };

  // Category / Course Type
  const effectiveCategory = category || courseType;
  if (effectiveCategory && effectiveCategory !== 'All' && effectiveCategory !== 'ALL' && effectiveCategory !== 'All Types') {
    mongoQuery.category = effectiveCategory;
  }

  // Class Level
  if (classLevel && classLevel !== 'All' && classLevel !== 'ALL' && classLevel !== 'All Classes') {
    const norm = normalizeClass(classLevel);
    mongoQuery.classLevel = { $in: [norm, `Class ${norm}`] };
  }

  // Subject
  if (subject && subject !== 'All' && subject !== 'ALL' && subject !== 'All Subjects') {
    mongoQuery.subject = new RegExp(`^${subject.trim()}$`, 'i');
  }

  // Stream
  if (stream && stream !== 'All' && stream !== 'ALL') {
    mongoQuery.stream = stream;
  }

  // Board
  if (board && board !== 'All' && board !== 'ALL') {
    mongoQuery.board = new RegExp(`^${board.trim()}$`, 'i');
  }

  // Language
  if (language && language !== 'All' && language !== 'ALL' && language !== 'All Languages') {
    mongoQuery.language = new RegExp(`^${language.trim()}$`, 'i');
  }

  // Price Filter (Free vs Paid)
  const effectivePriceFilter = (price || priceType || '').toLowerCase();
  if (effectivePriceFilter === 'free') {
    mongoQuery.price = 0;
  } else if (effectivePriceFilter === 'paid') {
    mongoQuery.price = { $gt: 0 };
  }

  // Search keyword across title, description, subject, tagline, category, and classLevel
  const searchTerm = (search || q || query || '').trim();
  if (searchTerm.length > 0) {
    mongoQuery.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { subject: { $regex: searchTerm, $options: 'i' } },
      { tagline: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { classLevel: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Sorting
  let sortObj = { enrolledCount: -1, createdAt: -1 };
  if (sort === 'recommended' || sort === 'popular') {
    sortObj = { enrolledCount: -1, averageRating: -1, createdAt: -1 };
  } else if (sort === 'newest' || sort === 'latest' || sort === 'Latest First') {
    sortObj = { createdAt: -1 };
  } else if (sort === 'oldest' || sort === 'Oldest First') {
    sortObj = { createdAt: 1 };
  } else if (sort === 'class' || sort === 'class_order' || sort === 'Class / Course Order') {
    sortObj = { classLevel: 1, subject: 1, createdAt: -1 };
  } else if (sort === 'price_asc') {
    sortObj = { price: 1 };
  } else if (sort === 'price_desc') {
    sortObj = { price: -1 };
  } else if (sort === 'rating') {
    sortObj = { averageRating: -1, enrolledCount: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [courses, total] = await Promise.all([
    Course.find(mongoQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Course.countDocuments(mongoQuery),
  ]);

  // Check enrollment status if user is logged in
  let userEnrolledCourseIds = new Set();
  if (req.user?.id) {
    const purchases = await CoursePurchase.find({
      user: req.user.id,
      paymentStatus: 'COMPLETED',
    }).lean();

    purchases.forEach((p) => {
      if (p.course) userEnrolledCourseIds.add(p.course.toString());
      if (p.includedCourses && Array.isArray(p.includedCourses)) {
        p.includedCourses.forEach((cId) => userEnrolledCourseIds.add(cId.toString()));
      }
    });
  }

  const formattedCourses = courses.map((c) => ({
    ...c,
    isEnrolled: userEnrolledCourseIds.has(c._id.toString()),
  }));

  return success(res, 'Courses retrieved successfully', {
    courses: formattedCourses,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// ============================================================
// 2. PUBLIC: GET FEATURED COURSES & BUNDLES (HOMEPAGE & LANDING)
// ============================================================
exports.getFeaturedCoursesAndBundles = asyncHandler(async (req, res, next) => {
  const [class10Courses, class12Courses, bundles] = await Promise.all([
    Course.find({ published: true, classLevel: { $in: ['10', 'Class 10'] } })
      .sort({ enrolledCount: -1 })
      .limit(6)
      .lean(),
    Course.find({ published: true, classLevel: { $in: ['12', 'Class 12'] } })
      .sort({ enrolledCount: -1 })
      .limit(6)
      .lean(),
    CourseBundle.find({ published: true })
      .populate('courses', 'title subject classLevel price thumbnail')
      .sort({ salesCount: -1 })
      .lean(),
  ]);

  return success(res, 'Featured courses and bundles retrieved', {
    class10: class10Courses,
    class12: class12Courses,
    bundles,
  });
});

// ============================================================
// 3. PUBLIC & ENROLLED: GET COURSE DETAILS WITH PAPERS SYLLABUS
// ============================================================
exports.getCourseDetails = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const userId = req.user?.id;

  const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
  const courseQuery = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

  const course = await Course.findOne(courseQuery).lean();
  if (!course || !course.published) {
    return error(res, 'Course not found or unavailable', 404);
  }

  // Increment views count
  await Course.findByIdAndUpdate(course._id, { $inc: { viewsCount: 1 } });

  // Check enrollment
  let isEnrolled = false;
  let purchasedVia = null;

  if (userId) {
    const purchase = await CoursePurchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { course: course._id },
        { includedCourses: course._id },
      ],
    }).lean();

    if (purchase) {
      isEnrolled = true;
      purchasedVia = purchase.purchaseType;
    }
  }

  // Fetch papers for this course
  const papers = await CoursePaper.find({ course: course._id, published: true })
    .sort({ year: -1, sortOrder: 1 })
    .lean();

  // Fetch user PPT purchases if logged in
  let userPurchasedPptPaperIds = new Set();
  if (userId) {
    const pptPurchases = await CoursePurchase.find({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { course: course._id },
        { includedCourses: course._id },
        { purchaseType: 'PPT_DOWNLOAD' },
      ],
    }).lean();

    pptPurchases.forEach((p) => {
      if (p.paper) userPurchasedPptPaperIds.add(p.paper.toString());
      if (p.course?.toString() === course._id.toString() || p.includedCourses?.some(c => c.toString() === course._id.toString())) {
        isEnrolled = true;
      }
    });
  }

  // Format papers: 10+ Years Board Exam Solutions & Videos are 100% FREE for reading and class access
  const formattedPapers = papers.map((p) => {
    const paperYoutubeUrl = p.youtubeUrl || (p.video?.url && p.video.url.includes('youtu') ? p.video.url : '');
    const paperYoutubeId = p.youtubeVideoId || getYouTubeVideoId(paperYoutubeUrl);
    const isPptUnlocked = isEnrolled || userPurchasedPptPaperIds.has(p._id.toString());

    return {
      _id: p._id,
      year: p.year,
      title: p.title,
      paperCode: p.paperCode,
      chapter: p.chapter || '',
      pyqYears: p.pyqYears || `${p.year}`,
      youtubeUrl: paperYoutubeUrl,
      youtubeVideoId: paperYoutubeId,
      isFreeSample: true, // Free class and reading access for all
      durationMinutes: p.durationMinutes,
      questionsCount: p.questionsCount,
      solutionNotes: p.solutionNotes,
      isLocked: false, // Free to watch and read
      isPptUnlocked,
      pptPrice: 19,
      // Video data: deliver full video stream / YouTube link
      video: {
        ...p.video,
        url: paperYoutubeUrl || p.video?.url || '',
        youtubeUrl: paperYoutubeUrl,
        youtubeVideoId: paperYoutubeId,
        thumbnail: p.video?.thumbnail || (paperYoutubeId ? `https://img.youtube.com/vi/${paperYoutubeId}/hqdefault.jpg` : ''),
      },
      // PPT data: deliver PPT URL if unlocked, else prompt for ₹19 download
      ppt: isPptUnlocked
        ? p.ppt
        : {
            filename: p.ppt?.filename || `Board_Paper_${p.year}_Solution_Notes.pdf`,
            pagesCount: p.ppt?.pagesCount || 18,
            url: '', // Unlocked upon ₹19 payment
            downloadPrice: 19,
          },
    };
  });

  // Find related bundles containing this course
  const relatedBundles = await CourseBundle.find({
    published: true,
    courses: course._id,
  })
    .populate('courses', 'title subject classLevel price')
    .lean();

  return success(res, 'Course details loaded successfully', {
    course: {
      ...course,
      isEnrolled,
      purchasedVia,
    },
    papers: formattedPapers,
    relatedBundles,
    freeSamplePaper: formattedPapers[0],
  });
});

// ============================================================
// 4. PUBLIC & STUDENT: WATCH PAPER VIDEO / CLASS (100% FREE READING & WATCHING)
// ============================================================
exports.getPaperWatchAccess = asyncHandler(async (req, res, next) => {
  const { paperId } = req.params;
  const userId = req.user?.id;

  const paper = await CoursePaper.findById(paperId).populate('course').lean();
  if (!paper || !paper.published) {
    return error(res, 'Paper content not found', 404);
  }

  const paperYoutubeUrl = paper.youtubeUrl || (paper.video?.url && paper.video.url.includes('youtu') ? paper.video.url : '');
  const paperYoutubeId = paper.youtubeVideoId || getYouTubeVideoId(paperYoutubeUrl);

  // Check PPT purchase status
  let isPptUnlocked = false;
  if (userId) {
    const purchase = await CoursePurchase.findOne({
      user: userId,
      paymentStatus: 'COMPLETED',
      $or: [
        { course: paper.course?._id },
        { includedCourses: paper.course?._id },
        { paper: paper._id, purchaseType: 'PPT_DOWNLOAD' },
      ],
    }).lean();
    if (purchase) isPptUnlocked = true;
  }

  return success(res, 'Paper video access authorized', {
    paper: {
      ...paper,
      youtubeUrl: paperYoutubeUrl,
      youtubeVideoId: paperYoutubeId,
      video: {
        ...paper.video,
        url: paperYoutubeUrl || paper.video?.url || '',
        youtubeUrl: paperYoutubeUrl,
        youtubeVideoId: paperYoutubeId,
      },
      ppt: isPptUnlocked ? paper.ppt : { filename: paper.ppt?.filename, pagesCount: paper.ppt?.pagesCount, url: '' },
      isPptUnlocked,
      pptPrice: 19,
    },
    isFreeSample: true,
    isEnrolled: isPptUnlocked,
  });
});

// ============================================================
// 4B. PROTECTED: CREATE RAZORPAY ORDER FOR PPT DOWNLOAD (₹19)
// ============================================================
exports.createPptPaymentOrder = asyncHandler(async (req, res, next) => {
  const { paperId } = req.body;
  const userId = req.user.id;

  const paper = await CoursePaper.findById(paperId).populate('course').lean();
  if (!paper || !paper.published) {
    return error(res, 'Paper solution PPT not found', 404);
  }

  // Check if already unlocked
  const existingPurchase = await CoursePurchase.findOne({
    user: userId,
    paymentStatus: 'COMPLETED',
    $or: [
      { course: paper.course?._id },
      { includedCourses: paper.course?._id },
      { paper: paper._id, purchaseType: 'PPT_DOWNLOAD' },
    ],
  }).lean();

  if (existingPurchase) {
    return success(res, 'PPT already unlocked', {
      alreadyUnlocked: true,
      downloadUrl: paper.ppt?.url,
    });
  }

  // Authoritative server-side price from MongoDB (Default: ₹19 per PPT download)
  const amountInRupees = Number(paper.downloadPrice || paper.ppt?.downloadPrice) || 19;

  const orderData = await razorpayService.createOrder(amountInRupees, 'INR', {
    userId: userId.toString(),
    paperId: paper._id.toString(),
    courseId: paper.course?._id?.toString() || '',
    purchaseType: 'PPT_DOWNLOAD',
    title: `${paper.year} Board Paper Solution PPT`,
  });

  await CoursePurchase.create({
    user: userId,
    purchaseType: 'PPT_DOWNLOAD',
    course: paper.course?._id,
    paper: paper._id,
    classLevel: paper.course?.classLevel || '10',
    subject: paper.course?.subject || 'Board Solution',
    amount: amountInRupees,
    currency: 'INR',
    razorpayOrderId: orderData.id,
    paymentStatus: 'PENDING',
  });

  return success(res, 'PPT download order created', {
    orderId: orderData.id,
    amount: amountInRupees,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    paperTitle: paper.title,
    pptFilename: paper.ppt?.filename || `${paper.year}_Solution_Notes.pdf`,
  });
});

// ============================================================
// 4C. PROTECTED: VERIFY RAZORPAY PAYMENT & GRANT PPT DOWNLOAD
// ============================================================
exports.verifyPptPaymentAndDownload = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user.id;

  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    return error(res, 'Payment signature verification failed.', 400, 'PAYMENT_VERIFICATION_FAILED');
  }

  const purchase = await CoursePurchase.findOne({ razorpayOrderId, user: userId });
  if (!purchase) {
    return error(res, 'Purchase order record not found.', 404);
  }

  purchase.paymentStatus = 'COMPLETED';
  purchase.razorpayPaymentId = razorpayPaymentId;
  purchase.razorpaySignature = razorpaySignature;
  purchase.purchasedAt = new Date();
  await purchase.save();

  const paper = await CoursePaper.findById(purchase.paper).lean();

  return success(res, 'PPT payment verified successfully. Download authorized.', {
    paymentStatus: 'COMPLETED',
    downloadUrl: paper?.ppt?.url || '',
    pptFilename: paper?.ppt?.filename || 'Board_Paper_Solution_Notes.pdf',
  });
});

// ============================================================
// 5. PROTECTED: CREATE RAZORPAY PAYMENT ORDER (COURSE)
// ============================================================
exports.createCoursePaymentOrder = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  const course = await Course.findById(courseId).lean();
  if (!course || !course.published) {
    return error(res, 'Course not found or unavailable for purchase', 404);
  }

  // Check duplicate purchase
  const existingPurchase = await CoursePurchase.findOne({
    user: userId,
    course: course._id,
    paymentStatus: 'COMPLETED',
  }).lean();

  if (existingPurchase) {
    return error(res, 'You are already enrolled in this course', 400, 'ALREADY_ENROLLED');
  }

  // Fetch verified server-side price from MongoDB
  const amountInRupees = course.price;
  const amountInPaisa = Math.round(amountInRupees * 100);

  const orderData = await razorpayService.createOrder(amountInRupees, 'INR', {
    userId: userId.toString(),
    courseId: course._id.toString(),
    purchaseType: 'INDIVIDUAL_COURSE',
    classLevel: course.classLevel,
    subject: course.subject,
  });

  // Create pending purchase record
  await CoursePurchase.create({
    user: userId,
    purchaseType: 'INDIVIDUAL_COURSE',
    course: course._id,
    classLevel: course.classLevel,
    subject: course.subject,
    stream: course.stream,
    amount: amountInRupees,
    currency: 'INR',
    razorpayOrderId: orderData.id,
    paymentStatus: 'PENDING',
  });

  return success(res, 'Razorpay order created for course', {
    orderId: orderData.id,
    amount: amountInRupees,
    amountInPaisa,
    currency: 'INR',
    courseTitle: course.title,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// ============================================================
// 6. PROTECTED: CREATE RAZORPAY PAYMENT ORDER (BUNDLE)
// ============================================================
exports.createBundlePaymentOrder = asyncHandler(async (req, res, next) => {
  const { bundleId } = req.body;
  const userId = req.user.id;

  const bundle = await CourseBundle.findById(bundleId).populate('courses').lean();
  if (!bundle || !bundle.published) {
    return error(res, 'Bundle not found or unavailable for purchase', 404);
  }

  // Check duplicate purchase
  const existingPurchase = await CoursePurchase.findOne({
    user: userId,
    bundle: bundle._id,
    paymentStatus: 'COMPLETED',
  }).lean();

  if (existingPurchase) {
    return error(res, 'You have already purchased this course bundle', 400, 'ALREADY_ENROLLED');
  }

  const amountInRupees = bundle.price;
  const amountInPaisa = Math.round(amountInRupees * 100);
  const includedCourseIds = bundle.courses.map((c) => c._id);

  const orderData = await razorpayService.createOrder(amountInRupees, 'INR', {
    userId: userId.toString(),
    bundleId: bundle._id.toString(),
    purchaseType: bundle.bundleType,
    classLevel: bundle.classLevel,
  });

  await CoursePurchase.create({
    user: userId,
    purchaseType: bundle.bundleType,
    bundle: bundle._id,
    includedCourses: includedCourseIds,
    classLevel: bundle.classLevel,
    stream: bundle.stream,
    amount: amountInRupees,
    currency: 'INR',
    razorpayOrderId: orderData.id,
    paymentStatus: 'PENDING',
  });

  return success(res, 'Razorpay order created for bundle', {
    orderId: orderData.id,
    amount: amountInRupees,
    amountInPaisa,
    currency: 'INR',
    bundleName: bundle.name,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// ============================================================
// 7. PROTECTED: VERIFY RAZORPAY PAYMENT AND UNLOCK COURSE
// ============================================================
exports.verifyCoursePayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user.id;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return error(res, 'Missing payment verification parameters', 400);
  }

  // Verify signature server-side
  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    await CoursePurchase.findOneAndUpdate(
      { razorpayOrderId },
      { paymentStatus: 'FAILED' }
    );
    return error(res, 'Invalid payment signature. Verification failed.', 400, 'PAYMENT_VERIFICATION_FAILED');
  }

  const purchase = await CoursePurchase.findOneAndUpdate(
    { razorpayOrderId, user: userId },
    {
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus: 'COMPLETED',
      purchasedAt: new Date(),
    },
    { new: true }
  );

  if (!purchase) {
    return error(res, 'Purchase order not found or already verified', 404);
  }

  // Increment enrolled counters
  if (purchase.course) {
    await Course.findByIdAndUpdate(purchase.course, { $inc: { enrolledCount: 1 } });
    // Initialize student progress
    await CourseProgress.findOneAndUpdate(
      { user: userId, course: purchase.course },
      { $setOnInsert: { completionPercentage: 0, completedPapers: [] } },
      { upsert: true }
    );
  }

  if (purchase.bundle) {
    await CourseBundle.findByIdAndUpdate(purchase.bundle, { $inc: { salesCount: 1 } });
    if (purchase.includedCourses && purchase.includedCourses.length > 0) {
      await Course.updateMany(
        { _id: { $in: purchase.includedCourses } },
        { $inc: { enrolledCount: 1 } }
      );
      for (const cId of purchase.includedCourses) {
        await CourseProgress.findOneAndUpdate(
          { user: userId, course: cId },
          { $setOnInsert: { completionPercentage: 0, completedPapers: [] } },
          { upsert: true }
        );
      }
    }
  }

  return success(res, 'Course unlocked successfully! Happy learning.', {
    purchaseId: purchase._id,
    purchaseType: purchase.purchaseType,
    courseId: purchase.course,
    bundleId: purchase.bundle,
  });
});

// ============================================================
// 8. PROTECTED: GET STUDENT'S ENROLLED "MY COURSES"
// ============================================================
exports.getMyCourses = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const purchases = await CoursePurchase.find({
    user: userId,
    paymentStatus: 'COMPLETED',
  })
    .populate('course')
    .populate('bundle')
    .populate('includedCourses')
    .sort({ purchasedAt: -1 })
    .lean();

  const enrolledCourseIds = new Set();
  const enrolledCoursesMap = new Map();

  purchases.forEach((p) => {
    if (p.course) {
      enrolledCourseIds.add(p.course._id.toString());
      enrolledCoursesMap.set(p.course._id.toString(), {
        ...p.course,
        purchasedAt: p.purchasedAt,
        purchaseType: p.purchaseType,
      });
    }
    if (p.includedCourses && Array.isArray(p.includedCourses)) {
      p.includedCourses.forEach((c) => {
        if (c && c._id) {
          enrolledCourseIds.add(c._id.toString());
          enrolledCoursesMap.set(c._id.toString(), {
            ...c,
            purchasedAt: p.purchasedAt,
            purchaseType: p.purchaseType,
            bundleName: p.bundle?.name,
          });
        }
      });
    }
  });

  const courseIdsArray = Array.from(enrolledCourseIds);

  // Fetch progress for all enrolled courses
  const progressList = await CourseProgress.find({
    user: userId,
    course: { $in: courseIdsArray },
  })
    .populate('lastWatchedPaper', 'title year durationMinutes')
    .lean();

  const progressMap = new Map();
  progressList.forEach((pr) => {
    progressMap.set(pr.course.toString(), pr);
  });

  const myCourses = courseIdsArray.map((cId) => {
    const courseData = enrolledCoursesMap.get(cId);
    const progress = progressMap.get(cId);

    return {
      ...courseData,
      progress: {
        completionPercentage: progress?.completionPercentage || 0,
        completedPapersCount: progress?.completedPapers?.length || 0,
        lastWatchedPaper: progress?.lastWatchedPaper || null,
        lastWatchedPositionSeconds: progress?.lastWatchedPositionSeconds || 0,
        lastAccessedAt: progress?.lastAccessedAt || courseData.purchasedAt,
      },
    };
  });

  return success(res, 'Student enrolled courses retrieved', {
    courses: myCourses,
    totalEnrolled: myCourses.length,
  });
});

// ============================================================
// 9. PROTECTED: UPDATE COURSE PROGRESS (SERVER-SIDE)
// ============================================================
exports.updateCourseProgress = asyncHandler(async (req, res, next) => {
  const { courseId, paperId, completed, positionSeconds } = req.body;
  const userId = req.user.id;

  const totalPapersCount = await CoursePaper.countDocuments({ course: courseId, published: true });

  const progressDoc = await CourseProgress.findOne({ user: userId, course: courseId });
  let completedPapers = progressDoc?.completedPapers?.map((id) => id.toString()) || [];

  if (completed && paperId && !completedPapers.includes(paperId.toString())) {
    completedPapers.push(paperId.toString());
  }

  const completionPercentage = totalPapersCount > 0
    ? Math.min(100, Math.round((completedPapers.length / totalPapersCount) * 100))
    : 0;

  const updatedProgress = await CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      $set: {
        completedPapers,
        lastWatchedPaper: paperId || progressDoc?.lastWatchedPaper,
        lastWatchedPositionSeconds: positionSeconds || 0,
        completionPercentage,
        lastAccessedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return success(res, 'Progress updated successfully', {
    progress: updatedProgress,
  });
});

// ============================================================
// 10. PUBLIC: GET ALL COURSE BUNDLES
// ============================================================
exports.getCourseBundles = asyncHandler(async (req, res, next) => {
  const { classLevel } = req.query;
  const query = { published: true };

  if (classLevel) {
    const norm = normalizeClass(classLevel);
    query.classLevel = { $in: [norm, `Class ${norm}`] };
  }

  const bundles = await CourseBundle.find(query)
    .populate('courses', 'title subject classLevel price thumbnail enrolledCount')
    .sort({ price: 1 })
    .lean();

  return success(res, 'Course bundles retrieved', {
    bundles,
  });
});

// ============================================================
// 11. ADMIN: GET ALL COURSES WITH METRICS
// ============================================================
exports.adminGetCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);

  // Aggregate total papers per course
  const papersCountAgg = await CoursePaper.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', totalPapers: { $sum: 1 }, freeSamplesCount: { $sum: { $cond: ['$isFreeSample', 1, 0] } } } },
  ]);

  const papersMap = new Map();
  papersCountAgg.forEach((p) => {
    papersMap.set(p._id.toString(), p);
  });

  const formatted = courses.map((c) => ({
    ...c,
    papersCount: papersMap.get(c._id.toString())?.totalPapers || 0,
    freeSamplesCount: papersMap.get(c._id.toString())?.freeSamplesCount || 0,
  }));

  return success(res, 'Admin courses list retrieved', {
    courses: formatted,
    total: formatted.length,
  });
});

// ============================================================
// 12. ADMIN: CREATE COURSE
// ============================================================
exports.adminCreateCourse = asyncHandler(async (req, res, next) => {
  const {
    title,
    category = 'PYQ_MASTERY',
    board = 'CBSE',
    classLevel,
    subject,
    stream = 'General',
    chapter = '',
    pyqYearsRange = '2015–2026',
    youtubeUrl = '',
    description,
    tagline,
    price = 249,
    originalPrice,
    thumbnailUrl,
    instructorName,
    instructorCredentials,
    published = true,
  } = req.body;

  const slug = `${normalizeClass(classLevel)}-${subject}-${category}-${Date.now().toString().slice(-4)}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const youtubeVideoId = getYouTubeVideoId(youtubeUrl);
  const finalThumbnail = thumbnailUrl || (youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` : '');

  const course = await Course.create({
    title,
    slug,
    category,
    board,
    classLevel: normalizeClass(classLevel),
    subject,
    stream,
    chapter,
    pyqYearsRange,
    youtubeUrl,
    youtubeVideoId,
    description,
    tagline: tagline || '10 Years of Board PYQs + Complete Video Solutions',
    price: Number(price),
    originalPrice: Number(originalPrice || Number(price) * 2),
    thumbnail: { url: finalThumbnail },
    instructor: {
      name: instructorName || 'MentorNearby Senior Faculty',
      credentials: instructorCredentials || 'M.Sc, B.Ed • 10+ Years Board Experience',
    },
    published: Boolean(published),
  });

  return success(res, 'Course created successfully', { course }, 201);
});

// ============================================================
// 13. ADMIN: UPDATE COURSE
// ============================================================
exports.adminUpdateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.youtubeUrl) {
    updateData.youtubeVideoId = getYouTubeVideoId(updateData.youtubeUrl);
    if (!updateData.thumbnailUrl && updateData.youtubeVideoId) {
      updateData.thumbnail = { url: `https://img.youtube.com/vi/${updateData.youtubeVideoId}/hqdefault.jpg` };
    }
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedCourse) {
    return error(res, 'Course not found', 404);
  }

  return success(res, 'Course updated successfully', { course: updatedCourse });
});

// ============================================================
// 14. ADMIN: DELETE COURSE
// ============================================================
exports.adminDeleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  await CoursePaper.deleteMany({ course: id });
  const deleted = await Course.findByIdAndDelete(id);

  if (!deleted) {
    return error(res, 'Course not found', 404);
  }

  return success(res, 'Course and all associated papers deleted successfully');
});

// ============================================================
// 15. ADMIN: ADD PAPER / VIDEO SOLUTION TO COURSE
// ============================================================
exports.adminAddPaper = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const {
    year,
    title,
    chapter = '',
    pyqYears = '',
    paperCode,
    isFreeSample = false,
    durationMinutes = 45,
    youtubeUrl = '',
    videoUrl,
    videoTitle,
    pptUrl,
    pptFilename,
    downloadPrice = 19,
    summary,
  } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    return error(res, 'Course not found', 404);
  }

  const finalYoutubeUrl = youtubeUrl || (videoUrl && videoUrl.includes('youtu') ? videoUrl : '');
  const youtubeVideoId = getYouTubeVideoId(finalYoutubeUrl);
  const finalDownloadPrice = Number(downloadPrice || req.body.pptPrice) || 19;

  const paper = await CoursePaper.create({
    course: courseId,
    year: Number(year),
    title: title || `${year} Board Examination Complete Video Solution`,
    chapter,
    pyqYears: pyqYears || `${year}`,
    paperCode: paperCode || 'Set 1 / Standard Paper',
    isFreeSample: Boolean(isFreeSample),
    durationMinutes: Number(durationMinutes),
    youtubeUrl: finalYoutubeUrl,
    youtubeVideoId,
    downloadPrice: finalDownloadPrice,
    video: {
      url: finalYoutubeUrl || videoUrl || 'https://www.youtube.com',
      title: videoTitle || `${year} Board Paper Full Solution`,
      durationSeconds: Number(durationMinutes) * 60,
      thumbnail: youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` : '',
    },
    ppt: {
      url: pptUrl || '',
      filename: pptFilename || `CBSE_${course.classLevel}_${course.subject}_${year}_Solution_Notes.pdf`,
      pagesCount: 18,
      downloadPrice: finalDownloadPrice,
    },
    solutionNotes: {
      summary: summary || 'Comprehensive step-by-step model solutions with official marking criteria.',
    },
    published: true,
  });

  return success(res, 'Paper added to course successfully', { paper }, 201);
});

// ============================================================
// 16. ADMIN: UPDATE PAPER
// ============================================================
exports.adminUpdatePaper = asyncHandler(async (req, res, next) => {
  const { paperId } = req.params;
  const updateData = { ...req.body };

  if (updateData.youtubeUrl !== undefined) {
    updateData.youtubeVideoId = getYouTubeVideoId(updateData.youtubeUrl);
  }

  if (updateData.downloadPrice !== undefined || updateData.pptPrice !== undefined) {
    const pPrice = Number(updateData.downloadPrice || updateData.pptPrice) || 19;
    updateData.downloadPrice = pPrice;
    if (updateData.ppt) {
      updateData.ppt.downloadPrice = pPrice;
    }
  }

  const updatedPaper = await CoursePaper.findByIdAndUpdate(
    paperId,
    { $set: updateData },
    { new: true }
  );

  if (!updatedPaper) {
    return error(res, 'Paper not found', 404);
  }

  return success(res, 'Paper updated successfully', { paper: updatedPaper });
});

// ============================================================
// 17. ADMIN: DELETE PAPER
// ============================================================
exports.adminDeletePaper = asyncHandler(async (req, res, next) => {
  const { paperId } = req.params;

  const deleted = await CoursePaper.findByIdAndDelete(paperId);
  if (!deleted) {
    return error(res, 'Paper not found', 404);
  }

  return success(res, 'Paper deleted successfully');
});

// ============================================================
// 18. ADMIN: CREATE COURSE BUNDLE
// ============================================================
exports.adminCreateBundle = asyncHandler(async (req, res, next) => {
  const {
    name,
    bundleType,
    classLevel,
    stream = 'General',
    description,
    courseIds,
    price,
    originalPrice,
    badge = 'BEST VALUE',
  } = req.body;

  const slug = `${normalizeClass(classLevel)}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const bundle = await CourseBundle.create({
    name,
    slug,
    bundleType,
    classLevel: normalizeClass(classLevel),
    stream,
    description,
    courses: courseIds,
    price: Number(price),
    originalPrice: Number(originalPrice || Number(price) * 1.8),
    badge,
    published: true,
  });

  return success(res, 'Course bundle created successfully', { bundle }, 201);
});

// ============================================================
// 19. ADMIN: UPDATE COURSE BUNDLE
// ============================================================
exports.adminUpdateBundle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const bundle = await CourseBundle.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!bundle) {
    return error(res, 'Course bundle not found', 404);
  }

  return success(res, 'Course bundle updated successfully', { bundle });
});

// ============================================================
// 20. ADMIN: DELETE COURSE BUNDLE
// ============================================================
exports.adminDeleteBundle = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const bundle = await CourseBundle.findByIdAndDelete(id);

  if (!bundle) {
    return error(res, 'Course bundle not found', 404);
  }

  return success(res, 'Course bundle deleted successfully');
});

// ============================================================
// 19. ADMIN: GET COURSES REVENUE & ENROLLMENT ANALYTICS
// ============================================================
exports.adminGetAnalytics = asyncHandler(async (req, res, next) => {
  const [totalPurchases, revenueAgg, topCourses] = await Promise.all([
    CoursePurchase.countDocuments({ paymentStatus: 'COMPLETED' }),
    CoursePurchase.aggregate([
      { $match: { paymentStatus: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]),
    Course.find({ published: true })
      .sort({ enrolledCount: -1 })
      .limit(5)
      .select('title subject classLevel price enrolledCount')
      .lean(),
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  return success(res, 'Courses analytics retrieved', {
    totalEnrollments: totalPurchases,
    totalRevenue,
    topCourses,
  });
});
