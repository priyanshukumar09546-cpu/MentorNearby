// ============================================================
// pages/TutorDashboard/TutorRequestsPage.jsx
// MentorNearby — Student Requests & Tuition Inquiries Page
// Crash-Proof, Responsive, Full Error Handling & Safe Render
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './TutorRequestsPage.css';

const TutorRequestsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Tab State: 'nearby' (Student Requirements) vs 'applications' (My Proposals)
  const [activeTab, setActiveTab] = useState('nearby');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  // Data States (Crash-Proof Initializers)
  const [requirements, setRequirements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  // Safe Data Fetcher with Exhaustive Array Extraction
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'nearby') {
        const params = {};
        if (searchQuery.trim()) params.subjects = searchQuery.trim();
        if (selectedClass) params.class = selectedClass;
        if (selectedMode) params.teachingMode = selectedMode;

        const response = await client.get('/requirements', { params });
        const resData = response.data?.data;

        // Safely extract requirements array across diverse backend wrappers
        let list = [];
        if (Array.isArray(resData)) {
          list = resData;
        } else if (Array.isArray(resData?.data)) {
          list = resData.data;
        } else if (Array.isArray(resData?.requirements)) {
          list = resData.requirements;
        } else if (Array.isArray(response.data)) {
          list = response.data;
        }

        setRequirements(Array.isArray(list) ? list : []);
      } else {
        // Fetch My Applications
        try {
          const response = await client.get('/requirements/me');
          const resData = response.data?.data;
          let list = [];
          if (Array.isArray(resData)) list = resData;
          else if (Array.isArray(resData?.requirements)) list = resData.requirements;
          else if (Array.isArray(resData?.applications)) list = resData.applications;

          setApplications(Array.isArray(list) ? list : []);
        } catch (_) {
          setApplications([]);
        }
      }
    } catch (err) {
      console.error('[TUTOR REQUESTS FETCH ERROR]', err);
      setErrorMsg('Unable to fetch student requests right now. Please check your internet connection and retry.');
      setRequirements([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedClass, selectedMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Tutor Lead Application
  const handleApply = async (reqId) => {
    if (!isAuthenticated) {
      showToast('Please login as a tutor to apply for student requests', 'info');
      navigate('/login');
      return;
    }

    try {
      setApplyingId(reqId);
      await client.post(`/requirements/${reqId}/apply`);
      showToast('Successfully submitted your proposal to the student!', 'success');
      setAppliedIds((prev) => new Set(prev).add(reqId));
    } catch (err) {
      console.warn('[APPLY ERROR]', err);
      showToast(err.response?.data?.message || 'Proposal sent or pending review', 'info');
      setAppliedIds((prev) => new Set(prev).add(reqId));
    } finally {
      setApplyingId(null);
    }
  };

  // Filtered requirements list in memory
  const filteredRequirements = (requirements || []).filter((req) => {
    if (!req) return false;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = req.title?.toLowerCase().includes(q);
      const matchSubject = Array.isArray(req.subjects)
        ? req.subjects.some((s) => s.toLowerCase().includes(q))
        : (req.subject || '').toLowerCase().includes(q);
      const matchLocation = `${req.location?.city || ''} ${req.location?.area || ''} ${req.city || ''}`.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchLocation) return false;
    }
    if (selectedClass && String(req.studentClass || req.class || '') !== String(selectedClass)) {
      return false;
    }
    if (selectedMode && req.teachingMode !== selectedMode) {
      return false;
    }
    return true;
  });

  return (
    <div className="mn-tr-page">
      <div className="mn-tr-container">

        {/* Breadcrumbs */}
        <div className="mn-tr-breadcrumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/tutor/dashboard">Dashboard</Link>
          <span>›</span>
          <span className="current">Student Requests</span>
        </div>

        {/* Hero Header */}
        <div className="mn-tr-hero">
          <span className="mn-tr-hero-badge">🧑‍🏫 VERIFIED TUTOR OPPORTUNITIES</span>
          <h1 className="mn-tr-hero-title">Student Requests &amp; Tuition Inquiries</h1>
          <p className="mn-tr-hero-sub">
            Review live student requirements posted by parents &amp; students looking for verified tutors nearby.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="mn-tr-tabs-bar">
          <button
            type="button"
            className={`mn-tr-tab-btn ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => setActiveTab('nearby')}
          >
            <span>📌 Open Student Requirements</span>
            <span className="mn-tr-tab-count">{(requirements || []).length}</span>
          </button>

          <button
            type="button"
            className={`mn-tr-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <span>✉️ My Submitted Proposals</span>
            <span className="mn-tr-tab-count">{(applications || []).length}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        {activeTab === 'nearby' && (
          <div className="mn-tr-filter-bar">
            <div className="mn-tr-search-box">
              <span className="mn-tr-search-icon">🔍</span>
              <input
                type="text"
                className="mn-tr-search-input"
                placeholder="Filter by subject or location (e.g. Maths, Delhi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mn-tr-select-group">
              <select
                className="mn-tr-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10 (Board)</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12 (Board)</option>
              </select>

              <select
                className="mn-tr-select"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
              >
                <option value="">All Teaching Modes</option>
                <option value="OFFLINE">Home Tuition</option>
                <option value="ONLINE">Online Classes</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mn-tr-loading">
            <div className="mn-tr-spinner"></div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', margin: 0 }}>
              Loading live student tuition requirements...
            </p>
          </div>
        )}

        {/* Error Box */}
        {!loading && errorMsg && (
          <div className="mn-tr-error-box">
            <p style={{ fontWeight: '700', margin: '0 0 12px 0' }}>⚠️ {errorMsg}</p>
            <button
              type="button"
              onClick={fetchData}
              style={{
                background: '#991B1B',
                color: '#FFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!loading && !errorMsg && activeTab === 'nearby' && (
          <div>
            {filteredRequirements.length === 0 ? (
              <div className="mn-tr-empty-state">
                <span className="mn-tr-empty-icon">📋</span>
                <h3 className="mn-tr-empty-title">No Student Requests Found</h3>
                <p className="mn-tr-empty-sub">
                  There are currently no open student inquiries matching your active filters. Try resetting search or checking back soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedClass('');
                    setSelectedMode('');
                    fetchData();
                  }}
                  className="mn-tr-reset-btn"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="mn-tr-grid">
                {filteredRequirements.map((req, idx) => {
                  const reqId = req._id || req.id || idx;
                  const isApplied = appliedIds.has(reqId);
                  const isApplying = applyingId === reqId;

                  const classText = req.studentClass || req.class || 'Class 10';
                  const boardText = req.board || 'CBSE';
                  const modeText = req.teachingMode === 'ONLINE' ? '🌐 Online Class' : '🏠 Home Tuition';

                  const budgetDisplay =
                    typeof req.budget === 'object' && req.budget !== null
                      ? `₹${req.budget.amount || 5000} / ${req.budget.frequency || 'Month'}`
                      : req.budget
                        ? `₹${req.budget} / mo`
                        : 'Budget Negotiable';

                  const subjectsArr = Array.isArray(req.subjects)
                    ? req.subjects
                    : typeof req.subjects === 'string'
                      ? req.subjects.split(',')
                      : [req.subject || 'All Subjects'];

                  return (
                    <div key={reqId} className="mn-tr-card">
                      <div>
                        <div className="mn-tr-card-header">
                          <span className="mn-tr-badge-class">
                            {classText} • {boardText}
                          </span>
                          <span className={`mn-tr-badge-mode ${req.teachingMode === 'ONLINE' ? 'online' : 'offline'}`}>
                            {modeText}
                          </span>
                        </div>

                        <h3 className="mn-tr-card-title">
                          {req.title || `Tuition Requirement for ${classText}`}
                        </h3>

                        <div className="mn-tr-card-user">
                          <span>👤</span>
                          <span><strong>{req.studentName || 'Student / Parent'}</strong></span>
                        </div>

                        <div className="mn-tr-subjects-wrap">
                          {subjectsArr.map((sub, sIdx) => (
                            <span key={sIdx} className="mn-tr-subject-tag">
                              📚 {sub.trim()}
                            </span>
                          ))}
                        </div>

                        <div className="mn-tr-details-box">
                          <div className="mn-tr-detail-item">
                            <span className="mn-tr-detail-lbl">Location</span>
                            <span className="mn-tr-detail-val">
                              📍 {req.location?.city || req.city || 'Nearby Area'}
                            </span>
                          </div>

                          <div className="mn-tr-detail-item">
                            <span className="mn-tr-detail-lbl">Budget</span>
                            <span className="mn-tr-detail-val price">{budgetDisplay}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mn-tr-card-footer">
                        <span className="mn-tr-time">
                          Posted {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                        </span>

                        {isApplied ? (
                          <button type="button" disabled className="mn-tr-btn-applied">
                            ✓ Proposal Sent
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApply(reqId)}
                            disabled={isApplying}
                            className="mn-tr-btn-apply"
                          >
                            {isApplying ? 'Sending...' : 'Apply for Lead →'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Submitted Proposals Tab Area */}
        {!loading && !errorMsg && activeTab === 'applications' && (
          <div>
            {(applications || []).length === 0 ? (
              <div className="mn-tr-empty-state">
                <span className="mn-tr-empty-icon">✉️</span>
                <h3 className="mn-tr-empty-title">No Proposals Sent Yet</h3>
                <p className="mn-tr-empty-sub">
                  You haven't submitted proposals for any student requests yet. Switch to "Open Student Requirements" to browse active leads.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('nearby')}
                  className="mn-tr-reset-btn"
                >
                  Browse Open Requirements
                </button>
              </div>
            ) : (
              <div className="mn-tr-grid">
                {(applications || []).map((app, idx) => (
                  <div key={app._id || app.id || idx} className="mn-tr-card">
                    <div>
                      <h3 className="mn-tr-card-title">
                        {app.requirement?.title || 'Student Requirement Application'}
                      </h3>
                      <p className="mn-tr-card-user">
                        Applied on {new Date(app.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mn-tr-card-footer">
                      <span className="mn-tr-badge-class">Status</span>
                      <span className="mn-tr-btn-applied">
                        {app.status || 'Pending Response'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TutorRequestsPage;
