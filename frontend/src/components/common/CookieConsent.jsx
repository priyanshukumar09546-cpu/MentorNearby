// ============================================================
// components/common/CookieConsent.jsx
// MentorNearby Cookie Consent Banner & Privacy Alignment
// Non-Intrusive Floating Bottom Card
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookieConsent');
      if (consent !== 'accepted') {
        setVisible(true);
      }
    } catch (_) {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookieConsent', 'accepted');
    } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mn-cookie-banner-wrap" role="region" aria-label="Cookie consent banner">
      <div className="mn-cookie-content">
        <span className="mn-cookie-icon">🍪</span>
        <p className="mn-cookie-text">
          <strong>We use essential cookies</strong> to keep you logged in and remember your preferences. By using MentorNearby, you agree to our Cookie Policy.
        </p>
      </div>

      <div className="mn-cookie-actions">
        <Link to="/privacy" className="mn-cookie-btn-learn">
          Learn More →
        </Link>
        <button
          type="button"
          onClick={handleAccept}
          className="mn-cookie-btn-accept"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
