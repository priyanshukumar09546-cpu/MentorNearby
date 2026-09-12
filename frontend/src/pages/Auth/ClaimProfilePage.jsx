// ============================================================
// pages/Auth/ClaimProfilePage.jsx
// MentorNearby Real Tutor Profile Claim & Onboarding
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaimProfile, submitClaimProfile } from '../../api/tutorDiscovery';
import { useToast } from '../../context/ToastContext';
import './ClaimProfilePage.css';

const ClaimProfilePage = () => {
  const { token } = useParams();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [leadData, setLeadData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Editable claim fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subjectsStr, setSubjectsStr] = useState('');
  const [classesStr, setClassesStr] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [teachingMode, setTeachingMode] = useState('Both');
  const [fee, setFee] = useState('');

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setLoading(true);
        const res = await getClaimProfile(token);
        if (res.data?.success) {
          const d = res.data.data;
          setLeadData(d);
          setPhone(d.phone || '');
          setEmail(d.email || '');
          setSubjectsStr((d.subjects || []).join(', '));
          setClassesStr((d.classes || []).join(', '));
          setQualification(d.qualification || '');
          setExperience(d.experience || '');
          setTeachingMode(d.teachingMode || 'Both');
          setFee(d.fee || '');
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Invalid or expired claim link. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchClaim();
    } else {
      setErrorMsg('No claim token provided in link.');
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      showToast?.('Please enter your active phone number', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        phone: phone.trim(),
        email: email.trim(),
        subjects: subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
        classes: classesStr.split(',').map((s) => s.trim()).filter(Boolean),
        qualification: qualification.trim(),
        experience: experience.trim(),
        teachingMode,
        fee: fee ? parseInt(fee, 10) : undefined,
      };

      const res = await submitClaimProfile(token, payload);
      if (res.data?.success) {
        setSubmitted(true);
        showToast?.('Profile claimed successfully!', 'success');
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to submit profile claim', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="claim-page-wrapper">
        <div className="claim-container" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading verified profile details...</h3>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="claim-page-wrapper">
        <div className="claim-container" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#b91c1c' }}>
            Claim Link Unavailable
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {errorMsg}
          </p>
          <Link to="/" className="admin-btn admin-btn-primary" style={{ display: 'inline-block' }}>
            Return to MentorNearby Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="claim-page-wrapper">
        <div className="claim-container">
          <div className="claim-success-card">
            <div className="claim-success-icon">✓</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Profile Claim Submitted!</h2>
            <p style={{ color: '#475569', maxWidth: '480px', lineHeight: 1.5 }}>
              Thank you, <strong>{leadData?.name}</strong>! Your profile information has been securely updated. Our verification team is reviewing your details to ensure safety and quality. Once approved, your profile will be marked VERIFIED and published live.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <Link to="/login" className="admin-btn admin-btn-primary">
                Go to Tutor Login
              </Link>
              <Link to="/" className="admin-btn admin-btn-secondary">
                Visit MentorNearby
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-page-wrapper">
      <div className="claim-container">
        <div className="claim-header-banner">
          <div className="claim-header-badge">⭐ VERIFIED TUTOR ONBOARDING</div>
          <h1 className="claim-title">Claim Your Tutor Profile</h1>
          <p className="claim-subtitle">
            Welcome, <strong>{leadData?.name}</strong>! MentorNearby has discovered your tutoring listing in {leadData?.city}. Please verify your details below to activate direct student inquiries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="claim-body">
          <div className="claim-grid-2">
            <div className="claim-field-group">
              <label className="claim-label">Full Name</label>
              <input type="text" readOnly className="claim-input" value={leadData?.name || ''} style={{ background: '#f1f5f9' }} />
            </div>

            <div className="claim-field-group">
              <label className="claim-label">City & Region</label>
              <input type="text" readOnly className="claim-input" value={`${leadData?.city || ''}, ${leadData?.locality || 'India'}`} style={{ background: '#f1f5f9' }} />
            </div>
          </div>

          <div className="claim-grid-2">
            <div className="claim-field-group">
              <label className="claim-label">Phone Number *</label>
              <input
                type="tel"
                required
                className="claim-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="claim-field-group">
              <label className="claim-label">Email Address</label>
              <input
                type="email"
                className="claim-input"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="claim-field-group">
            <label className="claim-label">Subjects You Teach (Comma Separated)</label>
            <input
              type="text"
              className="claim-input"
              placeholder="e.g. Mathematics, Physics, Chemistry"
              value={subjectsStr}
              onChange={(e) => setSubjectsStr(e.target.value)}
            />
          </div>

          <div className="claim-field-group">
            <label className="claim-label">Classes / Grades (Comma Separated)</label>
            <input
              type="text"
              className="claim-input"
              placeholder="e.g. Class 9, Class 10, Class 11, Class 12, JEE"
              value={classesStr}
              onChange={(e) => setClassesStr(e.target.value)}
            />
          </div>

          <div className="claim-grid-2">
            <div className="claim-field-group">
              <label className="claim-label">Teaching Experience (Years)</label>
              <input
                type="text"
                className="claim-input"
                placeholder="e.g. 5"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <div className="claim-field-group">
              <label className="claim-label">Hourly / Monthly Fee (₹)</label>
              <input
                type="number"
                min="0"
                className="claim-input"
                placeholder="e.g. 500"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
          </div>

          <div className="claim-grid-2">
            <div className="claim-field-group">
              <label className="claim-label">Qualification / Degree</label>
              <input
                type="text"
                className="claim-input"
                placeholder="e.g. M.Sc Mathematics, B.Tech"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
              />
            </div>

            <div className="claim-field-group">
              <label className="claim-label">Preferred Teaching Mode</label>
              <select
                className="claim-input"
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value)}
              >
                <option value="Both">Both (Online & In-Person)</option>
                <option value="Online">Online Only</option>
                <option value="Offline">Offline / Home Tutor Only</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {submitting ? 'Submitting Claim...' : 'Confirm & Claim Profile'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
              By claiming, you confirm that you are the genuine owner of this tutor profile.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimProfilePage;
