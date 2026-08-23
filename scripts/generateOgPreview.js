const sharp = require('sharp');
const path = require('path');

const svgCard = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FFFDF9"/>
      <stop offset="100%" stop-color="#FFF3E0"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6A00"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative subtle shapes -->
  <circle cx="1100" cy="120" r="240" fill="#FFEDD5" opacity="0.45"/>
  <circle cx="100" cy="550" r="180" fill="#EDE9FE" opacity="0.5"/>
  <circle cx="980" cy="520" r="120" fill="#DCFCE7" opacity="0.4"/>

  <!-- Outer Card Frame with Shadow -->
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#FFFFFF" stroke="#FED7AA" stroke-width="2" filter="url(#shadow)"/>

  <!-- Header: Logo & Tagline -->
  <g transform="translate(96, 110)">
    <!-- Logo Graduation Cap Icon -->
    <rect x="0" y="-40" width="54" height="54" rx="14" fill="url(#orangeGrad)"/>
    <path d="M27 -26L42 -19L27 -12L12 -19L27 -26Z" fill="#FFFFFF"/>
    <path d="M19 -14C19 -6 35 -6 35 -14" fill="#FFFFFF"/>
    <path d="M38 -17L40 -8" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="40" cy="-7" r="2" fill="#FEF08A"/>

    <!-- Brand Text -->
    <text x="70" y="-8" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" fill="#0F172A" letter-spacing="-0.02em">Mentor<tspan fill="#FF6A00">Nearby</tspan></text>
    <text x="72" y="14" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#64748B" letter-spacing="0.05em">FIND. LEARN. GROW.</text>
  </g>

  <!-- Main Headline -->
  <text x="96" y="240" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900" fill="#0F172A" letter-spacing="-0.03em">
    Find Trusted Tutors Near You
  </text>

  <!-- Subtitle Paragraph -->
  <text x="96" y="295" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500" fill="#475569">
    Connect with 100% KYC verified home &amp; online mentors for Classes 9–12,
  </text>
  <text x="96" y="330" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500" fill="#475569">
    CBSE, ICSE, NCERT Books, and Board Exam preparation across India.
  </text>

  <!-- Value Props Badges Grid -->
  <g transform="translate(96, 385)">
    <!-- Badge 1 -->
    <rect x="0" y="0" width="210" height="50" rx="12" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1.5"/>
    <text x="20" y="31" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#059669">🛡️ 100% KYC Verified</text>

    <!-- Badge 2 -->
    <rect x="226" y="0" width="210" height="50" rx="12" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1.5"/>
    <text x="246" y="31" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#D97706">⭐ 4.9/5 Parent Rating</text>

    <!-- Badge 3 -->
    <rect x="452" y="0" width="240" height="50" rx="12" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.5"/>
    <text x="472" y="31" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#2563EB">📚 NCERT Books &amp; Notes</text>

    <!-- Badge 4 -->
    <rect x="708" y="0" width="220" height="50" rx="12" fill="#F5F3FF" stroke="#DDD6FE" stroke-width="1.5"/>
    <text x="728" y="31" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#7C3AED">🔒 Secure Direct Contact</text>
  </g>

  <!-- Bottom Bar: Live Website URL & Verified Platform Seal -->
  <g transform="translate(96, 515)">
    <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#94A3B8">Official Platform</text>
    <rect x="140" y="-22" width="220" height="34" rx="17" fill="url(#orangeGrad)"/>
    <text x="250" y="1" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">mentornearby.com →</text>
  </g>

  <g transform="translate(1052, 515)">
    <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" fill="#059669" text-anchor="end">✓ Verified Educational Marketplace</text>
  </g>
</svg>
`;

const publicDir = path.resolve(__dirname, '../frontend/public');
const jpgPath = path.join(publicDir, 'og-preview.jpg');
const pngPath = path.join(publicDir, 'og-preview.png');

sharp(Buffer.from(svgCard))
  .jpeg({ quality: 95 })
  .toFile(jpgPath)
  .then(() => {
    console.log('✅ Generated og-preview.jpg (1200x630)');
    return sharp(Buffer.from(svgCard)).png().toFile(pngPath);
  })
  .then(() => {
    console.log('✅ Generated og-preview.png (1200x630)');
  })
  .catch(err => {
    console.error('Error creating OG image:', err);
  });
