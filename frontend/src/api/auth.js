import client from './client';

export const register = (data) => client.post('/auth/register', data);
export const login = (data) => client.post('/auth/login', data);
export const logout = () => client.post('/auth/logout');
export const getMe = () => client.get(`/auth/me?t=${new Date().getTime()}`);
export const forgotPassword = (data) => client.post('/auth/forgot-password', data);

// token is passed in URL path, password in body
export const resetPassword = ({ token, password }) =>
  client.post(`/auth/reset-password/${token}`, { password });

export const updatePassword = (data) => client.put('/auth/update-password', data);

// Email verification: token is in URL path (GET request)
export const verifyEmail = (token) =>
  client.get(`/auth/verify-email/${token}`);

export const googleAuth = (data) => client.post('/auth/google', data);
export const getGoogleAuthUrl = (role = 'STUDENT') =>
  client.get(`/auth/google/url?role=${encodeURIComponent(role)}`);

// OTP & Identity Verification APIs
export const sendVerificationOtp = (identifier, purpose = 'IDENTITY_VERIFICATION') =>
  client.post('/auth/send-otp', { identifier, purpose });

export const verifyIdentityOtp = (identifier, otp) =>
  client.post('/auth/verify-otp', { identifier, otp });

export const sendAadhaarOtp = (aadhaarNumber, consent) =>
  client.post('/auth/aadhaar/send-otp', { aadhaarNumber, consent });

export const verifyAadhaarOtp = (clientId, otp, aadhaarNumber) =>
  client.post('/auth/aadhaar/verify-otp', { clientId, otp, aadhaarNumber });
