// ============================================================
// pages/NotFoundPage.jsx
// MentorNearby Branded 404 "Page Not Found" Experience
// ============================================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mn-404-root">
      <div className="mn-404-card">
        {/* Visual Illustration */}
        <div className="mn-404-icon-box">
          <span className="mn-404-number">404</span>
          <div className="mn-404-emoji">🔍📚</div>
        </div>

        {/* Text Details */}
        <h1 className="mn-404-title">Oops! Page Not Found</h1>
        <p className="mn-404-desc">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let’s get you back on track!
        </p>

        {/* Action Buttons */}
        <div className="mn-404-actions">
          <Link to="/" className="mn-404-btn-primary">
            <span>🏠</span> Back to Home
          </Link>
          <Link to="/search" className="mn-404-btn-secondary">
            <span>🔍</span> Find Tutors
          </Link>
          <Link to="/study-resources" className="mn-404-btn-secondary">
            <span>📚</span> Study Resources
          </Link>
          <Link to="/how-it-works" className="mn-404-btn-secondary">
            <span>💡</span> How It Works
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
