// ============================================================
// components/home/AppPromotionSection.jsx
// ProfessorVirus — Mobile App Promotion Section
// Matching Reference Image 2 with dual realistic iPhone mockups
// Left: Copy, Feature rows, Store buttons
// Right: Home Screen & Explore Screen mobile mockups
// ============================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const APP_FEATURES = [
  {
    title: 'Discover tutors and connect with students.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
  },
  {
    title: 'Access study materials and learning resources anytime.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
        <path d="M6 6h10"></path>
        <path d="M6 10h10"></path>
      </svg>
    ),
  },
  {
    title: 'Stay connected with notifications and messaging.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    ),
  },
];

const AppPromotionSection = () => {
  const [showInstallTip, setShowInstallTip] = useState(false);

  const handleStoreClick = (e) => {
    e.preventDefault();
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then(() => {
        window.deferredPrompt = null;
      });
    } else {
      setShowInstallTip(true);
      setTimeout(() => setShowInstallTip(false), 5000);
    }
  };

  return (
    <section className="mn-app-promotion-section" aria-label="The ProfessorVirus App">
      <div className="mn-container">
        <div className="mn-app-promo-grid">
          {/* ============================================================ */}
          {/* LEFT SIDE: Heading, Features, Store Download Buttons        */}
          {/* ============================================================ */}
          <div className="mn-app-promo-left">
            {/* Small Pill Eyebrow */}
            <div className="mn-app-eyebrow-pill">
              <span className="mn-app-phone-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
              </span>
              <span>THE PROFESSORVIRUS APP</span>
            </div>

            {/* Main Heading with Highlight and Curved Underline */}
            <h2 className="mn-app-main-heading">
              Learn Smarter. Grow<br />
              <span className="mn-app-orange-word">
                Faster. Anywhere.
                {/* Curved Orange Underline Brush */}
                <svg className="mn-app-brush-underline" viewBox="0 0 260 20" fill="none" aria-hidden="true">
                  <path d="M 5 14 C 70 4, 190 4, 255 12" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>

            {/* Subtitle Description */}
            <p className="mn-app-lead-desc">
              Find verified tutors, connect with students, and manage your learning — all in one app.
            </p>

            {/* 3 Feature Rows */}
            <div className="mn-app-features-list">
              {APP_FEATURES.map((feat, idx) => (
                <div key={idx} className="mn-app-feature-item">
                  <div className="mn-app-feat-icon-box">
                    {feat.icon}
                  </div>
                  <span className="mn-app-feat-title">{feat.title}</span>
                </div>
              ))}
            </div>

            {/* Store Badges Row */}
            <div className="mn-app-store-badges-row">
              {/* Apple App Store */}
              <button
                type="button"
                className="mn-app-store-btn"
                onClick={handleStoreClick}
                aria-label="Download on the App Store"
              >
                <div className="mn-store-icon-wrap">
                  <svg width="22" height="26" viewBox="0 0 170 170" fill="currentColor">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.95-12.04-14.61-6.19-9.52-11.1-20.2-14.75-32.06-3.65-11.86-5.48-23.1-5.48-33.72 0-14.54 3.65-26.47 10.96-35.8 7.31-9.33 16.5-14.07 27.56-14.22 5.07 0 10.83 1.34 17.27 4.02 6.44 2.68 10.15 4.08 11.13 4.2 1.63-.33 5.76-1.89 12.38-4.68 6.63-2.79 12.38-4.08 17.27-3.87 12.71.74 22.78 5.66 30.2 14.77-11.07 6.69-16.49 15.82-16.27 27.38.22 9.07 3.75 16.71 10.59 22.92 6.84 6.21 15.01 9.77 24.52 10.67-2.17 6.49-4.89 13.06-8.15 19.72zM119.22 33.64c0-7.39 2.66-14.23 7.98-20.52 5.32-6.29 11.84-10.22 19.56-11.78.33 1.09.49 2.18.49 3.28 0 7.39-2.77 14.34-8.31 20.85-5.54 6.51-12.3 10.37-20.28 11.58-.22-1.09-.44-2.22-.44-3.41z"/>
                  </svg>
                </div>
                <div className="mn-store-text-col">
                  <span className="mn-store-label">Download on the</span>
                  <span className="mn-store-brand">App Store</span>
                </div>
              </button>

              {/* Google Play Store */}
              <button
                type="button"
                className="mn-app-store-btn"
                onClick={handleStoreClick}
                aria-label="Get it on Google Play"
              >
                <div className="mn-store-icon-wrap">
                  <svg width="22" height="24" viewBox="0 0 512 512" fill="none">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9.0-.2z" fill="#00E676"/>
                    <path d="M47 36.3L275.5 264 47 491.7V36.3z" fill="#00B0FF"/>
                    <path d="M385.4 337.8L104.6 499l220.7-221.3 60.1 60.1z" fill="#FF3D00"/>
                    <path d="M479.2 240.8L385.4 187l-60.1 60 60.1 60 93.8-53.8c16.8-9.7 16.8-22.7 0-32.4z" fill="#FFC400"/>
                  </svg>
                </div>
                <div className="mn-store-text-col">
                  <span className="mn-store-label">GET IT ON</span>
                  <span className="mn-store-brand">Google Play</span>
                </div>
              </button>
            </div>

            {/* PWA / App Store Guidance Tooltip */}
            {showInstallTip && (
              <div className="mn-app-install-tip">
                <span>💡 <strong>Tip:</strong> Tap <strong>"Share &amp; App PWA"</strong> on mobile or your browser menu to install the ProfessorVirus app directly to your home screen!</span>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: TWO REALISTIC SMARTPHONE MOCKUPS                */}
          {/* ============================================================ */}
          <div className="mn-app-promo-right" aria-label="ProfessorVirus Mobile App Interface">
            <div className="mn-phone-mockups-stage">
              {/* Decorative Top-Left and Top-Right Sparkles */}
              <div className="mn-mockup-sparkle mn-sparkle-left" aria-hidden="true">
                <svg width="45" height="35" viewBox="0 0 45 35" fill="none">
                  <line x1="12" y1="30" x2="4" y2="18" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                  <line x1="26" y1="30" x2="26" y2="12" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                  <line x1="38" y1="30" x2="44" y2="18" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <div className="mn-mockup-sparkle mn-sparkle-right" aria-hidden="true">
                <svg width="45" height="35" viewBox="0 0 45 35" fill="none">
                  <line x1="8" y1="30" x2="2" y2="18" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                  <line x1="20" y1="30" x2="20" y2="12" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                  <line x1="34" y1="30" x2="42" y2="18" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              {/* Decorative Background Ambient Glow */}
              <div className="mn-phone-ambient-glow" aria-hidden="true"></div>

              {/* -------------------------------------------------------- */}
              {/* PHONE 1: FRONT (Showing Upper Mobile Homepage)           */}
              {/* -------------------------------------------------------- */}
              <div className="mn-phone-frame mn-phone-front" aria-label="ProfessorVirus App Home Screen">
                {/* Dynamic Island Pill */}
                <div className="mn-phone-notch" aria-hidden="true">
                  <div className="mn-phone-camera"></div>
                </div>

                {/* Status Bar */}
                <div className="mn-phone-status-bar" aria-hidden="true">
                  <span className="mn-status-time">10:38</span>
                  <div className="mn-status-icons">
                    <svg width="12" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
                    </svg>
                    <svg width="13" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z"/>
                    </svg>
                    <span className="mn-status-battery">73%</span>
                  </div>
                </div>

                {/* Inside Phone Screen (Genuine Mobile Home UI) */}
                <div className="mn-phone-screen-content">
                  {/* Phone Header */}
                  <div className="mn-ps-header">
                    <div className="mn-ps-logo-wrap">
                      {/* Stacked books with graduation cap icon */}
                      <span className="mn-ps-logo-cap" style={{ fontSize: 16 }}>📚</span>
                      <div className="mn-ps-logo-text">
                        <span className="mn-ps-logo-name">
                          Professor<span style={{ color: '#E11D48' }}>Virus</span>
                        </span>
                        <span className="mn-ps-logo-tag">FIND. LEARN. GROW.</span>
                      </div>
                    </div>
                    <div className="mn-ps-header-actions">
                      <span className="mn-ps-header-icon">☀️</span>
                      <span className="mn-ps-header-icon mn-ps-bell">
                        🔔<span className="mn-ps-bell-dot">1</span>
                      </span>
                      <span className="mn-ps-header-icon">☰</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mn-ps-search-bar">
                    <span className="mn-ps-search-icon">🔍</span>
                    <span className="mn-ps-search-placeholder">Search for subjects, classes or tutors...</span>
                    <span className="mn-ps-filter-icon">⚙️</span>
                  </div>

                  {/* 3 Quick Action Cards */}
                  <div className="mn-ps-action-cards-row">
                    <div className="mn-ps-action-card">
                      <div className="mn-ps-card-avatar mn-avatar-pink">
                        <img src="/images/home/card-find-tutor-art.png" alt="Find a Tutor" onError={(e) => { e.target.style.display='none'; }} />
                        <span className="mn-ps-fallback-emoji">👩‍🎓</span>
                      </div>
                      <div className="mn-ps-card-title">Find a Tutor</div>
                      <div className="mn-ps-card-sub">Get the best tutors near you</div>
                      <div className="mn-ps-card-btn mn-btn-coral">›</div>
                    </div>

                    <div className="mn-ps-action-card">
                      <div className="mn-ps-card-avatar mn-avatar-gold">
                        <img src="/images/home/card-become-tutor-art.png" alt="Become a Tutor" onError={(e) => { e.target.style.display='none'; }} />
                        <span className="mn-ps-fallback-emoji">👨‍🏫</span>
                      </div>
                      <div className="mn-ps-card-title">Become a Tutor</div>
                      <div className="mn-ps-card-sub">Share knowledge earn &amp; grow</div>
                      <div className="mn-ps-card-btn mn-btn-green">›</div>
                    </div>

                    <div className="mn-ps-action-card">
                      <div className="mn-ps-card-avatar mn-avatar-blue">
                        <img src="/images/home/card-find-students-art.png" alt="Find Students" onError={(e) => { e.target.style.display='none'; }} />
                        <span className="mn-ps-fallback-emoji">👨‍👩‍👧</span>
                      </div>
                      <div className="mn-ps-card-title">Find Students</div>
                      <div className="mn-ps-card-sub">Get more students for classes</div>
                      <div className="mn-ps-card-btn mn-btn-green">›</div>
                    </div>
                  </div>

                  {/* Promotional Carousel Card */}
                  <div className="mn-ps-promo-banner">
                    <div className="mn-ps-promo-info">
                      <div className="mn-ps-promo-title">Learn Smarter with <span className="mn-text-coral">Verified Tutors</span></div>
                      <div className="mn-ps-promo-sub">Personalized learning. Real results. Online or Offline.</div>
                      <div className="mn-ps-promo-cta">Explore Tutors →</div>
                    </div>
                    <div className="mn-ps-promo-img-wrap">
                      <img src="/images/home/banner-student-girl.png" alt="Student" onError={(e) => { e.target.src='/images/home/hero-mentor-student.png'; }} />
                    </div>
                    <div className="mn-ps-promo-dots">
                      <span className="mn-ps-dot active"></span>
                      <span className="mn-ps-dot"></span>
                      <span className="mn-ps-dot"></span>
                      <span className="mn-ps-dot"></span>
                    </div>
                  </div>

                  {/* Platform Stats Row */}
                  <div className="mn-ps-stats-strip">
                    <div className="mn-ps-stat-item">
                      <div className="mn-ps-stat-icon mn-stat-coral">👥</div>
                      <div className="mn-ps-stat-num">12+</div>
                      <div className="mn-ps-stat-lbl">Happy Students</div>
                    </div>
                    <div className="mn-ps-stat-item">
                      <div className="mn-ps-stat-icon mn-stat-green">🛡️</div>
                      <div className="mn-ps-stat-num">100%</div>
                      <div className="mn-ps-stat-lbl">Verified Tutors</div>
                    </div>
                    <div className="mn-ps-stat-item">
                      <div className="mn-ps-stat-icon mn-stat-amber">⭐</div>
                      <div className="mn-ps-stat-num">4.1/5</div>
                      <div className="mn-ps-stat-lbl">Average Rating</div>
                    </div>
                    <div className="mn-ps-stat-item">
                      <div className="mn-ps-stat-icon mn-stat-purple">📍</div>
                      <div className="mn-ps-stat-num">7+</div>
                      <div className="mn-ps-stat-lbl">Nearby Tutors</div>
                    </div>
                  </div>

                  {/* Featured Tutors Header Preview */}
                  <div className="mn-ps-section-head">
                    <span className="mn-ps-sec-title">Featured Tutors</span>
                    <span className="mn-ps-sec-link">View All &gt;</span>
                  </div>

                  {/* Floating PWA Install Pill */}
                  <div className="mn-ps-floating-pwa">
                    <span>✨ Share &amp; App <strong className="mn-pwa-badge">PWA</strong></span>
                  </div>
                </div>

                {/* Bottom App Navigation (Home Active) */}
                <div className="mn-phone-bottom-nav" aria-hidden="true">
                  <div className="mn-pnav-item active">
                    <span className="mn-pnav-icon">🏠</span>
                    <span className="mn-pnav-label">Home</span>
                  </div>
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">🔍</span>
                    <span className="mn-pnav-label">Explore</span>
                  </div>
                  <div className="mn-pnav-item mn-pnav-post">
                    <div className="mn-pnav-plus-circle">+</div>
                    <span className="mn-pnav-label">Post/Ask</span>
                  </div>
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">💬</span>
                    <span className="mn-pnav-label">Messages</span>
                  </div>
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">👤</span>
                    <span className="mn-pnav-label">Profile</span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* PHONE 2: BACK / RIGHT (Showing Explore Screen)           */}
              {/* -------------------------------------------------------- */}
              <div className="mn-phone-frame mn-phone-back" aria-label="ProfessorVirus App Explore Screen">
                {/* Dynamic Island Pill */}
                <div className="mn-phone-notch" aria-hidden="true">
                  <div className="mn-phone-camera"></div>
                </div>

                {/* Status Bar */}
                <div className="mn-phone-status-bar" aria-hidden="true">
                  <span className="mn-status-time">10:38</span>
                  <div className="mn-status-icons">
                    <svg width="12" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
                    </svg>
                    <span className="mn-status-battery">73%</span>
                  </div>
                </div>

                {/* Inside Phone Screen (Explore Screen Content) */}
                <div className="mn-phone-screen-content">
                  {/* Featured Tutors Header */}
                  <div className="mn-ps-section-head">
                    <span className="mn-ps-sec-title">Featured Tutors</span>
                    <span className="mn-ps-sec-link">View All &gt;</span>
                  </div>

                  {/* 2 Real Tutor Cards in Row */}
                  <div className="mn-ps-tutors-row">
                    {/* Tutor 1: Rajender kumar */}
                    <div className="mn-ps-tutor-mini-card">
                      <div className="mn-ps-tutor-avatar-wrap">
                        <div className="mn-ps-tutor-avatar-circle mn-bg-avatar-1">👨‍🏫</div>
                        <span className="mn-ps-verified-pill-dot" title="Verified">✓</span>
                      </div>
                      <div className="mn-ps-tutor-name">Rajender kumar</div>
                      <div className="mn-ps-tutor-sub">English • Class 1-12</div>
                      <div className="mn-ps-tutor-loc">📍 Hapur</div>
                      <div className="mn-ps-tutor-tags">
                        <span className="mn-tag-online">Online</span>
                        <span className="mn-tag-offline">Offline</span>
                      </div>
                      <div className="mn-ps-tutor-btn">View Profile →</div>
                    </div>

                    {/* Tutor 2: Priyanshu Kumar */}
                    <div className="mn-ps-tutor-mini-card">
                      <div className="mn-ps-tutor-avatar-wrap">
                        <div className="mn-ps-tutor-avatar-circle mn-bg-avatar-2">🧑‍💻</div>
                        <span className="mn-ps-verified-pill-dot" title="Verified">✓</span>
                      </div>
                      <div className="mn-ps-tutor-name">Priyanshu Kumar</div>
                      <div className="mn-ps-tutor-sub">Mathematics, Physics • Cl...</div>
                      <div className="mn-ps-tutor-loc">📍 HAPUR &amp; Ghaziabad</div>
                      <div className="mn-ps-tutor-tags">
                        <span className="mn-tag-online">Online</span>
                        <span className="mn-tag-offline">Offline</span>
                      </div>
                      <div className="mn-ps-tutor-btn">View Profile →</div>
                    </div>
                  </div>

                  {/* Popular Subjects */}
                  <div className="mn-ps-section-head">
                    <span className="mn-ps-sec-title">Popular Subjects</span>
                    <span className="mn-ps-sec-link">View All</span>
                  </div>

                  <div className="mn-ps-subjects-chips-row">
                    <div className="mn-ps-sub-chip mn-chip-blue">
                      <span className="mn-chip-icon">π</span>
                      <span className="mn-chip-txt">Mathematics</span>
                    </div>
                    <div className="mn-ps-sub-chip mn-chip-red">
                      <span className="mn-chip-icon">⚛️</span>
                      <span className="mn-chip-txt">Physics</span>
                    </div>
                    <div className="mn-ps-sub-chip mn-chip-green">
                      <span className="mn-chip-icon">🧪</span>
                      <span className="mn-chip-txt">Chemistry</span>
                    </div>
                    <div className="mn-ps-sub-chip mn-chip-purple">
                      <span className="mn-chip-icon">🧬</span>
                      <span className="mn-chip-txt">Biology</span>
                    </div>
                    <div className="mn-ps-sub-chip mn-chip-amber">
                      <span className="mn-chip-icon">📖</span>
                      <span className="mn-chip-txt">English</span>
                    </div>
                  </div>

                  {/* Free Study Materials */}
                  <div className="mn-ps-section-head">
                    <span className="mn-ps-sec-title">Free Study Materials</span>
                    <span className="mn-ps-sec-link">Explore All</span>
                  </div>

                  <div className="mn-ps-study-cards-col">
                    <div className="mn-ps-study-item">
                      <span className="mn-study-icon mn-bg-blue">📘</span>
                      <div className="mn-study-meta">
                        <div className="mn-study-name">NCERT Book...</div>
                        <div className="mn-study-desc">Class 1 to 12</div>
                      </div>
                      <span className="mn-study-arrow">›</span>
                    </div>
                    <div className="mn-ps-study-item">
                      <span className="mn-study-icon mn-bg-green">📑</span>
                      <div className="mn-study-meta">
                        <div className="mn-study-name">Revision Not...</div>
                        <div className="mn-study-desc">Chapter-wise</div>
                      </div>
                      <span className="mn-study-arrow">›</span>
                    </div>
                  </div>

                  {/* Frequently Asked Questions Preview with ProfessorVirus */}
                  <div className="mn-ps-section-head">
                    <span className="mn-ps-sec-title">Frequently Asked Questions</span>
                  </div>
                  <div className="mn-ps-faq-mini-item">
                    <span>How does ProfessorVirus verify tutors?</span>
                    <span className="mn-faq-plus">+</span>
                  </div>

                  {/* Floating PWA Install Pill */}
                  <div className="mn-ps-floating-pwa">
                    <span>✨ Share &amp; App <strong className="mn-pwa-badge">PWA</strong></span>
                  </div>
                </div>

                {/* Bottom App Navigation (Explore Active) */}
                <div className="mn-phone-bottom-nav" aria-hidden="true">
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">🏠</span>
                    <span className="mn-pnav-label">Home</span>
                  </div>
                  <div className="mn-pnav-item active">
                    <span className="mn-pnav-icon">🔍</span>
                    <span className="mn-pnav-label">Explore</span>
                  </div>
                  <div className="mn-pnav-item mn-pnav-post">
                    <div className="mn-pnav-plus-circle">+</div>
                    <span className="mn-pnav-label">Post/Ask</span>
                  </div>
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">💬</span>
                    <span className="mn-pnav-label">Messages</span>
                  </div>
                  <div className="mn-pnav-item">
                    <span className="mn-pnav-icon">👤</span>
                    <span className="mn-pnav-label">Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPromotionSection;
