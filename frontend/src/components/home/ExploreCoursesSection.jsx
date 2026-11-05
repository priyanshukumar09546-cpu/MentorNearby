// ============================================================
// components/home/ExploreCoursesSection.jsx
// MentorNearby — Explore Our Courses Section (Matching Reference Image 1)
// Clean 4-card layout for Class 9, Class 10, Class 11, Class 12
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

const COURSE_CLASSES = [
  {
    classNum: '9',
    title: 'Class 9',
    description: 'Complete Study Resources',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    link: '/courses?class=Class 9',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
        <path d="M6 6h10"></path>
        <path d="M6 10h10"></path>
      </svg>
    ),
  },
  {
    classNum: '10',
    title: 'Class 10',
    description: 'Notes, PYQs & More',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    link: '/courses?class=Class 10',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
      </svg>
    ),
  },
  {
    classNum: '11',
    title: 'Class 11',
    description: 'All Subjects & Resources',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    link: '/courses?class=Class 11',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
      </svg>
    ),
  },
  {
    classNum: '12',
    title: 'Class 12',
    description: 'Board Exam Preparation',
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    link: '/courses?class=Class 12',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    ),
  },
];

const ExploreCoursesSection = () => {
  return (
    <section className="mn-courses-explore-section" aria-label="Explore Our Courses">
      <div className="mn-container">
        {/* Section Header */}
        <div className="mn-courses-section-header">
          <div className="mn-courses-header-text">
            <h2 className="mn-courses-main-title">
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
              <span>Explore Our</span>
              <span className="mn-courses-orange-text">Courses</span>
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
            </h2>
            <p className="mn-courses-sub-desc">
              Complete study materials, notes, PYQs and exam preparation for Class 9 to 12.
            </p>
          </div>
          <Link to="/courses" className="mn-courses-all-btn">
            <span>View All Courses</span>
            <span className="mn-courses-arrow">→</span>
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="mn-courses-grid-4col">
          {COURSE_CLASSES.map((item) => (
            <Link
              key={item.classNum}
              to={item.link}
              className="mn-course-class-card"
              style={{ '--card-accent': item.color }}
            >
              <div
                className="mn-course-card-icon-box"
                style={{
                  color: item.color,
                  backgroundColor: item.bg,
                  border: `1.5px solid ${item.border}`,
                }}
              >
                {item.icon}
              </div>
              <h3 className="mn-course-card-class-title">{item.title}</h3>
              <p className="mn-course-card-class-sub">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreCoursesSection;
