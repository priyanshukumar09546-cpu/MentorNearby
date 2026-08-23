import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const DEFAULT_REFUND = `
1. Fair & Transparent Refund Policy
At MentorNearby, student trust is our highest priority. We strive to provide complete clarity regarding refunds for digital resources and platform services.

2. Study Resources & Digital Downloads
• Free Online Preview: Because every study material offers 100% free online reading prior to purchase, downloadable PDF orders are generally final once the download link is accessed.
• Technical Failures: If a payment was deducted but the download was not unlocked due to a server error, our automated reconciliation processes a full refund within 3–5 business days.

3. Tutor Contact Unlock Credits
• If a student unlocks a tutor contact and the tutor is unresponsive for more than 48 hours, the student can request an instant credit reload to connect with an alternative verified tutor.

4. Contact Support for Refund Requests
Please email support@mentornearby.in with your Order ID and transaction timestamp.
`;

const RefundPolicyPage = () => {
  return (
    <LegalPageLayout
      slug="refund-policy"
      defaultTitle="Refund Policy"
      defaultContent={DEFAULT_REFUND}
    />
  );
};

export default RefundPolicyPage;
