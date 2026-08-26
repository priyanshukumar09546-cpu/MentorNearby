import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const DEFAULT_PRIVACY = `
1. Introduction & Scope
MentorNearby ("we", "our", or "us") provides a verified neighborhood tutoring network and digital academic resource platform. This Privacy Policy details how we collect, use, store, and safeguard your personal information.

2. Information We Collect
• Profile Information: Name, email address, phone number, academic grade/class, locality, and city.
• Tutor KYC & Background Verification: Educational degree certificates, subjects handled, hourly rates, and government identity records.
• Usage & Analytics Data: Reading engagement on study materials, video stream duration, and search queries.

3. Secure Data Handling & Payments
All transactions for offline PDF downloads and contact unlocks are processed through encrypted 256-Bit SSL channels via RBI-authorized payment partners (Razorpay). We never store raw card credentials or payment PINs.

4. 100% Student Privacy Protection
Exact residential addresses and phone numbers are protected and shared only when a tuition session is confirmed. Communication through MentorNearby verified channels ensures safe interactions.

5. Cookie Policy & Token Storage
• Essential Cookies Used: 'token' (httpOnly authentication session token) and 'role' (user account role indicator: Tutor, Student, or Parent).
• Purpose: Essential cookies maintain secure user authentication across page refreshes and personalize navigation based on your active role (Find Students vs Find Tutors).
• Duration: Essential auth cookies remain active for up to 7 days unless manually cleared upon logging out.
• Control & Management: You can clear cookies anytime via your browser settings or by clicking Logout in your account menu.

6. Contact Us
For any privacy-related requests or data deletion inquiries, please reach out to privacy@mentornearby.in.
`;

const PrivacyPolicyPage = () => {
  return (
    <LegalPageLayout
      slug="privacy-policy"
      defaultTitle="Privacy Policy"
      defaultContent={DEFAULT_PRIVACY}
    />
  );
};

export default PrivacyPolicyPage;
