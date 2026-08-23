// ============================================================
// api/courses.js
// Frontend API client for Courses, PYQ Mastery, Video Solutions,
// Bundles, Razorpay Payments, Student Progress & Admin Management
// ============================================================

import client from './client';

// 1. Get Courses Catalog (Search, Class, Subject, Stream filters)
export const getCourses = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const res = await client.get(`/courses?${query.toString()}`);
  return res.data;
};

// 2. Get Featured Courses & Stream Bundles for Landing/Home
export const getFeaturedCourses = async () => {
  const res = await client.get('/courses/featured');
  return res.data;
};

// 3. Get Course Details with 10-Year Papers Syllabus & Free Sample
export const getCourseDetails = async (idOrSlug) => {
  const res = await client.get(`/courses/${idOrSlug}`);
  return res.data;
};

// 4. Get Paper Watch Access (Video Stream & PPT notes)
export const getPaperWatchAccess = async (paperId) => {
  const res = await client.get(`/courses/paper/${paperId}/watch`);
  return res.data;
};

// 5. Create Razorpay Payment Order for Single Course
export const createCoursePaymentOrder = async (courseId) => {
  const res = await client.post('/courses/order/course', { courseId });
  return res.data;
};

// 6. Create Razorpay Payment Order for Bundle
export const createBundlePaymentOrder = async (bundleId) => {
  const res = await client.post('/courses/order/bundle', { bundleId });
  return res.data;
};

// 7. Verify Razorpay Payment & Unlock Course/Bundle
export const verifyCoursePayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const res = await client.post('/courses/verify-payment', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return res.data;
};

// 7B. Create Razorpay Payment Order for PPT Download (₹19)
export const createPptPaymentOrder = async (paperId) => {
  const res = await client.post('/courses/order/ppt', { paperId });
  return res.data;
};

// 7C. Verify Razorpay Payment & Download PPT
export const verifyPptPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const res = await client.post('/courses/verify-ppt-payment', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return res.data;
};

// 8. Get Student's Enrolled "My Courses" with Progress
export const getMyCourses = async () => {
  const res = await client.get('/courses/user/my-courses');
  return res.data;
};

// 9. Update Student Course Watch Progress
export const updateCourseProgress = async ({
  courseId,
  paperId,
  completed,
  positionSeconds,
}) => {
  const res = await client.post('/courses/user/progress', {
    courseId,
    paperId,
    completed,
    positionSeconds,
  });
  return res.data;
};

// 10. Get All Course Bundles
export const getCourseBundles = async (classLevel) => {
  const query = classLevel ? `?classLevel=${classLevel}` : '';
  const res = await client.get(`/courses/bundles${query}`);
  return res.data;
};

// 11. Admin: Get Courses List
export const adminGetCourses = async () => {
  const res = await client.get('/courses/admin/list');
  return res.data;
};

// 12. Admin: Create Course
export const adminCreateCourse = async (data) => {
  const res = await client.post('/courses/admin/create', data);
  return res.data;
};

// 13. Admin: Update Course
export const adminUpdateCourse = async (id, data) => {
  const res = await client.put(`/courses/admin/${id}`, data);
  return res.data;
};

// 14. Admin: Delete Course
export const adminDeleteCourse = async (id) => {
  const res = await client.delete(`/courses/admin/${id}`);
  return res.data;
};

// 15. Admin: Add Paper to Course
export const adminAddPaper = async (courseId, data) => {
  const res = await client.post(`/courses/admin/${courseId}/papers`, data);
  return res.data;
};

// 16. Admin: Update Paper
export const adminUpdatePaper = async (paperId, data) => {
  const res = await client.put(`/courses/admin/papers/${paperId}`, data);
  return res.data;
};

// 17. Admin: Delete Paper
export const adminDeletePaper = async (paperId) => {
  const res = await client.delete(`/courses/admin/papers/${paperId}`);
  return res.data;
};

// 18. Admin: Create Bundle
export const adminCreateBundle = async (data) => {
  const res = await client.post('/courses/admin/bundles', data);
  return res.data;
};

// 19. Admin: Update Bundle
export const adminUpdateBundle = async (id, data) => {
  const res = await client.put(`/courses/admin/bundles/${id}`, data);
  return res.data;
};

// 20. Admin: Delete Bundle
export const adminDeleteBundle = async (id) => {
  const res = await client.delete(`/courses/admin/bundles/${id}`);
  return res.data;
};

// 21. Admin: Get Analytics
export const adminGetCourseAnalytics = async () => {
  const res = await client.get('/courses/admin/analytics');
  return res.data;
};
