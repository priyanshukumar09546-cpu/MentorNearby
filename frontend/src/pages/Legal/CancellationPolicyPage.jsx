import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const DEFAULT_CANCELLATION = `
1. Overview
This Cancellation Policy outlines how cancellations and rescheduling are handled across MentorNearby digital purchases and tutoring sessions.

2. Digital Purchases
• Instant Delivery: Orders for downloadable PDF formula sheets, chapter notes, and PPT solutions are delivered immediately upon checkout confirmation.
• Incomplete Transactions: Payments pending or interrupted during checkout are automatically cancelled and reversed to your bank account.

3. Private Home & Online Tuition Sessions
• Advance Notice: Students and tutors must provide at least 4 hours prior notice if they need to reschedule a planned tuition class.
• Mutual Agreement: Rescheduled sessions should be arranged directly between the family and tutor to maintain consistent academic progress.
`;

const CancellationPolicyPage = () => {
  return (
    <LegalPageLayout
      slug="cancellation-policy"
      defaultTitle="Cancellation Policy"
      defaultContent={DEFAULT_CANCELLATION}
    />
  );
};

export default CancellationPolicyPage;
