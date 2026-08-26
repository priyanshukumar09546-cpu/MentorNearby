const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'STUDENT') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const setTokenCookie = (user, res) => {
  const normalizedRole = (user.role || '').toString().trim().toUpperCase();
  const token = generateToken(user._id, normalizedRole);

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expiresDate = new Date(Date.now() + sevenDays);

  // Exact settings required for cross-domain cookies (mentornearby.com -> onrender.com)
  const tokenCookieOptions = {
    expires: expiresDate,
    maxAge: sevenDays,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  };

  const roleCookieOptions = {
    expires: expiresDate,
    maxAge: sevenDays,
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    path: '/',
  };

  res.cookie('token', token, tokenCookieOptions);
  res.cookie('jwt', token, tokenCookieOptions);
  res.cookie('role', normalizedRole, roleCookieOptions);
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
