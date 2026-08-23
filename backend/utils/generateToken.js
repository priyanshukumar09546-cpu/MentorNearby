const jwt = require('jsonwebtoken');
const { success } = require('./apiResponse');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const setTokenCookie = (user, res) => {
  const token = generateToken(user._id);

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: process.env.COOKIE_SAME_SITE || (isProd ? 'lax' : 'lax'),
  };

  // Set root domain if configured for multi-subdomain support
  if (process.env.COOKIE_DOMAIN && isProd) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('token', token, cookieOptions);
  return token;
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = setTokenCookie(user, res);

  const normalizedRole = (user.role || '').toString().trim().toUpperCase();

  return success(res, message, {
    user: {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizedRole
    },
    token
  }, statusCode);
};

module.exports = { generateToken, sendTokenResponse, setTokenCookie };
