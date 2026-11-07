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
import { UNIFIED_PLAN } from '../../config/subscription';
import './StudentProfilePage.css';

const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contact Unlock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

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

  // Check Unlock Status (persists across page reloads via MongoDB ContactUnlock records)
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!isAuthenticated || !id) {
        setIsUnlocked(false);
        setUnlockedContact(null);
        return;
      }
      try {
        const res = await client.get(`/contact-unlocks/check/${id}`);
        if (res.data?.success && res.data?.data?.isUnlocked) {
          setIsUnlocked(true);
          setUnlockedContact(res.data.data.contactInfo || null);
        } else {
          setIsUnlocked(false);
          setUnlockedContact(null);
        }
      } catch (err) {
        console.warn('Contact unlock status check:', err?.message);
        setIsUnlocked(false);
        setUnlockedContact(null);
      }
    };

    checkUnlockStatus();
  }, [id, isAuthenticated]);

  // Open the unlock modal or perform authorized unlock
  const handleUnlockClick = async () => {
    if (!isAuthenticated) {
      showToast('Please login as a tutor to unlock student contact details', 'info');
      navigate('/login');
      return;
    }

    const isSubscribed = Boolean(
      user?.role === 'ADMIN' ||
      (user?.isSubscribed && user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
    );

    if (isSubscribed) {
      try {
        setUnlocking(true);
        const res = await client.post(`/contact-unlocks/unlock/${id}`);
        if (res.data?.success && res.data?.data?.isUnlocked) {
          setIsUnlocked(true);
          setUnlockedContact(res.data.data.contactInfo);
          showToast('🎉 Student contact details unlocked successfully!', 'success');
          return;
        }
      } catch (err) {
        console.warn('Direct unlock attempt note:', err);
      } finally {
        setUnlocking(false);
      }
    }

    // Otherwise show the ₹199 All Access unlock prompt
    setShowUnlockModal(true);
  };

  // Subscribe to MentorNearby All Access (₹199/month) and unlock contact
  const handleSubscribeAndUnlock = async () => {
    try {
      setUnlocking(true);
      const res = await client.post('/subscription/create-order', {
        planType: UNIFIED_PLAN.id,
        tutorId: id,
      });

      const orderData = res.data?.data || res.data || {};
      const orderId = orderData.orderId || res.data?.orderId;
      const key =
        orderData.razorpayKeyId ||
        res.data?.key ||
        import.meta.env.VITE_RAZORPAY_KEY ||
        'rzp_test_placeholder';

      // Fast verification for Test Mode / simulation
      if (
        !orderId ||
        orderData.isTestMode ||
        orderId.startsWith('order_test_') ||
        orderId.startsWith('sub_test_') ||
        !window.Razorpay ||
        key.includes('test') ||
        key.includes('placeholder')
      ) {
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderId || `order_test_${Date.now()}`,
          paymentId: `pay_test_${Date.now()}`,
          subscriptionId: orderData.subscriptionId || `sub_test_${Date.now()}`,
          tutorId: id,
          planType: UNIFIED_PLAN.id,
        });

        const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
        if (contact) {
          setIsUnlocked(true);
          setUnlockedContact(contact);
        } else {
          const unlockRes = await client.post(`/contact-unlocks/unlock/${id}`);
          if (unlockRes.data?.data?.contactInfo) {
            setIsUnlocked(true);
            setUnlockedContact(unlockRes.data.data.contactInfo);
          }
        }
        setShowUnlockModal(false);
        showToast('🎉 MentorNearby All Access activated! Student contact unlocked.', 'success');
        return;
      }

      // Live Razorpay recurring checkout
      const options = {
        key,
        amount: orderData.amount || UNIFIED_PLAN.amountInPaise,
        currency: 'INR',
        name: 'MentorNearby',
        description: 'MentorNearby All Access — ₹199/month AutoPay',
        order_id: orderId,
        subscription_id: orderData.subscriptionId || undefined,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id || orderData.subscriptionId,
              razorpay_signature: response.razorpay_signature,
              tutorId: id,
              planType: UNIFIED_PLAN.id,
            });
            const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
            if (contact) {
              setIsUnlocked(true);
              setUnlockedContact(contact);
            }
            setShowUnlockModal(false);
            showToast('🎉 All Access activated! Student contact unlocked.', 'success');
          } catch (err) {
            showToast('Payment verification failed', 'error');
          } finally {
            setUnlocking(false);
          }
        },
        theme: { color: '#E11D48' },
        modal: { ondismiss: () => setUnlocking(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        showToast(resp.error?.description || 'Payment failed', 'error');
        setUnlocking(false);
      });
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Payment initiation failed', 'error');
    } finally {
      setUnlocking(false);
    }
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
                    {isUnlocked && (
                      <span className="mn-sp-unlocked-badge-pill">
                        ✓ Contact Unlocked
                      </span>
                    )}
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
                <div className="mn-sp-info-box mn-sp-budget-card-box">
                  <div className="mn-sp-info-label">Expected Monthly Tutoring Budget</div>
                  <div className="mn-sp-info-value highlight">{budget}</div>
                  <div className="mn-sp-info-hint">Fee offered by student / parent (Paid to tutor)</div>
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
              
              {/* Tutoring Budget Clarification */}
              <div className="mn-sp-price-box">
                <div className="mn-sp-budget-pill">Student&apos;s Tutoring Budget</div>
                <div className="mn-sp-price-val">{budget}</div>
                <p className="mn-sp-budget-desc">
                  This is the parent&apos;s / student&apos;s expected monthly tutoring budget paid directly to you.
                </p>
              </div>

              {/* UNLOCKED STATE: Direct Phone & WhatsApp Access */}
              {isUnlocked ? (
                <div className="mn-sp-unlocked-container">
                  <div className="mn-sp-unlocked-header-badge">
                    <span>✓</span> Contact Unlocked
                  </div>

                  <div className="mn-sp-unlocked-box">
                    <div className="mn-sp-unlocked-meta-lbl">Direct Student / Parent Contact</div>
                    <div className="mn-sp-unlocked-person-name">
                      {unlockedContact?.name || studentName}
                    </div>

                    {unlockedContact?.phone && (
                      <div className="mn-sp-unlocked-phone-display">
                        <span className="mn-sp-phone-icon">📞</span>
                        <span className="mn-sp-phone-text">+91 {unlockedContact.phone}</span>
                      </div>
                    )}

                    {/* Instant Action Call & WhatsApp Buttons */}
                    <div className="mn-sp-action-btns-group">
                      {unlockedContact?.phone && (
                        <a
                          href={`tel:${unlockedContact.phone}`}
                          className="mn-sp-btn-call"
                        >
                          <span>📞</span> Call Direct ({unlockedContact.phone})
                        </a>
                      )}

                      <a
                        href={`https://wa.me/${(unlockedContact?.whatsappNumber || unlockedContact?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${unlockedContact?.name || studentName}, I am a verified tutor on MentorNearby reaching out regarding your ${studentClass} tuition requirement for ${subjects.slice(0, 2).join(', ')}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mn-sp-btn-whatsapp"
                      >
                        <span>💬</span> Chat on WhatsApp
                      </a>
                    </div>

                    {unlockedContact?.email && (
                      <div className="mn-sp-unlocked-email-tag">
                        <span>✉️</span> {unlockedContact.email}
                      </div>
                    )}

                    <div className="mn-sp-unlocked-permanent-note">
                      ✓ Unlocked permanently for your account. You can call or message anytime without repeat fees.
                    </div>
                  </div>
                </div>
              ) : (
                /* LOCKED STATE: Prompt Tutor to Unlock Contact */
                <div className="mn-sp-locked-container">
                  <div className="mn-sp-locked-info">
                    <span className="mn-sp-locked-icon">🔒</span>
                    <div>
                      <div className="mn-sp-locked-heading">Contact Details Locked</div>
                      <div className="mn-sp-locked-sub">
                        Unlock verified parent phone number and 1-click WhatsApp access.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUnlockClick}
                    className="mn-sp-unlock-cta"
                  >
                    <span>🔓 Unlock Direct Contact</span>
                  </button>
                </div>
              )}

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
                  <span>⚡</span>
                  <span>Direct Communication, Zero Commission</span>
                </li>
                <li className="mn-sp-trust-item">
                  <span>🔒</span>
                  <span>Permanent Access — No Repeat Charges</span>
                </li>
              </ul>

            </div>
          </div>

        </div>
      </div>

      {/* TEACHER CONTACT UNLOCK / SUBSCRIPTION PLAN MODAL */}
      {showUnlockModal && (
        <div className="mn-sp-modal-overlay" onClick={() => setShowUnlockModal(false)}>
          <div className="mn-sp-modal-card" onClick={(e) => e.stopPropagation()}>
            
            <div className="mn-sp-modal-header">
              <div>
                <h3 className="mn-sp-modal-title">Teacher Contact Unlock</h3>
                <p className="mn-sp-modal-subtitle">
                  Choose how you want to unlock {studentName}&apos;s contact details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="mn-sp-modal-close-btn"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Lead Brief Summary Strip */}
            <div className="mn-sp-modal-lead-summary">
              <div className="mn-sp-mls-col">
                <span className="mn-sp-mls-lbl">Student</span>
                <span className="mn-sp-mls-val">{studentName}</span>
              </div>
              <div className="mn-sp-mls-col">
                <span className="mn-sp-mls-lbl">Class &amp; Board</span>
                <span className="mn-sp-mls-val">{studentClass} ({studentBoard})</span>
              </div>
              <div className="mn-sp-mls-col">
                <span className="mn-sp-mls-lbl">Expected Tutoring Budget</span>
                <span className="mn-sp-mls-val highlight">{budget}</span>
              </div>
            </div>

            <div className="mn-sp-modal-budget-clarification">
              💡 <strong>Tutoring Fee Note:</strong> {budget} is the student&apos;s expected monthly tuition fee paid to you upon starting classes.
            </div>

            {/* All Access Plan Showcase */}
            <div className="mn-sp-modal-plans">
              <div className="mn-sp-plan-option featured">
                <div className="mn-sp-plan-badge-free" style={{ background: '#E11D48', color: '#FFF' }}>
                  👑 MENTORNEARBY ALL ACCESS
                </div>
                
                <div className="mn-sp-plan-header">
                  <div>
                    <h4 className="mn-sp-plan-title">Unlock Contact Details</h4>
                    <p className="mn-sp-plan-sub">Subscribe to MentorNearby All Access for ₹{UNIFIED_PLAN.amount}/month to unlock tutor and student contact details.</p>
                  </div>
                  <div className="mn-sp-plan-price-block">
                    <span className="mn-sp-free-price" style={{ color: '#E11D48' }}>₹{UNIFIED_PLAN.amount} <small style={{ fontSize: '12px', color: '#64748B' }}>/mo</small></span>
                  </div>
                </div>

                <ul className="mn-sp-plan-feature-list">
                  <li>✓ Direct Parent / Student Phone Number &amp; WhatsApp</li>
                  <li>✓ Unlimited Student Enquiries &amp; Lead Unlocks</li>
                  <li>✓ 0% Commission — Retain 100% of your earnings</li>
                  <li>✓ Priority Search Visibility &amp; Verification Badge</li>
                  <li>✓ Cancel AutoPay Anytime with 1 Click</li>
                </ul>

                <button
                  type="button"
                  onClick={handleSubscribeAndUnlock}
                  disabled={unlocking}
                  className="mn-sp-modal-unlock-act-btn"
                  style={{ background: '#E11D48', color: '#FFF', fontWeight: 800 }}
                >
                  {unlocking ? (
                    <span>⏳ Processing AutoPay Authorization...</span>
                  ) : (
                    <span>Subscribe Now – ₹{UNIFIED_PLAN.amount}/month</span>
                  )}
                </button>
              </div>
            </div>

            <div className="mn-sp-modal-footer">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="mn-sp-modal-cancel-btn"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentProfilePage;
