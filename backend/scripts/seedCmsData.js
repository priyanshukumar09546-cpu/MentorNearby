// ============================================================
// scripts/seedCmsData.js
// Seed Default Footer Config, CMS Pages & FAQs into MongoDB
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const mongoose = require('mongoose');
require('dotenv').config();

const AdminConfig = require('../models/AdminConfig');
const CmsPage = require('../models/CmsPage');
const FaqItem = require('../models/FaqItem');

const DEFAULT_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    category: 'LEGAL',
    excerpt: 'Learn how MentorNearby collects, uses, protects, and handles your personal information.',
    metaTitle: 'Privacy Policy | MentorNearby',
    metaDescription: 'MentorNearby Privacy Policy explaining student and tutor data security, privacy rights, and information protection.',
    content: `
# MentorNearby Privacy Policy

**Effective Date:** January 1, 2026  
**Last Updated:** February 2026  

Welcome to **MentorNearby** ("we", "our", or "us"). We are committed to protecting the privacy and personal data of all students, parents, tutors, and visitors across our platform.

---

## 1. Information We Collect

### A. Information You Provide
- **Account Registration:** Name, email address, phone number, city, academic grade/class, and profile password.
- **Tutor Profiles:** Educational qualifications, teaching experience, subjects handled, hourly tuition rates, availability, and Aadhaar/Govt ID verification records for KYC.
- **Tuition Requirements:** Grade level, subject needs, preferred timing, mode of tuition (Home / Online), and location landmarks.

### B. Payment & Transaction Information
- Payments for study materials, solution notes, and tutor contact unlocks are processed securely through RBI-authorized payment gateways (Razorpay). We do not store raw credit card numbers or UPI PINs on our servers.

---

## 2. How We Use Your Information

- **Tutor-Student Matching:** Facilitate direct, trusted connections between nearby students and verified home/online tutors.
- **Academic Content Access:** Deliver instant streaming and digital access to formula sheets, NCERT notes, and video classrooms.
- **Trust & Safety Verification:** Review tutor identities through multi-step government ID verification and background checks.
- **Communication & Alerts:** Send important SMS/WhatsApp updates regarding class bookings, inquiry responses, and platform notifications.

---

## 3. Data Protection & Security

- All data transmitted between your device and MentorNearby is encrypted using **Industry-Standard 256-Bit SSL/TLS**.
- Tutor contact details are protected behind authorized access controls to prevent spam.
- Student residential addresses are never broadcast publicly.

---

## 4. Contact Us Regarding Privacy
If you have any questions, concerns, or requests regarding this Privacy Policy, please email us at:
**privacy@mentornearby.in** or visit our [Contact Us](/contact) page.
    `,
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    category: 'LEGAL',
    excerpt: 'Standard terms of service governing the use of MentorNearby tutor discovery, courses, and study materials.',
    metaTitle: 'Terms & Conditions | MentorNearby',
    metaDescription: 'Terms and conditions for students, parents, and tutors using MentorNearby.',
    content: `
# MentorNearby Terms & Conditions

**Effective Date:** January 1, 2026  

These Terms and Conditions ("Terms") govern your access to and use of the MentorNearby website, mobile interfaces, and tutoring marketplace services.

---

## 1. User Eligibility & Accounts
- Users must provide truthful, accurate information when registering as a student, parent, or tutor.
- Tutors must be at least 18 years of age and hold valid academic credentials in the subjects they teach.

---

## 2. Marketplace & Educational Resource Rules
- **Free Online Reading:** All students have 100% free access to read curated formula sheets, chapter notes, and video classrooms online.
- **Paid Offline Downloads:** Offline printable PDF and PPT downloads require individual or combo purchase as indicated at checkout.
- **Direct Tutoring Engagements:** MentorNearby facilitates direct connections between verified tutors and families. Families and tutors agree on tuition schedules and direct fee structures.

---

## 3. Prohibited Conduct
- Scraping, automated harvesting, or unauthorized mass redistribution of academic materials.
- Impersonation or submitting fraudulent government documents during tutor KYC.
- Harassment or inappropriate conduct between platform users.

---

## 4. Limitation of Liability
MentorNearby exercises stringent verification processes, but is not liable for private offline disputes between independent tutors and parents. Users are encouraged to adhere to our [Safety & Trust Guidelines](/safety).
    `,
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    category: 'LEGAL',
    excerpt: 'Detailed guidelines on payment refunds for study resources and digital services.',
    metaTitle: 'Refund Policy | MentorNearby',
    metaDescription: 'MentorNearby transparent refund and consumer protection policy.',
    content: `
# MentorNearby Refund Policy

At MentorNearby, student satisfaction and fair policies are our highest priorities.

---

## 1. Digital Study Materials & PDF Downloads
- Because study resources offer **100% Free Online Reading** before purchase, offline PDF download purchases are generally non-refundable once the file has been downloaded.
- In cases of duplicate payment or payment failure where the file was not unlocked, our automated payment reconciliation issues a full refund within **3–5 business days**.

---

## 2. Tutor Contact Unlocks
- If a contact unlock fails to provide responsive tutor communication within 48 hours, students may request a credit reload to unlock an alternate nearby tutor.

---

## 3. How to Request a Refund
Submit a request with your Payment ID / Order ID to:
**support@mentornearby.in** or use our [Report an Issue](/report-issue) portal.
    `,
  },
  {
    slug: 'cancellation-policy',
    title: 'Cancellation Policy',
    category: 'LEGAL',
    excerpt: 'Policies regarding tuition session cancellations and digital order cancellation.',
    metaTitle: 'Cancellation Policy | MentorNearby',
    metaDescription: 'MentorNearby cancellation rules for classes, study materials, and bookings.',
    content: `
# MentorNearby Cancellation Policy

---

## 1. Digital Orders
- Orders for instant digital downloads (Formula Sheets, Important Q&A, Solution PPTs) are delivered immediately upon Razorpay confirmation.
- Cancellation requests for uncompleted or stuck transactions are automatically reversed back to the original payment source.

---

## 2. Home & Online Tuition Sessions
- Students and Tutors are encouraged to provide at least **4 hours notice** for rescheduling any planned home or online tuition session.
- Repeated unnotified cancellations may affect a tutor's platform rating or a student's active requirement listing.
    `,
  },
  {
    slug: 'how-it-works',
    title: 'How It Works',
    category: 'SUPPORT',
    excerpt: 'Step-by-step guide on how students find verified tutors and access free study materials.',
    metaTitle: 'How It Works | MentorNearby',
    metaDescription: 'Learn how MentorNearby works for students, parents, and tutors.',
    content: `
# How MentorNearby Works

MentorNearby is India's premier neighborhood tutoring network and academic resource platform.

---

## For Students & Parents
1. **Search Nearby:** Enter your class, subject, and locality to view top-rated tutors near your home.
2. **Review Verified Credentials:** Check background verification, educational degrees, parent reviews, and experience.
3. **Connect Directly:** Book a demo session or request home/online private tutoring.
4. **Study for Free:** Read master formula sheets, NCERT solutions, and watch board PYQ video solutions 100% free online!

---

## For Tutors
1. **Create Free Profile:** List your academic specializations, teaching modes, and locality coverage.
2. **Get Verified (KYC):** Upload ID proofs to earn the trusted **✓ Verified Tutor** badge.
3. **Receive Tuition Leads:** Get matched with neighborhood students looking for home & online mentors.
4. **Teach & Grow:** Build your teaching reputation and expand your private tutoring career.
    `,
  },
  {
    slug: 'safety-trust',
    title: 'Safety & Trust',
    category: 'SUPPORT',
    excerpt: 'Our commitment to a safe, transparent, and verified learning environment for every student.',
    metaTitle: 'Safety & Trust | MentorNearby',
    metaDescription: 'Learn about tutor verification, safety measures, and student protection on MentorNearby.',
    content: `
# Safety & Trust at MentorNearby

Your safety is our top priority. We implement stringent checks to ensure peace of mind for every parent and student.

---

## 1. Multi-Step Tutor Verification (KYC)
- **Government ID Checks:** Verification of Aadhaar, PAN, or Passport records.
- **Academic Credential Screening:** Validation of degrees, teaching certifications, and university transcripts.
- **Address & Locality Confirmation:** Ensuring physical neighborhood authenticity.

---

## 2. 100% Student Privacy
- Exact residential addresses and student phone numbers are kept private and shared only upon mutual confirmation.
- Continuous monitoring of platform communications to prevent unauthorized spam.

---

## 3. Verified Student Reviews
- Only students and parents who have engaged with a tutor can post authenticated reviews.
    `,
  },
  {
    slug: 'report-issue',
    title: 'Report an Issue',
    category: 'SUPPORT',
    excerpt: 'Report bugs, payment issues, inappropriate behavior, or request urgent platform support.',
    metaTitle: 'Report an Issue | MentorNearby',
    metaDescription: 'Submit an issue or safety report to the MentorNearby moderation team.',
    content: `
# Report an Issue or Dispute

Our dedicated safety and support team investigates every report within **24 hours**.

---

### Common Issues We Resolve Quickly:
- 💳 **Payment / Download Inquiries:** Instant resolution for digital resource downloads or payment receipts.
- 🛡️ **Tutor / Student Conduct:** Immediate moderation for any unverified conduct or policy violations.
- 🐞 **Platform Bugs / Glitches:** Quick fixes for video streaming, reader viewing, or account settings.

Submit your report using our [Contact Us](/contact) page or directly via **support@mentornearby.in**.
    `,
  },
];

const DEFAULT_FAQS = [
  {
    question: 'How do I find a verified tutor near my home?',
    answer: 'Enter your class, subject, and locality on the Find Tutors page. You can filter by home tuition, online mode, rating, and verified KYC status.',
    category: 'STUDENTS',
    order: 1,
  },
  {
    question: 'Is online reading for study resources really 100% free?',
    answer: 'Yes! All formula sheets, chapter study notes, NCERT books, and 10-year board PYQ video solutions are 100% free to read and watch online on MentorNearby.',
    category: 'STUDY_RESOURCES',
    order: 2,
  },
  {
    question: 'How much does it cost to download offline printable PDFs?',
    answer: 'Class 9 & 10 Formula Sheets are ₹7, Notes/PPTs are ₹12. Class 11 & 12 Formula Sheets are ₹8, Notes/PPTs are ₹14. Complete all-chapter combos start from ₹50.',
    category: 'PAYMENTS',
    order: 3,
  },
  {
    question: 'How can a tutor get verified on MentorNearby?',
    answer: 'Tutors can log in to their dashboard, navigate to the KYC Verification section, and submit their government ID (Aadhaar/PAN) along with academic degree certificates for verification.',
    category: 'TUTORS',
    order: 4,
  },
  {
    question: 'Are PYQ Video Mastery courses free to watch?',
    answer: 'Yes, all 10-year video solutions across Mathematics, Science, and other board subjects are 100% free to watch in our video classroom.',
    category: 'COURSES',
    order: 5,
  },
  {
    question: 'How do I contact MentorNearby customer support?',
    answer: 'You can reach us anytime at support@mentornearby.in, message our official WhatsApp Channel, or submit a query on our Contact Us page.',
    category: 'GENERAL',
    order: 6,
  },
];

async function seedData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not configured in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for CMS and Footer seeding...\n');

  // 1. Seed CMS Pages
  for (const p of DEFAULT_PAGES) {
    await CmsPage.findOneAndUpdate(
      { slug: p.slug },
      { ...p },
      { upsert: true, new: true }
    );
    console.log(`✓ Seeded CMS Page: ${p.title} (/${p.slug})`);
  }

  // 2. Seed FAQs
  await FaqItem.deleteMany({});
  for (const f of DEFAULT_FAQS) {
    await FaqItem.create(f);
  }
  console.log(`✓ Seeded ${DEFAULT_FAQS.length} FAQ items`);

  console.log('\nCMS seeding completed successfully!');
  await mongoose.disconnect();
}

seedData().catch((err) => {
  console.error('Error seeding CMS data:', err);
  process.exit(1);
});
