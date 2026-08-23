import React from 'react';
import { Link } from 'react-router-dom';

const SafetyPage = () => {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF1F2', color: '#E11D48', padding: '6px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 800, marginBottom: 16 }}>
            <span>🛡️</span>
            <span>TRUSTED &amp; VERIFIED PLATFORM</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', margin: '0 0 14px' }}>
            Safety &amp; Trust at MentorNearby
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            We implement stringent tutor verification, 100% student privacy safeguards, and secure learning protocols for every family.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 48 }}>
          
          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF1F2', border: '1.5px solid #FDA4AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#E11D48', marginBottom: 16 }}>
              👤
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Verified Tutors (KYC)
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              Multi-step screening of government IDs (Aadhaar/PAN), university degree certificates, and background credentials before awarding the verified badge.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#2563EB', marginBottom: 16 }}>
              🔒
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              100% Privacy Protection
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              Student residential addresses and phone numbers are shielded from public display to prevent unauthorized marketing calls and spam.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ECFDF5', border: '1.5px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#059669', marginBottom: 16 }}>
              ⭐
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Genuine Student Reviews
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              Authentic feedback and ratings posted only by verified students and parents who have taken tuition classes with the mentor.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FAF5FF', border: '1.5px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#9333EA', marginBottom: 16 }}>
              🚨
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              24/7 Issue Moderation
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
              Dedicated safety team investigating student or tutor reports within 24 hours to ensure a zero-tolerance policy against misconduct.
            </p>
          </div>

        </div>

        {/* Safety Guidelines Card */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0', padding: '36px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 18 }}>
            Parent &amp; Student Safety Checklist
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: '#475569' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
              <span><strong>Book a Demo Session:</strong> Always schedule an initial introductory class to evaluate teaching style and compatibility.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
              <span><strong>Verify the Profile Badge:</strong> Look for the <strong>✓ Verified Tutor</strong> checkmark on the tutor's profile page.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
              <span><strong>Home Tuition Guidance:</strong> For offline home tuition, ensure parent presence in the house during initial classes.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
              <span><strong>Report Suspicious Activity:</strong> If anything feels unprofessional, contact us immediately via <Link to="/report-issue" style={{ color: '#E11D48', fontWeight: 700 }}>Report an Issue</Link>.</span>
            </li>
          </ul>

          <div style={{ background: '#FFF1F2', border: '1px solid #FFE4E6', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#9F1239' }}>Need Immediate Help or Safety Assistance?</div>
              <div style={{ fontSize: 12.5, color: '#BE123C' }}>Our moderation team is available to assist you at all times.</div>
            </div>
            <Link
              to="/contact"
              style={{
                background: '#E11D48',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
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
