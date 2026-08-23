const crypto = require('crypto');

// This is an abstraction for an authorized Aadhaar KYC provider (e.g., Setu, Zoop, SurePass, etc.)
// When actual provider credentials are added to environment variables, replace the mock calls with real HTTP requests.

exports.sendAadhaarOtp = async (aadhaarNumber, consent) => {
  if (!consent) {
    throw new Error('User consent is required for Aadhaar KYC');
  }

  // Basic validation (12 digits)
  if (!/^\d{12}$/.test(aadhaarNumber)) {
    throw new Error('Invalid Aadhaar number');
  }

  // Example integration placeholder
  const kycProviderUrl = process.env.KYC_PROVIDER_API_URL;
  const kycApiKey = process.env.KYC_PROVIDER_API_KEY;

  if (kycProviderUrl && kycApiKey) {
    // Make actual API call to provider
    // const response = await axios.post(`${kycProviderUrl}/aadhaar/send-otp`, { aadhaar_number: aadhaarNumber }, { headers: { 'Authorization': `Bearer ${kycApiKey}` } });
    // return { clientId: response.data.client_id, message: 'OTP sent successfully' };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('KYC Provider not configured for production environment.');
  }

  // Fallback / Development Simulation
  // In a real production scenario without a provider, you'd fail here.
  // But for the sake of the requirement "create a clean provider abstraction/interface if the KYC provider is not yet configured",
  // we simulate a successful OTP send response returning a clientId.
  
  // We should NOT store the full aadhaar in memory like this normally, but for the abstraction to verify OTP, 
  // we'll return a fake client ID.
  const clientId = crypto.randomBytes(16).toString('hex');
  
  // We can return this to the controller
  return {
    clientId,
    message: 'OTP sent to Aadhaar-linked mobile number'
  };
};

exports.verifyAadhaarOtp = async (clientId, otp) => {
  if (!clientId || !otp) {
    throw new Error('Client ID and OTP are required');
  }

  const kycProviderUrl = process.env.KYC_PROVIDER_API_URL;
  const kycApiKey = process.env.KYC_PROVIDER_API_KEY;

  if (kycProviderUrl && kycApiKey) {
    // Make actual API call to provider
    // const response = await axios.post(`${kycProviderUrl}/aadhaar/verify-otp`, { client_id: clientId, otp }, { headers: { 'Authorization': `Bearer ${kycApiKey}` } });
    // return { verified: true, aadhaarData: response.data.aadhaar_data };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('KYC Provider not configured for production environment.');
  }

  // Fallback / Development Simulation
  if (otp === '123456' || otp.length === 6) {
    // Simulating successful verification
    return {
      verified: true,
      proofToken: crypto.randomBytes(24).toString('hex'),
      // In a real scenario, the provider returns Aadhaar details like name, dob, address, last 4 digits
      aadhaarData: {
        last4: 'XXXX' // We won't know the exact last 4 without storing it or getting it from provider
      }
    };
  }
  
  throw new Error('Invalid OTP');
};
