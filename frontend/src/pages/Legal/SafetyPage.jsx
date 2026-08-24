import React from 'react';
import { Link } from 'react-router-dom';
import './SafetyPage.css';

const SafetyPage = () => {
  return (
    <div className="mn-safety-root">
      <div className="mn-safety-container">
        
        {/* Header Hero */}
        <div className="mn-safety-hero">
          <div className="mn-safety-badge">
            <span>🛡️</span>
            <span>TRUSTED &amp; VERIFIED PLATFORM</span>
          </div>
          <h1 className="mn-safety-title">
            Safety &amp; Trust at MentorNearby
          </h1>
          <p className="mn-safety-sub">
            We implement stringent tutor verification, 100% student privacy safeguards, and secure learning protocols for every family.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="mn-safety-grid">
          
          <div className="mn-safety-card">
            <div className="mn-safety-icon-box red">
              👤
            </div>
            <h3 className="mn-safety-card-title">
              Verified Tutors (KYC)
            </h3>
            <p className="mn-safety-card-desc">
              Multi-step screening of government IDs (Aadhaar/PAN), university degree certificates, and background credentials before awarding the verified badge.
            </p>
          </div>

          <div className="mn-safety-card">
            <div className="mn-safety-icon-box blue">
              🔒
            </div>
            <h3 className="mn-safety-card-title">
              100% Privacy Protection
            </h3>
            <p className="mn-safety-card-desc">
              Student residential addresses and phone numbers are shielded from public display to prevent unauthorized marketing calls and spam.
            </p>
          </div>

          <div className="mn-safety-card">
            <div className="mn-safety-icon-box green">
              ⭐
            </div>
            <h3 className="mn-safety-card-title">
              Genuine Student Reviews
            </h3>
            <p className="mn-safety-card-desc">
              Authentic feedback and ratings posted only by verified students and parents who have taken tuition classes with the mentor.
            </p>
          </div>

          <div className="mn-safety-card">
            <div className="mn-safety-icon-box purple">
              🚨
            </div>
            <h3 className="mn-safety-card-title">
              24/7 Issue Moderation
            </h3>
            <p className="mn-safety-card-desc">
              Dedicated safety team investigating student or tutor reports within 24 hours to ensure a zero-tolerance policy against misconduct.
            </p>
          </div>

        </div>

        {/* Safety Guidelines Card */}
        <div className="mn-safety-guidelines-box">
          <h2 className="mn-safety-guidelines-title">
            Parent &amp; Student Safety Checklist
          </h2>
          <ul className="mn-safety-checklist">
            <li className="mn-safety-check-item">
              <span className="mn-safety-check-icon">✓</span>
              <span><strong>Book a Demo Session:</strong> Always schedule an initial introductory class to evaluate teaching style and compatibility.</span>
            </li>
            <li className="mn-safety-check-item">
              <span className="mn-safety-check-icon">✓</span>
              <span><strong>Verify the Profile Badge:</strong> Look for the <strong>✓ Verified Tutor</strong> checkmark on the tutor's profile page.</span>
            </li>
            <li className="mn-safety-check-item">
              <span className="mn-safety-check-icon">✓</span>
              <span><strong>Home Tuition Guidance:</strong> For offline home tuition, ensure parent presence in the house during initial classes.</span>
            </li>
            <li className="mn-safety-check-item">
              <span className="mn-safety-check-icon">✓</span>
              <span><strong>Report Suspicious Activity:</strong> If anything feels unprofessional, contact us immediately via <Link to="/report-issue" style={{ color: 'var(--color-red, #E11D48)', fontWeight: 700 }}>Report an Issue</Link>.</span>
            </li>
          </ul>

          <div className="mn-safety-action-banner">
            <div>
              <div className="mn-safety-action-title">Need Immediate Help or Safety Assistance?</div>
              <div className="mn-safety-action-sub">Our moderation team is available to assist you at all times.</div>
            </div>
            <Link
              to="/contact"
              className="mn-safety-action-btn"
            >
              Contact Support Team →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SafetyPage;

