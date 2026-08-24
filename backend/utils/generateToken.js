const jwt = require('jsonwebtoken');
const { success } = require('./apiResponse');

const generateToken = (userId, role = 'STUDENT') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const setTokenCookie = (user, res) => {
  const normalizedRole = (user.role || '').toString().trim().toUpperCase();
  const token = generateToken(user._id, normalizedRole);

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };

  if (process.env.COOKIE_DOMAIN && isProd) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('token', token, cookieOptions);
  res.cookie('jwt', token, cookieOptions);
  return token;
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = setTokenCookie(user, res);

  const normalizedRole = (user.role || '').toString().trim().toUpperCase();
  const userPayload = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: normalizedRole
  };

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userPayload,
    data: {
      token,
      user: userPayload
    }
  });
};

module.exports = { generateToken, sendTokenResponse, setTokenCookie };
