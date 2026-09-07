// ============================================================
// pages/ClassDiscovery/ClassDiscoveryPage.jsx
// Discovery Hub for Class 9–10 & Class 11–12
// Real Tutors • Real Study Materials • Dynamic Subject Routing
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import { searchStudyResources } from '../../api/studyResources';
import './ClassDiscoveryPage.css';

const CLASS_CONFIGS = {
  '9-10': {
    title: 'Class 9–10',
    subtitle: 'Build strong fundamentals for school exams, boards and foundation primers.',
    classes: ['9', '10'],
    subjects: [
      { name: 'Mathematics', icon: '📐', bg: '#EFF6FF', color: '#2563EB' },
      { name: 'Science', icon: '🔬', bg: '#F0FDFA', color: '#0D9488' },
      { name: 'English', icon: '📖', bg: '#FFF7ED', color: '#D97706' },
      { name: 'Computer Science', icon: '💻', bg: '#EEF2FF', color: '#4F46E5' },
    ],
  },
  '11-12': {
    title: 'Class 11–12',
    subtitle: 'Senior secondary excellence, board revisions & competitive entrance coaching.',
    classes: ['11', '12'],
    subjects: [
      { name: 'Physics', icon: '⚛️', bg: '#FDF2F8', color: '#DB2777' },
      { name: 'Chemistry', icon: '🧪', bg: '#F0FDF4', color: '#059669' },
      { name: 'Mathematics', icon: '📐', bg: '#EFF6FF', color: '#2563EB' },
      { name: 'Biology', icon: '🧬', bg: '#FAF5FF', color: '#9333EA' },
      { name: 'Economics', icon: '📈', bg: '#FEF2F2', color: '#E11D48' },
      { name: 'Accountancy', icon: '₹', bg: '#FEF3C7', color: '#D97706' },
      { name: 'English', icon: '📖', bg: '#FFF7ED', color: '#D97706' },
      { name: 'Computer Science', icon: '💻', bg: '#EEF2FF', color: '#4F46E5' },
    ],
  },
};

const ClassDiscoveryPage = () => {
  const { classRange = '9-10' } = useParams();
  const navigate = useNavigate();

  const activeConfig = CLASS_CONFIGS[classRange] || CLASS_CONFIGS['9-10'];
  const [selectedClass, setSelectedClass] = useState(activeConfig.classes[0]);
  const [viewTab, setViewTab] = useState('tutors'); // 'tutors' | 'resources'

  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Sync default class when classRange param changes
  useEffect(() => {
    setSelectedClass(activeConfig.classes[0]);
  }, [classRange]);

  // Fetch real tutors
  useEffect(() => {
    let isMounted = true;
    const fetchTutors = async () => {
      try {
        setLoadingTutors(true);
        const res = await searchTutors({ class: selectedClass, limit: 10 });
        if (!isMounted) return;
        const list = res.data?.data?.tutors || res.data?.tutors || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setTutors(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        setTutors([]);
      } finally {
        if (isMounted) setLoadingTutors(false);
      }
    };

    fetchTutors();
    return () => { isMounted = false; };
  }, [selectedClass]);

  // Fetch real study resources
  useEffect(() => {
    let isMounted = true;
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const res = await searchStudyResources({ classLevel: selectedClass, limit: 12 });
        if (!isMounted) return;
        const list = res.data?.resources || res.data?.data?.resources || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setResources(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        setResources([]);
      } finally {
        if (isMounted) setLoadingResources(false);
      }
    };

    fetchResources();
    return () => { isMounted = false; };
  }, [selectedClass]);

  return (
    <div className="mn-cls-page">
      <div className="mn-cls-container">

        {/* Topbar */}
        <header className="mn-cls-topbar">
          <button type="button" className="mn-cls-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h1 className="mn-cls-header-title">{activeConfig.title}</h1>
          <div className="mn-cls-header-spacer"></div>
        </header>

        {/* Hero */}
        <section className="mn-cls-hero">
          <h2 className="mn-cls-hero-title">{activeConfig.title} Hub</h2>
          <p className="mn-cls-hero-desc">{activeConfig.subtitle}</p>
        </section>

        {/* Class Selection Chips */}
        <div className="mn-cls-chips-wrap">
          {activeConfig.classes.map((cls) => (
            <button
              key={cls}
              type="button"
              className={`mn-cls-chip ${selectedClass === cls ? 'active' : ''}`}
              onClick={() => setSelectedClass(cls)}
            >
              Class {cls}
            </button>
          ))}
        </div>

        {/* Subjects for this Class Range */}
        <div className="mn-cls-section-title">
          <span>Subjects (Class {selectedClass})</span>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Tap to view tutors &amp; materials</span>
        </div>

        <div className="mn-cls-subjects-grid">
          {activeConfig.subjects.map((sub) => (
            <Link
              key={sub.name}
              to={`/subject/${encodeURIComponent(sub.name)}?class=${selectedClass}`}
              className="mn-cls-subject-card"
            >
              <div className="mn-cls-subj-icon-box" style={{ background: sub.bg, color: sub.color }}>
                {sub.icon}
              </div>
              <h4 className="mn-cls-subj-name">{sub.name}</h4>
              <p className="mn-cls-subj-sub">Class {selectedClass} ›</p>
            </Link>
          ))}
        </div>

        {/* View Tabs: Tutors vs Resources */}
        <div className="mn-cls-view-tabs">
          <button
            type="button"
            className={`mn-cls-view-tab ${viewTab === 'tutors' ? 'active' : ''}`}
            onClick={() => setViewTab('tutors')}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span>Verified Tutors</span>
          </button>

          <button
            type="button"
            className={`mn-cls-view-tab ${viewTab === 'resources' ? 'active' : ''}`}
            onClick={() => setViewTab('resources')}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Study Resources</span>
          </button>
        </div>

        {/* Content: Tutors */}
        {viewTab === 'tutors' && (
          <div>
            {loadingTutors ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
                <div className="spinner" style={{ margin: '0 auto 10px', width: 28, height: 28 }}></div>
                <p style={{ fontSize: 12 }}>Loading Class {selectedClass} tutors...</p>
              </div>
            ) : tutors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tutors.map((tutor) => {
                  const tutorId = tutor._id || tutor.id;
                  const name = tutor.user?.name || tutor.name || 'Verified Tutor';
                  const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.user?.avatar || '';
                  const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.isVerified === true;
                  const qualification = tutor.qualifications?.[0]?.degree || tutor.qualification || tutor.bio || '';
                  const location = tutor.location?.city || tutor.location?.area || '';

                  return (
                    <div
                      key={tutorId}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 14,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: '#2563EB',
                          flexShrink: 0,
                        }}
                      >
                        {photo ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{name}</h4>
                          {isVerified && <span style={{ color: '#16A34A', fontSize: 12 }}>✓</span>}
                        </div>
                        {qualification && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{qualification}</p>}
                        {location && <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#94A3B8' }}>📍 {location}</p>}
                      </div>

                      <Link
                        to={`/tutor/${tutorId}`}
                        style={{
                          background: '#2563EB',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          textDecoration: 'none',
                          flexShrink: 0,
                        }}
                      >
                        View Profile
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 14, padding: '30px 16px', textAlign: 'center', color: '#64748B' }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>No tutors found for Class {selectedClass} yet.</p>
                <Link to="/search" style={{ color: '#2563EB', fontWeight: 700, fontSize: 12 }}>Search all available tutors</Link>
              </div>
            )}
          </div>
        )}

        {/* Content: Study Resources */}
        {viewTab === 'resources' && (
          <div>
            {loadingResources ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
                <div className="spinner" style={{ margin: '0 auto 10px', width: 28, height: 28 }}></div>
                <p style={{ fontSize: 12 }}>Loading Class {selectedClass} study materials...</p>
              </div>
            ) : resources.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {resources.slice(0, 12).map((res) => {
                  const isFormula = res.resourceType === 'FORMULA_SHEET';
                  return (
                    <Link
                      key={res._id || res.id}
                      to={`/subject/${encodeURIComponent(res.subject || 'Mathematics')}?class=${selectedClass}&tab=resources`}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: 12,
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: isFormula ? '#EFF6FF' : '#FEF2F2',
                            color: isFormula ? '#2563EB' : '#E11D48',
                            display: 'inline-block',
                            marginBottom: 6,
                          }}
                        >
                          {isFormula ? '📘 FORMULA' : '📝 NOTES'}
                        </span>
                        <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          {res.title}
                        </h4>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748B' }}>
                        <span>{res.subject} • Class {selectedClass}</span>
                        <span style={{ color: '#16A34A', fontWeight: 800 }}>Free ›</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 14, padding: '30px 16px', textAlign: 'center', color: '#64748B' }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>No materials found for Class {selectedClass} yet.</p>
                <Link to="/study-resources" style={{ color: '#2563EB', fontWeight: 700, fontSize: 12 }}>Explore all study resources</Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ClassDiscoveryPage;
