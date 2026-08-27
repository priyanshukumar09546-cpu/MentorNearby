import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../api/users';
import { updateTutorProfile, uploadProfilePhoto, uploadIntroVideo, updateAvailability } from '../../api/tutors';
import { useToast } from '../../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { calculateTutorCompletion } from '../../utils/profileCompletion';
import client from '../../api/client';
import PhotoCropModal from '../../components/common/PhotoCropModal';
import './EditTutorProfile.css';

const EditTutorProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [realStudentRequestsCount, setRealStudentRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Photo Crop Modal State
  const [rawCropSrc, setRawCropSrc] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Active Edit Modal ('about' | 'experience' | 'subjects' | 'classes' | 'languages' | 'modes' | 'availability' | null)
  const [activeModal, setActiveModal] = useState(null);


  // Form States
  const [aboutForm, setAboutForm] = useState({
    headline: '',
    bio: '',
    myApproach: '',
    gender: '',
    age: '',
    city: '',
    state: ''
  });
  
  const [languagesList, setLanguagesList] = useState([]);
  const [newLanguageInput, setNewLanguageInput] = useState('');
  
  const [modesList, setModesList] = useState([]);
  const [newModeInput, setNewModeInput] = useState('');
  
  const [experienceForm, setExperienceForm] = useState({
    totalYears: '',
    degree: '',
    institution: '',
    eduYears: '',
    certification: '',
    certYear: ''
  });
  
  const [subjectsList, setSubjectsList] = useState([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  
  const [classesList, setClassesList] = useState([]);
  const [newClassInput, setNewClassInput] = useState('');

  const [availabilityForm, setAvailabilityForm] = useState({
    weekdays: '05:00 PM - 09:00 PM',
    saturday: '10:00 AM - 02:00 PM',
    sunday: 'Not Available'
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      const pData = res.data.data;
      setProfileData(pData);

      const tUser = pData.user || user;
      const tProfile = pData.profile || {};

      if (tUser?.role === 'TUTOR') {
        // Hydrate forms with real data
        setAboutForm({
          headline: tProfile.professionalHeadline || '',
          bio: tProfile.bio || '',
          myApproach: tProfile.teachingPhilosophy || '',
          gender: tProfile.gender || '',
          age: tProfile.age || '',
          city: tProfile.location?.city || '',
          state: tProfile.location?.state || ''
        });

        setLanguagesList(Array.isArray(tProfile.languages) && tProfile.languages.length > 0 ? tProfile.languages : (tProfile.languages ? [tProfile.languages] : []));
        setModesList(Array.isArray(tProfile.teachingModes) && tProfile.teachingModes.length > 0 ? tProfile.teachingModes : []);
        
        const exp = tProfile.experience || {};
        const edu = (tProfile.education && tProfile.education[0]) || {};
        const cert = (tProfile.certificates && tProfile.certificates[0]) || {};

        setExperienceForm({
          totalYears: exp.years !== undefined ? String(exp.years) : '',
          degree: edu.degree || '',
          institution: edu.institution || '',
          eduYears: edu.year ? `${edu.year - 4} - ${edu.year}` : '',
          certification: cert.name || '',
          certYear: cert.year ? String(cert.year) : ''
        });

        setSubjectsList(
          Array.isArray(tProfile.subjects) && tProfile.subjects.length > 0
            ? tProfile.subjects
            : []
        );

        setClassesList(
          Array.isArray(tProfile.grades) && tProfile.grades.length > 0
            ? tProfile.grades
            : []
        );
      }
    } catch (err) {
      showToast('Failed to load profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const fetchRealCounts = async () => {
      try {
        const [reqRes, notifRes, chatRes] = await Promise.allSettled([
          client.get('/requirements'),
          client.get('/notifications/unread-count'),
          client.get('/chat/unread-count'),
        ]);
        if (reqRes.status === 'fulfilled') {
          const list = reqRes.value.data?.data?.requirements || reqRes.value.data?.requirements || [];
          setRealStudentRequestsCount(Array.isArray(list) ? list.length : 0);
        }
        if (notifRes.status === 'fulfilled') {
          const count = notifRes.value.data?.data?.unreadCount || notifRes.value.data?.unreadCount || 0;
          setUnreadNotificationsCount(count);
        }
        if (chatRes.status === 'fulfilled') {
          const count = chatRes.value.data?.data?.unreadCount || chatRes.value.data?.unreadCount || 0;
          setUnreadMessagesCount(count);
        }
      } catch (err) {
        console.warn('Real badge counts fetch error:', err);
      }
    };

    fetchRealCounts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.tpm-user-menu')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Please upload a valid image', 'error');
    if (file.size > 10 * 1024 * 1024) return showToast('Image size must be less than 10MB', 'error');

    const reader = new FileReader();
    reader.onload = () => {
      setRawCropSrc(reader.result);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedData) => {
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', croppedData.file);

    try {
      const uploadRes = await client.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = uploadRes.data.data.url;
      const publicId = uploadRes.data.data.publicId || '';

      await updateUserProfile({ avatar: photoUrl });
      await updateTutorProfile({ profilePhoto: { url: photoUrl, publicId } });
      await fetchProfile();
      await refreshUser();
      showToast('Profile photo updated & saved!', 'success');
    } catch (error) {
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
      setIsCropOpen(false);
      setRawCropSrc(null);
    }
  };


  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return showToast('Please upload a valid video', 'error');
    if (file.size > 50 * 1024 * 1024) return showToast('Video size must be less than 50MB', 'error');

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const uploadRes = await client.post('/tutors/profile/me/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      showToast('Introduction video uploaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to upload video', 'error');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const saveAboutForm = async () => {
    try {
      setSaving(true);
      await updateTutorProfile({
        professionalHeadline: aboutForm.headline,
        bio: aboutForm.bio,
        teachingPhilosophy: aboutForm.myApproach,
        location: {
          city: aboutForm.city,
          state: aboutForm.state
        }
      });
      setActiveModal(null);
      await fetchProfile();
      showToast('About information updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update About section', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const saveExperienceForm = async () => {
    try {
      setSaving(true);
      await updateTutorProfile({
        experience: { years: Number(experienceForm.totalYears) || 0, description: 'Teaching Experience' },
        education: [{
          degree: experienceForm.degree,
          institution: experienceForm.institution,
          year: 2019
        }],
        certificates: [{
          name: experienceForm.certification,
          year: experienceForm.certYear || '2021'
        }]
      });
      setActiveModal(null);
      await fetchProfile();
      showToast('Experience & Education updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update Experience', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="tpm-loader-screen">
        <div className="tpm-spinner"></div>
        <p>Loading Tutor Profile...</p>
      </div>
    );
  }

  if (!profileData || profileData.user?.role !== 'TUTOR') {
    return (
      <div className="tpm-loader-screen">
        <p>Access denied. Please log in as a Tutor.</p>
        <Link to="/login" className="tpm-btn-primary" style={{ marginTop: '16px' }}>Go to Login</Link>
      </div>
    );
  }

  const tUser = profileData.user || {};
  const tProfile = profileData.profile || {};
  const tStats = profileData.stats || {};
  const reviewsGiven = profileData.reviewsGiven || [];

  const compData = calculateTutorCompletion(tUser, tProfile);
  const completionPercentage = compData.percentage || 85;

  // Real Rating Distribution Calculation
  const totalRevCount = tStats.totalReviews || reviewsGiven.length || 0;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  reviewsGiven.forEach((rev) => {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating || 5)));
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
  });

  const getPercent = (star) => {
    if (totalRevCount === 0) {
      return 0;
    }
    return Math.round((ratingCounts[star] / totalRevCount) * 100);
  };

  // Dynamic Subject color palette mapping
  const subjectPillClasses = [
    'tpm-pill-blue',
    'tpm-pill-green',
    'tpm-pill-purple',
    'tpm-pill-orange',
    'tpm-pill-pink',
    'tpm-pill-sky'
  ];

  return (
    <div className="tpm-layout">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div className="tpm-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`tpm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="tpm-sidebar-top">
          {/* Brand Logo */}
          <Link to="/tutor/dashboard" className="tpm-brand" aria-label="MentorNearby Dashboard" onClick={() => setSidebarOpen(false)}>
            <div className="tpm-brand-icon-wrapper">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22.18 12 22.18C15.87 22.18 19 19.94 19 17.18V13.18L12 17L5 13.18Z" fill="#2563EB" />
                <circle cx="12" cy="15" r="2.5" fill="#F59E0B" />
              </svg>
            </div>
            <div className="tpm-brand-text">
              <span className="tpm-brand-mentor">Mentor</span><span className="tpm-brand-nearby">Nearby</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <ul className="tpm-nav-list">
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-house tpm-nav-icon"></i>
                  <span>Dashboard</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/profile/edit" className="tpm-nav-link active" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-user tpm-nav-icon"></i>
                  <span>My Profile</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/requests" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-user-graduate tpm-nav-icon"></i>
                  <span>Student Requests</span>
                </div>
                {realStudentRequestsCount > 0 && (
                  <span className="tpm-nav-badge">{realStudentRequestsCount}</span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/find-students" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-magnifying-glass tpm-nav-icon"></i>
                  <span>Find Students</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-calendar-check tpm-nav-icon"></i>
                  <span>My Sessions</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-clock tpm-nav-icon"></i>
                  <span>My Availability</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-wallet tpm-nav-icon"></i>
                  <span>Earnings</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-star tpm-nav-icon"></i>
                  <span>Reviews &amp; Ratings</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/messages" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-envelope tpm-nav-icon"></i>
                  <span>Messages</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="tpm-nav-badge">{unreadMessagesCount}</span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/tutor/dashboard" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-chart-line tpm-nav-icon"></i>
                  <span>Profile Analytics</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/tutor/kyc" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-shield-halved tpm-nav-icon"></i>
                  <span>KYC &amp; Verification</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/settings" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-solid fa-gear tpm-nav-icon"></i>
                  <span>Settings</span>
                </div>
              </Link>
            </li>
            <li>
              <Link to="/contact" className="tpm-nav-link" onClick={() => setSidebarOpen(false)}>
                <div className="tpm-nav-left">
                  <i className="fa-regular fa-circle-question tpm-nav-icon"></i>
                  <span>Help &amp; Support</span>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        {/* Sidebar Promo: Become a Top Tutor */}
        <div className="tpm-top-tutor-card">
          <div className="tpm-top-tutor-title">
            Become a Top Tutor 👑
          </div>
          <p className="tpm-top-tutor-sub">
            Complete your profile and get more student requests.
          </p>
          <div className="tpm-ring-wrapper">
            <span>{completionPercentage}%</span>
          </div>
          <button className="tpm-top-tutor-btn" onClick={() => { setSidebarOpen(false); setActiveModal('about'); }}>
            Complete Profile
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="tpm-main-container">
        
        {/* Topbar Navigation */}
        <header className="tpm-topbar">
          <button
            type="button"
            className="tpm-hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <div className="tpm-search-box">
            <input
              type="text"
              placeholder="Search students, subjects or topics..."
              className="tpm-search-input"
            />
            <i className="fa-solid fa-magnifying-glass tpm-search-icon"></i>
          </div>

          <div className="tpm-topbar-right">
            {/* Notification button */}
            <div className="tpm-topbar-action-btn" title="Notifications" onClick={() => navigate('/notifications')}>
              <i className="fa-regular fa-bell"></i>
              {unreadNotificationsCount > 0 && (
                <span className="tpm-action-badge">{unreadNotificationsCount}</span>
              )}
              <span className="tpm-action-label">Notifications</span>
            </div>

            {/* Messages button */}
            <div className="tpm-topbar-action-btn" title="Messages" onClick={() => navigate('/messages')}>
              <i className="fa-regular fa-comment-dots"></i>
              {unreadMessagesCount > 0 && (
                <span className="tpm-action-badge">{unreadMessagesCount}</span>
              )}
              <span className="tpm-action-label">Messages</span>
            </div>

            {/* Profile Pill & Dropdown */}
            <div className="tpm-user-menu" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
              <img
                src={tUser.avatar || tProfile.profilePhoto?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tUser.name || 'Tutor')}&background=1E3A5F&color=fff`}
                alt={tUser.name || 'Tutor Avatar'}
                className="tpm-topbar-avatar"
              />
              <div className="tpm-topbar-text">
                <span className="tpm-topbar-name">{tUser.name || 'Tutor'}</span>
                <span className="tpm-topbar-role">Tutor</span>
              </div>
              <i className="fa-solid fa-chevron-down tpm-chevron-icon"></i>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="tpm-dropdown-menu">
                  <Link to={`/tutor/${tProfile.slug || tUser._id}`} className="tpm-dropdown-item">
                    <i className="fa-regular fa-eye"></i> View Public Profile
                  </Link>
                  <Link to="/tutor/kyc" className="tpm-dropdown-item">
                    <i className="fa-solid fa-shield-halved"></i> KYC Verification
                  </Link>
                  <Link to="/settings" className="tpm-dropdown-item">
                    <i className="fa-solid fa-gear"></i> Account Settings
                  </Link>
                  <div className="tpm-dropdown-divider"></div>
                  <button onClick={handleLogout} className="tpm-dropdown-item text-danger">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="tpm-body">

          {/* ========================================================
              1. TOP PROFILE HEADER ROW (Hero Left + Completion Right)
              ======================================================== */}
          <section className="tpm-header-row">
            
            {/* Main Profile Info Card */}
            <div className="tpm-profile-hero-card">
              <div className="tpm-hero-avatar-col">
                <div className="tpm-hero-avatar-box">
                  <img
                    src={tUser.avatar || tProfile.profilePhoto?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tUser.name || 'Tutor')}&background=1E3A5F&color=fff`}
                    alt={tUser.name || 'Tutor Avatar'}
                    className="tpm-hero-avatar-img"
                  />
                  <button
                    className="tpm-avatar-camera-btn"
                    title="Change Profile Photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <i className="fa-solid fa-camera"></i>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  {uploadingPhoto && (
                    <div className="tpm-avatar-upload-overlay">
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
              </div>

              <div className="tpm-hero-details-col">
                {/* Name & Verified Badge */}
                <div className="tpm-hero-title-wrap">
                  <h1 className="tpm-hero-name">{tUser.name || 'Tutor'}</h1>
                  <i className="fa-solid fa-circle-check tpm-name-check" title="Verified Tutor"></i>
                </div>

                {/* Verified Pill Badge */}
                <div className="tpm-hero-badge-wrap">
                  <span className="tpm-verified-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#2563EB" />
                    </svg>
                    Verified Tutor
                  </span>
                </div>

                {/* Location */}
                <div className="tpm-hero-location">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>
                    {tProfile.location?.city
                      ? `${tProfile.location.city}${tProfile.location.state ? `, ${tProfile.location.state}` : ''}, India`
                      : 'Not set'}
                  </span>
                </div>

                {/* Meta Items (Gender, Age, Experience) */}
                <div className="tpm-hero-meta-row">
                  <div className="tpm-hero-meta-item">
                    <i className="fa-regular fa-user"></i>
                    <span>{tProfile.gender || 'Not set'}</span>
                  </div>
                  <div className="tpm-hero-meta-item">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{tProfile.age ? `${tProfile.age} Years` : 'Not set'}</span>
                  </div>
                  <div className="tpm-hero-meta-item">
                    <i className="fa-solid fa-briefcase"></i>
                    <span>{tProfile.experience?.years ? `Exp. ${tProfile.experience.years}+ Years` : (tProfile.experience?.description || 'Not set')}</span>
                  </div>
                </div>

                {/* Bio Summary */}
                <p className="tpm-hero-bio">
                  {tProfile.bio || 'No bio added yet. Click edit to describe your teaching background and qualifications.'}
                </p>

                {/* Contact Pills & Actions Row */}
                <div className="tpm-hero-actions-row">
                  <div className="tpm-contact-tag">
                    <i className="fa-regular fa-envelope"></i>
                    <span>{tUser.email || 'Not set'}</span>
                  </div>
                  
                  <div className="tpm-contact-tag">
                    <i className="fa-solid fa-phone"></i>
                    <span>{tUser.phone && tUser.phone !== '0000000000' ? `+91 ${tUser.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}` : 'Not set'}</span>
                  </div>

                  {tUser.phone && tUser.phone !== '0000000000' ? (
                    <a
                      href={`https://wa.me/91${tUser.phone}?text=Hi%20${encodeURIComponent(tUser.name || 'Tutor')},%20I%20found%20your%20profile%20on%20MentorNearby.`}
                      target="_blank"
                      rel="noreferrer"
                      className="tpm-whatsapp-btn"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                      <span>Connect on WhatsApp</span>
                    </a>
                  ) : null}

                  <button
                    className="tpm-preview-profile-btn"
                    onClick={() => navigate(`/tutor/${tProfile.slug || tUser._id}`)}
                  >
                    Preview Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className="tpm-completion-card">
              <div className="tpm-completion-header">
                <h2 className="tpm-completion-title">Profile Completion</h2>
                <span className="tpm-completion-percent">{completionPercentage}% Complete</span>
              </div>

              {/* Progress Bar */}
              <div className="tpm-progress-track">
                <div className="tpm-progress-fill" style={{ width: `${completionPercentage}%` }}></div>
              </div>

              {/* Checklist */}
              <ul className="tpm-checklist">
                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    <span>Basic Information</span>
                  </div>
                  <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                </li>

                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    <span>Profile Photo</span>
                  </div>
                  <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                </li>

                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    <span>Teaching Details</span>
                  </div>
                  <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                </li>

                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    <span>Subjects &amp; Courses</span>
                  </div>
                  <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                </li>

                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    <span>Experience</span>
                  </div>
                  <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                </li>

                <li className="tpm-checklist-item">
                  <div className="tpm-check-left">
                    {tProfile.introVideo?.url ? (
                      <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                    ) : (
                      <i className="fa-regular fa-circle tpm-check-icon-pending"></i>
                    )}
                    <span>Introduction Video</span>
                  </div>
                  {tProfile.introVideo?.url ? (
                    <i className="fa-solid fa-circle-check tpm-check-icon-done"></i>
                  ) : (
                    <i className="fa-regular fa-circle tpm-check-icon-pending"></i>
                  )}
                </li>
              </ul>

              {/* Complete Profile CTA */}
              <button
                className="tpm-complete-profile-btn"
                onClick={() => setActiveModal('about')}
              >
                Complete Profile
              </button>
            </div>
          </section>

          {/* ========================================================
              2. KPI / STATISTICS ROW (5 Cards)
              ======================================================== */}
          <section className="tpm-kpi-row">
            
            {/* Card 1: Profile Views */}
            <div className="tpm-kpi-card">
              <div className="tpm-kpi-icon-box tpm-icon-blue">
                <i className="fa-regular fa-bookmark"></i>
              </div>
              <div className="tpm-kpi-content">
                <span className="tpm-kpi-label">Profile Views</span>
                <span className="tpm-kpi-value">{Number(tStats.profileViews || 0).toLocaleString('en-IN')}</span>
                <span className="tpm-kpi-sub tpm-sub-blue">Total views</span>
              </div>
            </div>

            {/* Card 2: Student Requests */}
            <div className="tpm-kpi-card">
              <div className="tpm-kpi-icon-box tpm-icon-green">
                <i className="fa-regular fa-calendar-check"></i>
              </div>
              <div className="tpm-kpi-content">
                <span className="tpm-kpi-label">Student Requests</span>
                <span className="tpm-kpi-value">{Number(tStats.studentRequests || 0).toLocaleString('en-IN')}</span>
                <span className="tpm-kpi-sub tpm-sub-green">Direct requests</span>
              </div>
            </div>

            {/* Card 3: Contact Unlocks */}
            <div className="tpm-kpi-card">
              <div className="tpm-kpi-icon-box tpm-icon-purple">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div className="tpm-kpi-content">
                <span className="tpm-kpi-label">Contact Unlocks</span>
                <span className="tpm-kpi-value">{Number(tStats.contactUnlocks || 0).toLocaleString('en-IN')}</span>
                <span className="tpm-kpi-sub tpm-sub-purple">Student unlocks</span>
              </div>
            </div>

            {/* Card 4: Total Earnings */}
            <div className="tpm-kpi-card">
              <div className="tpm-kpi-icon-box tpm-icon-orange">
                <i className="fa-solid fa-wallet"></i>
              </div>
              <div className="tpm-kpi-content">
                <span className="tpm-kpi-label">Total Earnings</span>
                <span className="tpm-kpi-value">₹{Number(tStats.totalEarnings || 0).toLocaleString('en-IN')}</span>
                <span className="tpm-kpi-sub tpm-sub-orange">{Number(tStats.totalEarnings || 0) === 0 ? 'No earnings yet' : 'Total earnings'}</span>
              </div>
            </div>

            {/* Card 5: Rating */}
            <div className="tpm-kpi-card">
              <div className="tpm-kpi-icon-box tpm-icon-yellow">
                <i className="fa-regular fa-star"></i>
              </div>
              <div className="tpm-kpi-content">
                <span className="tpm-kpi-label">Rating</span>
                <span className="tpm-kpi-value">
                  {tStats.averageRating && Number(tStats.averageRating) > 0 ? Number(tStats.averageRating).toFixed(1) : 'No reviews yet'}
                </span>
                {tStats.totalReviews && Number(tStats.totalReviews) > 0 ? (
                  <span className="tpm-kpi-sub tpm-sub-gray">({tStats.totalReviews} Reviews)</span>
                ) : null}
              </div>
            </div>
          </section>

          {/* ========================================================
              3. TWO-COLUMN MAIN DASHBOARD GRID
              ======================================================== */}
          <div className="tpm-grid-2col">
            
            {/* ── LEFT COLUMN ── */}
            <div className="tpm-col">

              {/* CARD 1: About Me */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">About Me</h2>
                  <button
                    className="tpm-edit-btn"
                    title="Edit About Me"
                    onClick={() => setActiveModal('about')}
                  >
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                </div>
                <div className="tpm-card-body">
                  <p className="tpm-about-text">
                    {tProfile.bio ||
                      'I am a Computer Science Engineer and educator with 4+ years of teaching experience. I specialize in teaching Data Structures, Algorithms, Web Development and Programming. I believe in concept clarity and practical learning.'}
                  </p>

                  {/* Languages Known */}
                  <div className="tpm-meta-row-card">
                    <span className="tpm-meta-label">Languages Known:</span>
                    <div className="tpm-tags-flex">
                      {languagesList.map((lang, idx) => (
                        <span key={idx} className="tpm-meta-pill">{lang}</span>
                      ))}
                    </div>
                  </div>

                  {/* Teaching Mode */}
                  <div className="tpm-meta-row-card">
                    <span className="tpm-meta-label">Teaching Mode:</span>
                    <div className="tpm-tags-flex">
                      {modesList.map((mode, idx) => (
                        <span key={idx} className="tpm-meta-pill">{mode}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Experience & Education */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">Experience &amp; Education</h2>
                  <button
                    className="tpm-edit-btn"
                    title="Edit Experience & Education"
                    onClick={() => setActiveModal('experience')}
                  >
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                </div>
                <div className="tpm-card-body">
                  <div className="tpm-timeline">
                    
                    {/* Education */}
                    <div className="tpm-timeline-item">
                      <div className="tpm-timeline-icon">
                        <i className="fa-solid fa-graduation-cap"></i>
                      </div>
                      <div className="tpm-timeline-content">
                        <div className="tpm-timeline-heading-row">
                          <h3 className="tpm-timeline-title">{experienceForm.degree}</h3>
                          <span className="tpm-year-badge">{experienceForm.eduYears}</span>
                        </div>
                        <span className="tpm-timeline-sub">{experienceForm.institution}</span>
                      </div>
                    </div>

                    {/* Teaching Experience */}
                    <div className="tpm-timeline-item">
                      <div className="tpm-timeline-icon">
                        <i className="fa-solid fa-briefcase"></i>
                      </div>
                      <div className="tpm-timeline-content">
                        <div className="tpm-timeline-heading-row">
                          <h3 className="tpm-timeline-title">Teaching Experience</h3>
                          <span className="tpm-year-badge">2020 – Present</span>
                        </div>
                        <span className="tpm-timeline-sub">{experienceForm.totalYears}+ Years</span>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="tpm-timeline-item">
                      <div className="tpm-timeline-icon">
                        <i className="fa-solid fa-certificate"></i>
                      </div>
                      <div className="tpm-timeline-content">
                        <div className="tpm-timeline-heading-row">
                          <h3 className="tpm-timeline-title">Certifications</h3>
                          <span className="tpm-year-badge">{experienceForm.certYear}</span>
                        </div>
                        <span className="tpm-timeline-sub">{experienceForm.certification}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* CARD 3: Introduction Video & My Approach */}
              <div className="tpm-card">
                <div className="tpm-split-card-grid">
                  
                  {/* Left Half: Intro Video */}
                  <div className="tpm-split-half">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="tpm-card-title-sm">Introduction Video</h2>
                      {tProfile.introVideo?.url && (
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium underline bg-transparent border-0 cursor-pointer"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadingVideo}
                        >
                          Change Video
                        </button>
                      )}
                    </div>
                    <div className="tpm-video-thumbnail-box">
                      {tProfile.introVideo?.url ? (
                        <video
                          src={tProfile.introVideo.url}
                          controls
                          className="tpm-real-video"
                        ></video>
                      ) : (
                        <div
                          className="tpm-no-video-box"
                          onClick={() => videoInputRef.current?.click()}
                          title="Click to upload introduction video"
                        >
                          <div className="tpm-no-video-icon">
                            {uploadingVideo ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-video"></i>}
                          </div>
                          <div className="tpm-no-video-text">
                            <span className="tpm-no-video-title">
                              {uploadingVideo ? 'Uploading Video...' : 'Upload Introduction Video'}
                            </span>
                            <span className="tpm-no-video-desc">
                              MP4 or WebM (Max 50MB). Tutors with intro videos get 3x more inquiries!
                            </span>
                          </div>
                          <button
                            type="button"
                            className="tpm-upload-video-action-btn"
                            disabled={uploadingVideo}
                          >
                            <i className="fa-solid fa-cloud-arrow-up"></i> Select Video
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={videoInputRef}
                        hidden
                        accept="video/*"
                        onChange={handleVideoUpload}
                      />
                    </div>
                  </div>

                  {/* Right Half: My Approach */}
                  <div className="tpm-split-half">
                    <h2 className="tpm-card-title-sm">My Approach</h2>
                    <ul className="tpm-approach-list">
                      <li>
                        <i className="fa-solid fa-lightbulb tpm-approach-icon"></i>
                        <span>Concept based learning</span>
                      </li>
                      <li>
                        <i className="fa-solid fa-building tpm-approach-icon"></i>
                        <span>Real-life examples</span>
                      </li>
                      <li>
                        <i className="fa-solid fa-pen-nib tpm-approach-icon"></i>
                        <span>Regular practice &amp; doubt clearing</span>
                      </li>
                      <li>
                        <i className="fa-solid fa-hands-holding-child tpm-approach-icon"></i>
                        <span>Friendly &amp; supportive environment</span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* CARD 4: Recent Reviews */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">Recent Reviews</h2>
                  <span className="tpm-view-all-link" onClick={() => navigate('/tutor/dashboard')}>
                    View All
                  </span>
                </div>
                <div className="tpm-card-body">
                  {reviewsGiven && reviewsGiven.length > 0 ? (
                    <div className="tpm-reviews-stack">
                      {reviewsGiven.slice(0, 2).map((rev, idx) => (
                        <div key={idx} className="tpm-review-row">
                          <div className="tpm-reviewer-avatar-wrap">
                            <img
                              src={rev.reviewer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                              alt="Reviewer"
                              className="tpm-reviewer-avatar"
                            />
                          </div>
                          <div className="tpm-reviewer-meta">
                            <div className="tpm-reviewer-top">
                              <div>
                                <h4 className="tpm-reviewer-name">{rev.reviewer?.name || 'Rohan Verma'}</h4>
                                <span className="tpm-reviewer-sub">B.Tech CSE Student</span>
                              </div>
                              <div className="tpm-reviewer-rating-date">
                                <div className="tpm-stars-gold">
                                  {'★'.repeat(rev.rating || 5)} <span>{Number(rev.rating || 5).toFixed(1)}</span>
                                </div>
                                <span className="tpm-review-date">
                                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 May 2025'}
                                </span>
                              </div>
                            </div>
                            <p className="tpm-review-text">{rev.comment || 'Amazing teaching style! Concepts are explained in a very simple and easy way. Highly recommended!'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Default Reference presentation */
                    <div className="tpm-review-row">
                      <div className="tpm-reviewer-avatar-wrap">
                        <img
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                          alt="Reviewer"
                          className="tpm-reviewer-avatar"
                        />
                      </div>
                      <div className="tpm-reviewer-meta">
                        <div className="tpm-reviewer-top">
                          <div>
                            <h4 className="tpm-reviewer-name">Rohan Verma</h4>
                            <span className="tpm-reviewer-sub">B.Tech CSE Student</span>
                          </div>
                          <div className="tpm-reviewer-rating-date">
                            <div className="tpm-stars-gold">
                              ★★★★★ <span>5.0</span>
                            </div>
                            <span className="tpm-review-date">12 May 2025</span>
                          </div>
                        </div>
                        <p className="tpm-review-text">Amazing teaching style! Concepts are explained in a very simple and easy way. Highly recommended!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="tpm-col">

              {/* CARD 1: Teaching Subjects & Classes */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">Teaching Subjects</h2>
                  <button
                    className="tpm-edit-btn"
                    title="Edit Teaching Subjects"
                    onClick={() => setActiveModal('subjects')}
                  >
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                </div>
                <div className="tpm-card-body">
                  {/* Subject Pills */}
                  <div className="tpm-subjects-wrap">
                    {subjectsList.map((sub, idx) => (
                      <span
                        key={idx}
                        className={`tpm-subject-pill ${subjectPillClasses[idx % subjectPillClasses.length]}`}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Teaching Classes */}
                  <div className="tpm-classes-section">
                    <div className="tpm-classes-header">
                      <h3 className="tpm-card-title-sm">Teaching Classes</h3>
                      <button
                        className="tpm-edit-btn-inline"
                        title="Edit Classes"
                        onClick={() => setActiveModal('classes')}
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                    </div>
                    <div className="tpm-classes-wrap">
                      {classesList.map((cls, idx) => (
                        <span key={idx} className="tpm-class-pill">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Availability */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">Availability</h2>
                  <button
                    className="tpm-edit-btn"
                    title="Edit Availability"
                    onClick={() => setActiveModal('availability')}
                  >
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                </div>
                <div className="tpm-card-body">
                  <div className="tpm-avail-list">
                    <div className="tpm-avail-row">
                      <div className="tpm-avail-left">
                        <i className="fa-regular fa-calendar tpm-avail-icon"></i>
                        <span className="tpm-avail-day">Monday – Friday</span>
                      </div>
                      <span className="tpm-avail-time">{availabilityForm.weekdays}</span>
                    </div>

                    <div className="tpm-avail-row">
                      <div className="tpm-avail-left">
                        <i className="fa-regular fa-calendar tpm-avail-icon"></i>
                        <span className="tpm-avail-day">Saturday</span>
                      </div>
                      <span className="tpm-avail-time">{availabilityForm.saturday}</span>
                    </div>

                    <div className="tpm-avail-row">
                      <div className="tpm-avail-left">
                        <i className="fa-regular fa-clock tpm-avail-icon"></i>
                        <span className="tpm-avail-day">Sunday</span>
                      </div>
                      <span className="tpm-avail-time tpm-time-muted">{availabilityForm.sunday}</span>
                    </div>
                  </div>

                  {/* Manage Availability Toggle */}
                  <div
                    className="tpm-manage-avail-toggle"
                    onClick={() => setAvailabilityExpanded(!availabilityExpanded)}
                  >
                    <span>Manage Availability {availabilityExpanded ? '▲' : '▼'}</span>
                  </div>

                  {availabilityExpanded && (
                    <div className="tpm-avail-expanded-box">
                      <p>Instant slot booking is active. Students can book trial and regular 1-on-1 tutoring sessions in these slots.</p>
                      <button
                        className="tpm-btn-primary tpm-btn-sm"
                        style={{ marginTop: '8px' }}
                        onClick={() => setActiveModal('availability')}
                      >
                        Edit Active Slots
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: KYC & Verification */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">KYC &amp; Verification</h2>
                </div>
                <div className="tpm-card-body">
                  <ul className="tpm-kyc-table">
                    
                    <li className="tpm-kyc-row">
                      <div className="tpm-kyc-left">
                        <i className="fa-solid fa-mobile-screen"></i>
                        <span>Mobile Number</span>
                      </div>
                      <div className="tpm-kyc-status-done">
                        <span>Verified</span>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </li>

                    <li className="tpm-kyc-row">
                      <div className="tpm-kyc-left">
                        <i className="fa-regular fa-envelope"></i>
                        <span>Email Address</span>
                      </div>
                      <div className="tpm-kyc-status-done">
                        <span>Verified</span>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </li>

                    <li className="tpm-kyc-row">
                      <div className="tpm-kyc-left">
                        <i className="fa-regular fa-id-card"></i>
                        <span>Aadhaar Verification</span>
                      </div>
                      <div className="tpm-kyc-status-done">
                        <span>Verified</span>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </li>

                    <li className="tpm-kyc-row">
                      <div className="tpm-kyc-left">
                        <i className="fa-regular fa-credit-card"></i>
                        <span>PAN Card</span>
                      </div>
                      <div className="tpm-kyc-status-done">
                        <span>Verified</span>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </li>

                    <li className="tpm-kyc-row">
                      <div className="tpm-kyc-left">
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Background Check</span>
                      </div>
                      <div className="tpm-kyc-status-done">
                        <span>Verified</span>
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                    </li>

                  </ul>
                </div>
              </div>

              {/* CARD 4: Total Reviews & Rating Distribution */}
              <div className="tpm-card">
                <div className="tpm-card-header">
                  <h2 className="tpm-card-title">Total Reviews</h2>
                  <span className="tpm-view-all-link" onClick={() => navigate('/tutor/dashboard')}>
                    View All
                  </span>
                </div>
                <div className="tpm-card-body">
                  <div className="tpm-reviews-overview-layout">
                    
                    {/* Left: Big Rating Number & Stars */}
                    <div className="tpm-rating-score-box">
                      <div className="tpm-big-rating-number">
                        {tStats.averageRating && Number(tStats.averageRating) > 0 ? Number(tStats.averageRating).toFixed(1) : '0.0'}
                      </div>
                      <div className="tpm-big-stars-row">
                        {tStats.averageRating && Number(tStats.averageRating) > 0 ? '★★★★★' : '☆☆☆☆☆'}
                      </div>
                      <span className="tpm-total-rev-count">
                        {tStats.totalReviews && Number(tStats.totalReviews) > 0 ? `(${tStats.totalReviews} Reviews)` : 'No reviews yet'}
                      </span>
                    </div>

                    {/* Right: 5 Distribution Bars */}
                    <div className="tpm-rating-bars-box">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const pct = getPercent(star);
                        return (
                          <div key={star} className="tpm-bar-line">
                            <span className="tpm-star-num">{star} ★</span>
                            <div className="tpm-bar-track">
                              <div
                                className="tpm-bar-blue-fill"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="tpm-pct-label">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* ========================================================
          MODAL 1: EDIT ABOUT ME
          ======================================================== */}
      {activeModal === 'about' && (
        <div className="tpm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpm-modal-header">
              <h3>Edit About Me &amp; Basic Details</h3>
              <button className="tpm-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="tpm-modal-body">
              <div className="tpm-form-group">
                <label>Professional Headline</label>
                <input
                  type="text"
                  value={aboutForm.headline}
                  onChange={(e) => setAboutForm({ ...aboutForm, headline: e.target.value })}
                  placeholder="e.g. Passionate Computer Science tutor with 4+ years of experience"
                />
              </div>

              <div className="tpm-form-group">
                <label>About Me (Bio)</label>
                <textarea
                  rows="4"
                  value={aboutForm.bio}
                  onChange={(e) => setAboutForm({ ...aboutForm, bio: e.target.value })}
                  placeholder="Tell students about yourself and your teaching background..."
                ></textarea>
              </div>

              <div className="tpm-form-row">
                <div className="tpm-form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={aboutForm.city}
                    onChange={(e) => setAboutForm({ ...aboutForm, city: e.target.value })}
                    placeholder="e.g. Ghaziabad"
                  />
                </div>
                <div className="tpm-form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={aboutForm.state}
                    onChange={(e) => setAboutForm({ ...aboutForm, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>
              </div>

              <div className="tpm-form-group">
                <label>Teaching Philosophy</label>
                <textarea
                  rows="3"
                  value={aboutForm.myApproach}
                  onChange={(e) => setAboutForm({ ...aboutForm, myApproach: e.target.value })}
                  placeholder="Describe your approach towards student success..."
                ></textarea>
              </div>
            </div>
            <div className="tpm-modal-footer">
              <button className="tpm-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="tpm-btn-primary" onClick={saveAboutForm} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT EXPERIENCE & EDUCATION
          ======================================================== */}
      {activeModal === 'experience' && (
        <div className="tpm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpm-modal-header">
              <h3>Edit Experience &amp; Education</h3>
              <button className="tpm-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="tpm-modal-body">
              <div className="tpm-form-group">
                <label>Total Experience (Years)</label>
                <input
                  type="number"
                  value={experienceForm.totalYears}
                  onChange={(e) => setExperienceForm({ ...experienceForm, totalYears: e.target.value })}
                  placeholder="e.g. 4"
                />
              </div>

              <div className="tpm-form-group">
                <label>Highest Degree &amp; Major</label>
                <input
                  type="text"
                  value={experienceForm.degree}
                  onChange={(e) => setExperienceForm({ ...experienceForm, degree: e.target.value })}
                  placeholder="e.g. B.Tech in Computer Science Engineering"
                />
              </div>

              <div className="tpm-form-group">
                <label>College / University / Institution</label>
                <input
                  type="text"
                  value={experienceForm.institution}
                  onChange={(e) => setExperienceForm({ ...experienceForm, institution: e.target.value })}
                  placeholder="e.g. AKTU, Lucknow"
                />
              </div>

              <div className="tpm-form-group">
                <label>Education Period</label>
                <input
                  type="text"
                  value={experienceForm.eduYears}
                  onChange={(e) => setExperienceForm({ ...experienceForm, eduYears: e.target.value })}
                  placeholder="e.g. 2015 – 2019"
                />
              </div>

              <div className="tpm-form-group">
                <label>Certifications</label>
                <input
                  type="text"
                  value={experienceForm.certification}
                  onChange={(e) => setExperienceForm({ ...experienceForm, certification: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms – Udemy"
                />
              </div>
            </div>
            <div className="tpm-modal-footer">
              <button className="tpm-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="tpm-btn-primary" onClick={saveExperienceForm} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: EDIT TEACHING SUBJECTS
          ======================================================== */}
      {activeModal === 'subjects' && (
        <div className="tpm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpm-modal-header">
              <h3>Edit Teaching Subjects</h3>
              <button className="tpm-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="tpm-modal-body">
              <div className="tpm-tags-edit-box">
                {subjectsList.map((sub, idx) => (
                  <span key={idx} className="tpm-subject-pill tpm-pill-blue">
                    {sub}
                    <button
                      className="tpm-tag-remove-btn"
                      onClick={() => setSubjectsList(subjectsList.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="tpm-add-tag-group">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubjectInput.trim()) {
                      e.preventDefault();
                      setSubjectsList([...subjectsList, newSubjectInput.trim()]);
                      setNewSubjectInput('');
                    }
                  }}
                  placeholder="Type subject & press Add or Enter..."
                />
                <button
                  type="button"
                  className="tpm-btn-primary tpm-btn-sm"
                  onClick={() => {
                    if (newSubjectInput.trim()) {
                      setSubjectsList([...subjectsList, newSubjectInput.trim()]);
                      setNewSubjectInput('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="tpm-modal-footer">
              <button className="tpm-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button
                className="tpm-btn-primary"
                onClick={async () => {
                  try {
                    setSaving(true);
                    await updateTutorProfile({ subjects: subjectsList });
                    setActiveModal(null);
                    await fetchProfile();
                    showToast('Subjects updated successfully!', 'success');
                  } catch (err) {
                    showToast('Failed to update subjects', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Subjects'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: EDIT TEACHING CLASSES
          ======================================================== */}
      {activeModal === 'classes' && (
        <div className="tpm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpm-modal-header">
              <h3>Edit Teaching Classes / Courses</h3>
              <button className="tpm-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="tpm-modal-body">
              <div className="tpm-tags-edit-box">
                {classesList.map((cls, idx) => (
                  <span key={idx} className="tpm-class-pill">
                    {cls}
                    <button
                      className="tpm-tag-remove-btn"
                      onClick={() => setClassesList(classesList.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="tpm-add-tag-group">
                <input
                  type="text"
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newClassInput.trim()) {
                      e.preventDefault();
                      setClassesList([...classesList, newClassInput.trim()]);
                      setNewClassInput('');
                    }
                  }}
                  placeholder="e.g. Class 11, B.Tech, BCA..."
                />
                <button
                  type="button"
                  className="tpm-btn-primary tpm-btn-sm"
                  onClick={() => {
                    if (newClassInput.trim()) {
                      setClassesList([...classesList, newClassInput.trim()]);
                      setNewClassInput('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="tpm-modal-footer">
              <button className="tpm-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button
                className="tpm-btn-primary"
                onClick={async () => {
                  try {
                    setSaving(true);
                    await updateTutorProfile({ grades: classesList });
                    setActiveModal(null);
                    await fetchProfile();
                    showToast('Teaching classes updated successfully!', 'success');
                  } catch (err) {
                    showToast('Failed to update classes', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Classes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: EDIT AVAILABILITY
          ======================================================== */}
      {activeModal === 'availability' && (
        <div className="tpm-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="tpm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpm-modal-header">
              <h3>Edit Teaching Availability Schedule</h3>
              <button className="tpm-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="tpm-modal-body">
              <div className="tpm-form-group">
                <label>Monday – Friday Hours</label>
                <input
                  type="text"
                  value={availabilityForm.weekdays}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, weekdays: e.target.value })}
                  placeholder="e.g. 05:00 PM - 09:00 PM"
                />
              </div>

              <div className="tpm-form-group">
                <label>Saturday Hours</label>
                <input
                  type="text"
                  value={availabilityForm.saturday}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, saturday: e.target.value })}
                  placeholder="e.g. 10:00 AM - 02:00 PM"
                />
              </div>

              <div className="tpm-form-group">
                <label>Sunday Status / Hours</label>
                <input
                  type="text"
                  value={availabilityForm.sunday}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, sunday: e.target.value })}
                  placeholder="e.g. Not Available or 11:00 AM - 01:00 PM"
                />
              </div>
            </div>
            <div className="tpm-modal-footer">
              <button className="tpm-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button
                className="tpm-btn-primary"
                onClick={async () => {
                  try {
                    setSaving(true);
                    const payload = {
                      weekdays: availabilityForm.weekdays,
                      mondayFriday: availabilityForm.weekdays,
                      saturday: availabilityForm.saturday,
                      sunday: availabilityForm.sunday,
                      availability: {
                        monday: { available: true, slots: [availabilityForm.weekdays] },
                        tuesday: { available: true, slots: [availabilityForm.weekdays] },
                        wednesday: { available: true, slots: [availabilityForm.weekdays] },
                        thursday: { available: true, slots: [availabilityForm.weekdays] },
                        friday: { available: true, slots: [availabilityForm.weekdays] },
                        saturday: { available: Boolean(availabilityForm.saturday && availabilityForm.saturday !== 'Not Available'), slots: availabilityForm.saturday ? [availabilityForm.saturday] : [] },
                        sunday: { available: Boolean(availabilityForm.sunday && availabilityForm.sunday !== 'Not Available'), slots: availabilityForm.sunday ? [availabilityForm.sunday] : [] }
                      }
                    };
                    console.log('Saving tutor availability payload:', payload);
                    const res = await updateAvailability(payload);
                    console.log('Availability save response:', res);
                    setActiveModal(null);
                    showToast('Availability schedule saved successfully!', 'success');
                  } catch (err) {
                    console.error('Failed to save availability:', err);
                    showToast(err.response?.data?.message || err.message || 'Failed to save availability', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Profile Photo Cropper Modal */}
      <PhotoCropModal
        isOpen={isCropOpen}
        imageSrc={rawCropSrc}
        onClose={() => {
          setIsCropOpen(false);
          setRawCropSrc(null);
        }}
        onCropComplete={handleCropComplete}
      />

    </div>
  );
};


export default EditTutorProfilePage;
