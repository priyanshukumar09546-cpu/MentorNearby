// ============================================================
// components/home/AppPromotionSection.jsx
// MentorNearby — Mobile App Showcase Section
// Matching Reference Image Composition with Triple Real iPhone Mockups:
// 1. Left Phone (Offset Back): Real Find Tutors Screen
// 2. Center Phone (Front & Center): Real Mobile Home Screen
// 3. Right Phone (Offset Back): Real Study Resources Screen
// ============================================================

import React, { useState } from 'react';

const APP_FEATURES = [
  {
    title: 'Discover verified tutors and students.',
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
    <section className="mn-app-promotion-section" aria-label="The MentorNearby App">
      {/* Decorative Top-Left Burgundy & Golden Wave */}
      <svg className="mn-app-corner-wave mn-corner-top-left" viewBox="0 0 320 220" fill="none" aria-hidden="true">
        <path d="M -40 -40 L 220 -40 C 180 40, 140 120, 60 180 C 20 210, -40 220, -40 220 Z" fill="#6B0F24" />
        <path d="M -40 -20 C 170 30, 130 130, 50 195" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9" />
      </svg>

      {/* Decorative Bottom-Right Burgundy & Golden Wave */}
      <svg className="mn-app-corner-wave mn-corner-bottom-right" viewBox="0 0 320 220" fill="none" aria-hidden="true">
        <path d="M 360 260 L 100 260 C 140 180, 180 100, 260 40 C 300 10, 360 0, 360 0 Z" fill="#6B0F24" />
        <path d="M 360 240 C 150 190, 190 90, 270 25" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9" />
      </svg>

      {/* Decorative Bottom-Left Golden Accent Wave */}
      <svg className="mn-app-corner-wave mn-corner-bottom-left" viewBox="0 0 280 140" fill="none" aria-hidden="true">
        <path d="M -20 140 C 60 120, 160 90, 260 130" stroke="#F59E0B" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M -20 150 C 50 105, 130 80, 220 145" stroke="#FBBF24" strokeWidth="1.5" fill="none" opacity="0.45" />
      </svg>

      {/* Decorative Top-Right Golden Accent Arc */}
      <svg className="mn-app-corner-wave mn-corner-top-right" viewBox="0 0 220 120" fill="none" aria-hidden="true">
        <path d="M 240 -20 C 170 20, 110 70, 50 110" stroke="#F59E0B" strokeWidth="2.5" fill="none" opacity="0.6" />
      </svg>

      <div className="mn-container">
        <div className="mn-app-promo-grid">
          {/* ============================================================ */}
          {/* LEFT SIDE: Heading, Features, Store Download Buttons        */}
          {/* ============================================================ */}
          <div className="mn-app-promo-left">
            {/* Brand Logo matching Reference */}
            <div className="mn-app-brand-badge">
              <img
                src="/logo.png"
                alt="MentorNearby Logo"
                className="mn-app-brand-logo-img"
              />
              <div className="mn-app-brand-text">
                <span className="mn-app-brand-title">MentorNearby</span>
                <span className="mn-app-brand-subtitle">FIND. LEARN. GROW.</span>
              </div>
            </div>

            {/* Small Pill Eyebrow */}
            <div className="mn-app-eyebrow-pill">
              <span className="mn-app-phone-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
              </span>
              <span>The MentorNearby App</span>
            </div>

            {/* Main Heading with Highlight and Curved Underline */}
            <h2 className="mn-app-main-heading">
              Learn Smarter. Grow<br />
              <span className="mn-app-orange-word">
                Faster.
                {/* Curved Orange Underline Brush */}
                <svg className="mn-app-brush-underline" viewBox="0 0 160 16" fill="none" aria-hidden="true">
                  <path d="M 4 11 C 45 4, 115 4, 156 11" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>{' '}
              <span className="mn-app-heading-dark">Anywhere.</span>
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
                <span>💡 <strong>Tip:</strong> Tap <strong>"Share &amp; App PWA"</strong> on mobile or your browser menu to install the MentorNearby app directly to your home screen!</span>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDE: THREE OVERLAPPING REALISTIC IPHONE MOCKUPS      */}
          {/* Featuring Genuine Production MentorNearby Screenshots        */}
          {/* ============================================================ */}
          <div className="mn-app-promo-right" aria-label="MentorNearby Real Mobile Application Interface">
            <div className="mn-phone-mockups-stage-3">
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
              {/* PHONE 1: LEFT PHONE (Actual Find Tutors Screen)           */}
              {/* -------------------------------------------------------- */}
              <div className="mn-phone-3d-frame mn-phone-pos-left" aria-label="MentorNearby Find Tutors Mobile Screen">
                <div className="mn-phone-inner-screen">
                  {/* Dedicated iOS Status Bar with Dynamic Island */}
                  <div className="mn-phone-status-bar-ios" aria-hidden="true">
                    <span className="mn-status-time">10:38</span>
                    <div className="mn-phone-island-pill">
                      <div className="mn-phone-island-cam"></div>
                    </div>
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

                  {/* Genuine Application Screenshot */}
                  <div className="mn-phone-screenshot-wrap">
                    <picture>
                      <source srcSet="/images/app-mockups/screen-find-tutors.webp" type="image/webp" />
                      <img
                        src="/images/app-mockups/screen-find-tutors.png"
                        alt="Actual MentorNearby Find Tutors Page"
                        className="mn-phone-screenshot-img"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* PHONE 2: CENTER PHONE (Actual Student Home Screen)       */}
              {/* -------------------------------------------------------- */}
              <div className="mn-phone-3d-frame mn-phone-pos-center" aria-label="MentorNearby Mobile Home Screen">
                <div className="mn-phone-inner-screen">
                  {/* Dedicated iOS Status Bar with Dynamic Island */}
                  <div className="mn-phone-status-bar-ios" aria-hidden="true">
                    <span className="mn-status-time">10:38</span>
                    <div className="mn-phone-island-pill">
                      <div className="mn-phone-island-cam"></div>
                    </div>
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

                  {/* Genuine Application Screenshot */}
                  <div className="mn-phone-screenshot-wrap">
                    <picture>
                      <source srcSet="/images/app-mockups/screen-mobile-home.webp" type="image/webp" />
                      <img
                        src="/images/app-mockups/screen-mobile-home.png"
                        alt="Actual MentorNearby Mobile Home Dashboard"
                        className="mn-phone-screenshot-img"
                        loading="eager"
                      />
                    </picture>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* PHONE 3: RIGHT PHONE (Actual Study Resources Screen)     */}
              {/* -------------------------------------------------------- */}
              <div className="mn-phone-3d-frame mn-phone-pos-right" aria-label="MentorNearby Study Resources Screen">
                <div className="mn-phone-inner-screen">
                  {/* Dedicated iOS Status Bar with Dynamic Island */}
                  <div className="mn-phone-status-bar-ios" aria-hidden="true">
                    <span className="mn-status-time">10:38</span>
                    <div className="mn-phone-island-pill">
                      <div className="mn-phone-island-cam"></div>
                    </div>
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

                  {/* Genuine Application Screenshot */}
                  <div className="mn-phone-screenshot-wrap">
                    <picture>
                      <source srcSet="/images/app-mockups/screen-study-resources.webp" type="image/webp" />
                      <img
                        src="/images/app-mockups/screen-study-resources.png"
                        alt="Actual MentorNearby Study Resources Page"
                        className="mn-phone-screenshot-img"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                </div>
              </div>

              {/* Realistic Ground Floor Shadow */}
              <div className="mn-phone-floor-shadow" aria-hidden="true"></div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPromotionSection;
