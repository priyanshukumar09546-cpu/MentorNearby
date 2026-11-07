// ============================================================
// components/home/HandwrittenNotesSection.jsx
// MentorNearby — Handwritten Notes Banner Section
// Matching Reference Image 1 with section heading, notebook illustrations & CTA
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

const NOTES_FEATURES = [
  'Unit-wise Notes',
  'Clear Diagrams',
  'Exam Focused',
  'Regularly Updated',
];

const HandwrittenNotesSection = () => {
  return (
    <section className="mn-notes-banner-section" aria-label="Explore Our Handwritten Notes">
      <div className="mn-container">
        {/* Section Header with Decorative Accent Lines (Matching Reference Image 1) */}
        <div className="mn-courses-section-header" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="mn-courses-header-text">
            <h2 className="mn-courses-main-title">
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
              <span>Explore Our</span>
              <span className="mn-courses-orange-text">Handwritten Notes</span>
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
            </h2>
            <p className="mn-courses-sub-desc">
              Clear concepts. Beautifully explained. Exam ready.
            </p>
          </div>
        </div>

        {/* Banner Card */}
        <div className="mn-notes-banner-card">
          {/* Left: 3 Realistic Tilted Handwritten Notes Sheets */}
          <div className="mn-notes-sheets-visual" aria-hidden="true">
            {/* Decorative Sparkles above notebook sheets */}
            <div className="mn-notes-top-sparkles">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <line x1="8" y1="20" x2="3" y2="12" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="20" x2="18" y2="8" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="28" y1="20" x2="33" y2="12" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Sheet 1: Physics (Tilted Left) */}
            <div className="mn-note-paper mn-note-physics">
              <div className="mn-note-header-strip mn-strip-purple">
                <span>✦ Physics</span>
              </div>
              <div className="mn-note-content-lines">
                <div className="mn-note-line mn-w-80"></div>
                <div className="mn-note-line mn-w-95"></div>
                {/* Wave diagram */}
                <svg className="mn-note-diagram-svg" viewBox="0 0 100 24" fill="none">
                  <path d="M 5 12 Q 25 2, 45 12 T 85 12" stroke="#8B5CF6" strokeWidth="2" fill="none"/>
                  <line x1="5" y1="12" x2="95" y2="12" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="2 2"/>
                </svg>
                <div className="mn-note-formula">λ = v / f</div>
                <div className="mn-note-line mn-w-70"></div>
              </div>
            </div>

            {/* Sheet 2: Maths (Center Front) */}
            <div className="mn-note-paper mn-note-maths">
              <div className="mn-note-header-strip mn-strip-orange">
                <span>✦ Maths</span>
              </div>
              <div className="mn-note-content-lines">
                <div className="mn-note-line mn-w-90"></div>
                {/* Circle & Geometry Diagram */}
                <svg className="mn-note-diagram-svg" viewBox="0 0 100 32" fill="none">
                  <circle cx="50" cy="16" r="13" stroke="#EA580C" strokeWidth="1.8" fill="rgba(234, 88, 12, 0.05)"/>
                  <polygon points="50,4 39,26 61,26" stroke="#EA580C" strokeWidth="1.4" fill="none"/>
                  <line x1="50" y1="16" x2="63" y2="16" stroke="#FDBA74" strokeWidth="1.2"/>
                </svg>
                <div className="mn-note-formula">(a + b)² = a² + 2ab + b²</div>
                <div className="mn-note-line mn-w-85"></div>
              </div>
            </div>

            {/* Sheet 3: Chemistry (Tilted Right) */}
            <div className="mn-note-paper mn-note-chemistry">
              <div className="mn-note-header-strip mn-strip-blue">
                <span>✦ Chemistry</span>
              </div>
              <div className="mn-note-content-lines">
                <div className="mn-note-line mn-w-85"></div>
                {/* Benzene ring */}
                <svg className="mn-note-diagram-svg" viewBox="0 0 100 28" fill="none">
                  <polygon points="50,2 62,8 62,20 50,26 38,20 38,8" stroke="#2563EB" strokeWidth="1.6" fill="rgba(37, 99, 235, 0.05)"/>
                  <circle cx="50" cy="14" r="6" stroke="#93C5FD" strokeWidth="1" strokeDasharray="2 2"/>
                </svg>
                <div className="mn-note-formula">2H₂ + O₂ → 2H₂O</div>
                <div className="mn-note-line mn-w-75"></div>
              </div>
            </div>
          </div>

          {/* Center: Heading, Subtitle & 4 Feature Badges */}
          <div className="mn-notes-banner-center">
            <h2 className="mn-notes-heading">
              Handwritten <span className="mn-notes-orange-text">Notes</span>
            </h2>
            <p className="mn-notes-description">
              High-quality, subject-wise handwritten notes for Class 9 to 12.
            </p>

            <div className="mn-notes-features-row">
              {NOTES_FEATURES.map((feature, i) => (
                <div key={i} className="mn-notes-feature-pill">
                  <span className="mn-notes-check-circle" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CTA Button */}
          <div className="mn-notes-banner-cta-wrap">
            <Link to="/study-resources" className="mn-notes-explore-btn">
              <span>Explore Notes</span>
              <span className="mn-notes-btn-arrow">→</span>
            </Link>
          </div>

          {/* Subtle Watermark Book in background */}
          <div className="mn-notes-watermark-icon" aria-hidden="true">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
              <path d="M6 6h10"></path>
              <path d="M6 10h10"></path>
              <path d="M6 14h6"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HandwrittenNotesSection;
