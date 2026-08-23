// ============================================================
// controllers/cmsController.js
// Content Management System: Footer Config, Legal/Support CMS Pages & FAQs
// ============================================================

const AdminConfig = require('../models/AdminConfig');
const CmsPage = require('../models/CmsPage');
const FaqItem = require('../models/FaqItem');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Official default footer configuration (Matches Reference Image)
const DEFAULT_FOOTER_CONFIG = {
  brand: {
    name: 'MentorNearby',
    tagline: 'Find. Learn. Grow.',
    description: 'MentorNearby connects students with trusted tutors nearby. Find the right mentor for your bright future.',
    logoUrl: '/logo.png',
  },
  columns: [
    {
      id: 'find-tutors',
      title: 'Find Tutors',
      icon: 'user',
      order: 1,
      enabled: true,
      links: [
        { label: 'Browse Tutors', path: '/tutors', enabled: true },
        { label: 'By Subject', path: '/tutors?filter=subject', enabled: true },
        { label: 'By Location', path: '/tutors?filter=location', enabled: true },
        { label: 'Verified Tutors', path: '/tutors?verified=true', enabled: true },
        { label: 'Online Tutors', path: '/tutors?mode=online', enabled: true },
      ],
    },
    {
      id: 'study-resources',
      title: 'Study Resources',
      icon: 'book',
      order: 2,
      enabled: true,
      links: [
        { label: 'NCERT Solutions', path: '/books', enabled: true },
        { label: 'Free Study Materials', path: '/study-resources', enabled: true },
        { label: 'Notes & PDFs', path: '/study-resources', enabled: true },
        { label: 'Previous Year Papers', path: '/courses', enabled: true },
        { label: 'Topper Tips', path: '/study-resources', enabled: true },
      ],
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      icon: 'headphone',
      order: 3,
      enabled: true,
      links: [
        { label: 'Contact Us', path: '/contact', enabled: true },
        { label: 'How It Works', path: '/how-it-works', enabled: true },
        { label: 'Safety & Trust', path: '/safety', enabled: true },
        { label: 'FAQs', path: '/faqs', enabled: true },
        { label: 'Report an Issue', path: '/report-issue', enabled: true },
      ],
    },
    {
      id: 'legal',
      title: 'Legal',
      icon: 'shield',
      order: 4,
      enabled: true,
      links: [
        { label: 'Privacy Policy', path: '/privacy', enabled: true },
        { label: 'Terms & Conditions', path: '/terms', enabled: true },
        { label: 'Refund Policy', path: '/refund', enabled: true },
        { label: 'Cancellation Policy', path: '/cancellation', enabled: true },
      ],
    },
  ],
  socials: [
    {
      id: 'youtube',
      platform: 'YouTube',
      handle: '@MentorNearby',
      url: 'https://www.youtube.com/@MentorNearby',
      icon: 'youtube',
      color: '#FF0000',
      enabled: true,
      order: 1,
    },
    {
      id: 'linkedin',
      platform: 'LinkedIn',
      handle: '/mentornearby',
      url: 'http://linkedin.com/company/mentornearby',
      icon: 'linkedin',
      color: '#0A66C2',
      enabled: true,
      order: 2,
    },
    {
      id: 'instagram',
      platform: 'Instagram',
      handle: '@mentornearby',
      url: 'https://www.instagram.com/mentornearby?igsi=anh5bmFjaTdvc29n',
      icon: 'instagram',
      color: '#E4405F',
      enabled: true,
      order: 3,
    },
    {
      id: 'twitter',
      platform: 'X / Twitter',
      handle: '@mentornearby',
      url: 'https://x.com/mentornearby?s=11',
      icon: 'twitter',
      color: '#000000',
      enabled: true,
      order: 4,
    },
    {
      id: 'telegram',
      platform: 'Telegram',
      handle: '/MentorNearbyOfficial',
      url: 'https://t.me/MentorNearbyOfficial',
      icon: 'telegram',
      color: '#229ED9',
      enabled: true,
      order: 5,
    },
    {
      id: 'whatsapp',
      platform: 'WhatsApp Channel',
      handle: 'MentorNearby',
      url: 'https://whatsapp.com/channel/0029Vb8bXCGHVvTgBlJSB43y',
      icon: 'whatsapp',
      color: '#25D366',
      enabled: true,
      order: 6,
    },
  ],
  trustSection: {
    enabled: true,
    heading: 'Trusted & Verified Platform',
    description: 'We verify tutors and ensure a safe learning environment for every student.',
    items: [
      { id: 'verified', label: 'Verified Tutors', icon: 'user-check', enabled: true },
      { id: 'safe', label: 'Safe & Secure', icon: 'shield-check', enabled: true },
      { id: 'privacy', label: '100% Privacy', icon: 'lock', enabled: true },
      { id: 'student-first', label: 'Student First', icon: 'users', enabled: true },
    ],
  },
  bottomBar: {
    copyright: `© ${new Date().getFullYear()} MentorNearby. All Rights Reserved.`,
    subtext: 'Made with ❤️ for Students & Parents',
    centerMessage: 'Your Trust, Our Priority.',
    contactButtonText: 'Need Help? Contact Us',
    contactButtonUrl: '/contact',
    enabled: true,
  },
};

// ============================================================
// 1. GET FOOTER CONFIG (PUBLIC)
// ============================================================
exports.getFooterConfig = asyncHandler(async (req, res, next) => {
  let configDoc = await AdminConfig.findOne({ key: 'MENTORNEARBY_FOOTER_CONFIG' }).lean();

  if (!configDoc || !configDoc.value) {
    configDoc = await AdminConfig.create({
      key: 'MENTORNEARBY_FOOTER_CONFIG',
      value: DEFAULT_FOOTER_CONFIG,
      description: 'MentorNearby Official Footer & Navigation Configuration',
    });
    return success(res, 'Default footer configuration loaded', { footer: DEFAULT_FOOTER_CONFIG });
  }

  // Merge any missing keys with default config safely
  const mergedFooter = {
    brand: { ...DEFAULT_FOOTER_CONFIG.brand, ...(configDoc.value.brand || {}) },
    columns: configDoc.value.columns?.length ? configDoc.value.columns : DEFAULT_FOOTER_CONFIG.columns,
    socials: configDoc.value.socials?.length ? configDoc.value.socials : DEFAULT_FOOTER_CONFIG.socials,
    trustSection: { ...DEFAULT_FOOTER_CONFIG.trustSection, ...(configDoc.value.trustSection || {}) },
    bottomBar: { ...DEFAULT_FOOTER_CONFIG.bottomBar, ...(configDoc.value.bottomBar || {}) },
  };

  return success(res, 'Footer configuration retrieved', { footer: mergedFooter });
});

// ============================================================
// 2. UPDATE FOOTER CONFIG (ADMIN)
// ============================================================
exports.updateFooterConfig = asyncHandler(async (req, res, next) => {
  const footerData = req.body;

  if (!footerData || typeof footerData !== 'object') {
    return error(res, 'Invalid footer configuration data', 400);
  }

  const updated = await AdminConfig.findOneAndUpdate(
    { key: 'MENTORNEARBY_FOOTER_CONFIG' },
    {
      value: footerData,
      updatedBy: req.user?.id,
    },
    { new: true, upsert: true }
  );

  return success(res, 'Footer configuration saved successfully', { footer: updated.value });
});

// ============================================================
// 3. GET CMS PAGE BY SLUG (PUBLIC)
// ============================================================
exports.getCmsPageBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const normalizedSlug = slug.toLowerCase().trim();

  let page = await CmsPage.findOne({ slug: normalizedSlug, published: true }).lean();

  if (!page) {
    // If standard legal/support slug, provide structured fallback
    return success(res, 'Page loaded', { page: null, slug: normalizedSlug });
  }

  return success(res, 'Page retrieved successfully', { page });
});

// ============================================================
// 4. GET ALL CMS PAGES (ADMIN)
// ============================================================
exports.getAllCmsPages = asyncHandler(async (req, res, next) => {
  const pages = await CmsPage.find({}).sort({ updatedAt: -1 }).lean();
  return success(res, 'All CMS pages retrieved', { pages });
});

// ============================================================
// 5. SAVE / UPDATE CMS PAGE (ADMIN)
// ============================================================
exports.saveCmsPage = asyncHandler(async (req, res, next) => {
  const { slug, title, category, excerpt, content, metaTitle, metaDescription, published } = req.body;

  if (!slug || !title || !content) {
    return error(res, 'Slug, title, and content are required', 400);
  }

  const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

  const page = await CmsPage.findOneAndUpdate(
    { slug: normalizedSlug },
    {
      title,
      category: category || 'LEGAL',
      excerpt: excerpt || '',
      content,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || '',
      published: published !== false,
      lastUpdatedBy: req.user?.id,
    },
    { new: true, upsert: true }
  );

  return success(res, 'CMS page saved successfully', { page });
});

// ============================================================
// 6. DELETE CMS PAGE (ADMIN)
// ============================================================
exports.deleteCmsPage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await CmsPage.findByIdAndDelete(id);
  return success(res, 'CMS page deleted successfully');
});

// ============================================================
// 7. GET FAQS (PUBLIC)
// ============================================================
exports.getFaqs = asyncHandler(async (req, res, next) => {
  const { category } = req.query;
  const filter = { published: true };
  if (category && category !== 'ALL') {
    filter.category = category.toUpperCase();
  }

  let faqs = await FaqItem.find(filter).sort({ order: 1, createdAt: 1 }).lean();

  return success(res, 'FAQs retrieved successfully', { faqs });
});

// ============================================================
// 8. CREATE FAQ (ADMIN)
// ============================================================
exports.createFaq = asyncHandler(async (req, res, next) => {
  const { question, answer, category, order, published } = req.body;

  if (!question || !answer) {
    return error(res, 'Question and answer are required', 400);
  }

  const faq = await FaqItem.create({
    question,
    answer,
    category: category || 'GENERAL',
    order: Number(order) || 0,
    published: published !== false,
  });

  return success(res, 'FAQ item created successfully', { faq });
});

// ============================================================
// 9. UPDATE FAQ (ADMIN)
// ============================================================
exports.updateFaq = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { question, answer, category, order, published } = req.body;

  const faq = await FaqItem.findByIdAndUpdate(
    id,
    { question, answer, category, order, published },
    { new: true }
  );

  if (!faq) {
    return error(res, 'FAQ not found', 404);
  }

  return success(res, 'FAQ updated successfully', { faq });
});

// ============================================================
// 10. DELETE FAQ (ADMIN)
// ============================================================
exports.deleteFaq = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await FaqItem.findByIdAndDelete(id);
  return success(res, 'FAQ deleted successfully');
});
