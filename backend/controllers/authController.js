const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateToken, sendTokenResponse, setTokenCookie } = require('../utils/generateToken');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const emailService = require('../services/emailService');
const riskService = require('../services/riskService');
const otpService = require('../services/otpService');

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  if (role !== 'STUDENT' && role !== 'PARENT' && role !== 'TUTOR') {
    return error(res, 'Role must be STUDENT, PARENT, or TUTOR', 400);
  }

  if (!name || !email || !password || !phone) {
    return error(res, 'Name, email, password, and phone are required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (role === 'TUTOR') {
      const existingTutorProfile = await TutorProfile.findOne({ user: existingUser._id });
      if (existingTutorProfile) {
        return error(res, 'A Tutor account already exists with this email. Please log in to access your Tutor Dashboard.', 409);
      }

      // Upgrade existing account to TUTOR
      existingUser.role = 'TUTOR';
      if (name) existingUser.name = name;
      if (phone) existingUser.phone = phone;
      if (password) existingUser.password = password; // pre-save will hash
      await existingUser.save();

      const slug = (name || existingUser.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
      
      const { 
        professionalHeadline, bio, gender, dateOfBirth, education, subjects, grades, languages,
        teachingModes, experience, fees, location, areasServed, profilePhoto, introVideo, certificates,
        kycData
      } = req.body;

      let parsedSubjects = Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map(s => s.trim()) : []);
      let parsedGrades = Array.isArray(grades) ? grades : (grades ? grades.split(',').map(g => g.trim()) : []);
      let parsedLanguages = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : []);
      let parsedAreas = Array.isArray(areasServed) ? areasServed : (areasServed ? areasServed.split(',').map(a => a.trim()) : []);

      let initialKycStatus = 'PENDING';

      const tutorProfile = await TutorProfile.create({ 
        user: existingUser._id, 
        slug,
        professionalHeadline, bio, gender, dateOfBirth, education,
        subjects: parsedSubjects, grades: parsedGrades, languages: parsedLanguages,
        teachingModes, experience, fees, location, serviceAreas: parsedAreas, 
        profilePhoto, introVideo, certificates,
        kycStatus: initialKycStatus,
        profileVisibility: false
      });

      if (kycData) {
        const KYC = require('../models/KYC');
        const docs = [];
        if (kycData.govtIdUrl) {
          docs.push({ type: 'GOVT_ID', url: kycData.govtIdUrl, publicId: kycData.govtIdPublicId || '' });
        }
        if (kycData.collegeIdUrl) {
          docs.push({ type: 'COLLEGE_ID', url: kycData.collegeIdUrl, publicId: kycData.collegeIdPublicId || '' });
        }
        if (kycData.qualificationUrl) {
          docs.push({ type: 'ADDRESS_PROOF', url: kycData.qualificationUrl, publicId: kycData.qualificationPublicId || '' });
        }
        if (kycData.selfieUrl) {
          docs.push({ type: 'SELFIE', url: kycData.selfieUrl, publicId: '' });
        }

        const isDigiLocker = Boolean(kycData.digilockerVerified || kycData.kycMode === 'DIGILOCKER');
        const govtIdType = isDigiLocker ? 'AADHAAR' : (kycData.govtIdType || 'AADHAAR');
        const govtIdLast4 = kycData.govtIdLast4 ? String(kycData.govtIdLast4).slice(-4) : '1234';

        await KYC.create({
          user: existingUser._id,
          tutorProfile: tutorProfile._id,
          kycMode: isDigiLocker ? 'DIGILOCKER' : 'MANUAL',
          digilockerVerified: isDigiLocker,
          selfieUrl: kycData.selfieUrl || '',
          status: isDigiLocker ? 'VERIFIED' : (docs.length > 0 ? 'PENDING_MANUAL_REVIEW' : 'PENDING'),
          govtIdType,
          govtIdLast4,
          digilockerData: isDigiLocker ? {
            name: kycData.digilockerName || existingUser.name,
            last4: govtIdLast4,
            verifiedAt: new Date(),
            source: 'DIGILOCKER_UIDAI'
          } : undefined,
          documents: docs
        });

        if (isDigiLocker) {
          tutorProfile.kycStatus = 'VERIFIED';
          tutorProfile.verificationStatus.identity = true;
          tutorProfile.verificationStatus.profile = true;
        } else if (docs.length > 0) {
          tutorProfile.kycStatus = 'PENDING';
        }
        await tutorProfile.save();
      }


      return sendTokenResponse(existingUser, 201, res);
    }
    return error(res, 'Email already exists. Please log in.', 409);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    phone
  });

  if (role === 'TUTOR') {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
    
    const { 
      professionalHeadline, bio, gender, dateOfBirth, education, subjects, grades, languages,
      teachingModes, experience, fees, location, areasServed, profilePhoto, introVideo, certificates,
      kycData
    } = req.body;

    let parsedSubjects = Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : []);
    let parsedGrades = Array.isArray(grades) ? grades : (grades ? grades.split(',').map(g => g.trim()).filter(Boolean) : []);
    let parsedLanguages = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : []);
    let parsedAreas = Array.isArray(areasServed) ? areasServed : (areasServed ? areasServed.split(',').map(a => a.trim()).filter(Boolean) : []);

    let initialKycStatus = kycData && (kycData.govtIdUrl || kycData.collegeIdUrl) ? 'PENDING' : 'NOT_SUBMITTED';

    const tutorProfile = await TutorProfile.create({ 
      user: user._id, 
      slug,
      professionalHeadline: professionalHeadline || 'Educator & Mentor',
      bio: bio || 'Welcome to my MentorNearby teaching profile.',
      gender: gender || 'Other',
      dateOfBirth: dateOfBirth || undefined,
      education: education && education.length > 0 ? education : [],
      subjects: parsedSubjects,
      grades: parsedGrades,
      languages: parsedLanguages,
      teachingModes: teachingModes && teachingModes.length > 0 ? teachingModes : ['Online', 'Offline'],
      experience: experience || { years: 1, description: 'Teaching mentor' },
      fees: fees || { amount: 500, frequency: 'Hour', negotiable: true },
      location: location || { city: 'Not Set', area: 'Not Set', pincode: '000000' },
      serviceAreas: parsedAreas, 
      profilePhoto: profilePhoto || { url: '', publicId: '' },
      introVideo: introVideo || { url: '' },
      certificates: certificates || [],
      kycStatus: initialKycStatus,
      profileVisibility: false // Hidden from public marketplace until approved by Admin
    });

    if (kycData) {
      const KYC = require('../models/KYC');
      const docs = [];
      if (kycData.govtIdUrl) {
        docs.push({ type: 'GOVT_ID', url: kycData.govtIdUrl, publicId: kycData.govtIdPublicId || '' });
      }
      if (kycData.collegeIdUrl) {
        docs.push({ type: 'COLLEGE_ID', url: kycData.collegeIdUrl, publicId: kycData.collegeIdPublicId || '' });
      }
      if (kycData.qualificationUrl) {
        docs.push({ type: 'ADDRESS_PROOF', url: kycData.qualificationUrl, publicId: kycData.qualificationPublicId || '' });
      }
      if (kycData.selfieUrl) {
        docs.push({ type: 'SELFIE', url: kycData.selfieUrl, publicId: '' });
      }

      const isDigiLocker = Boolean(kycData.digilockerVerified || kycData.kycMode === 'DIGILOCKER');
      const govtIdType = isDigiLocker ? 'AADHAAR' : (kycData.govtIdType || 'AADHAAR');
      const govtIdLast4 = kycData.govtIdLast4 ? String(kycData.govtIdLast4).slice(-4) : '1234';

      await KYC.create({
        user: user._id,
        tutorProfile: tutorProfile._id,
        kycMode: isDigiLocker ? 'DIGILOCKER' : 'MANUAL',
        digilockerVerified: isDigiLocker,
        selfieUrl: kycData.selfieUrl || '',
        status: isDigiLocker ? 'VERIFIED' : (docs.length > 0 ? 'PENDING_MANUAL_REVIEW' : 'PENDING'),
        govtIdType,
        govtIdLast4,
        digilockerData: isDigiLocker ? {
          name: kycData.digilockerName || user.name,
          last4: govtIdLast4,
          verifiedAt: new Date(),
          source: 'DIGILOCKER_UIDAI'
        } : undefined,
        documents: docs
      });

      if (isDigiLocker) {
        tutorProfile.kycStatus = 'VERIFIED';
        tutorProfile.verificationStatus.identity = true;
        tutorProfile.verificationStatus.profile = true;
      } else if (docs.length > 0) {
        tutorProfile.kycStatus = 'PENDING';
      }
      await tutorProfile.save();
    }

  } else {
    // STUDENT or PARENT
    const {
      whatsappNumber, location, studentDetails, academicDetails, tuitionRequirements, parentDetails
    } = req.body;

    if (studentDetails && !studentDetails.medium) {
      delete studentDetails.medium;
    }

    const StudentProfile = require('../models/StudentProfile');
    await StudentProfile.create({
      user: user._id,
      whatsappNumber, location, studentDetails, academicDetails, tuitionRequirements, parentDetails
    });
  }

  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  try {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Verify your email for MentorNearby',
      text: `Please verify your email by clicking: ${verifyUrl}`
    });
  } catch (emailError) {
    console.error('Email failed but user created:', emailError.message);
    // Don't throw error, let registration continue smoothly
  }

  console.log('[DEBUG REGISTER] returned user ID:', user._id, 'email:', user.email, 'role:', user.role);
  sendTokenResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return error(res, 'Please provide email and password', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return error(res, 'No account found with this email. Please sign up first.', 401);
  }

  // Enforce Role Match
  const dbRole = (user.role || '').toUpperCase();
  if (role && role.toUpperCase() !== dbRole && dbRole !== 'ADMIN') {
    if (role.toUpperCase() === 'TUTOR') {
      return error(res, 'This email is registered as a Student. Please switch to the Student tab to login, or use a different email to register as a Tutor.', 403);
    } else if (role.toUpperCase() === 'STUDENT' || role.toUpperCase() === 'PARENT') {
      return error(res, 'This email is registered as a Tutor. Please switch to the Tutor tab to login.', 403);
    }
  }

  if (user.isSuspended) {
    const suspensionMsg = user.suspensionReason
      ? `Your MentorNearby account has been temporarily suspended: "${user.suspensionReason}". Please contact MentorNearby support.`
      : 'Your MentorNearby account has been temporarily suspended. Please contact MentorNearby support.';
    return error(res, suspensionMsg, 403, 'ACCOUNT_SUSPENDED');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts > 5) {
      await riskService.addRiskFlag(user._id, 'FAILED_LOGIN', `${user.loginAttempts} failed login attempts`, 'MEDIUM');
    }
    await user.save({ validateBeforeSave: false });
    return error(res, 'Incorrect email or password.', 401);
  }

  user.loginAttempts = 0;
  user.lastLogin = Date.now();
  if (user.role) {
    user.role = user.role.toUpperCase();
  }
  await user.save({ validateBeforeSave: false });

  console.log('[DEBUG LOGIN] returned user ID:', user._id, 'email:', user.email, 'role:', user.role);
  sendTokenResponse(user, 200, res);
});

exports.logout = asyncHandler(async (req, res, next) => {
  const clearOptions = {
    expires: new Date(0),
    maxAge: 0,
    path: '/',
    secure: true,
    sameSite: 'none',
  };

  res.cookie('token', '', { ...clearOptions, httpOnly: true });
  res.cookie('jwt', '', { ...clearOptions, httpOnly: true });
  res.cookie('role', '', { ...clearOptions, httpOnly: false });
  return success(res, 'Logged out successfully');
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return error(res, 'User not found', 404);
  }

  const userRole = (user.role || '').toString().trim().toUpperCase();
  const userObj = user.toObject();
  userObj.role = userRole;

  console.log('[DEBUG GET /api/auth/me] user ID:', req.user?.id, 'email:', user.email, 'role:', userRole);

  let data = { user: userObj };

  if (userRole === 'TUTOR') {
    const tutorProfile = await TutorProfile.findOne({ user: user._id });
    data.tutorProfile = tutorProfile;
  } else if (userRole === 'STUDENT' || userRole === 'PARENT') {
    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ user: user._id });
    data.studentProfile = studentProfile;
  }

  return res.status(200).json({
    success: true,
    message: 'User data retrieved',
    user: userObj,
    data
  });
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return error(res, 'Invalid or expired verification token', 400);
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return success(res, 'Email verified successfully');
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return success(res, 'If your email is registered, a password reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset for MentorNearby',
      text: `Reset your password by clicking: ${resetUrl}`
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return error(res, 'Email could not be sent', 500);
  }

  return success(res, 'If your email is registered, a password reset link has been sent.');
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return error(res, 'Invalid or expired reset token', 400);
  }

  if (req.body.password.length < 8) {
    return error(res, 'Password must be at least 8 characters long', 400);
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return error(res, 'Please provide current and new password', 400);
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return error(res, 'Incorrect current password', 401);
  }

  user.password = newPassword;
  await user.save();

  return success(res, 'Password updated successfully');
});

exports.googleAuth = asyncHandler(async (req, res, next) => {
  const { credential, email: bodyEmail, name: bodyName, picture: bodyPicture, googleId: bodyGoogleId, role } = req.body;

  let email = bodyEmail;
  let name = bodyName;
  let picture = bodyPicture;
  let googleId = bodyGoogleId;

  if (credential) {
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const decoded = JSON.parse(jsonPayload);
      email = decoded.email;
      name = decoded.name;
      picture = decoded.picture;
      googleId = decoded.sub;
    } catch (err) {
      console.error('Failed to decode Google credential:', err);
    }
  }

  if (!email) {
    return error(res, 'Google authentication failed: Valid email required', 400);
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.isSuspended) {
      return error(res, `Account suspended: ${user.suspensionReason}`, 403);
    }

    if (!user.googleId && googleId) {
      user.googleId = googleId;
    }
    if (picture && !user.avatar) {
      user.avatar = picture;
    }
    user.emailVerified = true;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res);
  }

  // New Google User
  const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
  // Google auth never auto-assigns ADMIN role
  const selectedRole = role === 'TUTOR' ? 'TUTOR' : 'STUDENT';

  user = await User.create({
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    password: randomPassword,
    role: selectedRole,
    googleId: googleId || crypto.randomBytes(8).toString('hex'),
    avatar: picture || '',
    emailVerified: true,
    phone: '0000000000'
  });

  if (selectedRole === 'TUTOR') {
    const slug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
    await TutorProfile.create({
      user: user._id,
      slug,
      professionalHeadline: 'MentorNearby Educator',
      bio: 'Welcome to my MentorNearby professional profile.',
      profilePhoto: { url: picture || '', publicId: '' },
      kycStatus: 'NOT_SUBMITTED'
    });
  } else {
    const StudentProfile = require('../models/StudentProfile');
    await StudentProfile.create({
      user: user._id,
      studentDetails: { name: user.name }
    });
  }

  return sendTokenResponse(user, 201, res);
});

// @desc    Get Google OAuth authorization URL
// @route   GET /api/auth/google/url
// @access  Public
exports.getGoogleAuthUrl = asyncHandler(async (req, res, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return error(res, 'Google Cloud OAuth Client ID (GOOGLE_CLIENT_ID) is not configured in .env', 400);
  }

  const role = req.query.role || 'STUDENT';
  const defaultBackendBase = process.env.NODE_ENV === 'production' ? 'https://mentornearby-2.onrender.com/api' : `http://localhost:${process.env.PORT || 5000}/api`;
  const backendUrl = process.env.BACKEND_URL || defaultBackendBase;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/auth/google/callback`;

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=select_account&state=${encodeURIComponent(role)}`;

  return success(res, 'Google OAuth URL generated', { url: googleUrl, clientId, callbackUrl });
});

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res, next) => {
  const { code, state, error: googleErr } = req.query;
  const defaultFrontendUrl = process.env.NODE_ENV === 'production' ? 'https://www.mentornearby.com' : 'http://localhost:5173';
  const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;

  if (googleErr || !code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication was cancelled or failed')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google Cloud OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) missing in .env')}`);
  }

  const defaultBackendBase = process.env.NODE_ENV === 'production' ? 'https://mentornearby-2.onrender.com/api' : `http://localhost:${process.env.PORT || 5000}/api`;
  const backendUrl = process.env.BACKEND_URL || defaultBackendBase;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/auth/google/callback`;

  let tokenRes;
  try {
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    tokenRes = await response.json();
  } catch (err) {
    console.error('Google Token Exchange Error:', err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to exchange Google OAuth code')}`);
  }

  if (!tokenRes.access_token) {
    console.error('Google Token Error Response:', tokenRes);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(tokenRes.error_description || 'Google OAuth token exchange failed')}`);
  }

  let googleUser;
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` }
    });
    googleUser = await userInfoRes.json();
  } catch (err) {
    console.error('Google Userinfo Fetch Error:', err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to fetch Google user profile')}`);
  }

  const email = googleUser.email;
  if (!email) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google account did not return a valid email')}`);
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  const selectedRole = (state === 'TUTOR') ? 'TUTOR' : 'STUDENT';

  if (user) {
    if (user.isSuspended) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(`Account suspended: ${user.suspensionReason}`)}`);
    }
    
    // Enforce Role Match
    const dbRole = (user.role || '').toUpperCase();
    if (selectedRole !== dbRole && dbRole !== 'ADMIN') {
      let errorMsg = '';
      if (selectedRole === 'TUTOR') {
        errorMsg = 'This Google account is already registered as a Student. Please switch to the Student tab to login.';
      } else {
        errorMsg = 'This Google account is already registered as a Tutor. Please switch to the Tutor tab to login.';
      }
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    if (!user.googleId && googleUser.sub) {
      user.googleId = googleUser.sub;
    }
    if (googleUser.picture && !user.avatar) {
      user.avatar = googleUser.picture;
    }
    user.emailVerified = true;
    user.lastLogin = Date.now();

    if (user.role) {
      user.role = user.role.toUpperCase();
    }

    await user.save({ validateBeforeSave: false });
  } else {
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    user = await User.create({
      name: googleUser.name || email.split('@')[0],
      email: email.toLowerCase(),
      password: randomPassword,
      role: selectedRole,
      googleId: googleUser.sub || crypto.randomBytes(8).toString('hex'),
      avatar: googleUser.picture || '',
      emailVerified: true,
      phone: '0000000000'
    });

    if (selectedRole === 'TUTOR') {
      const slug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
      await TutorProfile.create({
        user: user._id,
        slug,
        professionalHeadline: 'MentorNearby Educator',
        bio: 'Welcome to my MentorNearby professional profile.',
        profilePhoto: { url: googleUser.picture || '', publicId: '' },
        kycStatus: 'NOT_SUBMITTED',
        profileVisibility: false,
        profileViews: 0,
        totalEarnings: 0,
        totalReviews: 0,
        averageRating: 0,
        studentRequests: 0,
        contactUnlocks: 0,
        savedCount: 0,
        searchAppearances: 0
      });
    } else {
      const StudentProfile = require('../models/StudentProfile');
      await StudentProfile.create({
        user: user._id,
        studentDetails: { name: user.name }
      });
    }
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  const cookieOptions = {
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };

  res.cookie('token', token, { ...cookieOptions, httpOnly: true });
  res.cookie('jwt', token, { ...cookieOptions, httpOnly: true });
  res.cookie('role', (user.role || 'STUDENT').toString().toUpperCase(), { ...cookieOptions, httpOnly: false });
  
  return res.redirect(`${frontendUrl}/auth-success?token=${token}&role=${(user.role || 'STUDENT').toString().toUpperCase()}`);
});

// @desc    Send OTP for Identity / Mobile / Email Verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendVerificationOtp = asyncHandler(async (req, res, next) => {
  const { identifier, purpose = 'IDENTITY_VERIFICATION' } = req.body;

  if (!identifier || !identifier.trim()) {
    return error(res, 'Mobile number or email identifier is required', 400);
  }

  try {
    const result = await otpService.sendOtp(identifier.trim(), purpose);
    return success(res, result.message, {
      expiresInSeconds: result.expiresInSeconds,
      cooldownSeconds: result.cooldownSeconds
    });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Verify OTP for Identity / Mobile / Email Verification
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyIdentityOtp = asyncHandler(async (req, res, next) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return error(res, 'Identifier and 6-digit OTP are required', 400);
  }

  try {
    const result = await otpService.verifyOtp(identifier.trim(), otp.trim());
    return success(res, result.message, {
      verified: true,
      proofToken: result.proofToken
    });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

const kycProviderService = require('../services/kycProviderService');

// @desc    Send Aadhaar KYC OTP
// @route   POST /api/auth/aadhaar/send-otp
// @access  Public
exports.sendAadhaarOtp = asyncHandler(async (req, res, next) => {
  const { aadhaarNumber, consent } = req.body;

  if (!consent) {
    return error(res, 'User consent is required for Aadhaar KYC', 400);
  }

  if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
    return error(res, 'Valid 12-digit Aadhaar number is required', 400);
  }

  try {
    const result = await kycProviderService.sendAadhaarOtp(aadhaarNumber, consent);
    return success(res, result.message, {
      clientId: result.clientId
    });
  } catch (err) {
    return error(res, err.message || 'Failed to send Aadhaar OTP', 400);
  }
});

// @desc    Verify Aadhaar KYC OTP
// @route   POST /api/auth/aadhaar/verify-otp
// @access  Public
exports.verifyAadhaarOtp = asyncHandler(async (req, res, next) => {
  const { clientId, otp, aadhaarNumber } = req.body;
  const jwt = require('jsonwebtoken');

  if (!clientId || !otp) {
    return error(res, 'Client ID and 6-digit OTP are required', 400);
  }

  try {
    const result = await kycProviderService.verifyAadhaarOtp(clientId, otp.trim());
    
    const last4 = aadhaarNumber ? aadhaarNumber.slice(-4) : (result.aadhaarData?.last4 || 'XXXX');

    // Create a secure proof token that the register/submit route can verify
    const proofToken = jwt.sign(
      { verified: true, govtIdType: 'AADHAAR', govtIdLast4: last4 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return success(res, 'Aadhaar verified successfully', {
      verified: true,
      proofToken: proofToken,
      govtIdLast4: last4,
      govtIdType: 'AADHAAR'
    });
  } catch (err) {
    return error(res, err.message || 'Invalid or expired OTP', 400);
  }
});
