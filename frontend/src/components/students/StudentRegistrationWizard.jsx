// ============================================================
// components/students/StudentRegistrationWizard.jsx
// MentorNearby Student Signup Flow — Reference-Matched 8 Steps
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { useAuth } from '../../context/AuthContext';
import { uploadPhoto } from '../../api/upload';
import getCroppedImg from '../../utils/cropImage';
import './StudentRegistrationWizard.css';

const CLASS_OPTIONS = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'College / Degree', 'Competitive Exams (JEE/NEET)'
];

const BOARD_OPTIONS = [
  'CBSE', 'ICSE', 'State Board (UP/Other)', 'IB (International Baccalaureate)', 'IGCSE / Cambridge', 'Other'
];

const POPULAR_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Computer Science', 'Economics', 'Accountancy', 'Hindi', 'Social Science', 'Coding / Python'
];

const BUDGET_PRESETS = [
  '₹1,000 - ₹2,000',
  '₹2,000 - ₹3,000',
  '₹3,000 - ₹5,000',
  '₹5,000 - ₹10,000',
  '₹10,000+'
];

const GOAL_OPTIONS = [
  'Improve Academic Performance',
  'Exam Preparation (CBSE/ICSE)',
  'Competitive Exam Prep (JEE/NEET)',
  'Concept Clarity & Homework Help',
  'Skill Building & Spoken English',
  'Score 90%+ in Board Exams',
  'Other'
];

const StudentRegistrationWizard = ({ onSwitchToTutor }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Role
    role: 'STUDENT',

    // Step 2: Basic Account Details
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profilePhotoUrl: '',
    profilePhotoBlob: null,

    // Step 4: Academic Details
    studentClass: 'Class 11',
    board: 'CBSE',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    customSubjectInput: '',
    location: 'Lucknow, Uttar Pradesh',
    studyMode: 'Both', // 'Online' | 'Offline' | 'Both'

    // Step 5: Budget & Preferences
    budgetPreset: '₹3,000 - ₹5,000',
    isCustomBudget: false,
    customBudgetAmount: '4000',
    preferredTutor: 'Any', // 'Any' | 'Male' | 'Female'

    // Step 6: Goals & Requirements
    learningGoal: 'Improve Academic Performance',
    requirements: 'Focus on concept clarity and weekly doubt clearing sessions.',

    // Step 7: Terms Agreement
    agreeTerms: true,
  });

  // Cropper State
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Update specific form fields
  const updateField = (field, value) => {
    setSubmitError('');
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Image Upload Handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Please upload JPG, JPEG, or PNG format.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Photo size should be less than 5MB.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setStep(3); // Go to Crop step
    };
    reader.readAsDataURL(file);
  };

  const onCropAreaComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropDone = async () => {
    if (!rawImageSrc || !croppedAreaPixels) {
      setStep(2);
      return;
    }
    try {
      const croppedResult = await getCroppedImg(rawImageSrc, croppedAreaPixels, rotation);
      if (croppedResult) {
        updateField('profilePhotoUrl', croppedResult.url);
        updateField('profilePhotoBlob', croppedResult.blob);
      }
    } catch (err) {
      console.error('Error cropping image:', err);
    }
    setStep(2); // Return to Basic Account Details with cropped photo
  };

  // Subject Tag Toggle
  const toggleSubject = (subject) => {
    const current = formData.subjects || [];
    if (current.includes(subject)) {
      updateField('subjects', current.filter((s) => s !== subject));
    } else {
      updateField('subjects', [...current, subject]);
    }
  };

  const handleAddCustomSubject = (e) => {
    if (e.key === 'Enter' && formData.customSubjectInput.trim()) {
      e.preventDefault();
      const val = formData.customSubjectInput.trim();
      if (!formData.subjects.includes(val)) {
        updateField('subjects', [...formData.subjects, val]);
      }
      updateField('customSubjectInput', '');
    }
  };

  // Step Validation
  const validateStep = (s) => {
    const errs = {};

    if (s === 2) {
      if (!formData.name.trim()) errs.name = 'Full Name is required';
      if (!formData.email.trim()) errs.email = 'Email Address is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address';
      if (!formData.phone.trim()) errs.phone = 'Mobile Number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit mobile number';
      if (!formData.password) errs.password = 'Password is required (min 6 characters)';
      else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }

    if (s === 4) {
      if (!formData.studentClass) errs.studentClass = 'Class is required';
      if (!formData.board) errs.board = 'Board is required';
      if (!formData.subjects || formData.subjects.length === 0) errs.subjects = 'Select at least one subject';
      if (!formData.location.trim()) errs.location = 'City / Location is required';
    }

    if (s === 5) {
      if (formData.isCustomBudget && !formData.customBudgetAmount) {
        errs.customBudget = 'Enter custom budget amount';
      }
    }

    if (s === 6) {
      if (!formData.learningGoal) errs.learningGoal = 'Learning goal is required';
    }

    if (s === 7) {
      if (!formData.agreeTerms) errs.agreeTerms = 'Please agree to Terms & Conditions';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(4);
      else if (step === 3) setStep(4);
      else if (step === 4) setStep(5);
      else if (step === 5) setStep(6);
      else if (step === 6) setStep(7);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(2);
    else if (step === 5) setStep(4);
    else if (step === 6) setStep(5);
    else if (step === 7) setStep(6);
  };

  // Submit Final Registration
  const handleFinalSubmit = async () => {
    if (!validateStep(7)) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      let uploadedPhotoUrl = formData.profilePhotoUrl;

      // If user uploaded a photo blob, upload to Cloudinary
      if (formData.profilePhotoBlob) {
        try {
          const uploadRes = await uploadPhoto(formData.profilePhotoBlob);
          const cdnUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
          if (cdnUrl) uploadedPhotoUrl = cdnUrl;
        } catch (uploadErr) {
          console.warn('Photo upload fallback to data URL:', uploadErr);
        }
      }

      const budgetDisplay = formData.isCustomBudget
        ? `₹${formData.customBudgetAmount} / month`
        : `${formData.budgetPreset} / month`;

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'STUDENT',
        avatar: uploadedPhotoUrl,
        profilePhoto: { url: uploadedPhotoUrl },
        location: {
          city: formData.location.trim(),
          area: formData.location.trim(),
        },
        studentDetails: {
          name: formData.name.trim(),
          class: formData.studentClass,
          board: formData.board,
        },
        academicDetails: {
          subjectsRequired: formData.subjects,
          learningGoals: [formData.learningGoal],
        },
        tuitionRequirements: {
          mode: formData.studyMode === 'Both' ? 'Hybrid' : formData.studyMode,
          budget: budgetDisplay,
          preferredGender: formData.preferredTutor,
        },
        learningGoals: [formData.learningGoal],
        bio: formData.requirements || '',
        aboutMe: formData.requirements || '',
      };

      await register(payload);
      setIsSubmitting(false);
      setStep(8); // Account Created Successfully
    } catch (err) {
      console.error('Registration error:', err);
      setIsSubmitting(false);
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to create student account. Please check your details.'
      );
    }
  };

  return (
    <div className="sr-wizard-root">
      <div className="sr-wizard-container">
        
        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoSelect}
          accept="image/jpeg,image/png,image/jpg,image/webp"
          style={{ display: 'none' }}
        />

        <div className="sr-card">
          
          {/* ============================================================ */}
          {/* TOP NAV & PROGRESS (Steps 2 to 7)                            */}
          {/* ============================================================ */}
          {step > 1 && step < 8 && (
            <div className="sr-top-nav">
              <button type="button" onClick={handleBack} className="sr-back-btn" title="Go Back">
                ←
              </button>
              <div className="sr-progress-dots">
                {[1, 2, 3, 4, 5, 6, 7].map((dotIdx) => {
                  const effectiveStep = step === 3 ? 2 : step > 3 ? step - 1 : step;
                  return (
                    <div
                      key={dotIdx}
                      className={`sr-dot ${dotIdx === effectiveStep ? 'active' : ''} ${dotIdx < effectiveStep ? 'completed' : ''}`}
                    />
                  );
                })}
              </div>
              <div style={{ width: 24 }}></div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: CHOOSE ROLE                                          */}
          {/* ============================================================ */}
          {step === 1 && (
            <div>
              <div className="sr-header-center">
                <h1 className="sr-logo-title">
                  Mentor<span>Nearby</span>
                </h1>
                <div className="sr-logo-tagline">FIND. LEARN. GROW.</div>
                <p className="sr-step-subtitle" style={{ marginTop: 14 }}>
                  Choose how you want to join
                </p>
              </div>

              <div className="sr-roles-grid">
                {/* 👨‍🏫 Option 1: Tutor */}
                <div
                  className="sr-role-card"
                  onClick={() => {
                    if (onSwitchToTutor) onSwitchToTutor();
                    else navigate('/become-tutor');
                  }}
                >
                  <div className="sr-role-icon-box">👨‍🏫</div>
                  <div>
                    <div className="sr-role-name">I am a Tutor</div>
                    <div className="sr-role-desc">Join as a tutor and start teaching</div>
                  </div>
                </div>

                {/* 👨‍🎓 Option 2: Student (Highlighted) */}
                <div
                  className="sr-role-card selected"
                  onClick={() => setStep(2)}
                >
                  <div className="sr-role-icon-box" style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#F59E0B' }}>
                    👨‍🎓
                  </div>
                  <div>
                    <div className="sr-role-name" style={{ color: '#F59E0B' }}>I am a Student</div>
                    <div className="sr-role-desc">Find the best tutors to learn</div>
                  </div>
                </div>
              </div>

              <div className="sr-actions-row" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="sr-btn-primary"
                >
                  Continue as Student →
                </button>
              </div>

              <div className="sr-login-link-row">
                Already have an account?{' '}
                <Link to="/login" className="sr-login-link">
                  Login
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: BASIC ACCOUNT DETAILS                                */}
          {/* ============================================================ */}
          {step === 2 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">Let's create your account</h2>
                <p className="sr-step-subtitle">Enter your basic details to get started</p>
              </div>

              <div className="sr-basic-grid">
                
                {/* Left Photo Upload Col */}
                <div className="sr-avatar-col">
                  <div className="sr-avatar-label">Profile Photo</div>
                  <div
                    className="sr-avatar-circle-wrap"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload profile photo"
                  >
                    {formData.profilePhotoUrl ? (
                      <img
                        src={formData.profilePhotoUrl}
                        alt="Profile Preview"
                        className="sr-avatar-img"
                      />
                    ) : (
                      <div className="sr-avatar-placeholder">
                        <span className="sr-avatar-camera-icon">📷</span>
                        <span className="sr-avatar-upload-text">Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <span className="sr-avatar-hint">JPG, PNG (Max 2MB)</span>

                  {formData.profilePhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="sr-crop-photo-btn"
                    >
                      Crop Photo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="sr-crop-photo-btn"
                    >
                      Choose Photo
                    </button>
                  )}

                  {errors.photo && <div className="sr-error-msg">{errors.photo}</div>}
                </div>

                {/* Right Fields Col */}
                <div className="sr-fields-col">
                  
                  {/* Full Name */}
                  <div className="sr-form-group">
                    <label className="sr-label">
                      Full Name <span className="sr-required-star">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={`sr-input ${errors.name ? 'has-error' : ''}`}
                    />
                    {errors.name && <span className="sr-error-msg">{errors.name}</span>}
                  </div>

                  {/* Email Address */}
                  <div className="sr-form-group">
                    <label className="sr-label">
                      Email Address <span className="sr-required-star">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`sr-input ${errors.email ? 'has-error' : ''}`}
                    />
                    {errors.email && <span className="sr-error-msg">{errors.email}</span>}
                  </div>

                  {/* Mobile Number */}
                  <div className="sr-form-group">
                    <label className="sr-label">
                      Mobile Number <span className="sr-required-star">*</span>
                    </label>
                    <div className="sr-phone-wrap">
                      <div className="sr-country-code">+91 ▾</div>
                      <input
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className={`sr-input ${errors.phone ? 'has-error' : ''}`}
                      />
                    </div>
                    {errors.phone && <span className="sr-error-msg">{errors.phone}</span>}
                  </div>

                  {/* Password */}
                  <div className="sr-form-group">
                    <label className="sr-label">
                      Password <span className="sr-required-star">*</span>
                    </label>
                    <div className="sr-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className={`sr-input ${errors.password ? 'has-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="sr-eye-btn"
                        tabIndex="-1"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.password && <span className="sr-error-msg">{errors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="sr-form-group">
                    <label className="sr-label">
                      Confirm Password <span className="sr-required-star">*</span>
                    </label>
                    <div className="sr-input-wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        className={`sr-input ${errors.confirmPassword ? 'has-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="sr-eye-btn"
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="sr-error-msg">{errors.confirmPassword}</span>}
                  </div>

                </div>

              </div>

              <div className="sr-actions-row">
                <button type="button" onClick={handleBack} className="sr-btn-outline">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="sr-btn-primary">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: CROP YOUR PHOTO (Interactive Instagram-style Cropper) */}
          {/* ============================================================ */}
          {step === 3 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">Crop your photo</h2>
                <p className="sr-step-subtitle">Drag to adjust and crop your photo</p>
              </div>

              <div className="sr-cropper-stage">
                {rawImageSrc ? (
                  <Cropper
                    image={rawImageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    showGrid={true}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropAreaComplete}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                    No photo selected
                  </div>
                )}
              </div>

              <div className="sr-cropper-controls">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  className="sr-cropper-tool-btn"
                  title="Rotate Left"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="sr-cropper-tool-btn"
                  title="Rotate Right"
                >
                  ↻
                </button>

                <div className="sr-zoom-slider-wrap">
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>-</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="sr-zoom-slider"
                  />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>+</span>
                </div>
              </div>

              <div className="sr-actions-row">
                <button type="button" onClick={() => setStep(2)} className="sr-btn-outline">
                  Cancel
                </button>
                <button type="button" onClick={handleCropDone} className="sr-btn-primary">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: ACADEMIC DETAILS                                     */}
          {/* ============================================================ */}
          {step === 4 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">Tell us about your studies</h2>
                <p className="sr-step-subtitle">This helps us match you with the right tutors</p>
              </div>

              <div className="sr-fields-col">
                
                {/* Class */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Class <span className="sr-required-star">*</span>
                  </label>
                  <select
                    value={formData.studentClass}
                    onChange={(e) => updateField('studentClass', e.target.value)}
                    className="sr-input"
                  >
                    {CLASS_OPTIONS.map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Board */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Board <span className="sr-required-star">*</span>
                  </label>
                  <select
                    value={formData.board}
                    onChange={(e) => updateField('board', e.target.value)}
                    className="sr-input"
                  >
                    {BOARD_OPTIONS.map((bd) => (
                      <option key={bd} value={bd}>
                        {bd}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subjects */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Subjects <span className="sr-required-star">*</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 8px' }}>
                    {POPULAR_SUBJECTS.map((sub) => {
                      const isSel = formData.subjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubject(sub)}
                          className={`sr-segment-btn ${isSel ? 'active' : ''}`}
                          style={{ flex: 'none', padding: '6px 12px', fontSize: '11.5px' }}
                        >
                          {isSel ? '✓ ' : '+ '}{sub}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Type subject & press Enter to add custom"
                    value={formData.customSubjectInput}
                    onChange={(e) => updateField('customSubjectInput', e.target.value)}
                    onKeyDown={handleAddCustomSubject}
                    className="sr-input"
                  />
                  {errors.subjects && <span className="sr-error-msg">{errors.subjects}</span>}
                </div>

                {/* City / Location */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    City / Location <span className="sr-required-star">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your city or location (e.g. Lucknow, Uttar Pradesh)"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className={`sr-input ${errors.location ? 'has-error' : ''}`}
                  />
                  {errors.location && <span className="sr-error-msg">{errors.location}</span>}
                </div>

                {/* Study Mode */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Study Mode <span className="sr-required-star">*</span>
                  </label>
                  <div className="sr-segments-group">
                    {['Online', 'Offline', 'Both'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateField('studyMode', mode)}
                        className={`sr-segment-btn ${formData.studyMode === mode ? 'active' : ''}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="sr-actions-row">
                <button type="button" onClick={handleBack} className="sr-btn-outline">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="sr-btn-primary">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: BUDGET & PREFERENCES                                 */}
          {/* ============================================================ */}
          {step === 5 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">Your Budget & Preferences</h2>
                <p className="sr-step-subtitle">Helps tutors know your expectations</p>
              </div>

              <div className="sr-fields-col">
                
                {/* Monthly Budget Presets */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Monthly Budget <span className="sr-required-star">*</span>
                  </label>
                  <div className="sr-budget-grid">
                    {BUDGET_PRESETS.map((preset) => {
                      const isSel = !formData.isCustomBudget && formData.budgetPreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            updateField('isCustomBudget', false);
                            updateField('budgetPreset', preset);
                          }}
                          className={`sr-budget-chip ${isSel ? 'active' : ''}`}
                        >
                          {preset}
                        </button>
                      );
                    })}

                    {/* Custom Budget Button */}
                    <button
                      type="button"
                      onClick={() => updateField('isCustomBudget', true)}
                      className={`sr-budget-chip ${formData.isCustomBudget ? 'active' : ''}`}
                    >
                      Custom Budget
                    </button>
                  </div>

                  {/* Custom Budget Input (when custom selected) */}
                  {formData.isCustomBudget && (
                    <div className="sr-custom-budget-row">
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={formData.customBudgetAmount}
                        onChange={(e) => updateField('customBudgetAmount', e.target.value)}
                        className="sr-custom-budget-input"
                        autoFocus
                      />
                      <span className="sr-custom-budget-sub">per month</span>
                    </div>
                  )}
                  {errors.customBudget && <span className="sr-error-msg">{errors.customBudget}</span>}
                </div>

                {/* Preferred Tutor Gender */}
                <div className="sr-form-group" style={{ marginTop: 8 }}>
                  <label className="sr-label">
                    Preferred Tutor (Optional) <span className="sr-required-star">*</span>
                  </label>
                  <div className="sr-segments-group">
                    {['Any', 'Male', 'Female'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => updateField('preferredTutor', gender)}
                        className={`sr-segment-btn ${formData.preferredTutor === gender ? 'active' : ''}`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="sr-actions-row">
                <button type="button" onClick={handleBack} className="sr-btn-outline">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="sr-btn-primary">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: GOALS & REQUIREMENTS                                 */}
          {/* ============================================================ */}
          {step === 6 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">What are your learning goals?</h2>
                <p className="sr-step-subtitle">Share your goals and what you want to achieve</p>
              </div>

              <div className="sr-fields-col">
                
                {/* Learning Goal */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Learning Goal <span className="sr-required-star">*</span>
                  </label>
                  <select
                    value={formData.learningGoal}
                    onChange={(e) => updateField('learningGoal', e.target.value)}
                    className="sr-input"
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.learningGoal && <span className="sr-error-msg">{errors.learningGoal}</span>}
                </div>

                {/* Describe Requirements */}
                <div className="sr-form-group">
                  <label className="sr-label">
                    Describe your requirements (Optional)
                  </label>
                  <textarea
                    placeholder="Write about what you want to learn, your expectations, preferred days/time, etc."
                    value={formData.requirements}
                    maxLength={500}
                    onChange={(e) => updateField('requirements', e.target.value)}
                    className="sr-textarea"
                  />
                  <div className="sr-textarea-counter">
                    {(formData.requirements || '').length}/500
                  </div>
                </div>

              </div>

              <div className="sr-actions-row">
                <button type="button" onClick={handleBack} className="sr-btn-outline">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="sr-btn-primary">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 7: REVIEW & CREATE ACCOUNT                              */}
          {/* ============================================================ */}
          {step === 7 && (
            <div>
              <div className="sr-header-left">
                <h2 className="sr-step-title">Review your details</h2>
                <p className="sr-step-subtitle">Please review your information before continuing</p>
              </div>

              <div className="sr-review-card">
                
                {/* Centered Avatar Preview */}
                <div className="sr-review-avatar-center">
                  {formData.profilePhotoUrl ? (
                    <img
                      src={formData.profilePhotoUrl}
                      alt="Student Avatar"
                      className="sr-review-avatar-img"
                    />
                  ) : (
                    <div className="sr-review-avatar-fallback">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                </div>

                <div className="sr-review-list">
                  <div className="sr-review-row">
                    <span className="sr-review-key">👤 Name</span>
                    <span className="sr-review-val">{formData.name}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">✉️ Email</span>
                    <span className="sr-review-val">{formData.email}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">📞 Mobile</span>
                    <span className="sr-review-val">+91 {formData.phone}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">🎓 Class</span>
                    <span className="sr-review-val">{formData.studentClass}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">🏫 Board</span>
                    <span className="sr-review-val">{formData.board}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">📖 Subjects</span>
                    <span className="sr-review-val">{formData.subjects.join(', ')}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">📍 Location</span>
                    <span className="sr-review-val">{formData.location}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">💻 Study Mode</span>
                    <span className="sr-review-val">{formData.studyMode === 'Both' ? 'Online & Offline' : formData.studyMode}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">💰 Budget</span>
                    <span className="sr-review-val">
                      {formData.isCustomBudget ? `₹ ${formData.customBudgetAmount} / month` : `${formData.budgetPreset} / month`}
                    </span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">👨‍🏫 Preferred Tutor</span>
                    <span className="sr-review-val">{formData.preferredTutor}</span>
                  </div>

                  <div className="sr-review-row">
                    <span className="sr-review-key">🎯 Goal</span>
                    <span className="sr-review-val">{formData.learningGoal}</span>
                  </div>

                  {formData.requirements && (
                    <div className="sr-review-row">
                      <span className="sr-review-key">📝 Requirements</span>
                      <span className="sr-review-val" style={{ maxWidth: '60%' }}>{formData.requirements}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Terms Checkbox */}
              <label className="sr-checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => updateField('agreeTerms', e.target.checked)}
                  className="sr-checkbox"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="sr-legal-link">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" target="_blank" className="sr-legal-link">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && <div className="sr-error-msg">{errors.agreeTerms}</div>}

              {submitError && (
                <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                  {submitError}
                </div>
              )}

              <div className="sr-actions-row">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="sr-btn-primary"
                  style={{ width: '100%' }}
                >
                  {isSubmitting ? 'Creating Student Account...' : 'Create My Account'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 8: ACCOUNT CREATED SUCCESSFULLY                         */}
          {/* ============================================================ */}
          {step === 8 && (
            <div className="sr-success-wrap">
              <div className="sr-success-icon-badge">✓</div>

              <h2 className="sr-success-title">Welcome to MentorNearby!</h2>
              <p className="sr-success-sub">Your student account has been created successfully.</p>

              {formData.profilePhotoUrl && (
                <img
                  src={formData.profilePhotoUrl}
                  alt="Student"
                  style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #F59E0B', objectFit: 'cover' }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate('/student-dashboard')}
                  className="sr-btn-primary"
                >
                  Go to Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="sr-btn-outline"
                >
                  Explore Tutors
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* BOTTOM TRUST FOOTER                                          */}
        {/* ============================================================ */}
        <footer className="sr-trust-footer">
          <div>Your data is safe with us. We never share your information with anyone.</div>
          <div className="sr-trust-pills">
            <span className="sr-trust-pill-item">☑ Trusted Platform</span>
            <span className="sr-trust-pill-item">👥 Verified Tutors</span>
            <span className="sr-trust-pill-item">🛡️ 100% Privacy</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default StudentRegistrationWizard;
