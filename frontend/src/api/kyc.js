// ============================================================
// api/kyc.js
// DigiLocker Instant Verification & Manual KYC API Helpers
// ============================================================

import client from './client';

export const sendDigilockerOtp = ({ aadhaarNumber, phone }) => {
  return client.post('/kyc/digilocker/send-otp', {
    aadhaarNumber,
    phone
  });
};

export const verifyDigilockerOtp = ({ sessionId, otp, aadhaarNumber, fullName }) => {
  return client.post('/kyc/digilocker/verify-otp', {
    sessionId,
    otp,
    aadhaarNumber,
    fullName
  });
};

export const getMyKycStatus = () => {
  return client.get('/kyc/my-status');
};

export const submitKyc = (formData) => {
  return client.post('/kyc/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
