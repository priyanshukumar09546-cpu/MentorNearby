import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadPhoto, uploadDocument } from '../../api/upload';
import './BecomeTutorPage.css';

const POPULAR_SUBJECTS_LIST = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Computer Science', 'Accountancy', 'Economics', 'Hindi', 'Social Science',
  'History', 'Geography', 'Political Science', 'Business Studies'
];

const POPULAR_CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'College / Degree', 'Competitive Exams'
];

const BecomeTutorPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    email: '',
    phone: '',
    password: '',
    profilePhotoUrl: '',
    
    // Step 2: Profile Details
    headline: '',
    bio: '',
    
    // Step 3: Subjects & Classes
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    classes: ['Class 6', 'Class 7', 'Class 8'],
    customSubjectInput: '',
    customClassInput: '',
    
    // Step 4: Experience & Education
    experience: '5+ Years',
    qualification: 'B.Tech',
    institute: '',
    passingYear: '2020',
    
    // Step 5: Location & Mode
    teachingMode: 'Both', // 'Online' | 'Offline' | 'Both'
    preferredLocation: '',
    pincode: '',
    
    // Step 6: Gallery
    galleryImages: [],
    
    // Step 7: KYC Documents
    identityProofType: 'Aadhaar Card',
    identityProofFile: null,
    identityProofFilename: '',
    
    addressProofType: 'Aadhaar Card',
    addressProofFile: null,
    addressProofFilename: '',
    
    qualificationProofType: 'Degree Certificate',
    qualificationProofFile: null,
    qualificationProofFilename: '',
    
    // Step 8: Terms
    agreeTerms: true,
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingKycField, setUploadingKycField] = useState(null);

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Profile photo must be less than 5MB.');
      return;
    }
    setUploadingPhoto(true);
    setErrorMsg('');
    try {
      const res = await uploadPhoto(file);
      const url = res.data?.data?.url || res.data?.url || URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, profilePhotoUrl: url }));
    } catch (_) {
      // Fallback local preview URL
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, profilePhotoUrl: localUrl }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Document Upload
  const handleDocumentUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKycField(field);
    setErrorMsg('');
    try {
      const res = await uploadDocument(file);
      const url = res.data?.data?.url || res.data?.url || '';
      if (field === 'identity') {
        setFormData(prev => ({ ...prev, identityProofFile: url || file, identityProofFilename: file.name }));
      } else if (field === 'address') {
        setFormData(prev => ({ ...prev, addressProofFile: url || file, addressProofFilename: file.name }));
      } else if (field === 'qualification') {
        setFormData(prev => ({ ...prev, qualificationProofFile: url || file, qualificationProofFilename: file.name }));
      }
    } catch (_) {
      if (field === 'identity') {
        setFormData(prev => ({ ...prev, identityProofFile: file, identityProofFilename: file.name }));
      } else if (field === 'address') {
        setFormData(prev => ({ ...prev, addressProofFile: file, addressProofFilename: file.name }));
      } else if (field === 'qualification') {
        setFormData(prev => ({ ...prev, qualificationProofFile: file, qualificationProofFilename: file.name }));
      }
    } finally {
      setUploadingKycField(null);
    }
  };

  // Handle Gallery Upload
  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map(f => URL.createObjectURL(f));
    setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...newImages].slice(0, 6) }));
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  // Add / Remove Subjects
  const addSubject = (sub) => {
    if (sub && !formData.subjects.includes(sub)) {
      setFormData(prev => ({ ...prev, subjects: [...prev.subjects, sub], customSubjectInput: '' }));
    }
  };

  const removeSubject = (subToRemove) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subToRemove)
    }));
  };

  // Add / Remove Classes
  const addClass = (cls) => {
    if (cls && !formData.classes.includes(cls)) {
      setFormData(prev => ({ ...prev, classes: [...prev.classes, cls], customClassInput: '' }));
    }
  };

  const removeClass = (clsToRemove) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c !== clsToRemove)
    }));
  };

  // Step Validation & Navigation
  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.name.trim()) return 'Please enter your full name.';
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address.';
      if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit mobile number.';
      if (!formData.password || formData.password.length < 6) return 'Please set a secure password (min 6 characters).';
    }
    if (step === 2) {
      if (!formData.headline.trim()) return 'Please enter a professional headline (e.g. Maths Teacher with 5+ Years Experience).';
      if (!formData.bio.trim()) return 'Please enter a brief bio about yourself and your teaching experience.';
    }
    if (step === 3) {
      if (formData.subjects.length === 0) return 'Please add at least one subject you teach.';
      if (formData.classes.length === 0) return 'Please add at least one class / grade you teach.';
    }
    if (step === 4) {
      if (!formData.experience) return 'Please select your teaching experience.';
      if (!formData.qualification) return 'Please select your highest qualification.';
      if (!formData.institute.trim()) return 'Please enter your institute or university name.';
    }
    if (step === 5) {
      if (!formData.teachingMode) return 'Please select a teaching mode.';
      if (formData.teachingMode !== 'Online' && !formData.preferredLocation.trim()) {
        return 'Please enter your preferred teaching city / area.';
      }
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
        return 'Please enter a valid 6-digit postal pincode.';
      }
    }
    if (step === 7) {
      if (!formData.identityProofFilename) return 'Please upload your Identity Proof document.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg('');
    setStep(prev => Math.min(prev + 1, 8));
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  // Final Submit
  const handleSubmit = async () => {
    if (!formData.agreeTerms) {
      setErrorMsg('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'TUTOR',
        professionalHeadline: formData.headline.trim(),
        bio: formData.bio.trim(),
        subjects: formData.subjects,
        grades: formData.classes,
        teachingModes: formData.teachingMode === 'Both' ? ['Online', 'Offline'] : [formData.teachingMode],
        experience: {
          years: parseInt(formData.experience) || 3,
          description: `${formData.experience} teaching ${formData.subjects.join(', ')}`
        },
        education: [{
          degree: formData.qualification,
          institution: formData.institute,
          year: parseInt(formData.passingYear) || 2020,
          field: formData.subjects[0] || 'Education'
        }],
        location: {
          city: formData.preferredLocation || 'Local Area',
          area: formData.preferredLocation || '',
          pincode: formData.pincode.trim()
        },
        profilePhoto: {
          url: formData.profilePhotoUrl || ''
        },
        kycData: {
          govtIdType: formData.identityProofType,
          identityVerified: false,
          documentsUploaded: true
        }
      };

      await register(payload);
      navigate('/tutor/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please verify your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mn-become-tutor-root">
      <div className="mn-become-tutor-container">
        
        {/* ============================================================ */}
        {/* TOP BRAND & TITLE HEADER                                     */}
        {/* ============================================================ */}
        <div className="mn-tutor-wizard-top-header">
          <Link to="/" className="mn-tutor-wizard-brand">
            <img src="/logo.png" alt="MentorNearby" className="mn-wizard-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <span className="mn-wizard-brand-text">Mentor<span className="mn-brand-red">Nearby</span></span>
              <span className="mn-wizard-brand-sub">Find. Learn. Grow.</span>
            </div>
          </Link>

          <h1 className="mn-tutor-wizard-main-title">
            Become a Tutor <span className="mn-title-sep">–</span> <span className="mn-gold-text">Step by Step</span>
          </h1>
          <p className="mn-tutor-wizard-sub">
            Create your tutor account in simple steps and start teaching with confidence.
          </p>

          <div className="mn-wizard-cap-divider">🎓</div>
        </div>

        {/* ============================================================ */}
        {/* MAIN STEP CARD CONTAINER                                     */}
        {/* ============================================================ */}
        <div className="mn-tutor-step-card">
          
          {/* Card Header with Step Title & Progress Counter */}
          <div className="mn-step-card-header">
            <div className="mn-step-badge-title">
              <span className="mn-step-circle-num">{step}</span>
              <span className="mn-step-title-text">
                {step === 1 && 'Basic Information'}
                {step === 2 && 'Profile Details'}
                {step === 3 && 'Subjects & Classes'}
                {step === 4 && 'Experience & Education'}
                {step === 5 && 'Location & Mode'}
                {step === 6 && 'Profile Picture & Gallery'}
                {step === 7 && 'Document Verification (KYC)'}
                {step === 8 && 'Review & Submit'}
              </span>
            </div>
            <span className="mn-step-fraction-counter">{step}/8</span>
          </div>

          {/* Progress Bar Line */}
          <div className="mn-step-progress-bar-track">
            <div
              className="mn-step-progress-bar-fill"
              style={{ width: `${(step / 8) * 100}%` }}
            ></div>
          </div>

          {/* Global Step Error Message */}
          {errorMsg && (
            <div className="mn-step-alert-error" role="alert">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: BASIC INFORMATION                                    */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="mn-step-body">
              <div className="mn-step-intro-row">
                <p className="mn-step-intro-text">Let's start with your basic details.</p>
                <div className="mn-avatar-upload-preview">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt="Avatar" className="mn-avatar-img-preview" />
                  ) : (
                    <span className="mn-avatar-placeholder-icon">👤</span>
                  )}
                  <label className="mn-avatar-camera-btn" title="Upload Photo">
                    📷
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Full Name <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Email Address <span className="mn-req">*</span></label>
                <input
                  type="email"
                  className="mn-form-input"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Mobile Number <span className="mn-req">*</span></label>
                <div className="mn-phone-input-row">
                  <span className="mn-phone-prefix">+91 ▾</span>
                  <input
                    type="tel"
                    className="mn-form-input mn-phone-field"
                    placeholder="Enter your mobile number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Password <span className="mn-req">*</span></label>
                <input
                  type="password"
                  className="mn-form-input"
                  placeholder="Set your account password (min 6 chars)"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                Continue →
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PROFILE DETAILS                                      */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="mn-step-body">
              <div className="mn-step-intro-row">
                <p className="mn-step-intro-text">Tell students about yourself.</p>
                <div className="mn-avatar-upload-preview">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt="Avatar" className="mn-avatar-img-preview" />
                  ) : (
                    <span className="mn-avatar-placeholder-icon">👤</span>
                  )}
                  <label className="mn-avatar-camera-btn" title="Upload Photo">
                    📷
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Headline <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="e.g. Maths Teacher with 5+ Years Experience"
                  value={formData.headline}
                  onChange={(e) => setFormData(p => ({ ...p, headline: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <div className="mn-form-lbl-row">
                  <label className="mn-form-lbl">Short Bio <span className="mn-req">*</span></label>
                  <span className="mn-char-counter">{formData.bio.length}/300</span>
                </div>
                <textarea
                  className="mn-form-textarea"
                  rows={4}
                  maxLength={300}
                  placeholder="Write a short bio about yourself, your teaching experience and what makes you unique..."
                  value={formData.bio}
                  onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                ></textarea>
              </div>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SUBJECTS & CLASSES                                   */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Select subjects you teach and classes.</p>

              {/* Subjects You Teach */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Subjects You Teach <span className="mn-req">*</span></label>
                <div className="mn-chips-container">
                  {formData.subjects.map((sub) => (
                    <span key={sub} className="mn-removable-chip">
                      <span>{sub}</span>
                      <button type="button" onClick={() => removeSubject(sub)} className="mn-chip-remove-btn">×</button>
                    </span>
                  ))}
                </div>

                <div className="mn-add-chip-row">
                  <select
                    className="mn-form-select"
                    onChange={(e) => { if (e.target.value) addSubject(e.target.value); e.target.value = ''; }}
                  >
                    <option value="">+ Choose from popular subjects</option>
                    {POPULAR_SUBJECTS_LIST.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classes You Teach */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Classes You Teach <span className="mn-req">*</span></label>
                <div className="mn-chips-container">
                  {formData.classes.map((cls) => (
                    <span key={cls} className="mn-removable-chip">
                      <span>{cls}</span>
                      <button type="button" onClick={() => removeClass(cls)} className="mn-chip-remove-btn">×</button>
                    </span>
                  ))}
                </div>

                <div className="mn-add-chip-row">
                  <select
                    className="mn-form-select"
                    onChange={(e) => { if (e.target.value) addClass(e.target.value); e.target.value = ''; }}
                  >
                    <option value="">+ Choose from classes &amp; grades</option>
                    {POPULAR_CLASSES_LIST.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: EXPERIENCE & EDUCATION                               */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Add your experience and educational background.</p>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Teaching Experience <span className="mn-req">*</span></label>
                <select
                  className="mn-form-select"
                  value={formData.experience}
                  onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value }))}
                >
                  <option value="1+ Years">1+ Years</option>
                  <option value="2+ Years">2+ Years</option>
                  <option value="3+ Years">3+ Years</option>
                  <option value="5+ Years">5+ Years</option>
                  <option value="8+ Years">8+ Years</option>
                  <option value="10+ Years">10+ Years</option>
                </select>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Highest Qualification <span className="mn-req">*</span></label>
                <select
                  className="mn-form-select"
                  value={formData.qualification}
                  onChange={(e) => setFormData(p => ({ ...p, qualification: e.target.value }))}
                >
                  <option value="B.Tech">B.Tech / B.E.</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="B.A">B.A</option>
                  <option value="M.A">M.A</option>
                  <option value="B.Com">B.Com</option>
                  <option value="M.Com">M.Com</option>
                  <option value="B.Ed">B.Ed</option>
                  <option value="M.Ed">M.Ed</option>
                  <option value="Ph.D">Ph.D / Doctorate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Institute / University <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter your institute name"
                  value={formData.institute}
                  onChange={(e) => setFormData(p => ({ ...p, institute: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Year of Passing <span className="mn-req">*</span></label>
                <select
                  className="mn-form-select"
                  value={formData.passingYear}
                  onChange={(e) => setFormData(p => ({ ...p, passingYear: e.target.value }))}
                >
                  {Array.from({ length: 25 }, (_, i) => 2026 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: LOCATION & MODE                                      */}
          {/* ============================================================ */}
          {step === 5 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Where and how do you want to teach?</p>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Teaching Mode <span className="mn-req">*</span></label>
                <div className="mn-teaching-modes-grid">
                  <button
                    type="button"
                    className={`mn-mode-card ${formData.teachingMode === 'Online' ? 'active' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, teachingMode: 'Online' }))}
                  >
                    <span className="mn-mode-icon">💻</span>
                    <span className="mn-mode-name">Online</span>
                  </button>

                  <button
                    type="button"
                    className={`mn-mode-card ${formData.teachingMode === 'Offline' ? 'active' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, teachingMode: 'Offline' }))}
                  >
                    <span className="mn-mode-icon">👨‍🏫</span>
                    <span className="mn-mode-name">Offline</span>
                  </button>

                  <button
                    type="button"
                    className={`mn-mode-card ${formData.teachingMode === 'Both' ? 'active' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, teachingMode: 'Both' }))}
                  >
                    <span className="mn-mode-icon">🔄</span>
                    <span className="mn-mode-name">Both</span>
                  </button>
                </div>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Preferred Location (for Offline)</label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter your city / area"
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData(p => ({ ...p, preferredLocation: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Pincode <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                />
              </div>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: PROFILE PICTURE & GALLERY                            */}
          {/* ============================================================ */}
          {step === 6 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Add photo and gallery to build trust.</p>

              <div className="mn-photo-banner-box">
                <div className="mn-avatar-upload-preview large">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt="Avatar" className="mn-avatar-img-preview" />
                  ) : (
                    <span className="mn-avatar-placeholder-icon">👤</span>
                  )}
                  <label className="mn-avatar-camera-btn" title="Upload Photo">
                    📷
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div className="mn-photo-spec-info">
                  <span className="mn-photo-spec-title">Main Profile Photo</span>
                  <span className="mn-photo-spec-sub">JPG, PNG (Max. 2MB)</span>
                </div>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Gallery Images (Optional)</label>
                <div className="mn-gallery-thumbnails-grid">
                  <label className="mn-gallery-upload-card">
                    <span className="mn-gallery-plus">+</span>
                    <span className="mn-gallery-upload-text">Upload images</span>
                    <span className="mn-gallery-upload-sub">JPG, PNG (Max. 5MB each)</span>
                    <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} />
                  </label>

                  {formData.galleryImages.map((imgUrl, i) => (
                    <div key={i} className="mn-gallery-thumb-item">
                      <img src={imgUrl} alt={`Gallery ${i + 1}`} className="mn-gallery-img" />
                      <button type="button" onClick={() => removeGalleryImage(i)} className="mn-thumb-remove-btn">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 7: DOCUMENT VERIFICATION (KYC)                          */}
          {/* ============================================================ */}
          {step === 7 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Upload documents for verification.</p>

              {/* Identity Proof */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Identity Proof <span className="mn-req">*</span></label>
                <div className="mn-kyc-upload-row">
                  <select
                    className="mn-form-select mn-kyc-type-select"
                    value={formData.identityProofType}
                    onChange={(e) => setFormData(p => ({ ...p, identityProofType: e.target.value }))}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>

                  <label className="mn-kyc-upload-btn">
                    <span>📤 Upload Document</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload('identity', e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {formData.identityProofFilename && (
                  <div className="mn-kyc-file-badge">
                    <span>📄 {formData.identityProofFilename}</span>
                    <span className="mn-file-check">✓</span>
                  </div>
                )}
              </div>

              {/* Address Proof */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Address Proof <span className="mn-req">*</span></label>
                <div className="mn-kyc-upload-row">
                  <select
                    className="mn-form-select mn-kyc-type-select"
                    value={formData.addressProofType}
                    onChange={(e) => setFormData(p => ({ ...p, addressProofType: e.target.value }))}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Electricity Bill">Electricity Bill</option>
                    <option value="Passport">Passport</option>
                    <option value="Rent Agreement">Rent Agreement</option>
                  </select>

                  <label className="mn-kyc-upload-btn">
                    <span>📤 Upload Document</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload('address', e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {formData.addressProofFilename && (
                  <div className="mn-kyc-file-badge">
                    <span>📄 {formData.addressProofFilename}</span>
                    <span className="mn-file-check">✓</span>
                  </div>
                )}
              </div>

              {/* Qualification Proof */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Qualification Proof <span className="mn-req">*</span></label>
                <div className="mn-kyc-upload-row">
                  <select
                    className="mn-form-select mn-kyc-type-select"
                    value={formData.qualificationProofType}
                    onChange={(e) => setFormData(p => ({ ...p, qualificationProofType: e.target.value }))}
                  >
                    <option value="Degree Certificate">Degree Certificate</option>
                    <option value="Marksheet">Marksheet</option>
                    <option value="College ID">College ID</option>
                  </select>

                  <label className="mn-kyc-upload-btn">
                    <span>📤 Upload Document</span>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload('qualification', e)} style={{ display: 'none' }} />
                  </label>
                </div>
                {formData.qualificationProofFilename && (
                  <div className="mn-kyc-file-badge">
                    <span>📄 {formData.qualificationProofFilename}</span>
                    <span className="mn-file-check">✓</span>
                  </div>
                )}
              </div>

              <p className="mn-kyc-security-note">
                🔒 Note: All documents are secure and encrypted.
              </p>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 8: REVIEW & SUBMIT                                      */}
          {/* ============================================================ */}
          {step === 8 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Review your details and submit.</p>

              {/* Summary Profile Header */}
              <div className="mn-review-profile-header">
                <div className="mn-review-avatar-frame">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt={formData.name} className="mn-review-avatar-img" />
                  ) : (
                    <span className="mn-review-avatar-fallback">{formData.name ? formData.name.charAt(0).toUpperCase() : 'T'}</span>
                  )}
                </div>
                <div>
                  <div className="mn-review-name-row">
                    <span className="mn-review-name">{formData.name || 'Your Name'}</span>
                    <span className="mn-review-verified-check">✓</span>
                  </div>
                  <div className="mn-review-headline">{formData.headline || 'Professional Home & Online Educator'}</div>
                  <div className="mn-review-exp-pill">{formData.experience} Experience</div>
                </div>
              </div>

              {/* Summary Detail Items */}
              <div className="mn-review-details-grid">
                <div className="mn-review-item">
                  <span className="mn-review-item-icon">📚</span>
                  <span className="mn-review-item-label">Subjects</span>
                  <span className="mn-review-item-val">{formData.subjects.join(', ')}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">🎓</span>
                  <span className="mn-review-item-label">Classes</span>
                  <span className="mn-review-item-val">{formData.classes.join(', ')}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">🔄</span>
                  <span className="mn-review-item-label">Mode</span>
                  <span className="mn-review-item-val">{formData.teachingMode}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">💼</span>
                  <span className="mn-review-item-label">Experience</span>
                  <span className="mn-review-item-val">{formData.experience}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">📍</span>
                  <span className="mn-review-item-label">Location</span>
                  <span className="mn-review-item-val">{formData.preferredLocation || 'Local Area'} (PIN: {formData.pincode})</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">🎓</span>
                  <span className="mn-review-item-label">Qualification</span>
                  <span className="mn-review-item-val">{formData.qualification} • {formData.institute} ({formData.passingYear})</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">📞</span>
                  <span className="mn-review-item-label">Mobile</span>
                  <span className="mn-review-item-val">+91 {formData.phone}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">✉️</span>
                  <span className="mn-review-item-label">Email</span>
                  <span className="mn-review-item-val">{formData.email}</span>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="mn-review-terms-label">
                <input
                  type="checkbox"
                  className="mn-review-terms-checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData(p => ({ ...p, agreeTerms: e.target.checked }))}
                />
                <span>I agree to the <Link to="/terms" target="_blank" className="mn-gold-link">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" className="mn-gold-link">Privacy Policy</Link>.</span>
              </label>

              <div className="mn-step-btn-row">
                <button type="button" className="mn-step-back-btn" onClick={handleBack} disabled={isSubmitting}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="mn-step-submit-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mn-btn-spinner"></span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit & Continue →'
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* BOTTOM TRUST GUARANTEE BAR                                   */}
        {/* ============================================================ */}
        <div className="mn-wizard-trust-guarantee-bar">
          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">🛡️</span>
            <div>
              <div className="mn-w-trust-title">100% Verified Tutors</div>
              <div className="mn-w-trust-sub">We verify every tutor for your safety</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">🔒</span>
            <div>
              <div className="mn-w-trust-title">Secure &amp; Trusted Platform</div>
              <div className="mn-w-trust-sub">Your data and documents are safe with us</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">👥</span>
            <div>
              <div className="mn-w-trust-title">Reach Thousands of Students</div>
              <div className="mn-w-trust-sub">Connect with students looking for tutors</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">🏅</span>
            <div>
              <div className="mn-w-trust-title">Grow Your Teaching Career</div>
              <div className="mn-w-trust-sub">Build your profile and grow with MentorNearby</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BecomeTutorPage;
