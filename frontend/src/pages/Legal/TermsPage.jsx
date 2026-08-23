import React from 'react';
import LegalPageLayout from './LegalPageLayout';

const DEFAULT_TERMS = `
1. Agreement to Terms
By accessing or using MentorNearby, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, you may not use our services.

2. User Responsibilities & Account Security
• Students & Parents: Agree to maintain respectful conduct with tutors and provide accurate tuition requirements.
• Tutors: Represent authentic academic qualifications, maintain punctual schedule commitments, and adhere to our safety standards.

3. Educational Content & Free Online Access
• All curated formula sheets, NCERT chapter notes, and PYQ video solutions are 100% free to read and watch online for educational use.
• Offline downloadable PDFs and PPT files require standard checkout unlock. Unauthorized commercial distribution or bulk scraping is strictly prohibited.

4. Tutoring Relationship
MentorNearby operates as a discovery and verification platform connecting students with independent tutors. Direct tuition fees and private offline agreements are managed directly between the tutor and the family.

5. Termination & Suspension
We reserve the right to suspend or terminate accounts that violate our community guidelines, submit forged KYC credentials, or engage in improper behavior.
`;

const TermsPage = () => {
  return (
    <LegalPageLayout
      slug="terms-and-conditions"
      defaultTitle="Terms & Conditions"
      defaultContent={DEFAULT_TERMS}
    />
  );
};

export default TermsPage;
