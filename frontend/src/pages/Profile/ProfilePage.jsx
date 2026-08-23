import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateStudentProfile, updateUserProfile } from '../../api/users';
import { getTutors } from '../../api/tutors';
import { useToast } from '../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { calculateStudentCompletion } from '../../utils/profileCompletion';
import client from '../../api/client';
import './StudentProfile.css';
import '../TutorProfile/TutorProfilePage.css';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Active Edit Modal ('basic' | 'bio' | 'academic' | 'goals' | 'subjects' | 'mode' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Form States
  const [basicForm, setBasicForm] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    city: '',
    state: '',
    area: '',
    pincode: ''
  });

  const [bioForm, setBioForm] = useState({
    bio: ''
  });

  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    grade: '',
    board: '',
    location: '',
    session: '',
    stream: '',
    medium: ''
  });

  const [goalsList, setGoalsList] = useState([]);
  const [newGoalInput, setNewGoalInput] = useState('');

  const [subjectsList, setSubjectsList] = useState([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  const [modesList, setModesList] = useState([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      const pData = res.data.data;
      setProfileData(pData);

      const stUser = pData.user || user;
      const stProfile = pData.profile || {};

      if (stUser?.role === 'STUDENT' || stUser?.role === 'PARENT') {
        // Hydrate forms
        setBasicForm({
          name: stUser.name || '',
          phone: stUser.phone || '',
          whatsappNumber: stProfile.whatsappNumber || '',
          city: stProfile.location?.city || '',
          state: stProfile.location?.state || '',
          area: stProfile.location?.area || '',
          pincode: stProfile.location?.pincode || ''
        });

        setBioForm({
          bio: stProfile.bio || stProfile.aboutMe || ''
        });

        const school = stProfile.schoolDetails || {};
        setSchoolForm({
          schoolName: school.schoolName || '',
          grade: school.grade || '',
          board: school.board || '',
          location: school.location || '',
          session: school.session || '',
          stream: school.stream || '',
          medium: school.medium || ''
        });

        const goals = stProfile.learningGoals || acad.learningGoals || [];
        setGoalsList(Array.isArray(goals) ? goals : (goals ? [goals] : []));

        const subs = stProfile.preferredSubjects || acad.preferredSubjects || acad.subjectsRequired || [];
        setSubjectsList(Array.isArray(subs) ? subs : (subs ? [subs] : []));

        const modes = stProfile.preferredModes || (stProfile.tuitionRequirements?.mode ? [stProfile.tuitionRequirements.mode] : []);
        setModesList(Array.isArray(modes) ? modes : (modes ? [modes] : []));
      }
    } catch (err) {
      showToast('Failed to load profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── Photo Upload Handler ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const uploadRes = await client.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = uploadRes.data.data.url;
      const publicId = uploadRes.data.data.publicId || '';

      await updateUserProfile({ avatar: photoUrl });
      await updateStudentProfile({ profilePhoto: { url: photoUrl, publicId } });

      showToast('Profile photo updated successfully!', 'success');
      fetchProfile();
      if (refreshUser) refreshUser();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Save Basic Info ──
  const handleSaveBasic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name: basicForm.name.trim(),
        phone: basicForm.phone.trim()
      });

      await updateStudentProfile({
        whatsappNumber: basicForm.whatsappNumber.trim(),
        location: {
          city: basicForm.city.trim(),
          state: basicForm.state.trim(),
          area: basicForm.area.trim(),
          pincode: basicForm.pincode.trim()
        }
      });

      showToast('Basic information saved!', 'success');
      setActiveModal(null);
      fetchProfile();
      if (refreshUser) refreshUser();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save basic info', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Save Bio ──
  const handleSaveBio = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStudentProfile({
        bio: bioForm.bio.trim(),
        aboutMe: bioForm.bio.trim()
      });

      showToast('Bio updated successfully!', 'success');
      setActiveModal(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bio', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Save School Details ──
  const handleSaveSchool = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStudentProfile({
        schoolDetails: {
          schoolName: schoolForm.schoolName.trim(),
          grade: schoolForm.grade.trim(),
          board: schoolForm.board.trim(),
          location: schoolForm.location.trim(),
          session: schoolForm.session.trim(),
          stream: schoolForm.stream.trim(),
          medium: schoolForm.medium.trim()
        }
      });

      showToast('School details saved!', 'success');
      setActiveModal(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save school details', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Save Learning Goals ──
  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      await updateStudentProfile({
        learningGoals: goalsList
      });

      showToast('Learning goals saved!', 'success');
      setActiveModal(null);
      fetchProfile();
    } catch (err) {
      showToast('Failed to save learning goals', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setGoalsList([...goalsList, newGoalInput.trim()]);
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index) => {
    setGoalsList(goalsList.filter((_, i) => i !== index));
  };

  // ── Save Preferred Subjects ──
  const handleSaveSubjects = async () => {
    setSaving(true);
    try {
      await updateStudentProfile({
        preferredSubjects: subjectsList,
        academicDetails: {
          ...(profileData?.profile?.academicDetails || {}),
          subjectsRequired: subjectsList,
          preferredSubjects: subjectsList
        }
      });

      showToast('Preferred subjects saved!', 'success');
      setActiveModal(null);
      fetchProfile();
    } catch (err) {
      showToast('Failed to save preferred subjects', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    if (!subjectsList.includes(newSubjectInput.trim())) {
      setSubjectsList([...subjectsList, newSubjectInput.trim()]);
    }
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (sub) => {
    setSubjectsList(subjectsList.filter((s) => s !== sub));
  };

  // ── Save Preferred Learning Mode ──
  const handleSaveModes = async () => {
    setSaving(true);
    try {
      await updateStudentProfile({
        preferredModes: modesList,
        tuitionRequirements: {
          ...(profileData?.profile?.tuitionRequirements || {}),
          mode: modesList[0] || 'Online'
        }
      });

      showToast('Learning mode preferences saved!', 'success');
      setActiveModal(null);
      fetchProfile();
    } catch (err) {
      showToast('Failed to save learning mode', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = (mode) => {
    if (modesList.includes(mode)) {
      setModesList(modesList.filter((m) => m !== mode));
    } else {
      setModesList([...modesList, mode]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 font-sans">
        <div className="text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-semibold text-sm">Loading Student Profile...</p>
        </div>
      </div>
    );
  }

  const currentUser = profileData?.user || user;
  const currentProfile = profileData?.profile || {};
  const stats = profileData?.stats || { enrolledCourses: 0, upcomingSessions: 0, completedSessions: 0, totalSpent: 0 };
  const recentBookings = profileData?.recentBookings || [];
  const reviewsGiven = profileData?.reviewsGiven || [];
  const badges = profileData?.badges || [];
  const role = currentUser?.role || 'STUDENT';

  // If Tutor, redirect to Tutor Profile view
  if (role === 'TUTOR') {
    navigate('/tutor/profile/edit');
    return null;
  }

  if (role === 'ADMIN') {
    navigate('/admin');
    return null;
  }

  // Profile data values
  const photoUrl = currentProfile.profilePhoto?.url || currentUser.avatar || '';
  const studentName = currentUser.name || 'Student';
  const initial = studentName.charAt(0).toUpperCase();
  const isVerified = currentUser.emailVerified && currentUser.phoneVerified;

  const locationStr = [currentProfile.location?.area, currentProfile.location?.city, currentProfile.location?.state]
    .filter(Boolean)
    .join(', ');

  const { percentage: completionPct, checklist } = calculateStudentCompletion(currentUser, currentProfile);

  // Pill color generator for subjects
  const getSubjectColorClass = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
    return colors[index % colors.length];
  };

  return (
    <div className="sp-layout">
      
      {/* Hidden File Input for 1-Click Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        style={{ display: 'none' }}
      />

      {/* ========================================================
          LEFT SIDEBAR
          ======================================================== */}
      <aside className="sp-sidebar">
        <div className="sp-sidebar-top">
          
          {/* Brand Logo */}
          <Link to="/" className="sp-brand">
            <img src="/logo.png" alt="MentorNearby" className="sp-brand-logo" />
            <span className="sp-brand-name">MentorNearby</span>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Student Profile Sidebar">
            <ul className="sp-nav-list">
              <li>
                <Link to="/dashboard" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">🏠</span>
                    <span>Dashboard</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/search" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">🔍</span>
                    <span>Find Tutors</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/courses" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">📖</span>
                    <span>My Learning</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/student/requirements" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">📅</span>
                    <span>My Bookings</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/messages" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">✉️</span>
                    <span>Messages</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="sp-nav-link active">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">👤</span>
                    <span>My Profile</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/my-courses" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">📺</span>
                    <span>My Courses</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/study-resources" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">📚</span>
                    <span>Study Resources</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/saved-tutors" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">⭐</span>
                    <span>Saved Tutors</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">📝</span>
                    <span>Reviews</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/student/purchases" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">💳</span>
                    <span>Payment History</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">⚙️</span>
                    <span>Settings</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="sp-nav-link">
                  <div className="sp-nav-left">
                    <span className="sp-nav-icon">❓</span>
                    <span>Help &amp; Support</span>
                  </div>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Refer & Earn Card */}
          <div className="sp-refer-card">
            <span className="sp-refer-title">Refer &amp; Earn</span>
            <span className="sp-refer-sub">Invite your friends and earn exciting rewards!</span>
            <button
              onClick={() => showToast('Your referral link has been copied!', 'success')}
              className="sp-refer-btn"
            >
              Refer Now
            </button>
            <span className="sp-refer-gift">🎁</span>
          </div>

        </div>
      </aside>

      {/* ========================================================
          MAIN CONTAINER
          ======================================================== */}
      <div className="sp-main-container">
        
        {/* Top Header */}
        <header className="sp-topbar">
          <div className="sp-search-box">
            <span className="sp-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search tutors, subjects or topics..."
              className="sp-search-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
            />
          </div>

          <div className="sp-topbar-right">
            <Link to="/notifications" className="sp-icon-btn" title="Notifications">
              <span>🔔</span>
            </Link>
            <Link to="/messages" className="sp-icon-btn" title="Messages">
              <span>💬</span>
            </Link>
            
            <div className="sp-user-pill" onClick={() => setActiveModal('basic')}>
              {photoUrl ? (
                <img src={photoUrl} alt={studentName} className="sp-avatar-sm" />
              ) : (
                <div className="sp-avatar-fallback-sm">{initial}</div>
              )}
              <div className="sp-user-info-sm">
                <span className="sp-user-name-sm">{studentName}</span>
                <span className="sp-user-role-sm">Student</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="sp-content">
          
          {/* 1. TOP PROFILE HERO CARD */}
          <section className="sp-hero-card">
            
            {/* Avatar with Upload Trigger */}
            <div className="sp-avatar-wrapper">
              {photoUrl ? (
                <img src={photoUrl} alt={studentName} className="sp-avatar-img" />
              ) : (
                <div className="sp-avatar-fallback-lg">{initial}</div>
              )}
              <button
                className="sp-photo-edit-btn"
                title="Change Profile Photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? '⏳' : '📷'}
              </button>
            </div>

            {/* Identity Info */}
            <div className="sp-hero-identity">
              <div className="sp-name-row">
                <h1 className="sp-student-name">{studentName}</h1>
                {isVerified && (
                  <span className="sp-verified-badge" title="Verified Account">✓</span>
                )}
              </div>

              <span className="sp-role-badge">
                <span>🎓</span> Student
              </span>

              <div className="sp-meta-list">
                <div className="sp-meta-item">
                  <span className="sp-meta-icon">📍</span>
                  <span>{locationStr || 'Location not added yet'}</span>
                </div>

                <div className="sp-meta-item">
                  <span className="sp-meta-icon">✉️</span>
                  <span>{currentUser.email || 'Email not available'}</span>
                </div>

                <div className="sp-meta-item">
                  <span className="sp-meta-icon">📞</span>
                  <span>{currentUser.phone || currentProfile.whatsappNumber || 'Phone not added yet'}</span>
                </div>
              </div>
            </div>

            {/* Profile Completion Panel */}
            <div className="sp-completion-panel">
              <div className="sp-completion-header">
                <span className="sp-completion-title">Profile Completion</span>
                <span className="sp-completion-pct">{completionPct}% Complete</span>
              </div>

              <div className="sp-progress-track">
                <div className="sp-progress-fill" style={{ width: `${completionPct}%` }}></div>
              </div>

              <ul className="sp-checklist">
                {checklist.map((item) => (
                  <li key={item.id} className="sp-check-item">
                    <div className="sp-check-left">
                      <span className={item.completed ? 'sp-check-icon-done' : 'sp-check-icon-todo'}>
                        {item.completed ? '✓' : '•'}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <span className={`sp-check-state-circle ${item.completed ? 'done' : 'todo'}`}>
                      {item.completed ? '✓' : ''}
                    </span>
                  </li>
                ))}
              </ul>

              {completionPct < 100 && (
                <button
                  className="sp-complete-profile-btn"
                  onClick={() => setActiveModal('basic')}
                >
                  Complete Profile
                </button>
              )}
            </div>

          </section>

          {/* 2. FOUR KPI STAT METRIC CARDS */}
          <section className="sp-kpi-grid">
            
            {/* Card 1: Enrolled Courses */}
            <div className="sp-kpi-card">
              <div className="sp-kpi-icon-box blue">📖</div>
              <div className="sp-kpi-info">
                <span className="sp-kpi-label">Enrolled Courses</span>
                <span className="sp-kpi-val">{stats.enrolledCourses || 0}</span>
                <span className="sp-kpi-sub blue">Active Courses</span>
              </div>
            </div>

            {/* Card 2: Upcoming Sessions */}
            <div className="sp-kpi-card">
              <div className="sp-kpi-icon-box green">📅</div>
              <div className="sp-kpi-info">
                <span className="sp-kpi-label">Upcoming Sessions</span>
                <span className="sp-kpi-val">{stats.upcomingSessions || 0}</span>
                <span className="sp-kpi-sub green">This Week</span>
              </div>
            </div>

            {/* Card 3: Completed Sessions */}
            <div className="sp-kpi-card">
              <div className="sp-kpi-icon-box purple">✓</div>
              <div className="sp-kpi-info">
                <span className="sp-kpi-label">Completed Sessions</span>
                <span className="sp-kpi-val">{stats.completedSessions || 0}</span>
                <span className="sp-kpi-sub purple">Sessions</span>
              </div>
            </div>

            {/* Card 4: Total Spent */}
            <div className="sp-kpi-card">
              <div className="sp-kpi-icon-box amber">💳</div>
              <div className="sp-kpi-info">
                <span className="sp-kpi-label">Total Spent</span>
                <span className="sp-kpi-val">₹{(stats.totalSpent || 0).toLocaleString()}</span>
                <span className="sp-kpi-sub amber">Total Amount</span>
              </div>
            </div>

          </section>

          {/* 3. TWO-COLUMN MAIN CONTENT GRID */}
          <div className="sp-main-grid">
            
            {/* ── LEFT COLUMN ── */}
            <div className="sp-col">
              
              {/* About Me Card */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">About Me</h2>
                  <button
                    className="sp-edit-btn"
                    title="Edit About Me"
                    onClick={() => setActiveModal('bio')}
                  >
                    ✏️
                  </button>
                </div>

                <div className="sp-about-text">
                  {currentProfile.bio || currentProfile.aboutMe ? (
                    currentProfile.bio || currentProfile.aboutMe
                  ) : (
                    <span className="sp-empty-text">No bio added yet. Click ✏️ to introduce yourself!</span>
                  )}
                </div>
              </div>

              {/* School Details Card */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">School Details</h2>
                  <button
                    className="sp-edit-btn"
                    title="Edit School Details"
                    onClick={() => setActiveModal('academic')}
                  >
                    ✏️
                  </button>
                </div>

                <div className="sp-degree-banner">
                  <div className="sp-degree-left">
                    <span className="sp-cap-icon">🏫</span>
                    <div>
                      <div className="sp-degree-title">
                        {currentProfile.schoolDetails?.schoolName || 'School Name not added'}
                      </div>
                      <div className="sp-college-name">
                        {currentProfile.schoolDetails?.location || 'Location not added'}
                      </div>
                    </div>
                  </div>

                  {currentProfile.schoolDetails?.session && (
                    <span className="sp-year-pill">{currentProfile.schoolDetails.session}</span>
                  )}
                </div>

                {/* 4-Box Metric Grid */}
                <div className="sp-academic-4grid">
                  <div className="sp-sub-box">
                    <span className="sp-sub-box-label">Class / Grade</span>
                    <span className="sp-sub-box-val">{currentProfile.schoolDetails?.grade || '—'}</span>
                  </div>
                  <div className="sp-sub-box">
                    <span className="sp-sub-box-label">Board</span>
                    <span className="sp-sub-box-val">{currentProfile.schoolDetails?.board || '—'}</span>
                  </div>
                  <div className="sp-sub-box">
                    <span className="sp-sub-box-label">Stream</span>
                    <span className="sp-sub-box-val">{currentProfile.schoolDetails?.stream || '—'}</span>
                  </div>
                  <div className="sp-sub-box">
                    <span className="sp-sub-box-label">Medium</span>
                    <span className="sp-sub-box-val">{currentProfile.schoolDetails?.medium || '—'}</span>
                  </div>
                </div>

                {/* Preferred Subjects Row */}
                <div className="sp-school-row" style={{ marginTop: '16px' }}>
                  <div className="sp-school-left">
                    <span className="sp-school-icon">📚</span>
                    <div>
                      <div className="sp-school-title">Preferred Subjects</div>
                      <div className="sp-school-board">
                        {currentProfile.preferredSubjects?.length > 0
                          ? currentProfile.preferredSubjects.join(', ')
                          : 'No subjects specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Recent Bookings */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">My Recent Bookings</h2>
                  <Link to="/student/requirements" className="sp-view-all">View All</Link>
                </div>

                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <div key={b._id} className="sp-booking-item">
                      <div className="sp-booking-left">
                        {b.tutor?.avatar ? (
                          <img src={b.tutor.avatar} alt={b.tutor.name} className="sp-tutor-avatar" />
                        ) : (
                          <div className="sp-avatar-fallback-sm">{b.tutor?.name?.charAt(0) || 'T'}</div>
                        )}
                        <div>
                          <div className="sp-booking-title">{b.requirement?.subject || 'Tuition Session'}</div>
                          <div className="sp-booking-sub">Tutor: {b.tutor?.name || 'Assigned Tutor'} • {new Date(b.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className={`sp-status-pill ${(b.status || 'PENDING').toLowerCase()}`}>
                        {b.status || 'Pending'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="sp-empty-text">No bookings yet. Find and connect with top tutors nearby!</span>
                )}
              </div>

              {/* Reviews Given */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">Reviews Given</h2>
                  <Link to="/bookmarks" className="sp-view-all">View All</Link>
                </div>

                {reviewsGiven.length > 0 ? (
                  reviewsGiven.map((r) => (
                    <div key={r._id} className="sp-review-card">
                      <div className="sp-review-top">
                        <div className="sp-booking-left">
                          {r.tutor?.avatar ? (
                            <img src={r.tutor.avatar} alt={r.tutor.name} className="sp-tutor-avatar" />
                          ) : (
                            <div className="sp-avatar-fallback-sm">{r.tutor?.name?.charAt(0) || 'T'}</div>
                          )}
                          <div>
                            <div className="sp-booking-title">{r.tutor?.name || 'Tutor'}</div>
                            <div className="sp-booking-sub">{new Date(r.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="sp-stars-row">{'★'.repeat(r.rating || 5)}</div>
                      </div>
                      <div className="sp-review-comment">{r.comment}</div>
                    </div>
                  ))
                ) : (
                  <span className="sp-empty-text">You haven't submitted any reviews yet.</span>
                )}
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="sp-col">
              
              {/* Learning Goals */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">Learning Goals</h2>
                  <button
                    className="sp-edit-btn"
                    title="Edit Learning Goals"
                    onClick={() => setActiveModal('goals')}
                  >
                    ✏️
                  </button>
                </div>

                {goalsList.length > 0 ? (
                  <div className="sp-goals-list">
                    {goalsList.map((goal, idx) => (
                      <div key={idx} className="sp-goal-item">
                        <span className="sp-goal-icon">🎯</span>
                        <span>{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="sp-empty-text">No learning goals added yet. Click ✏️ to add your goals!</span>
                )}
              </div>

              {/* Preferred Subjects */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">Preferred Subjects</h2>
                  <button
                    className="sp-edit-btn"
                    title="Edit Preferred Subjects"
                    onClick={() => setActiveModal('subjects')}
                  >
                    ✏️
                  </button>
                </div>

                {subjectsList.length > 0 ? (
                  <div className="sp-subjects-wrap">
                    {subjectsList.map((sub, idx) => (
                      <span key={idx} className={`sp-subject-pill ${getSubjectColorClass(idx)}`}>
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="sp-empty-text">No preferred subjects added yet. Click ✏️ to select subjects!</span>
                )}
              </div>

              {/* Preferred Learning Mode */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">Preferred Learning Mode</h2>
                  <button
                    className="sp-edit-btn"
                    title="Edit Learning Mode"
                    onClick={() => setActiveModal('mode')}
                  >
                    ✏️
                  </button>
                </div>

                <div className="sp-mode-list">
                  {[
                    { id: 'Online', label: 'Online Classes', icon: '💻' },
                    { id: 'Offline', label: 'Offline Classes', icon: '🏠' },
                    { id: 'Hybrid', label: 'Hybrid', icon: '🔄' }
                  ].map((m) => {
                    const isSelected = modesList.includes(m.id);
                    return (
                      <div key={m.id} className="sp-mode-item">
                        <div className="sp-mode-left">
                          <span className="sp-mode-icon">{m.icon}</span>
                          <span>{m.label}</span>
                        </div>
                        <span className={`sp-mode-check-circle ${isSelected ? 'active' : 'inactive'}`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My Badges */}
              <div className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-card-title">My Badges</h2>
                  <span className="sp-view-all" style={{ cursor: 'pointer' }}>View All</span>
                </div>

                {badges.length > 0 ? (
                  <div className="sp-badges-grid">
                    {badges.map((b, idx) => (
                      <div key={idx} className="sp-badge-item">
                        <div className={`sp-badge-hex ${b.color === '#2563EB' ? 'blue' : idx === 1 ? 'orange' : 'purple'}`}>
                          {b.icon || '🌟'}
                        </div>
                        <span className="sp-badge-label">{b.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="sp-empty-text">No badges earned yet. Complete lessons to unlock badges!</span>
                )}
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* ========================================================
          MODAL 1: EDIT BASIC INFORMATION & LOCATION
          ======================================================== */}
      {activeModal === 'basic' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit Basic Information</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveBasic}>
              <div className="sp-modal-body">
                <div className="sp-form-group">
                  <label className="sp-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="sp-input"
                    value={basicForm.name}
                    onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                  />
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">Phone Number</label>
                    <input
                      type="tel"
                      className="sp-input"
                      value={basicForm.phone}
                      onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">WhatsApp Number</label>
                    <input
                      type="tel"
                      className="sp-input"
                      value={basicForm.whatsappNumber}
                      onChange={(e) => setBasicForm({ ...basicForm, whatsappNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">City</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. Ghaziabad"
                      value={basicForm.city}
                      onChange={(e) => setBasicForm({ ...basicForm, city: e.target.value })}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">State</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. Uttar Pradesh"
                      value={basicForm.state}
                      onChange={(e) => setBasicForm({ ...basicForm, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">Area / Locality</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. Sector 62"
                      value={basicForm.area}
                      onChange={(e) => setBasicForm({ ...basicForm, area: e.target.value })}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">PIN Code</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. 201309"
                      value={basicForm.pincode}
                      onChange={(e) => setBasicForm({ ...basicForm, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="sp-modal-footer">
                <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sp-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT ABOUT ME / BIO
          ======================================================== */}
      {activeModal === 'bio' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit About Me</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveBio}>
              <div className="sp-modal-body">
                <div className="sp-form-group">
                  <label className="sp-label">Short Bio &amp; Learning Interests</label>
                  <textarea
                    rows={6}
                    className="sp-textarea"
                    placeholder="Tell tutors about your background, interests, and what you want to achieve..."
                    value={bioForm.bio}
                    onChange={(e) => setBioForm({ bio: e.target.value })}
                  />
                </div>
              </div>
              <div className="sp-modal-footer">
                <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sp-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Bio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: EDIT ACADEMIC DETAILS
          ======================================================== */}
      {activeModal === 'academic' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit School Details</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveSchool}>
              <div className="sp-modal-body">
                <div className="sp-form-group">
                  <label className="sp-label">School Name</label>
                  <input
                    type="text"
                    className="sp-input"
                    placeholder="e.g. Delhi Public School"
                    value={schoolForm.schoolName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                  />
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">Class / Grade</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. Class 10"
                      value={schoolForm.grade}
                      onChange={(e) => setSchoolForm({ ...schoolForm, grade: e.target.value })}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">Board</label>
                    <select
                      className="sp-input"
                      value={schoolForm.board}
                      onChange={(e) => setSchoolForm({ ...schoolForm, board: e.target.value })}
                    >
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">School Location (City, State)</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. New Delhi, Delhi"
                      value={schoolForm.location}
                      onChange={(e) => setSchoolForm({ ...schoolForm, location: e.target.value })}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">Academic Session</label>
                    <input
                      type="text"
                      className="sp-input"
                      placeholder="e.g. 2026-27"
                      value={schoolForm.session}
                      onChange={(e) => setSchoolForm({ ...schoolForm, session: e.target.value })}
                    />
                  </div>
                </div>
                <div className="sp-grid-2">
                  <div className="sp-form-group">
                    <label className="sp-label">Stream (For 11th/12th)</label>
                    <select
                      className="sp-input"
                      value={schoolForm.stream}
                      onChange={(e) => setSchoolForm({ ...schoolForm, stream: e.target.value })}
                    >
                      <option value="">Select Stream / N/A</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts/Humanities">Arts/Humanities</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-label">Medium of Education</label>
                    <select
                      className="sp-input"
                      value={schoolForm.medium}
                      onChange={(e) => setSchoolForm({ ...schoolForm, medium: e.target.value })}
                    >
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="sp-modal-footer">
                <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="sp-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save School Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: EDIT LEARNING GOALS
          ======================================================== */}
      {activeModal === 'goals' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit Learning Goals</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-form-group">
                <label className="sp-label">Add a Learning Goal</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="sp-input"
                    style={{ flex: 1 }}
                    placeholder="e.g. Improve DSA and Problem Solving"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGoal(); } }}
                  />
                  <button type="button" onClick={handleAddGoal} className="sp-btn-save" style={{ padding: '8px 16px' }}>Add</button>
                </div>
              </div>

              <div className="sp-goals-list" style={{ marginTop: '8px' }}>
                {goalsList.map((goal, idx) => (
                  <div key={idx} className="sp-goal-item" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="sp-goal-icon">🎯</span>
                      <span>{goal}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="sp-modal-footer">
              <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="button" className="sp-btn-save" onClick={handleSaveGoals} disabled={saving}>
                {saving ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: EDIT PREFERRED SUBJECTS
          ======================================================== */}
      {activeModal === 'subjects' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit Preferred Subjects</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-form-group">
                <label className="sp-label">Add a Subject</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="sp-input"
                    style={{ flex: 1 }}
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                  />
                  <button type="button" onClick={handleAddSubject} className="sp-btn-save" style={{ padding: '8px 16px' }}>Add</button>
                </div>
              </div>

              <div className="sp-subjects-wrap" style={{ marginTop: '12px' }}>
                {subjectsList.map((sub, idx) => (
                  <span
                    key={idx}
                    className={`sp-subject-pill ${getSubjectColorClass(idx)}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => handleRemoveSubject(sub)}
                    title="Click to remove"
                  >
                    <span>{sub}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>✕</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="sp-modal-footer">
              <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="button" className="sp-btn-save" onClick={handleSaveSubjects} disabled={saving}>
                {saving ? 'Saving...' : 'Save Subjects'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: EDIT PREFERRED LEARNING MODE
          ======================================================== */}
      {activeModal === 'mode' && (
        <div className="sp-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">Edit Preferred Learning Mode</h3>
              <button className="sp-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-mode-list">
                {[
                  { id: 'Online', label: 'Online Classes', desc: 'Interactive live 1-on-1 virtual sessions' },
                  { id: 'Offline', label: 'Offline Classes', desc: 'Home tuition or tutor center classes' },
                  { id: 'Hybrid', label: 'Hybrid Mode', desc: 'Flexible mix of online and in-person learning' }
                ].map((m) => {
                  const isSelected = modesList.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMode(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0F172A' }}>{m.label}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>{m.desc}</div>
                      </div>
                      <span className={`sp-mode-check-circle ${isSelected ? 'active' : 'inactive'}`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="sp-modal-footer">
              <button type="button" className="sp-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="button" className="sp-btn-save" onClick={handleSaveModes} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
