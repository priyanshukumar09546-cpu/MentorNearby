import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadPhoto, uploadDocument } from '../../api/upload';
import { extractUserRole, getRoleDashboard } from '../../components/common/ProtectedRoute';

const TutorRegistration = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Document Upload States
  const [isUploadingCollegeId, setIsUploadingCollegeId] = useState(false);
  const [collegeIdUploadError, setCollegeIdUploadError] = useState('');
  const [isUploadingGovtId, setIsUploadingGovtId] = useState(false);
  const [govtIdUploadError, setGovtIdUploadError] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'TUTOR', phone: '',
    professionalHeadline: '', bio: '', gender: '', dateOfBirth: '',
    education: [{ degree: '', institution: '', year: '', field: '' }],
    subjects: '', grades: '', languages: '',
    teachingModes: ['Offline'], experience: { years: 1, description: '' },
    fees: { amount: '', frequency: 'Month', negotiable: true },
    location: { city: '', area: '', pincode: '', address: '' },
    areasServed: '',
    profilePhoto: { url: '', publicId: '' },
    introVideo: { url: '' },
    certificates: [],
    kycData: {
      govtIdType: 'AADHAAR',
      govtIdLast4: '',
      identityVerified: false,
      collegeIdUrl: '',
      collegeIdPublicId: '',
      collegeIdFilename: '',
      govtIdUrl: '',
      govtIdPublicId: '',
      govtIdFilename: '',
      consent: false
    }
  });

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const updateData = (field, value, section) => {
    setSubmitError('');
    setErrors(prev => ({ ...prev, [section ? `${section}.${field}` : field]: undefined }));
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // OTP Actions
  const handleSendOtp = async () => {
    const aadhaar = formData.kycData.aadhaarNumber?.trim();
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      setOtpError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!formData.kycData.aadhaarConsent) {
      setOtpError('Please provide consent to proceed with Aadhaar KYC.');
      return;
    }

    setOtpSending(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const res = await sendAadhaarOtp(aadhaar, formData.kycData.aadhaarConsent);
      setAadhaarClientId(res.data?.data?.clientId || '');
      setOtpSent(true);
      setOtpSuccess(`Verification OTP sent to Aadhaar-linked mobile number.`);
      setCooldown(60);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code received.');
      return;
    }

    setOtpVerifying(true);
    setOtpError('');

    try {
      const res = await verifyAadhaarOtp(aadhaarClientId, otpValue.trim(), formData.kycData.aadhaarNumber);
      setFormData(prev => ({
        ...prev,
        kycData: {
          ...prev.kycData,
          identityVerified: true,
          proofToken: res.data?.data?.proofToken || '',
          govtIdLast4: res.data?.data?.govtIdLast4 || prev.kycData.aadhaarNumber.slice(-4),
        }
      }));
      setOtpSuccess('✓ Aadhaar Verified Successfully!');
      setErrors(prev => ({ ...prev, 'kycData.identityVerified': undefined }));
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Document Upload Handler (College ID)
  const handleCollegeIdUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setCollegeIdUploadError('File size exceeds the 10MB limit.');
        return;
      }

      setIsUploadingCollegeId(true);
      setCollegeIdUploadError('');

      try {
        const res = await uploadDocument(file);
        const { url, publicId, filename } = res.data.data;
        setFormData(prev => ({
          ...prev,
          kycData: {
            ...prev.kycData,
            collegeIdUrl: url,
            collegeIdPublicId: publicId,
            collegeIdFilename: filename || file.name
          }
        }));
        setErrors(prev => ({ ...prev, 'kycData.collegeIdUrl': undefined, 'kycData.documents': undefined }));
      } catch (err) {
        setCollegeIdUploadError(err.response?.data?.message || 'Failed to upload document. Please try again.');
      } finally {
        setIsUploadingCollegeId(false);
      }
    }
  };

  // Document Upload Handler (Govt ID Scan)
  const handleGovtIdUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setGovtIdUploadError('File size exceeds the 10MB limit.');
        return;
      }

      setIsUploadingGovtId(true);
      setGovtIdUploadError('');

      try {
        const res = await uploadDocument(file);
        const { url, publicId, filename } = res.data.data;
        setFormData(prev => ({
          ...prev,
          kycData: {
            ...prev.kycData,
            govtIdUrl: url,
            govtIdPublicId: publicId,
            govtIdFilename: filename || file.name
          }
        }));
        setErrors(prev => ({ ...prev, 'kycData.govtIdUrl': undefined, 'kycData.documents': undefined }));
      } catch (err) {
        setGovtIdUploadError(err.response?.data?.message || 'Failed to upload Govt ID. Please try again.');
      } finally {
        setIsUploadingGovtId(false);
      }
    }
  };

  const validateStep = (currentStep) => {
    const errs = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) errs['name'] = 'Full Name is required';
      if (!formData.email.trim()) errs['email'] = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errs['email'] = 'Enter a valid email address';
      if (!formData.password) errs['password'] = 'Password is required (min 8 characters)';
      else if (formData.password.length < 8) errs['password'] = 'Password must be at least 8 characters';
      if (!formData.phone.trim()) errs['phone'] = 'Mobile Phone Number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errs['phone'] = 'Enter a valid 10-digit mobile number';
    }

    if (currentStep === 2) {
      if (!formData.professionalHeadline.trim()) errs['professionalHeadline'] = 'Professional Headline is required';
      if (!formData.bio.trim()) errs['bio'] = 'Bio is required';
      if (!formData.gender) errs['gender'] = 'Select Gender';
      if (!formData.dateOfBirth) errs['dateOfBirth'] = 'Date of Birth is required';
    }

    if (currentStep === 3) {
      if (!formData.education[0].degree.trim()) errs['education.degree'] = 'Highest Qualification/Degree is required';
      if (!formData.education[0].institution.trim()) errs['education.institution'] = 'College/University name is required';
    }

    if (currentStep === 4) {
      if (!formData.subjects.trim()) errs['subjects'] = 'At least one subject is required';
      if (!formData.grades.trim()) errs['grades'] = 'Classes/Grades taught is required';
      if (!formData.teachingModes || formData.teachingModes.length === 0) errs['teachingModes'] = 'Select at least one teaching mode';
    }

    if (currentStep === 5) {
      if (!formData.experience.description.trim()) errs['experience.description'] = 'Experience description is required';
    }

    if (currentStep === 6) {
      if (!formData.fees.amount) errs['fees.amount'] = 'Expected Fee amount is required';
      else if (isNaN(formData.fees.amount) || Number(formData.fees.amount) <= 0) errs['fees.amount'] = 'Enter a valid positive fee amount';
    }

    if (currentStep === 7) {
      if (!formData.location.city.trim()) errs['location.city'] = 'City is required';
      if (!formData.location.area.trim()) errs['location.area'] = 'Area is required';
      if (!formData.location.pincode.trim()) errs['location.pincode'] = 'PIN Code is required';
      else if (!/^\d{6}$/.test(formData.location.pincode.trim())) errs['location.pincode'] = 'Enter a valid 6-digit PIN Code';
    }

    if (currentStep === 8) {
      if (!formData.profilePhoto.url) errs['profilePhoto.url'] = 'Profile Photo is mandatory. Please upload an image.';
    }

    if (currentStep === 9) {
      if (!formData.kycData.govtIdUrl && !formData.kycData.collegeIdUrl) {
        errs['kycData.documents'] = 'Please upload at least one verification document (Government ID or College ID).';
      }
      if (!formData.kycData.consent) {
        errs['kycData.consent'] = 'You must consent to document verification to proceed';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateStep(9)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const sanitizedEducation = formData.education.map(ed => {
        const parsedYear = parseInt(ed.year, 10);
        return {
          degree: ed.degree || '',
          institution: ed.institution || '',
          year: !isNaN(parsedYear) ? parsedYear : undefined,
          field: ed.field || ''
        };
      });

      const res = await register({
        ...formData,
        education: sanitizedEducation,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
        grades: formData.grades.split(',').map(g => g.trim()).filter(Boolean),
        languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        areasServed: formData.areasServed ? formData.areasServed.split(',').map(a => a.trim()).filter(Boolean) : []
      });
      const userObj = res?.user || res?.data?.data?.user || res?.data?.user;
      const role = extractUserRole(userObj) || 'TUTOR';
      console.log('[AUTH ROLE AFTER REGISTER]', role);
      const targetDashboard = getRoleDashboard(role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please check your entries.';
      if (err?.response?.status === 409 || msg.toLowerCase().includes('email')) {
        setSubmitError('Email already exists. Please log in instead.');
      } else {
        setSubmitError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const Label = ({ children, required = true }) => (
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {children} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
  );

  const ErrMsg = ({ field }) => (
    errors[field] ? <p className="text-xs text-red-600 mt-1 font-medium">{errors[field]}</p> : null
  );

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 my-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tutor Registration</h2>
          <p className="text-sm text-gray-500">Step {step} of 9: {
            ['Account Credentials', 'Professional Info', 'Education & Qualifications', 'Subjects & Modes', 'Experience', 'Fee Details', 'Location & Coverage', 'Profile Photo', 'Identity & KYC Verification'][step - 1]
          }</p>
        </div>
        {onBack && (
          <button onClick={onBack} type="button" className="text-sm font-semibold text-blue-600 hover:underline">
            Switch Role
          </button>
        )}
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${(step / 9) * 100}%` }}
        />
      </div>

      <form onSubmit={step === 9 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">1. Account Credentials</h3>
            <div>
              <Label>Full Name</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => updateData('name', e.target.value)} />
              <ErrMsg field="name" />
            </div>
            <div>
              <Label>Email Address</Label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. rahul@example.com" value={formData.email} onChange={e => updateData('email', e.target.value)} />
              <ErrMsg field="email" />
            </div>
            <div>
              <Label>Mobile Phone Number</Label>
              <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="10-digit mobile number" value={formData.phone} onChange={e => updateData('phone', e.target.value)} />
              <ErrMsg field="phone" />
            </div>
            <div>
              <Label>Account Password</Label>
              <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Min 8 chars, uppercase & number" value={formData.password} onChange={e => updateData('password', e.target.value)} />
              <ErrMsg field="password" />
            </div>
          </div>
        )}

        {/* Step 2: Professional Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">2. Professional Details</h3>
            <div>
              <Label>Professional Headline</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Senior Mathematics Faculty | 8+ Yrs Exp" value={formData.professionalHeadline} onChange={e => updateData('professionalHeadline', e.target.value)} />
              <ErrMsg field="professionalHeadline" />
            </div>
            <div>
              <Label>Bio / About Me</Label>
              <textarea rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Introduce yourself, your teaching approach, and student achievements..." value={formData.bio} onChange={e => updateData('bio', e.target.value)} />
              <ErrMsg field="bio" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white" value={formData.gender} onChange={e => updateData('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <ErrMsg field="gender" />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" value={formData.dateOfBirth} onChange={e => updateData('dateOfBirth', e.target.value)} />
                <ErrMsg field="dateOfBirth" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Education */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">3. Highest Qualification</h3>
            <div>
              <Label>Degree / Qualification</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. B.Tech in Computer Science, M.Sc Physics" value={formData.education[0].degree} onChange={e => {
                const edu = [...formData.education];
                edu[0].degree = e.target.value;
                setFormData(prev => ({ ...prev, education: edu }));
              }} />
              <ErrMsg field="education.degree" />
            </div>
            <div>
              <Label>College / University / Institution</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Delhi University / IIT Delhi" value={formData.education[0].institution} onChange={e => {
                const edu = [...formData.education];
                edu[0].institution = e.target.value;
                setFormData(prev => ({ ...prev, education: edu }));
              }} />
              <ErrMsg field="education.institution" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required={false}>Passing Year</Label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. 2022" value={formData.education[0].year} onChange={e => {
                  const edu = [...formData.education];
                  edu[0].year = e.target.value;
                  setFormData(prev => ({ ...prev, education: edu }));
                }} />
              </div>
              <div>
                <Label required={false}>Major / Specialization</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Mathematics" value={formData.education[0].field} onChange={e => {
                  const edu = [...formData.education];
                  edu[0].field = e.target.value;
                  setFormData(prev => ({ ...prev, education: edu }));
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Subjects & Modes */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">4. Teaching Preferences</h3>
            <div>
              <Label>Subjects Taught (Comma-separated)</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Mathematics, Physics, Chemistry" value={formData.subjects} onChange={e => updateData('subjects', e.target.value)} />
              <ErrMsg field="subjects" />
            </div>
            <div>
              <Label>Classes / Grades Taught (Comma-separated)</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Class 9, Class 10, Class 11, Class 12" value={formData.grades} onChange={e => updateData('grades', e.target.value)} />
              <ErrMsg field="grades" />
            </div>
            <div>
              <Label>Teaching Modes</Label>
              <div className="flex gap-4 mt-2">
                {['Online', 'Offline', 'Hybrid'].map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={formData.teachingModes.includes(mode)}
                      onChange={e => {
                        const cur = [...formData.teachingModes];
                        if (e.target.checked) cur.push(mode);
                        else {
                          const idx = cur.indexOf(mode);
                          if (idx > -1) cur.splice(idx, 1);
                        }
                        updateData('teachingModes', cur);
                      }}
                    />
                    {mode}
                  </label>
                ))}
              </div>
              <ErrMsg field="teachingModes" />
            </div>
            <div>
              <Label required={false}>Languages Spoken</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. English, Hindi" value={formData.languages} onChange={e => updateData('languages', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 5: Experience */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">5. Experience & Methodology</h3>
            <div>
              <Label>Years of Teaching Experience</Label>
              <input type="number" min="0" max="50" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" value={formData.experience.years} onChange={e => updateData('years', parseInt(e.target.value, 10) || 0, 'experience')} />
            </div>
            <div>
              <Label>Experience Description & Past Track Record</Label>
              <textarea rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Mention schools/coaching institutes, competitive exam results, or private tuition history..." value={formData.experience.description} onChange={e => updateData('description', e.target.value, 'experience')} />
              <ErrMsg field="experience.description" />
            </div>
          </div>
        )}

        {/* Step 6: Fee Details */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">6. Fee & Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expected Fee (INR ₹)</Label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500" value={formData.fees.amount} onChange={e => updateData('amount', e.target.value, 'fees')} />
                <ErrMsg field="fees.amount" />
              </div>
              <div>
                <Label>Billing Frequency</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white" value={formData.fees.frequency} onChange={e => updateData('frequency', e.target.value, 'fees')}>
                  <option value="Hour">Per Hour</option>
                  <option value="Month">Per Month</option>
                  <option value="Session">Per Session</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Location */}
        {step === 7 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">7. Location & Service Areas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. New Delhi" value={formData.location.city} onChange={e => updateData('city', e.target.value, 'location')} />
                <ErrMsg field="location.city" />
              </div>
              <div>
                <Label>Area / Locality</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Connaught Place" value={formData.location.area} onChange={e => updateData('area', e.target.value, 'location')} />
                <ErrMsg field="location.area" />
              </div>
            </div>
            <div>
              <Label>PIN Code</Label>
              <input type="text" maxLength="6" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="6-digit PIN Code" value={formData.location.pincode} onChange={e => updateData('pincode', e.target.value, 'location')} />
              <ErrMsg field="location.pincode" />
            </div>
          </div>
        )}

        {/* Step 8: Profile Photo */}
        {step === 8 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">8. Profile Photograph</h3>
            <div>
              <Label>Upload Professional Photo</Label>
              {formData.profilePhoto.url ? (
                <div className="flex items-center gap-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <img src={formData.profilePhoto.url} alt="Uploaded Profile" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-800">✓ Photograph Uploaded</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, profilePhoto: { url: '', publicId: '' } }))}
                    className="text-xs text-red-600 hover:text-red-800 font-bold bg-white px-2.5 py-1.5 rounded border border-red-200"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    disabled={isUploadingPhoto}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" 
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          setPhotoUploadError('Selected file exceeds the 5MB size limit.');
                          return;
                        }
                        setIsUploadingPhoto(true);
                        setPhotoUploadError('');
                        try {
                          const res = await uploadPhoto(file);
                          const { url, publicId } = res.data.data;
                          setFormData(prev => ({ ...prev, profilePhoto: { url, publicId } }));
                          setErrors(prev => ({ ...prev, 'profilePhoto.url': undefined }));
                        } catch (err) {
                          setPhotoUploadError(err.response?.data?.message || 'Failed to upload photo. Please try again.');
                        } finally {
                          setIsUploadingPhoto(false);
                        }
                      }
                    }} 
                  />
                  {isUploadingPhoto && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-semibold flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Uploading photo... Please wait.
                    </div>
                  )}
                  {photoUploadError && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ {photoUploadError}
                    </p>
                  )}
                </div>
              )}
              <ErrMsg field="profilePhoto.url" />
            </div>
          </div>
        )}

        {/* Step 9: KYC Identity & Qualification Verification */}
        {step === 9 && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-gray-800">9. Identity & Qualification Verification</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
              <p className="font-bold text-sm flex items-center gap-1.5 mb-1 text-blue-950">
                🔒 Verified Trust & Identity Shield
              </p>
              <p>
                To maintain a safe and trusted mentoring marketplace, educators provide proof of identity and qualifications.
                Your documents are securely encrypted and reviewed <strong>exclusively by authorized MentorNearby administrators</strong>.
                Students and parents will NEVER see your private documents or numbers.
              </p>
            </div>

            {/* Part A: Government ID Document Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <span>🛡️</span> Government Identity Document
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label required={false}>Government ID Type</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                    value={formData.kycData.govtIdType}
                    onChange={e => updateData('govtIdType', e.target.value, 'kycData')}
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                  </select>
                </div>

                <div>
                  <Label required={false}>Last 4 Digits (For Identification)</Label>
                  <input
                    type="text"
                    maxLength="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    placeholder="e.g. 8912"
                    value={formData.kycData.govtIdLast4}
                    onChange={e => updateData('govtIdLast4', e.target.value.replace(/\D/g, '').slice(0, 4), 'kycData')}
                  />
                </div>
              </div>

              {formData.kycData.govtIdUrl ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">✓</span>
                    <div>
                      <p className="font-bold text-emerald-800">Govt ID Scan Uploaded</p>
                      <p className="text-[11px] text-emerald-600 truncate max-w-[200px]">
                        {formData.kycData.govtIdFilename || 'Govt_ID_Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      kycData: { ...prev.kycData, govtIdUrl: '', govtIdPublicId: '', govtIdFilename: '' }
                    }))}
                    className="text-xs text-red-600 hover:text-red-800 font-bold bg-white px-2.5 py-1.5 rounded border border-red-200"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, application/pdf"
                    disabled={isUploadingGovtId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 text-xs"
                    onChange={handleGovtIdUpload}
                  />
                  {isUploadingGovtId && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-semibold flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Uploading Govt ID securely...
                    </div>
                  )}
                  {govtIdUploadError && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ {govtIdUploadError}
                    </p>
                  )}
                </div>
              )}
              <ErrMsg field="kycData.govtIdUrl" />
            </div>

            {/* Part B: College / Student / Faculty ID / Degree Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <span>🎓</span> College ID / Degree Certificate / Qualification Proof
              </h4>
              <p className="text-xs text-gray-500">
                Upload a clear photo or scanned copy of your College Student ID, Degree Certificate, or Teaching Credential (JPG, PNG, PDF up to 10MB).
              </p>

              {formData.kycData.collegeIdUrl ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">✓</span>
                    <div>
                      <p className="font-bold text-emerald-800">Qualification / College ID Document Uploaded</p>
                      <p className="text-[11px] text-emerald-600 truncate max-w-[200px]">
                        {formData.kycData.collegeIdFilename || 'College_ID_Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      kycData: { ...prev.kycData, collegeIdUrl: '', collegeIdPublicId: '', collegeIdFilename: '' }
                    }))}
                    className="text-xs text-red-600 hover:text-red-800 font-bold bg-white px-2.5 py-1.5 rounded border border-red-200"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, application/pdf"
                    disabled={isUploadingCollegeId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 text-xs"
                    onChange={handleCollegeIdUpload}
                  />
                  {isUploadingCollegeId && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-semibold flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Uploading qualification document...
                    </div>
                  )}
                  {collegeIdUploadError && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ {collegeIdUploadError}
                    </p>
                  )}
                </div>
              )}
              <ErrMsg field="kycData.collegeIdUrl" />
            </div>

            <ErrMsg field="kycData.documents" />

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  type="checkbox" 
                  className="mt-0.5"
                  checked={formData.kycData.consent} 
                  onChange={e => updateData('consent', e.target.checked, 'kycData')} 
                />
                <span className="text-xs text-gray-700 leading-normal">
                  I confirm that all details and documents provided are genuine and accurate. I consent to MentorNearby verifying my educational credentials for platform trust and safety. <span className="text-red-500 font-bold">*</span>
                </span>
              </label>
              <ErrMsg field="kycData.consent" />
            </div>
          </div>
        )}

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold flex items-center justify-between">
            <span>⚠️ {submitError}</span>
            {submitError.includes('log in') && (
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-700 ml-2"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-gray-100 pt-4">
          {step > 1 && (
            <button 
              type="button" 
              onClick={prevStep}
              disabled={isSubmitting}
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              Previous
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="ml-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span> Submitting Application...
              </>
            ) : (
              step === 9 ? 'Submit Registration & KYC' : 'Continue to Next Step →'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TutorRegistration;
