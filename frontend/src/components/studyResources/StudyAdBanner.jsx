// ============================================================
// components/studyResources/StudyAdBanner.jsx
// Clean, respectful educational sponsor & ad banner
// Automatically hidden for Premium users & Admins
// ============================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StudyAdBanner = ({ format = 'horizontal', customStyle = {} }) => {
  const { user } = useAuth();

  // Premium users and Admins never see ads
  if (user?.isPremium || user?.role === 'ADMIN') {
    return null;
  }

  if (format === 'sidebar') {
    return (
      <div
        className="sr-ad-banner sr-ad-sidebar"
        style={{
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
          border: '1.5px dashed #CBD5E1',
          borderRadius: 14,
          padding: '16px 14px',
          textAlign: 'center',
          ...customStyle,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sponsor
          </span>
          <span style={{ fontSize: 9.5, color: '#4F46E5', fontWeight: 700 }}>
            ⭐ Go Ad-Free
          </span>
        </div>
        <div style={{ fontSize: 24, marginBottom: 4 }}>🎓</div>
        <h5 style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>
          Personalized 1-on-1 Tutoring
        </h5>
        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4, margin: '0 0 10px' }}>
          Find verified top tutors near your locality for board exams &amp; concepts.
        </p>
        <a
          href="/tutors"
          style={{
            display: 'block',
            background: '#4F46E5',
            color: '#FFFFFF',
            fontSize: 11.5,
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Find Local Tutors →
        </a>
      </div>
    );
  }

  // Horizontal banner (default)
  return (
    <div
      className="sr-ad-banner sr-ad-horizontal"
      style={{
        background: 'linear-gradient(90deg, #F8FAFC 0%, #EEF2FF 50%, #F8FAFC 100%)',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        margin: '16px 0',
        ...customStyle,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Educational Sponsor
            </span>
            <span style={{ fontSize: 10, color: '#4F46E5', fontWeight: 700 }}>• Ad-Free with Premium</span>
          </div>
          <p style={{ fontSize: 12, color: '#334155', fontWeight: 600, margin: '2px 0 0' }}>
            Need doubt clearance? Connect with top subject tutors in your neighborhood on MentorNearby.
          </p>
        </div>
      </div>

      <a
        href="/tutors"
        style={{
          background: '#1E293B',
          color: '#FFFFFF',
          fontSize: 11.5,
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: 8,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Explore Tutors →
      </a>
    </div>
  );
};

export default StudyAdBanner;
