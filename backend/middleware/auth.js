const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { error } = require('../utils/apiResponse');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
    token = req.cookies.token || req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return error(res, 'Not authorized to access this route', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('+role +isSuspended +suspensionReason');
    
    if (!req.user) {
      return error(res, 'Not authorized to access this route', 401);
    }

    if (req.user.isSuspended && req.user.role?.toUpperCase() !== 'ADMIN') {
      const suspensionMsg = req.user.suspensionReason
        ? `Your MentorNearby account has been temporarily suspended: "${req.user.suspensionReason}". Please contact MentorNearby support.`
        : 'Your MentorNearby account has been temporarily suspended. Please contact MentorNearby support.';
      return error(res, suspensionMsg, 403, 'ACCOUNT_SUSPENDED');
    }
    
    next();
  } catch (err) {
    return error(res, 'Not authorized to access this route', 401);
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Not authorized to access this route', 401);
    }
    const userRole = (req.user.role || '').toString().trim().toUpperCase();
    // Super-admin bypass: ADMIN role has universal authorization
    if (userRole === 'ADMIN') {
      return next();
    }
    const allowedRoles = roles.map(r => r.toString().trim().toUpperCase());
    if (!allowedRoles.includes(userRole)) {
      return error(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
