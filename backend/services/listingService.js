// ============================================================
// services/listingService.js
// Automatic Tutor and Student Listing Publication Service
// Validates mandatory info + photo + email verification
// ============================================================

const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const emailService = require('./emailService');

/**
 * Validate and automatically publish tutor or student listing
 * @param {string|ObjectId} userId - User ID
 * @param {string} role - 'TUTOR' or 'STUDENT'
 * @returns {Promise<Object>} Result object with publication status
 */
const checkAndPublishListing = async (userId, role = null) => {
  const user = await User.findById(userId).select('+phone');
  if (!user) return { published: false, reason: 'USER_NOT_FOUND' };

  const effectiveRole = (role || user.role || 'STUDENT').toUpperCase();

  if (effectiveRole === 'TUTOR') {
    const tutor = await TutorProfile.findOne({ user: user._id });
    if (!tutor) return { published: false, reason: 'TUTOR_PROFILE_NOT_FOUND' };

    // Don't auto-publish if suspended or rejected by admin
    if (tutor.listingStatus === 'Suspended' || tutor.listingStatus === 'Rejected') {
      return {
        published: false,
        listingStatus: tutor.listingStatus,
        reason: `Listing is ${tutor.listingStatus} by administrator: ${tutor.suspensionReason || tutor.rejectionReason}`,
      };
    }

    // 1. Mandatory Profile Photo Check (Part 7)
    const hasPhoto = Boolean(
      (tutor.profilePhoto && tutor.profilePhoto.url && tutor.profilePhoto.url.trim()) ||
      (user.avatar && user.avatar.trim())
    );

    if (!hasPhoto) {
      return {
        published: false,
        listingStatus: 'Draft',
        photoMissing: true,
        reason: 'PROFILE_PHOTO_REQUIRED',
        message: 'A valid profile photo is mandatory before your tutor listing can be published.',
      };
    }

    // 2. Mandatory Fields Check
    const missingFields = [];
    if (!user.name && !tutor.name) missingFields.push('Full Name');
    if (!tutor.subjects || tutor.subjects.length === 0) missingFields.push('At least one Subject');
    if (!tutor.location?.city && !tutor.location?.area && !tutor.location?.pincode) {
      missingFields.push('Location (City, Area, or Pincode)');
    }
    if (!tutor.experience?.years && !tutor.experience?.description && tutor.experience?.years !== 0) {
      missingFields.push('Teaching Experience');
    }

    if (missingFields.length > 0) {
      return {
        published: false,
        listingStatus: 'Draft',
        reason: 'MANDATORY_FIELDS_REQUIRED',
        message: `Please complete required profile fields: ${missingFields.join(', ')}`,
        missingFields,
      };
    }

    // 3. Email Verification Check
    if (!user.emailVerified) {
      return {
        published: false,
        listingStatus: 'Draft',
        emailPending: true,
        reason: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email address before your listing can go live.',
      };
    }

    // All validation passed -> Automatically Publish Listing
    const wasPublished = tutor.listingStatus === 'Published';
    tutor.listingStatus = 'Published';
    tutor.isApproved = true;
    tutor.profileStatus = 'published';
    tutor.profileVisibility = true;
    if (!tutor.publishedAt) {
      tutor.publishedAt = new Date();
    }
    await tutor.save({ validateBeforeSave: false });

    // Send automatic publication email if this is a new publication
    if (!wasPublished) {
      try {
        await emailService.sendTutorPublicationEmail({
          tutorName: user.name,
          email: user.email,
          subjects: tutor.subjects,
          experience: tutor.experience,
        });
      } catch (err) {
        console.warn('⚠️ Tutor publication email sending notice:', err.message);
      }
    }

    return {
      published: true,
      listingStatus: 'Published',
      isApproved: true,
      message: 'Your tutor profile is published and live on MentorNearby!',
    };
  }

  // STUDENT Role
  if (effectiveRole === 'STUDENT' || effectiveRole === 'PARENT') {
    let student = await StudentProfile.findOne({ user: user._id });
    if (!student) {
      student = await StudentProfile.create({
        user: user._id,
        listingStatus: 'Draft',
      });
    }

    if (student.listingStatus === 'Suspended' || student.listingStatus === 'Rejected') {
      return {
        published: false,
        listingStatus: student.listingStatus,
        reason: `Listing is ${student.listingStatus} by administrator: ${student.suspensionReason || student.rejectionReason}`,
      };
    }

    // Mandatory Photo Check
    const hasPhoto = Boolean(
      (student.profilePhoto && student.profilePhoto.url && student.profilePhoto.url.trim()) ||
      (user.avatar && user.avatar.trim())
    );

    if (!hasPhoto) {
      return {
        published: false,
        listingStatus: 'Draft',
        photoMissing: true,
        reason: 'PROFILE_PHOTO_REQUIRED',
        message: 'A profile photo is mandatory before your student profile can be published.',
      };
    }

    // Mandatory Fields Check
    const missingFields = [];
    if (!user.name && !student.studentDetails?.name) missingFields.push('Student Name');
    if (!student.location?.city && !student.location?.area) missingFields.push('City or Area');

    if (missingFields.length > 0) {
      return {
        published: false,
        listingStatus: 'Draft',
        reason: 'MANDATORY_FIELDS_REQUIRED',
        message: `Please complete required profile fields: ${missingFields.join(', ')}`,
        missingFields,
      };
    }

    // Email verification check
    if (!user.emailVerified) {
      return {
        published: false,
        listingStatus: 'Draft',
        emailPending: true,
        reason: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email address before your profile can go live.',
      };
    }

    const wasPublished = student.listingStatus === 'Published';
    student.listingStatus = 'Published';
    student.isApproved = true;
    student.profileVisibility = true;
    if (!student.publishedAt) {
      student.publishedAt = new Date();
    }
    await student.save({ validateBeforeSave: false });

    if (!wasPublished) {
      try {
        await emailService.sendStudentPublicationEmail({
          studentName: student.studentDetails?.name || user.name,
          email: user.email,
        });
      } catch (err) {
        console.warn('⚠️ Student publication email sending notice:', err.message);
      }
    }

    return {
      published: true,
      listingStatus: 'Published',
      isApproved: true,
      message: 'Your student profile is published and live on MentorNearby!',
    };
  }

  return { published: false, reason: 'UNSUPPORTED_ROLE' };
};

/**
 * Suspend listing by admin
 */
const suspendListing = async (profileId, role, reason, adminUser) => {
  const isTutor = role.toUpperCase() === 'TUTOR';
  let profile = null;
  let user = null;

  if (isTutor) {
    profile = await TutorProfile.findById(profileId).populate('user');
    if (!profile) profile = await TutorProfile.findOne({ user: profileId }).populate('user');
  } else {
    profile = await StudentProfile.findById(profileId).populate('user');
    if (!profile) profile = await StudentProfile.findOne({ user: profileId }).populate('user');
  }

  if (!profile) throw new Error('Listing profile not found');

  user = profile.user;
  profile.listingStatus = 'Suspended';
  profile.isApproved = false;
  profile.profileVisibility = false;
  profile.suspendedAt = new Date();
  profile.suspensionReason = reason || 'Suspended by admin for verification/policy review';
  profile.suspendedBy = adminUser?._id || null;
  await profile.save({ validateBeforeSave: false });

  if (user && user.email) {
    try {
      await emailService.sendListingSuspendedEmail({ user, reason: profile.suspensionReason });
    } catch (err) {
      console.warn('Suspension email error:', err.message);
    }
  }

  return profile;
};

/**
 * Restore suspended listing by admin
 */
const restoreListing = async (profileId, role, adminUser) => {
  const isTutor = role.toUpperCase() === 'TUTOR';
  let profile = null;

  if (isTutor) {
    profile = await TutorProfile.findById(profileId).populate('user');
    if (!profile) profile = await TutorProfile.findOne({ user: profileId }).populate('user');
  } else {
    profile = await StudentProfile.findById(profileId).populate('user');
    if (!profile) profile = await StudentProfile.findOne({ user: profileId }).populate('user');
  }

  if (!profile) throw new Error('Listing profile not found');

  profile.listingStatus = 'Published';
  profile.isApproved = true;
  profile.profileVisibility = true;
  profile.suspendedAt = null;
  profile.suspensionReason = '';
  profile.suspendedBy = null;
  await profile.save({ validateBeforeSave: false });

  if (profile.user && profile.user.email) {
    try {
      await emailService.sendListingRestoredEmail({ user: profile.user });
    } catch (err) {
      console.warn('Restoration email error:', err.message);
    }
  }

  return profile;
};

/**
 * Get listings stats for Admin
 */
const getListingsStats = async () => {
  const [
    totalTutors,
    publishedTutors,
    suspendedTutors,
    draftTutors,
    totalStudents,
    publishedStudents,
    suspendedStudents,
  ] = await Promise.all([
    TutorProfile.countDocuments(),
    TutorProfile.countDocuments({ listingStatus: 'Published' }),
    TutorProfile.countDocuments({ listingStatus: 'Suspended' }),
    TutorProfile.countDocuments({ listingStatus: 'Draft' }),
    StudentProfile.countDocuments(),
    StudentProfile.countDocuments({ listingStatus: 'Published' }),
    StudentProfile.countDocuments({ listingStatus: 'Suspended' }),
  ]);

  return {
    tutors: {
      total: totalTutors,
      published: publishedTutors,
      suspended: suspendedTutors,
      draft: draftTutors,
    },
    students: {
      total: totalStudents,
      published: publishedStudents,
      suspended: suspendedStudents,
    },
    totalListings: totalTutors + totalStudents,
    totalPublished: publishedTutors + publishedStudents,
    totalSuspended: suspendedTutors + suspendedStudents,
  };
};

module.exports = {
  checkAndPublishListing,
  suspendListing,
  restoreListing,
  getListingsStats,
};
