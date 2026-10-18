// ============================================================
// components/common/MobileShareInstallWidget.jsx
// MentorNearby Mobile Responsive Floating Share & Add to Home Screen Widget
// Fully handles Android BeforeInstallPrompt + iOS Safari Add-to-Home Screen Sheet
// Native Safe Area Compliant, Zero Layout Shifts, Dismissible
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import './MobileShareInstallWidget.css';

const CANONICAL_URL = 'https://mentornearby.com';
const SHARE_TITLE = 'MentorNearby — Find Nearby Tutors';
const SHARE_TEXT = 'Discover nearby home tutors and explore learning opportunities with MentorNearby.';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MobileShareInstallWidget = () => {
  const location = useLocation();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check display conditions on mount
  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      localStorage.getItem('mn_pwa_installed') === 'true';
    setIsStandalone(Boolean(standaloneMode));

    // 2. Check iOS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Check dismissal persistence
    const dismissedAt = localStorage.getItem('mn_mobile_widget_dismissed_at');
    if (dismissedAt) {
      const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
      if (timeSinceDismiss < DISMISS_DURATION_MS) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);

    // 4. Listen for BeforeInstallPrompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 5. Listen for AppInstalled event
    const handleAppInstalled = () => {
      localStorage.setItem('mn_pwa_installed', 'true');
      setIsStandalone(true);
      setDeferredPrompt(null);
      if (showToast) {
        showToast('MentorNearby was added to your Home Screen! 🎉', 'success');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const pathname = location.pathname;

  // Route-based suppression (Do not block admin, auth, checkout, or fullscreen reader)
  if (
    isDismissed ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/courses/watch') ||
    pathname.startsWith('/study-resources/reader')
  ) {
    return null;
  }

  // Dismiss widget for 7 days
  const handleDismissForever = () => {
    localStorage.setItem('mn_mobile_widget_dismissed_at', Date.now().toString());
    setIsDismissed(true);
    setIsOpen(false);
  };

  // Close open menu
  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  // ------------------------------------------------------------
  // Action 1: Share Website Handler
  // ------------------------------------------------------------
  const handleShareWebsite = async () => {
    handleCloseMenu();

    if (navigator.share) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: CANONICAL_URL,
        });
      } catch (err) {
        // User cancelled or share aborted — fallback if not AbortError
        if (err.name !== 'AbortError') {
          setShowShareFallback(true);
        }
      }
    } else {
      setShowShareFallback(true);
    }
  };

  // Copy Link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(CANONICAL_URL);
      setCopied(true);
      if (showToast) {
        showToast('Website link copied to clipboard! ✓', 'success');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // Fallback copy using textarea
      const el = document.createElement('textarea');
      el.value = CANONICAL_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ------------------------------------------------------------
  // Action 2: Add to Home Screen Handler
  // ------------------------------------------------------------
  const handleAddToHomeScreen = async () => {
    handleCloseMenu();

    // Case 1: Already running in standalone mode
    if (isStandalone) {
      if (showToast) {
        showToast('MentorNearby is already installed on your device! ✓', 'info');
      }
      return;
    }

    // Case 2: Android / Chrome with native deferred prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (showToast) {
            showToast('Adding MentorNearby to Home Screen...', 'success');
          }
          localStorage.setItem('mn_pwa_installed', 'true');
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      return;
    }

    // Case 3: iOS Safari (Display authentic step-by-step guidance)
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    // Case 4: Other browsers / Desktop without deferred prompt
    setShowIosGuide(true);
  };

  return (
    <>
      <div className="mn-mobile-floating-widget" role="complementary" aria-label="Mobile quick actions">
        {/* Toggle Pill Button (when menu closed) */}
        {!isOpen && (
          <button
            type="button"
            className="mn-floating-pill-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Open Share and Install Menu"
          >
            <span className="mn-floating-pill-icon-glow">✨</span>
            <span className="mn-floating-pill-text">Share & App</span>
            <span className="mn-floating-pill-badge">PWA</span>
          </button>
        )}

        {/* Expanded Floating Menu Card */}
        {isOpen && (
          <div className="mn-floating-menu-card" role="dialog" aria-modal="true">
            <div className="mn-floating-menu-header">
              <div className="mn-floating-brand-title">
                <span>⚡</span> Mentor<span>Nearby</span>
              </div>
              <button
                type="button"
                className="mn-floating-close-btn"
                onClick={handleCloseMenu}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mn-floating-actions-list">
              {/* Action 1: Share Website */}
              <button
                type="button"
                className="mn-floating-action-item"
                onClick={handleShareWebsite}
              >
                <div className="mn-action-icon-wrap share-bg">
                  <span>🔗</span>
                </div>
                <div className="mn-action-text-wrap">
                  <div className="mn-action-main-label">Share Website</div>
                  <div className="mn-action-sub-label">Share with friends & parents</div>
                </div>
                <span className="mn-action-chevron">›</span>
              </button>

              {/* Action 2: Add to Home Screen */}
              <button
                type="button"
                className="mn-floating-action-item highlight"
                onClick={handleAddToHomeScreen}
              >
                <div className="mn-action-icon-wrap install-bg">
                  <span>📱</span>
                </div>
                <div className="mn-action-text-wrap">
                  <div className="mn-action-main-label">
                    {isStandalone ? 'App Installed' : 'Add to Home Screen'}
                  </div>
                  <div className="mn-action-sub-label">
                    {isStandalone ? 'Installed on device ✓' : 'Instant 1-tap app access'}
                  </div>
                </div>
                <span className="mn-action-chevron">›</span>
              </button>
            </div>

            <div className="mn-floating-dismiss-footer">
              <button
                type="button"
                className="mn-floating-dismiss-link"
                onClick={handleDismissForever}
              >
                Don't show again for 7 days
              </button>
            </div>
          </div>
        )}
      </div>

      {/* iOS Safari Installation Guide Modal Sheet */}
      {showIosGuide && (
        <div className="mn-guide-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="mn-guide-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mn-sheet-handle"></div>
            <div className="mn-sheet-header">
              <div className="mn-sheet-title">
                <span>📱</span> Add MentorNearby to Home Screen
              </div>
              <button
                type="button"
                className="mn-sheet-close-btn"
                onClick={() => setShowIosGuide(false)}
                aria-label="Close installation guide"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Install MentorNearby on your mobile home screen for fast, instant access to tutors and notes without using extra device storage.
            </p>

            <div className="mn-ios-steps-list">
              <div className="mn-ios-step-card">
                <span className="mn-step-badge">1</span>
                <div className="mn-step-content">
                  Open <strong>MentorNearby</strong> in <strong>Safari</strong> on your device.
                </div>
              </div>

              <div className="mn-ios-step-card">
                <span className="mn-step-badge">2</span>
                <div className="mn-step-content">
                  Tap the Safari <span className="mn-step-icon-highlight">Share ⎙ / ⎋</span> button in the bottom navigation bar.
                </div>
              </div>

              <div className="mn-ios-step-card">
                <span className="mn-step-badge">3</span>
                <div className="mn-step-content">
                  Scroll down the share menu and select <span className="mn-step-icon-highlight">➕ Add to Home Screen</span>.
                </div>
              </div>

              <div className="mn-ios-step-card">
                <span className="mn-step-badge">4</span>
                <div className="mn-step-content">
                  Confirm by tapping <span className="mn-step-icon-highlight font-bold">Add</span> in the top-right corner.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: '14px',
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Fallback Modal Sheet (when Web Share API is not supported or cancelled) */}
      {showShareFallback && (
        <div className="mn-guide-modal-overlay" onClick={() => setShowShareFallback(false)}>
          <div className="mn-guide-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mn-sheet-handle"></div>
            <div className="mn-sheet-header">
              <div className="mn-sheet-title">
                <span>🔗</span> Share MentorNearby
              </div>
              <button
                type="button"
                className="mn-sheet-close-btn"
                onClick={() => setShowShareFallback(false)}
                aria-label="Close share menu"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
              Help students and parents find verified home tutors nearby:
            </p>

            <div className="mn-share-grid">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${SHARE_TEXT}\n\n👉 Find trusted tutors near you: ${CANONICAL_URL}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mn-share-option-btn whatsapp"
                onClick={() => setShowShareFallback(false)}
              >
                <span>💬</span> WhatsApp
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(
                  CANONICAL_URL
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mn-share-option-btn"
                onClick={() => setShowShareFallback(false)}
              >
                <span>🐦</span> X / Twitter
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(CANONICAL_URL)}&text=${encodeURIComponent(
                  SHARE_TEXT
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mn-share-option-btn"
                onClick={() => setShowShareFallback(false)}
              >
                <span>✈️</span> Telegram
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CANONICAL_URL)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mn-share-option-btn"
                onClick={() => setShowShareFallback(false)}
              >
                <span>💼</span> LinkedIn
              </a>
            </div>

            <div className="mn-copy-link-bar">
              <input
                type="text"
                readOnly
                value={CANONICAL_URL}
                className="mn-copy-link-input"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`mn-copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? 'Copied! ✓' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileShareInstallWidget;
