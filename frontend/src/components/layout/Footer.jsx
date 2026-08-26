// ============================================================
// components/layout/Footer.jsx
// MentorNearby Official Pixel-Accurate Responsive Footer Component
// Controlled Dynamically via Admin Panel / CMS API
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchFooterConfig } from '../../api/cms';
import './Footer.css';

// SVG Icon Helper Components
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const IconHeadphone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const IconUserCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <polyline points="17 11 19 13 23 9"></polyline>
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

// Social Media Icons
const IconYouTube = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  </div>
);

const IconLinkedIn = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(10, 102, 194, 0.3)' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
    </svg>
  </div>
);

const IconInstagram = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(221, 42, 123, 0.3)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  </div>
);

const IconTwitterX = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.3)' }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  </div>
);

const IconTelegram = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#229ED9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(34, 158, 217, 0.3)' }}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.61 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.79-1.63 4.58-1.91 5.1-1.92.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.04.3z"/>
    </svg>
  </div>
);

const IconWhatsApp = () => (
  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.24-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
    </svg>
  </div>
);

// Fallback Default Footer Configuration (Matching Source of Truth)
const DEFAULT_CONFIG = {
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
      enabled: true,
      links: [
        { label: 'Browse Tutors', path: '/tutors', enabled: true },
        { label: 'Find Students (For Tutors)', path: '/find-students', enabled: true },
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
      enabled: true,
    },
    {
      id: 'linkedin',
      platform: 'LinkedIn',
      handle: '/mentornearby',
      url: 'http://linkedin.com/company/mentornearby',
      icon: 'linkedin',
      enabled: true,
    },
    {
      id: 'instagram',
      platform: 'Instagram',
      handle: '@mentornearby',
      url: 'https://www.instagram.com/mentornearby?igsi=anh5bmFjaTdvc29n',
      icon: 'instagram',
      enabled: true,
    },
    {
      id: 'twitter',
      platform: 'X / Twitter',
      handle: '@mentornearby',
      url: 'https://x.com/mentornearby?s=11',
      icon: 'twitter',
      enabled: true,
    },
    {
      id: 'telegram',
      platform: 'Telegram',
      handle: '/MentorNearbyOfficial',
      url: 'https://t.me/MentorNearbyOfficial',
      icon: 'telegram',
      enabled: true,
    },
    {
      id: 'whatsapp',
      platform: 'WhatsApp Channel',
      handle: 'MentorNearby',
      url: 'https://whatsapp.com/channel/0029Vb8bXCGHVvTgBlJSB43y',
      icon: 'whatsapp',
      enabled: true,
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
    copyright: '© 2026 MentorNearby. All Rights Reserved.',
    subtext: 'Made with ❤️ for Students & Parents',
    centerMessage: 'Your Trust, Our Priority.',
    contactButtonText: 'Need Help? Contact Us',
    contactButtonUrl: '/contact',
    enabled: true,
  },
};

const Footer = () => {
  const location = useLocation();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Hidden on dedicated workspace viewports
  const isExcludedRoute =
    location.pathname === '/dashboard' ||
    location.pathname === '/tutor/dashboard' ||
    location.pathname === '/tutor/profile/edit' ||
    location.pathname.startsWith('/courses/watch/');

  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const res = await fetchFooterConfig();
        if (isMounted && res.data?.footer) {
          setConfig(res.data.footer);
        }
      } catch (_) {
        // Safe fallback to DEFAULT_CONFIG
      }
    };
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isExcludedRoute) {
    return null;
  }

  const renderColumnIcon = (iconName) => {
    switch (iconName) {
      case 'user':
        return <IconUser />;
      case 'book':
        return <IconBook />;
      case 'headphone':
        return <IconHeadphone />;
      case 'shield':
      default:
        return <IconShield />;
    }
  };

  const renderSocialIcon = (iconType) => {
    switch (iconType?.toLowerCase()) {
      case 'youtube':
        return <IconYouTube />;
      case 'linkedin':
        return <IconLinkedIn />;
      case 'instagram':
        return <IconInstagram />;
      case 'twitter':
      case 'x':
        return <IconTwitterX />;
      case 'telegram':
        return <IconTelegram />;
      case 'whatsapp':
        return <IconWhatsApp />;
      default:
        return <IconShield />;
    }
  };

  const renderTrustIcon = (iconName) => {
    switch (iconName) {
      case 'user-check':
        return <IconUserCheck />;
      case 'shield-check':
        return <IconShield />;
      case 'lock':
        return <IconLock />;
      case 'users':
      default:
        return <IconUsers />;
    }
  };

  const brand = config.brand || DEFAULT_CONFIG.brand;
  const columns = (config.columns || DEFAULT_CONFIG.columns).filter((c) => c.enabled !== false);
  const socials = (config.socials || DEFAULT_CONFIG.socials).filter((s) => s.enabled !== false);
  const trust = config.trustSection || DEFAULT_CONFIG.trustSection;
  const bottomBar = config.bottomBar || DEFAULT_CONFIG.bottomBar;

  return (
    <footer className="mn-footer-root">
      <div className="mn-footer-container">
        {/* ============================================================ */}
        {/* 1. TOP SECTION: BRAND + 4 NAVIGATION COLUMNS                 */}
        {/* ============================================================ */}
        <div className="mn-footer-main-grid">
          {/* Brand Column */}
          <div className="mn-footer-brand-col">
            <Link to="/" className="mn-footer-brand-logo-wrap">
              <img
                src={brand.logoUrl || '/logo.png'}
                alt="MentorNearby Logo"
                className="mn-footer-brand-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="mn-footer-brand-title">
                <span className="mn-footer-brand-title-navy">Mentor</span>
                <span className="mn-footer-brand-title-red">Nearby</span>
              </div>
              <span className="mn-footer-brand-tagline">
                {brand.tagline || 'Find. Learn. Grow.'}
              </span>
            </Link>
            <p className="mn-footer-brand-desc">
              {brand.description ||
                'MentorNearby connects students with trusted tutors nearby. Find the right mentor for your bright future.'}
            </p>
          </div>

          {/* 4 Navigation Columns */}
          {columns.map((col) => (
            <div key={col.id || col.title} className="mn-footer-col">
              <div className="mn-footer-col-header">
                <div className="mn-footer-col-icon">
                  {renderColumnIcon(col.icon)}
                </div>
                <h4 className="mn-footer-col-title">{col.title}</h4>
              </div>
              <ul className="mn-footer-link-list">
                {col.links
                  ?.filter((l) => l.enabled !== false)
                  .map((link, idx) => (
                    <li key={idx}>
                      <Link to={link.path || '/'} className="mn-footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* 2. CONNECT WITH US (SOCIAL MEDIA ROW)                        */}
        {/* ============================================================ */}
        <div className="mn-footer-social-wrapper">
          <div className="mn-footer-divider-title">
            <div className="mn-footer-divider-line left"></div>
            <span className="mn-footer-divider-text">Connect With Us</span>
            <div className="mn-footer-divider-line right"></div>
          </div>

          <div className="mn-footer-social-grid">
            {socials.map((social) => (
              <a
                key={social.id || social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mn-footer-social-card"
                title={`${social.platform}: ${social.handle}`}
              >
                {renderSocialIcon(social.icon || social.platform)}
                <div className="mn-footer-social-info">
                  <span className="mn-footer-social-platform">{social.platform}</span>
                  <span
                    className="mn-footer-social-handle"
                    style={{
                      color:
                        social.platform === 'YouTube'
                          ? '#EF4444'
                          : social.platform === 'Instagram'
                          ? '#E11D48'
                          : '#475569',
                    }}
                  >
                    {social.handle}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. TRUSTED & VERIFIED PLATFORM BANNER                        */}
        {/* ============================================================ */}
        {trust.enabled !== false && (
          <div className="mn-footer-trust-banner">
            <div className="mn-footer-trust-left">
              <div className="mn-footer-trust-shield-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h4 className="mn-footer-trust-heading">{trust.heading}</h4>
                <p className="mn-footer-trust-desc">{trust.description}</p>
              </div>
            </div>

            <div className="mn-footer-trust-items-grid">
              {trust.items
                ?.filter((item) => item.enabled !== false)
                .map((item) => (
                  <div key={item.id || item.label} className="mn-footer-trust-item">
                    <div className="mn-footer-trust-item-icon">
                      {renderTrustIcon(item.icon)}
                    </div>
                    <span className="mn-footer-trust-item-label">{item.label}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. BOTTOM NAVIGATION BAR (DARK NAVY)                         */}
      {/* ============================================================ */}
      {bottomBar.enabled !== false && (
        <div className="mn-footer-bottom-bar">
          <div className="mn-footer-container">
            <div className="mn-footer-bottom-content">
              {/* Left: Copyright & Subtext */}
              <div className="mn-footer-bottom-left">
                <p className="mn-footer-copyright">{bottomBar.copyright}</p>
                <p className="mn-footer-subtext">{bottomBar.subtext}</p>
              </div>

              {/* Center: Shield badge + Motto */}
              <div className="mn-footer-bottom-center">
                <div className="mn-footer-shield-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </div>
                <span className="mn-footer-center-message">{bottomBar.centerMessage}</span>
              </div>

              {/* Right: Contact Us Action Button */}
              <div>
                <Link to={bottomBar.contactButtonUrl || '/contact'} className="mn-footer-contact-btn">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                  </svg>
                  <span>{bottomBar.contactButtonText}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
