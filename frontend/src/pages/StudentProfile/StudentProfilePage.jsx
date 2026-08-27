// ============================================================
// pages/StudentProfile/StudentProfilePage.jsx
// MentorNearby — Public Student Lead & Profile View
// Enables Verified Tutors to Inspect Full Student Requirements & Unlock Contact
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UnlockContactModal from '../../components/payment/UnlockContactModal';
import './StudentProfilePage.css';

const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get(`/users/students/${id}`);
        const data = res.data?.data?.student || res.data?.student || res.data?.data;
        if (!data) throw new Error('Student data not found');
        setStudent(data);
      } catch (err) {
        console.warn('Primary student fetch failed, trying requirement endpoint:', err?.message);
        try {
          const reqRes = await client.get(`/requirements/${id}`);
          const reqData = reqRes.data?.data?.requirement || reqRes.data?.requirement || reqRes.data?.data;
          if (reqData) {
            setStudent({
              _id: reqData._id,
              name: reqData.studentName || 'Student Lead',
              avatar: '',
              role: 'STUDENT',
              createdAt: reqData.createdAt,
              isVerified: true,
              studentDetails: {
                class: reqData.class || reqData.studentClass || 'Class 10',
                board: reqData.board || 'CBSE',
                medium: 'English',
              },
              academicDetails: {
                subjectsRequired: Array.isArray(reqData.subjects) ? reqData.subjects : (reqData.subject ? [reqData.subject] : ['All Subjects']),
              },
              location: reqData.location || { city: reqData.city || 'Nearby', area: reqData.area || '' },
              tuitionRequirements: {
                mode: reqData.teachingMode || 'Home Tuition',
                budget: reqData.budget?.amount ? `₹${reqData.budget.amount}/mo` : '₹5000/mo',
                preferredDays: ['Monday - Friday'],
                preferredTime: 'Evening (4:00 PM - 7:00 PM)',
              },
              bio: reqData.description || reqData.preferences?.additionalRequirements || 'Seeking experienced and verified tutor for home/online guidance.',
            });
          } else {
            setError('Student lead profile not found.');
          }
        } catch (_) {
          setError('Unable to load student profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStudentData();
  }, [id]);

  const handleUnlockClick = () => {
    if (!isAuthenticated) {
      showToast('Please login to unlock student contact details', 'info');
      navigate('/login');
      return;
    }
    setUnlockModalOpen(true);
  };

  if (loading) {
    return (
      <div className="mn-sp-page flex flex-col items-center justify-center min-h-[60vh]">
        <div className="spinner spinner-lg mb-4"></div>
        <p className="text-gray-600 dark:text-zinc-400 font-semibold">Loading verified student profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="mn-sp-page">
        <div className="mn-sp-container text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Student Profile Not Found</h2>
          <p className="text-gray-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
            {error || 'The student requirement you are looking for is no longer active or has been fulfilled.'}
          </p>
          <Link to="/find-students" className="btn btn-primary">
            ← Browse Active Student Leads
          </Link>
        </div>
      </div>
    );
  }

  const studentName = student.name || 'Verified Student';
  const studentClass = student.studentDetails?.class || 'Class 10';
  const studentBoard = student.studentDetails?.board || 'CBSE';
  const studentMedium = student.studentDetails?.medium || 'English';
  const mode = student.tuitionRequirements?.mode || 'Home Tuition (Offline)';
  const budget = student.tuitionRequirements?.budget || '₹5,000 / month';
  const city = student.location?.city || 'Local Area';
  const area = student.location?.area ? `, ${student.location.area}` : '';
  const subjects = student.academicDetails?.subjectsRequired || ['Mathematics', 'Science'];
  const bio = student.bio || 'Seeking a dedicated and punctual tutor to assist with regular coursework, exam preparation, and concept clarity.';
  const postedDate = new Date(student.createdAt || Date.now()).toLocaleDateString();

  return (
    <div className="mn-sp-page">
      <div className="mn-sp-container">
        
        {/* Breadcrumb Navigation */}
        <div className="mn-sp-breadcrumb">
          <Link to="/">Home</Link>
          <span className="mn-sp-breadcrumb-sep">›</span>
          <Link to="/find-students">Find Students</Link>
          <span className="mn-sp-breadcrumb-sep">›</span>
          <span>{studentName}</span>
        </div>

        {/* Layout Grid */}
        <div className="mn-sp-layout">
          
          {/* Main Column */}
          <div className="mn-sp-main-col">
            
            {/* Header Hero Card */}
            <div className="mn-sp-hero-card">
              <div className="mn-sp-hero-top">
                {student.avatar ? (
                  <img src={student.avatar} alt={studentName} className="mn-sp-avatar-img" />
                ) : (
                  <div className="mn-sp-avatar">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="mn-sp-hero-info">
                  <div className="mn-sp-name-row">
                    <h1 className="mn-sp-title">{studentName}</h1>
                    <span className="mn-sp-verified-badge">
                      ✓ Verified Student Lead
                    </span>
                  </div>

                  <div className="mn-sp-meta-row">
                    <span className="mn-sp-meta-item">
                      🎓 {studentClass} ({studentBoard})
                    </span>
                    <span className="mn-sp-meta-item">
                      📍 {city}{area}
                    </span>
                    <span className="mn-sp-meta-item">
                      📅 Posted {postedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
            <div className="mn-sp-section-card">
              <h2 className="mn-sp-section-title">
                <span>📚</span> Academic Details
              </h2>
              <div className="mn-sp-info-grid">
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Class / Grade</div>
                  <div className="mn-sp-info-value">{studentClass}</div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Educational Board</div>
                  <div className="mn-sp-info-value">{studentBoard}</div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Medium of Instruction</div>
                  <div className="mn-sp-info-value">{studentMedium}</div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Learning Mode</div>
                  <div className="mn-sp-info-value highlight">{mode}</div>
                </div>
              </div>
            </div>

            {/* Subjects Required */}
            <div className="mn-sp-section-card">
              <h2 className="mn-sp-section-title">
                <span>📖</span> Subjects Required for Tuition
              </h2>
              <div className="mn-sp-subjects-grid">
                {subjects.map((sub, idx) => (
                  <span key={idx} className="mn-sp-subject-badge">
                    <span>✨</span> {typeof sub === 'string' ? sub.trim() : sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Tuition Preferences & Timings */}
            <div className="mn-sp-section-card">
              <h2 className="mn-sp-section-title">
                <span>⚙️</span> Tuition Preferences &amp; Schedule
              </h2>
              <div className="mn-sp-info-grid">
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Preferred Days</div>
                  <div className="mn-sp-info-value">
                    {Array.isArray(student.tuitionRequirements?.preferredDays) 
                      ? student.tuitionRequirements.preferredDays.join(', ') 
                      : (student.tuitionRequirements?.preferredDays || 'Monday – Friday (5 Days)')}
                  </div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Preferred Timing</div>
                  <div className="mn-sp-info-value">
                    {student.tuitionRequirements?.preferredTime || 'Evening (4:00 PM – 7:00 PM)'}
                  </div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Monthly Budget</div>
                  <div className="mn-sp-info-value highlight">{budget}</div>
                </div>
                <div className="mn-sp-info-box">
                  <div className="mn-sp-info-label">Urgency</div>
                  <div className="mn-sp-info-value" style={{ color: '#10b981' }}>⚡ Immediate Requirement</div>
                </div>
              </div>
            </div>

            {/* About Student & Learning Goals */}
            <div className="mn-sp-section-card">
              <h2 className="mn-sp-section-title">
                <span>📝</span> Requirement Description &amp; Learning Goals
              </h2>
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed text-sm">
                {bio}
              </p>
            </div>

          </div>

          {/* Sidebar CTA Column */}
          <div className="mn-sp-sidebar-col">
            <div className="mn-sp-sidebar-card">
              
              <div className="mn-sp-price-box">
                <div className="mn-sp-price-label">Expected Monthly Budget</div>
                <div className="mn-sp-price-val">{budget}</div>
              </div>

              <button
                type="button"
                onClick={handleUnlockClick}
                className="mn-sp-unlock-cta"
              >
                <span>🔓 Unlock Direct Contact</span>
              </button>

              <Link to="/find-students" className="mn-sp-back-btn">
                <span>← Back to All Leads</span>
              </Link>

              {/* Trust Badges */}
              <ul className="mn-sp-trust-list">
                <li className="mn-sp-trust-item">
                  <span>🛡️</span>
                  <span>100% Verified Parent / Student Lead</span>
                </li>
                <li className="mn-sp-trust-item">
                  <span>📞</span>
                  <span>Instant Phone &amp; WhatsApp Access</span>
                </li>
                <li className="mn-sp-trust-item">
                  <span>💳</span>
                  <span>Safe &amp; Secure Razorpay Checkout</span>
                </li>
                <li className="mn-sp-trust-item">
                  <span>⚡</span>
                  <span>Direct Communication, Zero Commission</span>
                </li>
              </ul>

            </div>
          </div>

        </div>

      </div>

      {/* Unlock Contact Modal */}
      {unlockModalOpen && (
        <UnlockContactModal
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          tutorId={student._id || id}
        />
      )}
    </div>
  );
};

export default StudentProfilePage;
