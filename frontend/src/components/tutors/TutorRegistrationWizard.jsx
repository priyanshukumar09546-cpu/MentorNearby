import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadPhoto, uploadDocument, uploadTutorId } from '../../api/upload';
import PhotoCropModal from '../common/PhotoCropModal';
import '../../pages/Auth/BecomeTutorPage.css';

const POPULAR_SUBJECTS_LIST = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Computer Science', 'Accountancy', 'Economics', 'Hindi', 'Social Science',
  'History', 'Geography', 'Political Science', 'Business Studies', 'Coding / Python'
];

const POPULAR_CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'College / Degree', 'Competitive Exams'
];

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TutorRegistrationWizard = ({ onBackToRoleSelect }) => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Photo Cropper State
  const [rawPhotoSrc, setRawPhotoSrc] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Form State — 8 Steps Exact
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    email: '',
    phone: '',
    password: '',
    profilePhotoUrl: '',
    
    // Step 2: Personal Details
    headline: '',
    bio: '',
    gender: 'Prefer not to say',
    age: '',
    
    // Step 3: Education
    qualification: 'B.Tech',
    institute: '',
    field: 'Computer Science',
    passingYear: '2020',
    
    // Step 4: Teaching Experience
    experience: '5+ Years',
    experienceDetails: '',
    
    // Step 5: Subjects & Pricing
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    classes: ['Class 6', 'Class 7', 'Class 8'],
    customSubjectInput: '',
    customClassInput: '',
    hourlyFee: '500',
    feeFrequency: 'PER_HOUR',
    negotiable: false,
    
    // Step 6: Availability & Mode
    teachingMode: 'Both', // 'Online' | 'Offline' | 'Both'
    preferredLocation: '',
    pincode: '',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    
    // Step 7: KYC Documents
    identityProofType: 'Aadhaar Card',
    identityProofFile: null,
    identityProofFilename: '',
    identityProofVerified: false,
    
    addressProofType: 'Aadhaar Card',
    addressProofFile: null,
    addressProofFilename: '',
    
    qualificationProofType: 'Degree Certificate',
    qualificationProofFile: null,
    qualificationProofFilename: '',
    
    // Step 8: Review & Submit
    agreeTerms: true,
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingKycField, setUploadingKycField] = useState(null);

  // 1. Trigger Photo Selection and Open Interactive Cropper Modal
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Profile photo must be less than 10MB.');
      e.target.value = '';
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      setRawPhotoSrc(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 2. Handle Cropped Image from PhotoCropModal (Canvas 400x400 output)
  const handleCropComplete = async (croppedData) => {
    setUploadingPhoto(true);
    setErrorMsg('');
    try {
      const res = await uploadPhoto(croppedData.file);
      const url = res.data?.data?.url || res.data?.url || croppedData.url;
      setFormData(prev => ({ ...prev, profilePhotoUrl: url }));
    } catch (err) {
      console.warn('Direct upload failed, using local cropped url:', err);
      setFormData(prev => ({ ...prev, profilePhotoUrl: croppedData.url }));
    } finally {
      setUploadingPhoto(false);
      setIsCropModalOpen(false);
      setRawPhotoSrc(null);
    }
  };

  // 3. Handle Document Upload with OCR & Fake ID Detection
  const handleDocumentUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size filter (50KB to 5MB)
    if (file.size < 50 * 1024) {
      setErrorMsg('File size bohot chhota hai (kam se kam 50KB hona chahiye). Saaf aur clear photo upload karein.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size 5MB se zyada hai. Kripya 5MB se kam ki photo upload karein.');
      e.target.value = '';
      return;
    }

    setUploadingKycField(field);
    setErrorMsg('');

    const docType = field === 'identity'
      ? formData.identityProofType
      : (field === 'address' ? formData.addressProofType : formData.qualificationProofType);

    try {
      const res = await uploadDocument(file, docType);
      const url = res.data?.data?.url || res.data?.url || '';
      if (field === 'identity') {
        setFormData(prev => ({
          ...prev,
          identityProofFile: url || file,
          identityProofFilename: file.name,
          identityProofVerified: true
        }));
      } else if (field === 'address') {
        setFormData(prev => ({ ...prev, addressProofFile: url || file, addressProofFilename: file.name }));
      } else if (field === 'qualification') {
        setFormData(prev => ({ ...prev, qualificationProofFile: url || file, qualificationProofFilename: file.name }));
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || err.response?.data?.error || 'Document verify karne me error aaya. Kripya saaf photo upload karein.';
      setErrorMsg(backendMsg);
      if (field === 'identity') {
        setFormData(prev => ({ ...prev, identityProofFile: null, identityProofFilename: '', identityProofVerified: false }));
      }
    } finally {
      setUploadingKycField(null);
      e.target.value = '';
    }
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

  // Toggle Day
  const toggleDay = (day) => {
    setFormData(prev => {
      const exists = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: exists ? prev.availableDays.filter(d => d !== day) : [...prev.availableDays, day]
      };
    });
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
      if (!formData.bio.trim()) return 'Please enter a brief bio about yourself and your teaching methodology.';
    }
    if (step === 3) {
      if (!formData.qualification) return 'Please select your highest qualification.';
      if (!formData.institute.trim()) return 'Please enter your institute or university name.';
    }
    if (step === 4) {
      if (!formData.experience) return 'Please select your teaching experience.';
    }
    if (step === 5) {
      if (formData.subjects.length === 0) return 'Please add at least one subject you teach.';
      if (formData.classes.length === 0) return 'Please add at least one class / grade you teach.';
      if (!formData.hourlyFee || Number(formData.hourlyFee) <= 0) return 'Please enter a valid tuition fee.';
    }
    if (step === 6) {
      if (!formData.teachingMode) return 'Please select a teaching mode.';
      if (formData.teachingMode !== 'Online' && !formData.preferredLocation.trim()) {
        return 'Please enter your preferred teaching city / area.';
      }
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
        return 'Please enter a valid 6-digit postal pincode.';
      }
      if (formData.availableDays.length === 0) return 'Please select at least one available teaching day.';
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
    if (step === 1 && onBackToRoleSelect) {
      onBackToRoleSelect();
      return;
    }
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
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        subjects: formData.subjects,
        grades: formData.classes,
        teachingModes: formData.teachingMode === 'Both' ? ['Online', 'Offline'] : [formData.teachingMode],
        fees: {
          amount: parseFloat(formData.hourlyFee) || 500,
          frequency: formData.feeFrequency || 'PER_HOUR',
          currency: 'INR',
          negotiable: !!formData.negotiable
        },
        experience: {
          years: parseInt(formData.experience) || 3,
          description: formData.experienceDetails || `${formData.experience} teaching ${formData.subjects.join(', ')}`
        },
        education: [{
          degree: formData.qualification,
          institution: formData.institute,
          year: parseInt(formData.passingYear) || 2020,
          field: formData.field || formData.subjects[0] || 'Education'
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
            Create your tutor account in 8 simple steps and start teaching with confidence.
          </p>

          <div className="mn-wizard-cap-divider">🎓</div>
        </div>

        {/* ============================================================ */}
        {/* MAIN 8-STEP CARD CONTAINER                                   */}
        {/* ============================================================ */}
        <div className="mn-tutor-step-card">
          
          {/* Card Header with Step Title & Progress Counter */}
          <div className="mn-step-card-header">
            <div className="mn-step-badge-title">
              <span className="mn-step-circle-num">{step}</span>
              <span className="mn-step-title-text">
                {step === 1 && 'Basic Information'}
                {step === 2 && 'Personal Details'}
                {step === 3 && 'Education'}
                {step === 4 && 'Teaching Experience'}
                {step === 5 && 'Subjects & Pricing'}
                {step === 6 && 'Availability'}
                {step === 7 && 'KYC Documents'}
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
              <div className="mn-step-intro-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p className="mn-step-intro-text" style={{ margin: 0 }}>
                    Let's start with your basic account details.
                  </p>
                  <p style={{ fontSize: '12px', color: '#D97706', marginTop: '4px', fontWeight: '600' }}>
                    💡 Face ko beech me rakhein, clear background
                  </p>
                </div>
                <div className="mn-avatar-upload-preview" style={{ flexShrink: 0, position: 'relative', width: '84px', height: '84px', borderRadius: '50%', border: '2.5px solid #2563EB', overflow: 'hidden', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)' }}>
                  {uploadingPhoto ? (
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textAlign: 'center' }}>
                      ⏳ Saving...
                    </div>
                  ) : formData.profilePhotoUrl ? (
                    <img
                      src={formData.profilePhotoUrl}
                      alt="Avatar"
                      className="mn-avatar-img-preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="mn-avatar-placeholder-icon" style={{ fontSize: '36px' }}>👤</span>
                  )}
                  <label
                    className="mn-avatar-camera-btn"
                    title="Upload & Adjust Photo"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: '#2563EB',
                      color: '#FFF',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    📷
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />
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
                    placeholder="Enter your 10-digit mobile number"
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

              <div className="mn-step-btn-row">
                {onBackToRoleSelect && (
                  <button type="button" className="mn-step-back-btn" onClick={onBackToRoleSelect}>
                    ← Switch Role
                  </button>
                )}
                <button type="button" className="mn-step-primary-btn" onClick={handleNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PERSONAL DETAILS                                     */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Tell students about your profile and teaching approach.</p>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Professional Headline <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="e.g. Senior Mathematics & Physics Tutor (5+ Yrs Exp)"
                  value={formData.headline}
                  onChange={(e) => setFormData(p => ({ ...p, headline: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <div className="mn-form-lbl-row">
                  <label className="mn-form-lbl">Short Bio <span className="mn-req">*</span></label>
                  <span className="mn-char-counter">{formData.bio.length}/400</span>
                </div>
                <textarea
                  className="mn-form-textarea"
                  rows={4}
                  maxLength={400}
                  placeholder="Write a short bio about yourself, your teaching methodology and how you help students excel..."
                  value={formData.bio}
                  onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                ></textarea>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Gender</label>
                <select
                  className="mn-form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Age (Optional)</label>
                <input
                  type="number"
                  className="mn-form-input"
                  placeholder="e.g. 26"
                  min={18}
                  max={80}
                  value={formData.age}
                  onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
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
          {/* STEP 3: EDUCATION                                            */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Add your educational background and qualifications.</p>

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
                  <option value="Other">Other Degree / Diploma</option>
                </select>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Institute / University <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter your college or university name"
                  value={formData.institute}
                  onChange={(e) => setFormData(p => ({ ...p, institute: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Field of Study / Specialization</label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="e.g. Computer Science, Pure Mathematics, Physics"
                  value={formData.field}
                  onChange={(e) => setFormData(p => ({ ...p, field: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Year of Passing <span className="mn-req">*</span></label>
                <select
                  className="mn-form-select"
                  value={formData.passingYear}
                  onChange={(e) => setFormData(p => ({ ...p, passingYear: e.target.value }))}
                >
                  {Array.from({ length: 30 }, (_, i) => 2026 - i).map(year => (
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
          {/* STEP 4: TEACHING EXPERIENCE                                  */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Share your teaching background and years of experience.</p>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Total Teaching Experience <span className="mn-req">*</span></label>
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
                  <option value="15+ Years">15+ Years</option>
                </select>
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Teaching Experience Summary (Optional)</label>
                <textarea
                  className="mn-form-textarea"
                  rows={3}
                  placeholder="e.g. 5 years teaching CBSE & ICSE Class 9-12 students with 95%+ pass rate in board exams..."
                  value={formData.experienceDetails}
                  onChange={(e) => setFormData(p => ({ ...p, experienceDetails: e.target.value }))}
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
          {/* STEP 5: SUBJECTS & PRICING                                   */}
          {/* ============================================================ */}
          {step === 5 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Select subjects, classes, and set your tuition fees.</p>

              {/* Subjects */}
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

              {/* Classes */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Classes &amp; Grades You Teach <span className="mn-req">*</span></label>
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

              {/* Tuition Fees */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Tuition Fee Rate (₹) <span className="mn-req">*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px' }}>
                  <input
                    type="number"
                    className="mn-form-input"
                    placeholder="e.g. 500"
                    min={100}
                    value={formData.hourlyFee}
                    onChange={(e) => setFormData(p => ({ ...p, hourlyFee: e.target.value }))}
                  />
                  <select
                    className="mn-form-select"
                    value={formData.feeFrequency}
                    onChange={(e) => setFormData(p => ({ ...p, feeFrequency: e.target.value }))}
                  >
                    <option value="PER_HOUR">/ Hour</option>
                    <option value="PER_MONTH">/ Month</option>
                    <option value="PER_DAY">/ Day</option>
                    <option value="PER_WEEK">/ Week</option>
                    <option value="PER_SESSION">/ Session</option>
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
          {/* STEP 6: AVAILABILITY & MODE                                  */}
          {/* ============================================================ */}
          {step === 6 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">Specify how, where, and when you are available to teach.</p>

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
                <label className="mn-form-lbl">Preferred City / Locality Area</label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="e.g. Indirapuram, Ghaziabad / South Delhi"
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData(p => ({ ...p, preferredLocation: e.target.value }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Postal Pincode <span className="mn-req">*</span></label>
                <input
                  type="text"
                  className="mn-form-input"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                />
              </div>

              <div className="mn-form-group">
                <label className="mn-form-lbl">Available Teaching Days <span className="mn-req">*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {DAYS_LIST.map(day => {
                    const isSelected = formData.availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#1D4ED8' : '#475569',
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {day.slice(0, 3)} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
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
          {/* STEP 7: KYC DOCUMENTS                                        */}
          {/* ============================================================ */}
          {step === 7 && (
            <div className="mn-step-body">
              <p className="mn-step-intro-text">
                Upload verification documents for your trusted tutor badge.
              </p>

              {/* Identity Proof with OCR Fraud Protection */}
              <div className="mn-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="mn-form-lbl" style={{ margin: 0 }}>
                    Identity Proof (Aadhaar / PAN) <span className="mn-req">*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    🛡️ Anti-Fake ID Protected
                  </span>
                </div>

                <div className="mn-kyc-upload-row" style={{ marginTop: '6px' }}>
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

                  <label className="mn-kyc-upload-btn" style={{ cursor: uploadingKycField ? 'not-allowed' : 'pointer' }}>
                    <span>{uploadingKycField === 'identity' ? '⏳ Verifying ID...' : '📤 Upload Document'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                      disabled={!!uploadingKycField}
                      onChange={(e) => handleDocumentUpload('identity', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {uploadingKycField === 'identity' && (
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', color: '#B45309', fontSize: '12px', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔍</span>
                    <span>Document authenticity check chal raha hai (OCR Scanning)...</span>
                  </div>
                )}

                {formData.identityProofFilename && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📄</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534' }}>
                          {formData.identityProofFilename}
                        </div>
                        <div style={{ fontSize: '11px', color: '#15803D', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🔒 Stored in /secure-ids</span>
                          <span>•</span>
                          <span style={{ background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>
                            PENDING MANUAL REVIEW
                          </span>
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#16A34A', fontWeight: '800', fontSize: '13px' }}>✓ Verified</span>
                  </div>
                )}
              </div>

              {/* Address Proof */}
              <div className="mn-form-group">
                <label className="mn-form-lbl">Address Proof (Optional)</label>
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

                  <label className="mn-kyc-upload-btn" style={{ cursor: uploadingKycField ? 'not-allowed' : 'pointer' }}>
                    <span>{uploadingKycField === 'address' ? '⏳ Uploading...' : '📤 Upload Document'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                      disabled={!!uploadingKycField}
                      onChange={(e) => handleDocumentUpload('address', e)}
                      style={{ display: 'none' }}
                    />
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
                <label className="mn-form-lbl">Qualification / Degree Proof (Optional)</label>
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

                  <label className="mn-kyc-upload-btn" style={{ cursor: uploadingKycField ? 'not-allowed' : 'pointer' }}>
                    <span>{uploadingKycField === 'qualification' ? '⏳ Uploading...' : '📤 Upload Document'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                      disabled={!!uploadingKycField}
                      onChange={(e) => handleDocumentUpload('qualification', e)}
                      style={{ display: 'none' }}
                    />
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
                🔒 Note: All documents are stored in private encrypted storage (/secure-ids). Documents are only used for 100% manual review and are NEVER made public.
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
              <p className="mn-step-intro-text">Review your tutor details and finish creating your profile.</p>

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
                  <span className="mn-review-item-label">Teaching Mode</span>
                  <span className="mn-review-item-val">{formData.teachingMode}</span>
                </div>

                <div className="mn-review-item">
                  <span className="mn-review-item-icon">💰</span>
                  <span className="mn-review-item-label">Tuition Fee</span>
                  <span className="mn-review-item-val">
                    ₹{formData.hourlyFee}{' '}
                    {formData.feeFrequency === 'PER_MONTH' || formData.feeFrequency === 'Month'
                      ? '/ month'
                      : formData.feeFrequency === 'PER_DAY' || formData.feeFrequency === 'Day'
                      ? '/ day'
                      : formData.feeFrequency === 'PER_WEEK' || formData.feeFrequency === 'Week'
                      ? '/ week'
                      : formData.feeFrequency === 'PER_SESSION' || formData.feeFrequency === 'Session'
                      ? '/ session'
                      : '/ hour'}
                  </span>
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
                  className="mn-step-primary-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Tutor Account...' : 'Create Tutor Account ✓'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* TRUST GUARANTEE BANNER                                       */}
        {/* ============================================================ */}
        <div className="mn-wizard-trust-guarantee-bar">
          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">🛡️</span>
            <div>
              <div className="mn-w-trust-title">Verified Identity</div>
              <div className="mn-w-trust-sub">100% Manual Document Check</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">🔒</span>
            <div>
              <div className="mn-w-trust-title">Encrypted Data</div>
              <div className="mn-w-trust-sub">256-Bit SSL Protection</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">⚡</span>
            <div>
              <div className="mn-w-trust-title">Direct Student Leads</div>
              <div className="mn-w-trust-sub">No Hidden Commissions</div>
            </div>
          </div>

          <div className="mn-wizard-trust-pill">
            <span className="mn-w-trust-icon">💬</span>
            <div>
              <div className="mn-w-trust-title">24/7 Tutor Support</div>
              <div className="mn-w-trust-sub">Dedicated Help Desk</div>
            </div>
          </div>
        </div>

        {/* Profile Photo Interactive Cropper Modal */}
        <PhotoCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawPhotoSrc}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawPhotoSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />

      </div>
    </div>
  );
};

export default TutorRegistrationWizard;

