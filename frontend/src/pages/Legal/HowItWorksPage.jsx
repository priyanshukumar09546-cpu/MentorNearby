// ============================================================
// pages/Legal/HowItWorksPage.jsx
// MentorNearby Standalone "How It Works" Production Page
// Exact Recreation of Reference Image media_1787468562519.jpg
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HowItWorksPage.css';

const HowItWorksPage = () => {
  const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT' | 'TUTOR'
  const navigate = useNavigate();

  // Update SEO Page Title and Meta Description
  useEffect(() => {
    document.title = 'How It Works | MentorNearby';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn how MentorNearby helps students find trusted tutors and helps tutors connect with students.'
      );
    }
  }, []);

  return (
    <div className="hiw-page-root">
      <div className="hiw-container">

        {/* ---------------------------------------------------------- */}
        {/* 1. HERO HEADER                                             */}
        {/* ---------------------------------------------------------- */}
        <div className="hiw-hero-section">
          <h1 className="hiw-main-heading">
            How <span className="hiw-brand-mentor">Mentor</span><span className="hiw-brand-nearby">Nearby</span> Works
          </h1>
          <p className="hiw-subheading">
            A simple, safe and smart way to connect students &amp; parents with trusted tutors.
          </p>

          {/* Segmented Toggle (Student / Parent vs Tutor) */}
          <div
            className="hiw-toggle-container"
            role="tablist"
            aria-label="Select workflow type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'STUDENT'}
              className={`hiw-toggle-btn ${activeTab === 'STUDENT' ? 'active-student' : ''}`}
              onClick={() => setActiveTab('STUDENT')}
            >
              <span className="hiw-toggle-icon">👤</span>
              <span>I’m a Student / Parent</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'TUTOR'}
              className={`hiw-toggle-btn ${activeTab === 'TUTOR' ? 'active-tutor' : ''}`}
              onClick={() => setActiveTab('TUTOR')}
            >
              <span className="hiw-toggle-icon">🎓</span>
              <span>I’m a Tutor</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* 2. STUDENT / PARENT WORKFLOW (ORANGE THEME)                */}
        {/* ---------------------------------------------------------- */}
        <section
          id="students-section"
          className={`hiw-flow-section student-theme ${activeTab === 'STUDENT' ? 'view-active' : 'view-inactive'}`}
          aria-labelledby="heading-students-flow"
        >
          {/* Section Header Divider */}
          <div className="hiw-section-divider student-divider">
            <span className="hiw-divider-line" />
            <h2 id="heading-students-flow" className="hiw-divider-label">
              FOR STUDENTS / PARENTS
            </h2>
            <span className="hiw-divider-line" />
          </div>

          {/* Desktop 5-Step Horizontal Grid */}
          <div className="hiw-desktop-process-row">
            {/* Step 1 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
            >
              <div className="hiw-step-badge orange-badge">1</div>
              <div className="hiw-step-card orange-card">
                <div className="hiw-card-illus-box">
                  {/* Map & Location Pin Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <rect x="8" y="16" width="84" height="52" rx="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
                    <path d="M8 32L92 32" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M8 50L92 50" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M34 16L34 68" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M66 16L66 68" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Location Pin */}
                    <g transform="translate(50, 36)">
                      <circle cx="0" cy="-6" r="13" fill="#FF6A00" />
                      <circle cx="0" cy="-6" r="4.5" fill="#FFFFFF" />
                      <path d="M-8 -2L0 12L8 -2" fill="#FF6A00" />
                      <circle cx="0" cy="13" r="3" fill="#FED7AA" opacity="0.8" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Search for a Tutor</h3>
                <p className="hiw-step-desc">
                  Search by subject, class, location or keywords to find the best nearby tutors.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 1 -> 2 */}
            <div className="hiw-arrow-indicator orange-arrow" aria-hidden="true">›</div>

            {/* Step 2 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
            >
              <div className="hiw-step-badge orange-badge">2</div>
              <div className="hiw-step-card orange-card">
                <div className="hiw-card-illus-box">
                  {/* Tutor Cards & Stars Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <rect x="6" y="16" width="88" height="52" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
                    {/* 3 Tutor Avatars */}
                    <g transform="translate(22, 32)">
                      <circle cx="0" cy="0" r="10" fill="#FF6A00" />
                      <circle cx="0" cy="-2" r="4" fill="#FFFFFF" />
                      <path d="M-6 8C-6 4 -3 2 0 2C3 2 6 4 6 8" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(50, 32)">
                      <circle cx="0" cy="0" r="10" fill="#2563EB" />
                      <circle cx="0" cy="-2" r="4" fill="#FFFFFF" />
                      <path d="M-6 8C-6 4 -3 2 0 2C3 2 6 4 6 8" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(78, 32)">
                      <circle cx="0" cy="0" r="10" fill="#059669" />
                      <circle cx="0" cy="-2" r="4" fill="#FFFFFF" />
                      <path d="M-6 8C-6 4 -3 2 0 2C3 2 6 4 6 8" fill="#FFFFFF" />
                    </g>
                    {/* Rating Stars */}
                    <g transform="translate(50, 56)">
                      <text x="0" y="0" textAnchor="middle" fontSize="11.5" fill="#F59E0B" fontWeight="900">★★★★★</text>
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Compare Tutors</h3>
                <p className="hiw-step-desc">
                  Compare tutors by experience, reviews, teaching style, fees and availability.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 2 -> 3 */}
            <div className="hiw-arrow-indicator orange-arrow" aria-hidden="true">›</div>

            {/* Step 3 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search?verified=true')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search?verified=true')}
            >
              <div className="hiw-step-badge orange-badge">3</div>
              <div className="hiw-step-card orange-card">
                <div className="hiw-card-illus-box">
                  {/* Verified Shield Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 42)">
                      <path
                        d="M0 -26L22 -17V5C22 18 11 26 0 30C-11 26 -22 18 -22 5V-17L0 -26Z"
                        fill="#10B981"
                      />
                      <path
                        d="M0 -22L18 -14V4C18 15 9 22 0 26C-9 22 -18 15 -18 4V-14L0 -22Z"
                        fill="#059669"
                      />
                      <path
                        d="M-7 3L-2 8L9 -4"
                        stroke="#FFFFFF"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Safety star badge */}
                      <circle cx="14" cy="14" r="6" fill="#F59E0B" />
                      <text x="14" y="16.5" textAnchor="middle" fontSize="7" fill="#FFFFFF" fontWeight="900">★</text>
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Verify Before Connecting</h3>
                <p className="hiw-step-desc">
                  All tutors go through our strict verification process for your safety and trust.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 3 -> 4 */}
            <div className="hiw-arrow-indicator orange-arrow" aria-hidden="true">›</div>

            {/* Step 4 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
            >
              <div className="hiw-step-badge orange-badge">4</div>
              <div className="hiw-step-card orange-card">
                <div className="hiw-card-illus-box">
                  {/* Secure Rupee Lock Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 44)">
                      {/* Shackle */}
                      <path
                        d="M-10 -6V-16C-10 -22 -6 -26 0 -26C6 -26 10 -22 10 -16V-6"
                        stroke="#6C3AED"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      {/* Lock Body */}
                      <rect x="-18" y="-6" width="36" height="28" rx="7" fill="#8B5CF6" />
                      <circle cx="0" cy="6" r="4" fill="#FFFFFF" />
                      {/* Rupee badge */}
                      <circle cx="14" cy="17" r="8" fill="#F59E0B" />
                      <text x="14" y="20.5" textAnchor="middle" fontSize="9" fill="#FFFFFF" fontWeight="900">₹</text>
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Unlock Contact</h3>
                <p className="hiw-step-desc">
                  Unlock the contact details of your preferred tutor and connect directly.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 4 -> 5 */}
            <div className="hiw-arrow-indicator orange-arrow" aria-hidden="true">›</div>

            {/* Step 5 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
            >
              <div className="hiw-step-badge orange-badge">5</div>
              <div className="hiw-step-card orange-card">
                <div className="hiw-card-illus-box">
                  {/* Student Studying at Laptop Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 44)">
                      {/* Laptop */}
                      <rect x="-24" y="10" width="48" height="4" rx="2" fill="#94A3B8" />
                      <path d="M-18 10L-14 -10H14L18 10Z" fill="#3B82F6" />
                      <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
                      {/* Student figure */}
                      <circle cx="0" cy="-22" r="9" fill="#1E1B4B" />
                      <path d="M-12 -22C-12 -28 -7 -32 0 -32C7 -32 12 -28 12 -22" fill="#F472B6" />
                      {/* Headphones */}
                      <path d="M-10 -22C-10 -28 -5 -33 0 -33C5 -33 10 -28 10 -22" stroke="#F59E0B" strokeWidth="2.5" />
                      <rect x="-12" y="-23" width="3" height="6" rx="1.5" fill="#F59E0B" />
                      <rect x="9" y="-23" width="3" height="6" rx="1.5" fill="#F59E0B" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Start Learning</h3>
                <p className="hiw-step-desc">
                  Discuss your requirements and start your learning journey.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Timeline (Students) */}
          <div className="hiw-mobile-timeline">
            {[
              {
                num: 1,
                title: 'Search for a Tutor',
                desc: 'Search by subject, class, location or keywords to find the best nearby tutors.',
                icon: '📍',
                link: '/search',
              },
              {
                num: 2,
                title: 'Compare Tutors',
                desc: 'Compare tutors by experience, reviews, teaching style, fees and availability.',
                icon: '⭐',
                link: '/search',
              },
              {
                num: 3,
                title: 'Verify Before Connecting',
                desc: 'All tutors go through our strict verification process for your safety and trust.',
                icon: '🛡️',
                link: '/search?verified=true',
              },
              {
                num: 4,
                title: 'Unlock Contact',
                desc: 'Unlock the contact details of your preferred tutor and connect directly.',
                icon: '🔒',
                link: '/search',
              },
              {
                num: 5,
                title: 'Start Learning',
                desc: 'Discuss your requirements and start your learning journey.',
                icon: '👩‍🎓',
                link: '/search',
              },
            ].map((st, idx) => (
              <div
                key={st.num}
                className="hiw-mobile-step-item"
                onClick={() => navigate(st.link)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === 'Enter' && navigate(st.link)}
              >
                <div className="hiw-mobile-badge-col">
                  <div className="hiw-mobile-badge orange-badge">{st.num}</div>
                  {idx < 4 && <div className="hiw-mobile-connector-line" />}
                </div>
                <div className="hiw-mobile-step-card orange-mobile-card">
                  <div className="hiw-mobile-icon-box orange-icon-box">{st.icon}</div>
                  <div className="hiw-mobile-content">
                    <h3 className="hiw-mobile-title">{st.title}</h3>
                    <p className="hiw-mobile-desc">{st.desc}</p>
                  </div>
                  <div className="hiw-mobile-arrow" aria-hidden="true">›</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 3. TUTOR WORKFLOW (PURPLE THEME)                           */}
        {/* ---------------------------------------------------------- */}
        <section
          id="tutors-section"
          className={`hiw-flow-section tutor-theme ${activeTab === 'TUTOR' ? 'view-active' : 'view-inactive'}`}
          aria-labelledby="heading-tutors-flow"
        >
          {/* Section Header Divider */}
          <div className="hiw-section-divider tutor-divider">
            <span className="hiw-divider-line purple-line" />
            <h2 id="heading-tutors-flow" className="hiw-divider-label purple-label">
              FOR TUTORS
            </h2>
            <span className="hiw-divider-line purple-line" />
          </div>

          {/* Desktop 5-Step Horizontal Grid */}
          <div className="hiw-desktop-process-row">
            {/* Step 1 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/become-a-tutor')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/become-a-tutor')}
            >
              <div className="hiw-step-badge purple-badge">1</div>
              <div className="hiw-step-card purple-card">
                <div className="hiw-card-illus-box">
                  {/* Create Profile Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 40)">
                      <rect x="-24" y="-20" width="48" height="40" rx="8" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.5" />
                      <circle cx="0" cy="-6" r="7" fill="#6C3AED" />
                      <path d="M-10 12C-10 7 -5 5 0 5C5 5 10 7 10 12" fill="#6C3AED" />
                      {/* Pencil Badge */}
                      <circle cx="16" cy="12" r="7" fill="#FF6A00" />
                      <path d="M14 14L18 10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Create Your Profile</h3>
                <p className="hiw-step-desc">
                  Sign up and create a professional profile that highlights your skills and expertise.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 1 -> 2 */}
            <div className="hiw-arrow-indicator purple-arrow" aria-hidden="true">›</div>

            {/* Step 2 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/tutor/kyc')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/tutor/kyc')}
            >
              <div className="hiw-step-badge purple-badge">2</div>
              <div className="hiw-step-card purple-card">
                <div className="hiw-card-illus-box">
                  {/* Verify Identity Shield Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 42)">
                      <path
                        d="M0 -26L22 -17V5C22 18 11 26 0 30C-11 26 -22 18 -22 5V-17L0 -26Z"
                        fill="#6C3AED"
                      />
                      <path
                        d="M0 -22L18 -14V4C18 15 9 22 0 26C-9 22 -18 15 -18 4V-14L0 -22Z"
                        fill="#5B21B6"
                      />
                      <path
                        d="M-7 3L-2 8L9 -4"
                        stroke="#FFFFFF"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Verify Your Identity</h3>
                <p className="hiw-step-desc">
                  Complete verification to build trust and help students feel confident.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 2 -> 3 */}
            <div className="hiw-arrow-indicator purple-arrow" aria-hidden="true">›</div>

            {/* Step 3 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/search')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
            >
              <div className="hiw-step-badge purple-badge">3</div>
              <div className="hiw-step-card purple-card">
                <div className="hiw-card-illus-box">
                  {/* Megaphone Broadcast Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(48, 44)">
                      {/* Megaphone Body */}
                      <path d="M-16 -4L2 -16V16L-16 4V-4Z" fill="#6C3AED" />
                      <rect x="-24" y="-6" width="8" height="12" rx="2" fill="#4C1D95" />
                      <path d="M-18 6L-12 18" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" />
                      {/* Sound Waves */}
                      <path d="M10 -12C14 -6 14 6 10 12" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M16 -18C22 -9 22 9 16 18" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Get Discovered</h3>
                <p className="hiw-step-desc">
                  Your profile appears in student search results in your selected areas.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 3 -> 4 */}
            <div className="hiw-arrow-indicator purple-arrow" aria-hidden="true">›</div>

            {/* Step 4 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/tutor/requests')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/tutor/requests')}
            >
              <div className="hiw-step-badge purple-badge">4</div>
              <div className="hiw-step-card purple-card">
                <div className="hiw-card-illus-box">
                  {/* Chat Bubbles Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 42)">
                      <rect x="-20" y="-18" width="34" height="22" rx="6" fill="#6C3AED" />
                      <path d="M-10 4L-16 12L-4 4" fill="#6C3AED" />
                      <circle cx="-12" cy="-7" r="2" fill="#FFFFFF" />
                      <circle cx="-3" cy="-7" r="2" fill="#FFFFFF" />
                      <circle cx="6" cy="-7" r="2" fill="#FFFFFF" />
                      <rect x="-4" y="-4" width="26" height="18" rx="5" fill="#A78BFA" opacity="0.9" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Receive Requests</h3>
                <p className="hiw-step-desc">
                  Interested students contact you. You choose whom you want to teach.
                </p>
              </div>
            </div>

            {/* Connecting Arrow 4 -> 5 */}
            <div className="hiw-arrow-indicator purple-arrow" aria-hidden="true">›</div>

            {/* Step 5 */}
            <div
              className="hiw-step-card-wrapper"
              onClick={() => navigate('/tutor/dashboard')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigate('/tutor/dashboard')}
            >
              <div className="hiw-step-badge purple-badge">5</div>
              <div className="hiw-step-card purple-card">
                <div className="hiw-card-illus-box">
                  {/* Graduation Cap Vector */}
                  <svg className="hiw-illus-svg" viewBox="0 0 100 80" fill="none" aria-hidden="true">
                    <g transform="translate(50, 42)">
                      <path d="M0 -20L28 -8L0 4L-28 -8L0 -20Z" fill="#1E1B4B" />
                      <path d="M-16 -1C-16 11 16 11 16 -1" fill="#0F172A" />
                      <path d="M18 -4L22 14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="22" cy="16" r="3" fill="#F59E0B" />
                    </g>
                  </svg>
                </div>
                <h3 className="hiw-step-title">Start Teaching</h3>
                <p className="hiw-step-desc">
                  Connect with students and begin their learning journey.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Timeline (Tutors) */}
          <div className="hiw-mobile-timeline">
            {[
              {
                num: 1,
                title: 'Create Your Profile',
                desc: 'Sign up and create a professional profile that highlights your skills and expertise.',
                icon: '👤',
                link: '/become-a-tutor',
              },
              {
                num: 2,
                title: 'Verify Your Identity',
                desc: 'Complete verification to build trust and help students feel confident.',
                icon: '🛡️',
                link: '/tutor/kyc',
              },
              {
                num: 3,
                title: 'Get Discovered',
                desc: 'Your profile appears in student search results in your selected areas.',
                icon: '📢',
                link: '/search',
              },
              {
                num: 4,
                title: 'Receive Requests',
                desc: 'Interested students contact you. You choose whom you want to teach.',
                icon: '💬',
                link: '/tutor/requests',
              },
              {
                num: 5,
                title: 'Start Teaching',
                desc: 'Connect with students and begin their learning journey.',
                icon: '🎓',
                link: '/tutor/dashboard',
              },
            ].map((st, idx) => (
              <div
                key={st.num}
                className="hiw-mobile-step-item"
                onClick={() => navigate(st.link)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === 'Enter' && navigate(st.link)}
              >
                <div className="hiw-mobile-badge-col">
                  <div className="hiw-mobile-badge purple-badge">{st.num}</div>
                  {idx < 4 && <div className="hiw-mobile-connector-line purple-connector" />}
                </div>
                <div className="hiw-mobile-step-card purple-mobile-card">
                  <div className="hiw-mobile-icon-box purple-icon-box">{st.icon}</div>
                  <div className="hiw-mobile-content">
                    <h3 className="hiw-mobile-title">{st.title}</h3>
                    <p className="hiw-mobile-desc">{st.desc}</p>
                  </div>
                  <div className="hiw-mobile-arrow" aria-hidden="true">›</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 4. WARM PEACH BOTTOM CTA BANNER                            */}
        {/* ---------------------------------------------------------- */}
        <div className="hiw-bottom-cta-banner">
          <div className="hiw-cta-left">
            {/* Friendly Student Illustration */}
            <div className="hiw-cta-avatar-box">
              <svg viewBox="0 0 100 100" className="hiw-cta-avatar-svg" aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="3" />
                <g transform="translate(50, 52)">
                  <circle cx="0" cy="-14" r="15" fill="#D97706" />
                  <circle cx="0" cy="-17" r="14" fill="#FBBF24" />
                  <circle cx="0" cy="-14" r="10" fill="#FFE4E6" />
                  {/* Smile */}
                  <path d="M-4 -11C-2 -8 2 -8 4 -11" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Backpack & Thumbs Up */}
                  <path d="M-18 20C-18 6 -10 2 0 2C10 2 18 6 18 20" fill="#FF6A00" />
                  <rect x="-10" y="8" width="20" height="14" rx="2" fill="#EA580C" />
                  <line x1="-10" y1="14" x2="10" y2="14" stroke="#FED7AA" strokeWidth="1.5" />
                  {/* Thumbs up hand */}
                  <circle cx="20" cy="6" r="4.5" fill="#FFE4E6" />
                  <path d="M18 4L22 4L22 8L18 8Z" fill="#FFE4E6" />
                </g>
              </svg>
            </div>

            <div className="hiw-cta-text-wrap">
              <h2 className="hiw-cta-heading">Ready to Find Your Perfect Tutor?</h2>
              <p className="hiw-cta-sub">
                Join thousands of students and parents who trust MentorNearby.
              </p>
            </div>
          </div>

          <div className="hiw-cta-btn-wrap">
            <Link
              to={activeTab === 'TUTOR' ? '/become-a-tutor' : '/search'}
              className="hiw-cta-btn"
            >
              {activeTab === 'TUTOR' ? 'Become a Tutor Now →' : 'Find Tutors Now →'}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HowItWorksPage;
