// ============================================================
// pages/FindStudents/FindStudentsPage.jsx
// MentorNearby — Find Students / Student Tuition Requirements Page
// Enables Verified Tutors to Search, Browse, & Apply for Student Leads
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './FindStudentsPage.css';

const FindStudentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('subject') || '');
  const [classGrade, setClassGrade] = useState(searchParams.get('class') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('city') || '');
  const [teachingMode, setTeachingMode] = useState(searchParams.get('mode') || '');

  // Data States
  const [requirements, setRequirements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  // Fetch Open Tuition Requirements from Backend API
  const fetchStudentRequirements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.subject = searchQuery;
      if (classGrade) params.class = classGrade;
      if (location) params.location = location;
      if (teachingMode) params.mode = teachingMode;

      // Primary endpoint for open requirements
      const response = await client.get('/requirements', { params });
      const payload = response.data?.data || response.data;
      const list = payload?.requirements || payload?.data || (Array.isArray(payload) ? payload : []);
      const total = payload?.total ?? payload?.count ?? list.length;

      setRequirements(Array.isArray(list) ? list : []);
      setTotalCount(total);
    } catch (err) {
      console.warn('Failed to fetch open requirements, trying public fallback:', err);
      try {
        const fallbackRes = await client.get('/requirements/me');
        const fallbackList = fallbackRes.data?.data?.requirements || [];
        setRequirements(fallbackList);
        setTotalCount(fallbackList.length);
      } catch (_) {
        setError('Unable to load student leads. Please check your connection.');
        setRequirements([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentRequirements();
  }, [classGrade, teachingMode]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (searchQuery) newParams.q = searchQuery;
    if (classGrade) newParams.class = classGrade;
    if (location) newParams.location = location;
    if (teachingMode) newParams.mode = teachingMode;
    setSearchParams(newParams);
    fetchStudentRequirements();
  };

  const handleApplyLead = async (reqId) => {
    if (!isAuthenticated) {
      showToast('Please login as a tutor to apply for student leads', 'info');
      navigate('/login');
      return;
    }

    const userRole = (user?.role || user?.user?.role || '').toString().toUpperCase();
    if (userRole !== 'TUTOR' && userRole !== 'ADMIN') {
      showToast('Only registered Tutors can apply for student requirements', 'warning');
      return;
    }

    try {
      setApplyingId(reqId);
      await client.post(`/requirements/${reqId}/apply`);
      showToast('Successfully submitted your proposal to the student!', 'success');
      setAppliedIds((prev) => new Set(prev).add(reqId));
    } catch (err) {
      showToast(err.response?.data?.message || 'Application submitted or pending response', 'info');
      setAppliedIds((prev) => new Set(prev).add(reqId));
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="mn-fs-page">
      {/* Hero Banner Section */}
      <section className="mn-fs-hero">
        <div className="mn-fs-hero-content">
          <span className="mn-fs-hero-badge">🧑‍🏫 FOR VERIFIED TUTORS &amp; TEACHERS</span>
          <h1 className="mn-fs-hero-title">Find Students Near You</h1>
          <p className="mn-fs-hero-subtitle">
            Browse active home tuition requirements and online student inquiries. Connect directly with parents and students looking for quality education.
          </p>

          {/* Search Bar */}
          <form className="mn-fs-search-form" onSubmit={handleSearchSubmit}>
            <div className="mn-fs-input-wrap">
              <span className="mn-fs-input-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by subject (e.g. Maths, Physics, Chemistry)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mn-fs-input"
              />
            </div>

            <div className="mn-fs-input-wrap">
              <span className="mn-fs-input-icon">📍</span>
              <input
                type="text"
                placeholder="City or Area (e.g. Delhi, Mumbai, Sector 62)..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mn-fs-input"
              />
            </div>

            <button type="submit" className="mn-fs-search-btn">
              Find Student Leads
            </button>
          </form>
        </div>
      </section>

      {/* Main Content & Filter Section */}
      <div className="mn-fs-container">
        {/* Filter Controls Bar */}
        <div className="mn-fs-filter-bar">
          <div className="mn-fs-filter-group">
            <label className="mn-fs-filter-label">Class Level:</label>
            <select
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              className="mn-fs-select"
            >
              <option value="">All Classes (Class 1–12)</option>
              <option value="Class 1-5">Class 1 – 5 (Primary)</option>
              <option value="Class 6-8">Class 6 – 8 (Middle)</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10 (Board)</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12 (Board)</option>
              <option value="Competitive Exam">JEE / NEET / Competitive</option>
            </select>
          </div>

          <div className="mn-fs-filter-group">
            <label className="mn-fs-filter-label">Teaching Mode:</label>
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value)}
              className="mn-fs-select"
            >
              <option value="">All Modes (Home &amp; Online)</option>
              <option value="OFFLINE">Home Tuition (Offline)</option>
              <option value="ONLINE">Online Classes</option>
              <option value="BOTH">Both Home &amp; Online</option>
            </select>
          </div>

          <div className="mn-fs-stats-pill">
            <span>🎯 Active Inquiries: <strong>{totalCount} Student Leads</strong></span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="mn-fs-loading">
            <div className="mn-fs-spinner"></div>
            <p>Searching verified student tuition requirements...</p>
          </div>
        )}

        {/* Error Box */}
        {!loading && error && (
          <div className="mn-fs-error-box">
            <p>⚠️ {error}</p>
            <button onClick={fetchStudentRequirements} className="mn-fs-retry-btn">
              Retry Search
            </button>
          </div>
        )}

        {/* Student Requirements Grid */}
        {!loading && !error && (
          <div>
            {requirements.length === 0 ? (
              <div className="mn-fs-empty-state">
                <span className="mn-fs-empty-icon">📋</span>
                <h3 className="mn-fs-empty-title">No Student Leads Found</h3>
                <p className="mn-fs-empty-sub">
                  No active student tuition requirements matched your current filters. Try resetting your search query or class filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setClassGrade('');
                    setLocation('');
                    setTeachingMode('');
                    setSearchParams({});
                    fetchStudentRequirements();
                  }}
                  className="mn-fs-reset-btn"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="mn-fs-grid">
                {requirements.map((req, idx) => {
                  const reqId = req._id || req.id || idx;
                  const isApplied = appliedIds.has(reqId);
                  const isApplying = applyingId === reqId;

                  const budgetText =
                    typeof req.budget === 'object' && req.budget !== null
                      ? `₹${req.budget.amount || 0}/${req.budget.frequency === 'Hour' ? 'hr' : 'mo'}`
                      : req.budget
                        ? `₹${req.budget}/mo`
                        : 'Budget Negotiable';

                  const subjectsList = Array.isArray(req.subjects)
                    ? req.subjects
                    : typeof req.subjects === 'string'
                      ? req.subjects.split(',')
                      : [req.subject || 'All Subjects'];

                  const classText = req.studentClass || req.class || 'Class 10';
                  const boardText = req.board || 'CBSE';

                  return (
                    <div key={reqId} className="mn-fs-card">
                      <div className="mn-fs-card-header">
                        <span className="mn-fs-class-badge">
                          {classText} • {boardText}
                        </span>
                        <span
                          className={`mn-fs-mode-badge ${
                            req.teachingMode === 'ONLINE' ? 'online' : 'offline'
                          }`}
                        >
                          {req.teachingMode === 'ONLINE'
                            ? '🌐 Online Class'
                            : '🏠 Home Tuition'}
                        </span>
                      </div>

                      <Link to={`/students/${reqId}`} className="hover:underline">
                        <h3 className="mn-fs-card-title">{req.title || `Tuition Needed for ${classText}`}</h3>
                      </Link>

                      <p className="mn-fs-card-meta">
                        👤 <strong>{req.studentName || 'Student'}</strong> • Posted {new Date(req.createdAt || Date.now()).toLocaleDateString()}
                      </p>

                      {/* Subjects Badges */}
                      <div className="mn-fs-subjects-row">
                        {subjectsList.map((sub, sIdx) => (
                          <span key={sIdx} className="mn-fs-subject-tag">
                            📚 {sub.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Details Box */}
                      <div className="mn-fs-card-details">
                        <div className="mn-fs-detail-item">
                          <span className="mn-fs-detail-label">Location</span>
                          <span className="mn-fs-detail-value">
                            📍 {req.location?.city || req.city || 'Nearby Area'} {req.area ? `, ${req.area}` : ''}
                          </span>
                        </div>

                        <div className="mn-fs-detail-item">
                          <span className="mn-fs-detail-label">Monthly Budget</span>
                          <span className="mn-fs-detail-value highlight">{budgetText}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mn-fs-card-footer">
                        <div className="mn-fs-status-tag">
                          <span>Status:</span>
                          <span className="mn-fs-status-open">🟢 Open Requirement</span>
                        </div>

                        <div className="mn-fs-btn-row">
                          <Link
                            to={`/students/${reqId}`}
                            className="mn-fs-view-btn"
                            title="View Full Student Details"
                          >
                            👁️ View Profile
                          </Link>

                          {isApplied ? (
                            <button type="button" disabled className="mn-fs-applied-btn">
                              ✓ Unlocked
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplyLead(reqId)}
                              disabled={isApplying}
                              className="mn-fs-apply-btn"
                            >
                              {isApplying ? 'Unlocking...' : '🔓 Unlock Contact'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindStudentsPage;
