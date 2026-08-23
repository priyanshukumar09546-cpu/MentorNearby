import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { extractUserRole, getRoleDashboard } from '../../components/common/ProtectedRoute';

const StudentRegistration = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'STUDENT', phone: '', whatsappNumber: '',
    location: { city: '', area: '', pincode: '', address: '' },
    studentDetails: { name: '', class: '', board: '', medium: '' },
    academicDetails: { subjectsRequired: '', weakSubjects: '', interests: '', learningGoals: '' },
    tuitionRequirements: { mode: '', preferredDays: '', preferredTime: '', budget: '', preferredGender: '' },
    parentDetails: { name: '', phone: '', relationship: '' }
  });

  const updateData = (field, value, section) => {
    setSubmitError('');
    setErrors(prev => ({ ...prev, [section ? `${section}.${field}` : field]: undefined }));
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
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
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) errs['password'] = 'Password must include uppercase, lowercase, and a number';
      if (!formData.phone.trim()) errs['phone'] = 'Mobile Number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errs['phone'] = 'Enter a valid 10-digit mobile number';
    }

    if (currentStep === 2) {
      if (!formData.location.city.trim()) errs['location.city'] = 'City is required';
      if (!formData.location.area.trim()) errs['location.area'] = 'Area/Locality is required';
      if (!formData.location.pincode.trim()) errs['location.pincode'] = 'PIN Code is required';
      else if (!/^\d{6}$/.test(formData.location.pincode.trim())) errs['location.pincode'] = 'Enter a valid 6-digit PIN Code';
      if (!formData.location.address.trim()) errs['location.address'] = 'Full exact address is required';
    }

    if (currentStep === 3) {
      if (!formData.studentDetails.name.trim()) errs['studentDetails.name'] = 'Student Name is required';
      if (!formData.studentDetails.class.trim()) errs['studentDetails.class'] = 'Class/Grade is required';
    }

    if (currentStep === 4) {
      if (!formData.academicDetails.subjectsRequired.trim()) errs['academicDetails.subjectsRequired'] = 'Subjects Required is mandatory';
    }

    if (currentStep === 5) {
      if (!formData.tuitionRequirements.mode) errs['tuitionRequirements.mode'] = 'Select a preferred Tuition Mode';
      if (!formData.tuitionRequirements.budget.trim()) errs['tuitionRequirements.budget'] = 'Please enter your budget estimate';
    }

    if (currentStep === 6) {
      if (!formData.parentDetails.name.trim()) errs['parentDetails.name'] = 'Parent/Guardian Name is required';
      if (!formData.parentDetails.phone.trim()) errs['parentDetails.phone'] = 'Parent Phone is required';
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
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const studentDetailsPayload = { ...formData.studentDetails };
      if (!studentDetailsPayload.medium) delete studentDetailsPayload.medium;

      const tuitionReqPayload = { ...formData.tuitionRequirements };
      if (!tuitionReqPayload.preferredGender) delete tuitionReqPayload.preferredGender;

      const res = await register({
        ...formData,
        role: 'STUDENT',
        studentDetails: {
          ...studentDetailsPayload,
          subjects: formData.academicDetails.subjectsRequired ? formData.academicDetails.subjectsRequired.split(',').map(s => s.trim()).filter(Boolean) : []
        },
        tuitionRequirements: {
          ...tuitionReqPayload,
          preferredDays: formData.tuitionRequirements.preferredDays ? formData.tuitionRequirements.preferredDays.split(',').map(d => d.trim()).filter(Boolean) : []
        }
      });
      const userObj = res?.user || res?.data?.data?.user || res?.data?.user;
      const role = extractUserRole(userObj) || 'STUDENT';
      console.log('[AUTH ROLE AFTER REGISTER]', role);
      const targetDashboard = getRoleDashboard(role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      const fieldErrors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message;

      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        msg = fieldErrors.map(e => `${e.field}: ${e.message}`).join(' | ');
      } else if (!msg || msg === 'Validation Error') {
        msg = 'Registration failed. Please review all form fields and try again.';
      }

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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
        <button 
          type="button" 
          className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          onClick={step === 1 ? onBack : prevStep}
        >
          &larr; Back
        </button>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Step {step} of 6</span>
          <span className="text-xs text-red-500 font-medium">* Required field</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Student & Parent Registration</h2>

      <form onSubmit={(e) => { e.preventDefault(); step === 6 ? handleSubmit(e) : handleNext(); }}>
        
        {/* Step 1: Basic Account Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">1. Account Credentials</h3>
            <div>
              <Label>Full Name (Account Owner)</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => updateData('name', e.target.value)} />
              <ErrMsg field="name" />
            </div>

            <div>
              <Label>Email Address</Label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="rahul@example.com" value={formData.email} onChange={e => updateData('email', e.target.value)} />
              <ErrMsg field="email" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Password</Label>
                <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="••••••••" value={formData.password} onChange={e => updateData('password', e.target.value)} />
                <ErrMsg field="password" />
              </div>

              <div>
                <Label>Mobile Phone Number</Label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="10 digit number" value={formData.phone} onChange={e => updateData('phone', e.target.value)} />
                <ErrMsg field="phone" />
              </div>
            </div>

            <div>
              <Label required={false}>WhatsApp Number (Optional)</Label>
              <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="If different from mobile" value={formData.whatsappNumber} onChange={e => updateData('whatsappNumber', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">2. Address Details</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 mb-4">
              <p className="font-bold flex items-center gap-1">🔒 Privacy Notice</p>
              <p>Your exact address is kept private and is ONLY revealed to tutors whose contact you explicitly unlock.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. New Delhi" value={formData.location.city} onChange={e => updateData('city', e.target.value, 'location')} />
                <ErrMsg field="location.city" />
              </div>

              <div>
                <Label>Area / Locality</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Karol Bagh" value={formData.location.area} onChange={e => updateData('area', e.target.value, 'location')} />
                <ErrMsg field="location.area" />
              </div>
            </div>

            <div>
              <Label>PIN Code</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="110001" value={formData.location.pincode} onChange={e => updateData('pincode', e.target.value, 'location')} />
              <ErrMsg field="location.pincode" />
            </div>

            <div>
              <Label>Exact Home Address (House No, Street, Landmark)</Label>
              <textarea rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Flat 12A, Block C, Near Metro Station..." value={formData.location.address} onChange={e => updateData('address', e.target.value, 'location')} />
              <ErrMsg field="location.address" />
            </div>
          </div>
        )}

        {/* Step 3: Student Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">3. Student Profile</h3>
            <div>
              <Label>Student's Full Name</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Student's name" value={formData.studentDetails.name} onChange={e => updateData('name', e.target.value, 'studentDetails')} />
              <ErrMsg field="studentDetails.name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Class / Grade</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Class 10" value={formData.studentDetails.class} onChange={e => updateData('class', e.target.value, 'studentDetails')} />
                <ErrMsg field="studentDetails.class" />
              </div>

              <div>
                <Label required={false}>Board</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. CBSE, ICSE" value={formData.studentDetails.board} onChange={e => updateData('board', e.target.value, 'studentDetails')} />
              </div>

              <div>
                <Label required={false}>Medium</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white" value={formData.studentDetails.medium} onChange={e => updateData('medium', e.target.value, 'studentDetails')}>
                  <option value="">Select</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Academic Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">4. Academic Requirements</h3>
            <div>
              <Label>Subjects Required (comma-separated)</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Mathematics, Science" value={formData.academicDetails.subjectsRequired} onChange={e => updateData('subjectsRequired', e.target.value, 'academicDetails')} />
              <ErrMsg field="academicDetails.subjectsRequired" />
            </div>

            <div>
              <Label required={false}>Weak Subjects / Areas for Improvement</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Algebra, Physics Numericals" value={formData.academicDetails.weakSubjects} onChange={e => updateData('weakSubjects', e.target.value, 'academicDetails')} />
            </div>

            <div>
              <Label required={false}>Specific Learning Goals</Label>
              <textarea rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Need to score 90%+ in board exams..." value={formData.academicDetails.learningGoals} onChange={e => updateData('learningGoals', e.target.value, 'academicDetails')} />
            </div>
          </div>
        )}

        {/* Step 5: Tuition Requirements */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">5. Tuition Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Tuition Mode</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white" value={formData.tuitionRequirements.mode} onChange={e => updateData('mode', e.target.value, 'tuitionRequirements')}>
                  <option value="">Select Mode</option>
                  <option value="Offline">Offline / Home Tuition</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid (Both)</option>
                </select>
                <ErrMsg field="tuitionRequirements.mode" />
              </div>

              <div>
                <Label>Expected Budget (Monthly/Hourly)</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. ₹5000/month or ₹500/hr" value={formData.tuitionRequirements.budget} onChange={e => updateData('budget', e.target.value, 'tuitionRequirements')} />
                <ErrMsg field="tuitionRequirements.budget" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required={false}>Preferred Days</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Mon, Wed, Fri" value={formData.tuitionRequirements.preferredDays} onChange={e => updateData('preferredDays', e.target.value, 'tuitionRequirements')} />
              </div>
              
              <div>
                <Label required={false}>Preferred Time</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5 PM - 7 PM" value={formData.tuitionRequirements.preferredTime} onChange={e => updateData('preferredTime', e.target.value, 'tuitionRequirements')} />
              </div>
            </div>

            <div>
              <Label required={false}>Preferred Tutor Gender</Label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white" value={formData.tuitionRequirements.preferredGender} onChange={e => updateData('preferredGender', e.target.value, 'tuitionRequirements')}>
                <option value="">Any Gender</option>
                <option value="Female">Female Tutor Preferred</option>
                <option value="Male">Male Tutor Preferred</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 6: Parent Details */}
        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">6. Parent / Guardian Contact</h3>
            <div>
              <Label>Parent/Guardian Full Name</Label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Enter full name" value={formData.parentDetails.name} onChange={e => updateData('name', e.target.value, 'parentDetails')} />
              <ErrMsg field="parentDetails.name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Parent Mobile Number</Label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="10 digit number" value={formData.parentDetails.phone} onChange={e => updateData('phone', e.target.value, 'parentDetails')} />
                <ErrMsg field="parentDetails.phone" />
              </div>

              <div>
                <Label required={false}>Relationship to Student</Label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g. Father, Mother" value={formData.parentDetails.relationship} onChange={e => updateData('relationship', e.target.value, 'parentDetails')} />
              </div>
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
                <span className="animate-spin">⏳</span> Submitting...
              </>
            ) : (
              step === 6 ? 'Complete Registration' : 'Continue to Next Step →'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistration;
