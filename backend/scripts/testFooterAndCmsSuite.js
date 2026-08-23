// ============================================================
// scripts/testFooterAndCmsSuite.js
// Verification Test Suite for Footer, Social Media, Trust Section, CMS & FAQs
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
const cmsController = require('../controllers/cmsController');

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runTests() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not configured in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('\n======================================================');
  console.log('STARTING FOOTER & CMS VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, msg) => {
    total++;
    if (condition) {
      console.log(`✅ PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${msg}`);
      process.exit(1);
    }
  };

  // 1. Test Footer Config Retrieval
  console.log('--- 1. Testing Footer Brand, Columns & Socials ---');
  const req1 = {};
  const res1 = mockRes();
  await cmsController.getFooterConfig(req1, res1);
  const footer = res1.data?.data?.footer || res1.data?.footer;

  assert(Boolean(footer), 'Footer configuration retrieved from API');
  assert(footer.brand?.name === 'MentorNearby', 'Footer Brand Name is MentorNearby');
  assert(footer.brand?.tagline === 'Find. Learn. Grow.', 'Footer Tagline is "Find. Learn. Grow."');
  assert(footer.brand?.description?.includes('connects students with trusted tutors'), 'Footer Description is accurate');

  // Verify 4 Columns
  assert(footer.columns?.length >= 4, 'Footer has 4 navigation columns');
  const findTutorsCol = footer.columns.find((c) => c.title === 'Find Tutors');
  assert(Boolean(findTutorsCol), 'Find Tutors column exists');
  assert(findTutorsCol.links?.some((l) => l.label === 'Browse Tutors' && l.path === '/tutors'), 'Browse Tutors link is present and working');
  assert(findTutorsCol.links?.some((l) => l.label === 'Verified Tutors'), 'Verified Tutors link is present');
  assert(findTutorsCol.links?.some((l) => l.label === 'Online Tutors'), 'Online Tutors link is present');

  const studyResourcesCol = footer.columns.find((c) => c.title === 'Study Resources');
  assert(Boolean(studyResourcesCol), 'Study Resources column exists');
  assert(studyResourcesCol.links?.some((l) => l.label === 'NCERT Solutions'), 'NCERT Solutions link is present');
  assert(studyResourcesCol.links?.some((l) => l.label === 'Free Study Materials'), 'Free Study Materials link is present');
  assert(studyResourcesCol.links?.some((l) => l.label === 'Notes & PDFs'), 'Notes & PDFs link is present');
  assert(studyResourcesCol.links?.some((l) => l.label === 'Previous Year Papers'), 'Previous Year Papers link is present');

  const helpCol = footer.columns.find((c) => c.title === 'Help & Support');
  assert(Boolean(helpCol), 'Help & Support column exists');
  assert(helpCol.links?.some((l) => l.label === 'Contact Us'), 'Contact Us link is present');
  assert(helpCol.links?.some((l) => l.label === 'How It Works'), 'How It Works link is present');
  assert(helpCol.links?.some((l) => l.label === 'Safety & Trust'), 'Safety & Trust link is present');
  assert(helpCol.links?.some((l) => l.label === 'FAQs'), 'FAQs link is present');
  assert(helpCol.links?.some((l) => l.label === 'Report an Issue'), 'Report an Issue link is present');

  const legalCol = footer.columns.find((c) => c.title === 'Legal');
  assert(Boolean(legalCol), 'Legal column exists');
  assert(legalCol.links?.some((l) => l.label === 'Privacy Policy'), 'Privacy Policy link is present');
  assert(legalCol.links?.some((l) => l.label === 'Terms & Conditions'), 'Terms & Conditions link is present');
  assert(legalCol.links?.some((l) => l.label === 'Refund Policy'), 'Refund Policy link is present');
  assert(legalCol.links?.some((l) => l.label === 'Cancellation Policy'), 'Cancellation Policy link is present');

  // Verify Exact Social URLs
  console.log('\n--- 2. Testing Exact Official Social Media URLs ---');
  const yt = footer.socials?.find((s) => s.platform === 'YouTube');
  assert(yt?.url === 'https://www.youtube.com/@MentorNearby', 'YouTube URL is https://www.youtube.com/@MentorNearby');

  const li = footer.socials?.find((s) => s.platform === 'LinkedIn');
  assert(li?.url === 'http://linkedin.com/company/mentornearby', 'LinkedIn URL is http://linkedin.com/company/mentornearby');

  const ig = footer.socials?.find((s) => s.platform === 'Instagram');
  assert(ig?.url?.includes('instagram.com/mentornearby'), 'Instagram URL is official profile');

  const tw = footer.socials?.find((s) => s.platform === 'X / Twitter' || s.platform === 'Twitter');
  assert(tw?.url === 'https://x.com/mentornearby?s=11', 'X / Twitter URL is https://x.com/mentornearby?s=11');

  const tg = footer.socials?.find((s) => s.platform === 'Telegram');
  assert(tg?.url === 'https://t.me/MentorNearbyOfficial', 'Telegram URL is https://t.me/MentorNearbyOfficial');

  const wa = footer.socials?.find((s) => s.platform === 'WhatsApp Channel');
  assert(wa?.url?.includes('whatsapp.com/channel/0029Vb8bXCGHVvTgBlJSB43y'), 'WhatsApp Channel URL is official channel');

  // Verify Trust Banner & Bottom Bar
  console.log('\n--- 3. Testing Trust Banner & Bottom Bar ---');
  assert(footer.trustSection?.heading === 'Trusted & Verified Platform', 'Trust Banner heading matches reference image');
  assert(footer.trustSection?.description?.includes('We verify tutors'), 'Trust Banner description matches reference image');
  assert(footer.trustSection?.items?.length === 4, 'Trust Banner has exactly 4 trust badges');
  assert(footer.trustSection?.items?.some((i) => i.label === 'Verified Tutors'), 'Badge "Verified Tutors" is present');
  assert(footer.trustSection?.items?.some((i) => i.label === 'Safe & Secure'), 'Badge "Safe & Secure" is present');
  assert(footer.trustSection?.items?.some((i) => i.label === '100% Privacy'), 'Badge "100% Privacy" is present');
  assert(footer.trustSection?.items?.some((i) => i.label === 'Student First'), 'Badge "Student First" is present');

  assert(footer.bottomBar?.copyright?.includes('MentorNearby. All Rights Reserved.'), 'Bottom Bar copyright text is present');
  assert(footer.bottomBar?.centerMessage === 'Your Trust, Our Priority.', 'Bottom Bar center message is "Your Trust, Our Priority."');
  assert(footer.bottomBar?.contactButtonText === 'Need Help? Contact Us', 'Bottom Bar button is "Need Help? Contact Us"');

  // 4. Test CMS Pages in Database
  console.log('\n--- 4. Testing CMS Pages in Database ---');
  const pages = await CmsPage.find({});
  assert(pages.length >= 7, `Seeded CMS Pages found: ${pages.length}`);

  const privacyPage = pages.find((p) => p.slug === 'privacy-policy');
  assert(Boolean(privacyPage && privacyPage.published), 'Privacy Policy CMS page exists & is published');

  const termsPage = pages.find((p) => p.slug === 'terms-and-conditions');
  assert(Boolean(termsPage && termsPage.published), 'Terms & Conditions CMS page exists & is published');

  const refundPage = pages.find((p) => p.slug === 'refund-policy');
  assert(Boolean(refundPage && refundPage.published), 'Refund Policy CMS page exists & is published');

  const cancelPage = pages.find((p) => p.slug === 'cancellation-policy');
  assert(Boolean(cancelPage && cancelPage.published), 'Cancellation Policy CMS page exists & is published');

  // 5. Test FAQs
  console.log('\n--- 5. Testing FAQ Knowledge Base ---');
  const faqs = await FaqItem.find({ published: true });
  assert(faqs.length >= 6, `Published FAQs in MongoDB: ${faqs.length}`);
  assert(faqs.some((f) => f.question?.includes('verified tutor')), 'FAQ for finding verified tutors exists');
  assert(faqs.some((f) => f.question?.includes('free')), 'FAQ for free online study materials exists');

  console.log('\n======================================================');
  console.log(`ALL ${passed} / ${total} VERIFICATION CHECKS PASSED (100%)`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
