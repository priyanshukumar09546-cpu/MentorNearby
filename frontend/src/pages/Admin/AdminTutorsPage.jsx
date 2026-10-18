// ============================================================
// pages/Admin/AdminTutorsPage.jsx
// Enterprise Admin Tutor Management System
// 100% Real Database Fetching — No Mock/Demo Data
// 4 Functional Action Icons: View (👁️), Profile Status (🔗), Suspend/Restore (🚫/♻️), Delete (🗑️)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAdminTutors,
  getAdminTutorDetail,
  approveTutor,
  unapproveTutor,
  rejectTutor,
  suspendTutor,
  reactivateTutor,
  deleteTutorPermanently,
  grantUserSubscription,
} from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';
import '../../styles/AdminDesign.css';

const AdminTutorsPage = () => {
  const { showToast } = useToast();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTutors, setTotalTutors] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Centered Modals state
  const [viewModalData, setViewModalData] = useState({ isOpen: false, tutor: null, loading: false });
  const [profileStatusModalData, setProfileStatusModalData] = useState({ isOpen: false, tutor: null });
  const [subModalData, setSubModalData] = useState({ isOpen: false, tutor: null, days: 30, planType: 'teacher', loading: false });
  const [suspendModalData, setSuspendModalData] = useState({ isOpen: false, tutor: null, reason: 'Policy violation', customReason: '', submitting: false });
  const [reactivateModalData, setReactivateModalData] = useState({ isOpen: false, tutor: null, submitting: false });
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    tutor: null,
    reasonCategory: 'Policy violation',
    customReason: '',
    confirmText: '',
    submitting: false,
  });

  // Approval Modal with Email Preview & Missing Fields Inspection
  const [approveModalData, setApproveModalData] = useState({
    isOpen: false,
    tutor: null,
    missingDetails: [],
    customMessage: '',
    subject: 'Congratulations! Your MentorNearby Tutor Profile Has Been Approved 🎉',
    includeMissingDetails: true,
    submitting: false,
  });

  // Unapproval / Action Required Modal with Reason & Email Preview
  const [unapproveModalData, setUnapproveModalData] = useState({
    isOpen: false,
    tutor: null,
    reason: 'Required documents missing',
    explanation: 'Please provide valid identity verification and qualification documents to complete your profile verification.',
    correctionChecklist: ['Government Identity Proof (Aadhaar / Voter ID / Passport)'],
    customMessage: '',
    subject: 'Action Required: Please Update Your MentorNearby Tutor Profile',
    submitting: false,
  });

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const res = await getAdminTutors({
        search: search || undefined,
        accountStatus: accountStatusFilter !== 'ALL' ? accountStatusFilter : undefined,
        kycStatus: kycFilter !== 'ALL' ? kycFilter : undefined,
        page,
        limit: pageSize,
      });
      setTutors(res.data.data.tutors || []);
    } catch (e) {
      console.warn('Failed to load tutors marketplace list:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [search, accountStatusFilter, kycFilter, page, pageSize]);

  // Real statistics calculation based on DB response
  const stats = useMemo(() => {
    const active = tutors.filter((t) => !t.isSuspended && (t.profile?.isApproved || t.profile?.profileStatus === 'approved')).length;
    const pendingApproval = tutors.filter((t) => !t.isSuspended && !t.profile?.isApproved && t.profile?.profileStatus !== 'approved').length;
    const suspended = tutors.filter((t) => t.isSuspended).length;
    const verified = tutors.filter((t) => t.profile?.kycStatus === 'VERIFIED').length;
    const pending = tutors.filter((t) => t.profile?.kycStatus === 'PENDING').length;
    const discoveryTutors = tutors.filter((t) => t.profile?.registeredViaDiscovery || t.registeredViaDiscovery || t.profile?.discoveryLeadId).length;
    return { active, pendingApproval, suspended, verified, pending, discoveryTutors, total: totalTutors };
  }, [tutors, totalTutors]);

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // ------------------------------------------------------------
  // HELPER: Analyze Tutor Incomplete Optional Fields
  // ------------------------------------------------------------
  const analyzeTutorMissingDetails = (tutor) => {
    const prof = tutor?.profile || tutor || {};
    const missing = [];

    if (!prof.profilePhoto?.url) {
      missing.push({
        key: 'profilePhoto',
        title: 'Profile Photo',
        tip: 'Upload a clear, friendly portrait photo to establish trust with parents and students.',
      });
    }

    if (!prof.professionalHeadline || !prof.professionalHeadline.trim()) {
      missing.push({
        key: 'headline',
        title: 'Professional Headline',
        tip: 'Add a catchy headline summarizing your teaching expertise (e.g. "Senior CBSE Math Tutor | 8+ Yrs Exp").',
      });
    }

    if (!prof.bio || prof.bio.trim().length < 40) {
      missing.push({
        key: 'bio',
        title: 'Detailed Bio / About You',
        tip: 'Share your background, teaching philosophy, and academic journey.',
      });
    }

    if (!prof.subjects || prof.subjects.length === 0) {
      missing.push({
        key: 'subjects',
        title: 'Subjects & Classes',
        tip: 'Specify all subjects and grade levels you teach so matching students can find you.',
      });
    }

    if (!prof.experience?.years) {
      missing.push({
        key: 'experience',
        title: 'Teaching Experience',
        tip: 'Specify your years of tutoring or classroom experience.',
      });
    }

    const hasEducation = Array.isArray(prof.education) && prof.education.length > 0;
    const hasCertificates = Array.isArray(prof.certificates) && prof.certificates.length > 0;
    if (!hasEducation && !hasCertificates) {
      missing.push({
        key: 'education',
        title: 'Education & Qualifications',
        tip: 'List your highest degrees, college, or subject certifications.',
      });
    }

    if (!prof.teachingModes || prof.teachingModes.length === 0) {
      missing.push({
        key: 'teachingModes',
        title: 'Teaching Modes (Online / Home Tuition / Hybrid)',
        tip: 'Indicate whether you teach Online, In-Person Home Tuition, or Both.',
      });
    }

    if (!prof.location?.city && !prof.location?.locality) {
      missing.push({
        key: 'location',
        title: 'City & Service Area',
        tip: 'Specify your neighborhood and city for hyper-local student matching.',
      });
    }

    if (!prof.fees?.amount) {
      missing.push({
        key: 'fees',
        title: 'Tuition Fee Rates',
        tip: 'Set your hourly or monthly pricing rate so parents know what to expect.',
      });
    }

    if (!prof.introVideo?.url) {
      missing.push({
        key: 'introVideo',
        title: 'Intro Video (Optional)',
        tip: 'Record and upload a 60-second video introduction to boost student inquiries.',
      });
    }

    return missing;
  };

  // ------------------------------------------------------------
  // ACTION 0: ✓ APPROVE TUTOR CONFIRMATION MODAL & SEND EMAIL
  // ------------------------------------------------------------
  const openApproveModal = (tutor) => {
    const missing = analyzeTutorMissingDetails(tutor);
    setApproveModalData({
      isOpen: true,
      tutor,
      missingDetails: missing,
      customMessage: '',
      subject: 'Congratulations! Your MentorNearby Tutor Profile Has Been Approved 🎉',
      includeMissingDetails: missing.length > 0,
      submitting: false,
    });
  };

  const handleConfirmApprove = async () => {
    if (!approveModalData.tutor) return;
    const tutorId = approveModalData.tutor._id;
    setApproveModalData((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        customSubject: approveModalData.subject,
        customMessage: approveModalData.customMessage,
        missingDetailsList: approveModalData.includeMissingDetails ? approveModalData.missingDetails : [],
        sendEmailNotification: true,
        idempotencyKey: `appr_${tutorId}_${Date.now()}`,
      };

      const res = await approveTutor(tutorId, payload);
      const data = res.data?.data || {};

      if (data.emailSent) {
        showToast('Tutor Approved & Congratulation Email Delivered! 🎉', 'success');
      } else {
        showToast(
          res.data?.message || 'Tutor profile approved, but email delivery failed. You can resend anytime.',
          'warning'
        );
      }

      setApproveModalData({
        isOpen: false,
        tutor: null,
        missingDetails: [],
        customMessage: '',
        subject: '',
        includeMissingDetails: true,
        submitting: false,
      });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve tutor', 'error');
      setApproveModalData((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ------------------------------------------------------------
  // ACTION 1: ✕ UNAPPROVE / CORRECTION REQUIRED MODAL & SEND EMAIL
  // ------------------------------------------------------------
  const openUnapproveModal = (tutor) => {
    setUnapproveModalData({
      isOpen: true,
      tutor,
      reason: 'Required documents missing',
      explanation: 'Please provide valid identity verification and qualification documents to complete your profile verification.',
      correctionChecklist: ['Government Identity Proof (Aadhaar / Voter ID / Passport)'],
      customMessage: '',
      subject: 'Action Required: Please Update Your MentorNearby Tutor Profile',
      submitting: false,
    });
  };

  const handleConfirmUnapprove = async () => {
    if (!unapproveModalData.tutor) return;
    if (!unapproveModalData.explanation.trim()) {
      showToast('Please provide an explanation for unapproving this tutor profile.', 'error');
      return;
    }

    const tutorId = unapproveModalData.tutor._id;
    setUnapproveModalData((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        reason: unapproveModalData.reason,
        explanation: unapproveModalData.explanation.trim(),
        correctionChecklist: unapproveModalData.correctionChecklist,
        customMessage: unapproveModalData.customMessage,
        customSubject: unapproveModalData.subject,
        sendEmailNotification: true,
        idempotencyKey: `unappr_${tutorId}_${Date.now()}`,
      };

      const res = await unapproveTutor(tutorId, payload);
      const data = res.data?.data || {};

      if (data.emailSent) {
        showToast('Tutor approval cancelled and action required email sent.', 'success');
      } else {
        showToast(
          res.data?.message || 'Tutor approval cancelled, but notification email could not be sent.',
          'warning'
        );
      }

      setUnapproveModalData({
        isOpen: false,
        tutor: null,
        reason: 'Required documents missing',
        explanation: '',
        correctionChecklist: [],
        customMessage: '',
        subject: '',
        submitting: false,
      });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel tutor approval', 'error');
      setUnapproveModalData((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleReject = async (tutorId) => {
    const reason = window.prompt('Enter reason for rejection:', 'Verification documents or profile criteria not met');
    if (reason === null) return;
    try {
      await rejectTutor(tutorId, { reason });
      showToast('Tutor profile rejected.', 'info');
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject tutor', 'error');
    }
  };

  // ------------------------------------------------------------
  // ACTION: 💎 GRANT SUBSCRIPTION
  // ------------------------------------------------------------
  const handleGrantSub = async (e) => {
    e.preventDefault();
    if (!subModalData.tutor) return;
    try {
      setSubModalData((prev) => ({ ...prev, loading: true }));
      const userId = subModalData.tutor.user?._id || subModalData.tutor._id;
      const res = await grantUserSubscription(userId, {
        days: subModalData.days,
        planType: subModalData.planType,
      });
      showToast(res.data?.message || 'Subscription granted successfully!', 'success');
      setSubModalData({ isOpen: false, tutor: null, days: 30, planType: 'teacher', loading: false });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to grant subscription', 'error');
      setSubModalData((prev) => ({ ...prev, loading: false }));
    }
  };

  // ------------------------------------------------------------
  // ACTION 1: 👁️ VIEW TUTOR DETAILS (Centered Modal)
  // ------------------------------------------------------------
  const handleOpenView = async (tutor) => {
    setViewModalData({ isOpen: true, tutor, loading: true });
    try {
      const res = await getAdminTutorDetail(tutor._id);
      setViewModalData({ isOpen: true, tutor: res.data.data.tutor, loading: false });
    } catch (err) {
      setViewModalData((prev) => ({ ...prev, loading: false }));
      showToast('Loaded basic tutor details', 'info');
    }
  };

  // ------------------------------------------------------------
  // ACTION 2: 🔗 PROFILE STATUS & COMPLETION (Centered Modal)
  // ------------------------------------------------------------
  const handleOpenProfileStatus = (tutor) => {
    setProfileStatusModalData({ isOpen: true, tutor });
  };

  // Calculate Tutor Profile Health Checklist
  const calculateTutorProfileHealth = (tutor) => {
    if (!tutor) return { score: 0, missing: [], isComplete: false };
    const p = tutor.profile || {};
    const checks = [
      { key: 'name', label: 'Full Name', passed: Boolean(tutor.name && tutor.name.trim()) },
      { key: 'email', label: 'Email Address', passed: Boolean(tutor.email) },
      { key: 'phone', label: 'Phone Number', passed: Boolean(tutor.phone) },
      { key: 'photo', label: 'Profile Photo', passed: Boolean(p.profilePhoto?.url) },
      { key: 'bio', label: 'Bio / Teaching Philosophy', passed: Boolean(p.bio && p.bio.length >= 20) },
      { key: 'subjects', label: 'Subjects Taught', passed: Boolean(p.subjects && p.subjects.length > 0) },
      { key: 'classes', label: 'Classes / Grades Handled', passed: Boolean(p.grades && p.grades.length > 0) },
      { key: 'experience', label: 'Teaching Experience', passed: Boolean(p.experience?.years !== undefined) },
      { key: 'fees', label: 'Fee Structure', passed: Boolean(p.fees?.amount && p.fees.amount > 0) },
      { key: 'location', label: 'City & Locality', passed: Boolean(p.location?.city) },
      { key: 'kyc', label: 'Government ID KYC Document', passed: p.kycStatus === 'VERIFIED' || p.kycStatus === 'PENDING' },
    ];
    const passedCount = checks.filter(c => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const missing = checks.filter(c => !c.passed).map(c => c.label);
    const isComplete = score >= 80 && (p.kycStatus === 'VERIFIED' || p.kycStatus === 'PENDING');
    return { score, checks, missing, isComplete };
  };

  // ------------------------------------------------------------
  // ACTION 3: 🚫 SUSPEND / ♻️ RESTORE (Centered Modal)
  // ------------------------------------------------------------
  const handleOpenSuspend = (tutor) => {
    setSuspendModalData({
      isOpen: true,
      tutor,
      reason: 'Policy violation',
      customReason: '',
      submitting: false,
    });
  };

  const handleConfirmSuspend = async (e) => {
    e.preventDefault();
    const { tutor, reason, customReason } = suspendModalData;
    const fullReason = customReason.trim() ? `${reason}: ${customReason.trim()}` : reason;

    try {
      setSuspendModalData((prev) => ({ ...prev, submitting: true }));
      await suspendTutor(tutor._id, { reason: fullReason });
      showToast(`Tutor ${tutor.name} has been suspended.`, 'warning');
      setSuspendModalData({ isOpen: false, tutor: null, reason: 'Policy violation', customReason: '', submitting: false });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend tutor account.', 'error');
      setSuspendModalData((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleOpenReactivate = (tutor) => {
    setReactivateModalData({ isOpen: true, tutor, submitting: false });
  };

  const handleConfirmReactivate = async () => {
    const { tutor } = reactivateModalData;
    try {
      setReactivateModalData((prev) => ({ ...prev, submitting: true }));
      await reactivateTutor(tutor._id);
      showToast(`Tutor ${tutor.name} has been restored and is now active.`, 'success');
      setReactivateModalData({ isOpen: false, tutor: null, submitting: false });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore tutor account.', 'error');
      setReactivateModalData((prev) => ({ ...prev, submitting: false }));
    }
  };

  // ------------------------------------------------------------
  // ACTION 4: 🗑️ PERMANENT DELETE (Centered Modal)
  // ------------------------------------------------------------
  const handleOpenDelete = (tutor) => {
    setDeleteModalData({
      isOpen: true,
      tutor,
      reasonCategory: 'Policy violation',
      customReason: '',
      confirmText: '',
      submitting: false,
    });
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    const { tutor, reasonCategory, customReason, confirmText } = deleteModalData;

    if (confirmText !== 'DELETE') {
      showToast('You must type "DELETE" exactly to confirm permanent deletion.', 'error');
      return;
    }

    const fullReason = customReason.trim()
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    try {
      setDeleteModalData((prev) => ({ ...prev, submitting: true }));
      await deleteTutorPermanently(tutor._id, {
        reason: fullReason,
        confirmText: 'DELETE',
      });
      showToast(`Tutor "${tutor.name}" permanently deleted.`, 'success');
      setDeleteModalData({
        isOpen: false,
        tutor: null,
        reasonCategory: 'Policy violation',
        customReason: '',
        confirmText: '',
        submitting: false,
      });
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to permanently delete tutor account.', 'error');
      setDeleteModalData((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      {/* 1. Page Header */}
      <AdminPageHeader
        icon="🧑‍🏫"
        eyebrow="TUTORS MARKETPLACE"
        title="Tutor Network Directory"
        subtitle="Live tutor registry fetched from MongoDB. Complete lifecycle management with instant action governance."
      >
        <button
          onClick={fetchTutors}
          disabled={loading}
          className="admin-btn admin-btn-secondary px-3 py-2 text-xs"
          title="Refresh Tutors List"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      {/* 2. Real KPI Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Tutors</span>
            <div className="admin-kpi-icon-box">👨‍🏫</div>
          </div>
          <p className="admin-kpi-value">{totalTutors}</p>
          <p className="admin-kpi-subtext">Registered instructor accounts</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Active Tutors</span>
            <div className="admin-kpi-icon-box">🟢</div>
          </div>
          <p className="admin-kpi-value text-emerald-600">{stats.active}</p>
          <p className="admin-kpi-subtext">Available on search marketplace</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">KYC Verified</span>
            <div className="admin-kpi-icon-box">✓</div>
          </div>
          <p className="admin-kpi-value text-emerald-600">{stats.verified}</p>
          <p className="admin-kpi-subtext">Identity verified with badge</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Pending KYC</span>
            <div className="admin-kpi-icon-box">⏳</div>
          </div>
          <p className="admin-kpi-value text-amber-600">{stats.pending}</p>
          <p className="admin-kpi-subtext">Documents awaiting verification</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Pending Approval</span>
            <div className="admin-kpi-icon-box">⏳</div>
          </div>
          <p className="admin-kpi-value text-amber-600">{stats.pendingApproval}</p>
          <p className="admin-kpi-subtext">Awaiting admin review</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Suspended</span>
            <div className="admin-kpi-icon-box">🔴</div>
          </div>
          <p className="admin-kpi-value text-rose-600">{stats.suspended}</p>
          <p className="admin-kpi-subtext">Accounts restricted by admin</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="admin-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by tutor name, email, phone, subjects, city or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="admin-input w-full pl-9 text-xs"
            />
            <span className="absolute left-3 top-2.5 text-sm text-[#85857D]">🔍</span>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={accountStatusFilter}
              onChange={(e) => { setAccountStatusFilter(e.target.value); setPage(1); }}
              className="admin-select w-full text-xs"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="PENDING_APPROVAL">⏳ Pending Approval Only</option>
              <option value="ACTIVE">🟢 Active Only</option>
              <option value="SUSPENDED">🔴 Suspended Only</option>
            </select>
          </div>

          {/* KYC Status Filter */}
          <div>
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
              className="admin-select w-full text-xs"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="VERIFIED">✓ Verified</option>
              <option value="PENDING">⏳ Pending Review</option>
              <option value="REJECTED">✕ Rejected</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table / Empty State */}
      {loading ? (
        <div className="admin-card p-12 text-center">
          <div className="inline-block animate-spin text-3xl mb-3">🔄</div>
          <p className="text-sm font-semibold text-[#575752]">Fetching live tutors from database...</p>
        </div>
      ) : tutors.length === 0 ? (
        <AdminEmptyState
          icon="🧑‍🏫"
          title="No tutors registered yet."
          description="New educators and mentors who register on MentorNearby will appear here automatically."
          actionLabel={search || accountStatusFilter !== 'ALL' || kycFilter !== 'ALL' ? 'Reset Filters' : undefined}
          onAction={() => { setSearch(''); setAccountStatusFilter('ALL'); setKycFilter('ALL'); }}
        />
      ) : (
        <div className="admin-card p-6 shadow-sm">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TUTOR IDENTITY</th>
                  <th>USER ID</th>
                  <th>SUBJECTS &amp; EXP</th>
                  <th>LOCATION &amp; FEE</th>
                  <th>KYC STATUS</th>
                  <th>ACCOUNT</th>
                  <th>REGISTERED</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tutor) => {
                  const profile = tutor.profile || {};
                  const isSuspended = tutor.isSuspended;
                  const isVerified = profile.kycStatus === 'VERIFIED';

                  return (
                    <tr key={tutor._id} className={isSuspended ? 'bg-red-50/40' : ''}>
                      
                      {/* 1. Tutor Name & Contact */}
                      <td>
                        <div className="admin-user-cell">
                          <ProfileAvatar
                            src={profile.profilePhoto?.url}
                            name={tutor.name}
                            size="md"
                            showBadge={isVerified}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="admin-user-name">{tutor.name}</p>
                              {isVerified && <span className="text-emerald-600 text-xs" title="Verified Identity">✓</span>}
                            </div>
                            {(profile.registeredViaDiscovery || tutor.registeredViaDiscovery || profile.discoveryLeadId) && (
                              <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                  color: '#b45309',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  border: '1px solid #fcd34d',
                                }}>
                                  🛰️ Registered via Discovery Engine
                                </span>
                              </div>
                            )}
                            <p className="admin-user-email truncate max-w-[170px] text-xs text-[#575752]">
                              {tutor.email}
                            </p>
                            {tutor.phone && (
                              <p className="text-[11px] font-mono text-[#85857D] flex items-center gap-1 mt-0.5">
                                <span>📱 {tutor.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Tutor ID */}
                      <td>
                        <button
                          onClick={() => handleCopy(tutor._id, 'Tutor ID')}
                          className="font-mono text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded cursor-pointer transition flex items-center gap-1"
                          title="Click to copy full ID"
                        >
                          <span>{tutor._id.slice(-6)}</span>
                          <span className="text-[10px] text-slate-400">📋</span>
                        </button>
                      </td>

                      {/* 3. Subjects & Experience */}
                      <td>
                        <div>
                          <p className="font-bold text-[#1C1C1A] text-xs">
                            {profile.subjects?.slice(0, 2).join(', ') || 'General Tuition'}
                            {profile.subjects?.length > 2 && ` +${profile.subjects.length - 2}`}
                          </p>
                          <p className="text-[11px] text-[#85857D] mt-0.5">
                            {profile.experience?.years || 0} Years • {profile.teachingModes?.join('/') || 'Offline'}
                          </p>
                        </div>
                      </td>

                      {/* 4. Location & Fee */}
                      <td>
                        <div>
                          <p className="text-[#575752] text-xs font-medium truncate max-w-[130px]">
                            {profile.location?.city ? `${profile.location.city}` : 'Location N/A'}
                          </p>
                          <p className="text-[11px] font-mono text-[#0F172A] font-bold mt-0.5">
                            ₹{profile.fees?.amount || 500} / {profile.fees?.frequency || 'mo'}
                          </p>
                        </div>
                      </td>

                      {/* 5. KYC Status */}
                      <td>
                        <span
                          className={`admin-badge ${
                            isVerified
                              ? 'admin-badge-emerald'
                              : profile.kycStatus === 'PENDING'
                              ? 'admin-badge-amber'
                              : profile.kycStatus === 'REJECTED'
                              ? 'admin-badge-rose'
                              : 'admin-badge-slate'
                          }`}
                        >
                          {profile.kycStatus || 'NOT_SUBMITTED'}
                        </span>
                      </td>

                      {/* 6. Account Status */}
                      <td>
                        {isSuspended ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="admin-badge admin-badge-rose font-bold">
                              🔴 Suspended
                            </span>
                            {tutor.suspensionReason && (
                              <span className="text-[10px] text-red-600 max-w-[120px] truncate" title={tutor.suspensionReason}>
                                {tutor.suspensionReason}
                              </span>
                            )}
                          </div>
                        ) : (!profile.isApproved && profile.profileStatus !== 'approved' && !tutor.isApproved) ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="admin-badge font-bold" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                              ⏳ Pending Approval
                            </span>
                            <span className="text-[9.5px] text-amber-700 font-medium">
                              Hidden from search
                            </span>
                          </div>
                        ) : (
                          <span className="admin-badge admin-badge-emerald font-bold">
                            🟢 Active
                          </span>
                        )}
                      </td>

                      {/* 7. Registration Date */}
                      <td>
                        <span className="text-[11.5px] text-[#85857D]">
                          {new Date(tutor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          
                          {/* Approve / Reject Buttons vs Approved Badge */}
                          {profile.kycStatus !== 'VERIFIED' && !profile.isApproved && !tutor.isApproved ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openApproveModal(tutor)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title="Approve Tutor Profile & Review Notification Email"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReject(tutor._id)}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer"
                                title="Reject Tutor Profile"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                                ✓ Approved
                              </span>
                              <button
                                onClick={() => openUnapproveModal(tutor)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Cancel Approval / Remove from Website Listings"
                              >
                                ✕ Unapprove
                              </button>
                            </div>
                          )}

                          {/* ICON 1: 👁️ View Full Details Modal */}
                          <button
                            onClick={() => handleOpenView(tutor)}
                            className="admin-btn-square view"
                            title="View Full Tutor Profile Details"
                          >
                            👁️
                          </button>

                          {/* ICON 2: 🔗 Profile Status & Completion */}
                          <button
                            onClick={() => handleOpenProfileStatus(tutor)}
                            className="admin-btn-square"
                            style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}
                            title="Check Profile Completion & Missing Info"
                          >
                            🔗
                          </button>

                          {/* ICON 2.5: 💎 Grant Subscription */}
                          <button
                            onClick={() =>
                              setSubModalData({
                                isOpen: true,
                                tutor,
                                days: 30,
                                planType: 'teacher',
                                loading: false,
                              })
                            }
                            className="admin-btn-square"
                            style={{ background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' }}
                            title="Grant 30-Day Teacher Subscription"
                          >
                            💎
                          </button>

                          {/* ICON 3: 🚫 Suspend or ♻️ Restore */}
                          {isSuspended ? (
                            <button
                              onClick={() => handleOpenReactivate(tutor)}
                              className="admin-btn-square reactivate bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="Restore Tutor Account"
                            >
                              ♻️
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSuspend(tutor)}
                              className="admin-btn-square suspend bg-rose-50 text-rose-700 hover:bg-rose-100"
                              title="Suspend Tutor Account"
                            >
                              🚫
                            </button>
                          )}

                          {/* ICON 4: 🗑️ Permanent Delete */}
                          <button
                            onClick={() => handleOpenDelete(tutor)}
                            className="admin-btn-square delete bg-rose-50 text-rose-700 hover:bg-rose-100"
                            title="Delete Tutor Permanently"
                          >
                            🗑️
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[#E6E2D9] text-xs text-[#77766E]">
            <div>
              Showing <strong className="text-[#1C1C1A]">{Math.min((page - 1) * pageSize + 1, totalTutors)}</strong> to{' '}
              <strong className="text-[#1C1C1A]">{Math.min(page * pageSize, totalTutors)}</strong> of{' '}
              <strong className="text-[#1C1C1A]">{totalTutors}</strong> tutors
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="admin-select py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="admin-btn admin-btn-secondary px-2.5 py-1 text-xs disabled:opacity-40"
                >
                  ←
                </button>
                <span className="px-3 py-1 bg-[#FAF9F6] border border-[#E6E2D9] rounded-lg font-bold text-xs">
                  Page {page} of {Math.ceil(totalTutors / pageSize) || 1}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= totalTutors}
                  className="admin-btn admin-btn-secondary px-2.5 py-1 text-xs disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: 👁️ CENTERED VIEW TUTOR DETAILS MODAL                 */}
      {/* ============================================================ */}
      {viewModalData.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setViewModalData({ isOpen: false, tutor: null, loading: false })}>
          <div className="admin-modal-box max-w-2xl text-left" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  src={viewModalData.tutor?.profile?.profilePhoto?.url}
                  name={viewModalData.tutor?.name}
                  size="lg"
                  showBadge={viewModalData.tutor?.profile?.kycStatus === 'VERIFIED'}
                />
                <div>
                  <h3 className="text-lg font-black text-[#0F172A]">{viewModalData.tutor?.name}</h3>
                  <p className="text-xs text-[#64748B]">{viewModalData.tutor?.email} • {viewModalData.tutor?.phone || 'No phone'}</p>
                  <p className="text-[11px] font-mono text-[#85857D] mt-0.5">ID: {viewModalData.tutor?._id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalData({ isOpen: false, tutor: null, loading: false })}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Discovery Engine Acquisition Banner */}
            {(viewModalData.tutor?.profile?.registeredViaDiscovery || viewModalData.tutor?.registeredViaDiscovery || viewModalData.tutor?.profile?.discoveryLeadId) && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#92400e',
                fontWeight: 600,
                fontSize: '12px'
              }}>
                <span style={{ fontSize: '16px' }}>🛰️</span>
                <span><strong>Discovery Engine Lead:</strong> This tutor was acquired through the automated Discovery Engine and completed registration via invitation link.</span>
              </div>
            )}

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase">Account Status</span>
                  <p className="font-extrabold text-sm mt-0.5">
                    {viewModalData.tutor?.isSuspended ? '🔴 Suspended' : '🟢 Active'}
                  </p>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase">KYC Status</span>
                  <p className="font-extrabold text-sm mt-0.5 text-amber-700">
                    {viewModalData.tutor?.profile?.kycStatus || 'NOT_SUBMITTED'}
                  </p>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase">Contact Unlocks</span>
                  <p className="font-extrabold text-sm mt-0.5 text-indigo-700">
                    {viewModalData.tutor?.unlocksCount || 0} times
                  </p>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 font-bold uppercase">Expected Fee</span>
                  <p className="font-extrabold text-sm mt-0.5 text-emerald-700">
                    ₹{viewModalData.tutor?.profile?.fees?.amount || 500}
                  </p>
                </div>
              </div>

              {/* Bio & Description */}
              <div>
                <h4 className="font-bold text-[#0F172A] mb-1">About &amp; Bio</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {viewModalData.tutor?.profile?.bio || 'No bio written yet.'}
                </p>
              </div>

              {/* Subjects & Grades */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-[#0F172A] mb-1">Subjects Taught</h4>
                  <p className="text-slate-700 font-semibold">{viewModalData.tutor?.profile?.subjects?.join(', ') || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-[#0F172A] mb-1">Grades / Classes</h4>
                  <p className="text-slate-700 font-semibold">{viewModalData.tutor?.profile?.grades?.join(', ') || 'N/A'}</p>
                </div>
              </div>

              {/* Education & Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-[#0F172A] mb-1">Education &amp; Qualifications</h4>
                  {viewModalData.tutor?.profile?.education?.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {viewModalData.tutor.profile.education.map((edu, idx) => (
                        <li key={idx}><strong>{edu.degree}</strong> - {edu.institution} ({edu.year})</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">No education entries added.</p>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-[#0F172A] mb-1">Teaching Modes &amp; Location</h4>
                  <p className="text-slate-700 font-semibold">Modes: {viewModalData.tutor?.profile?.teachingModes?.join(', ') || 'Offline'}</p>
                  <p className="text-slate-600 mt-1">City: {viewModalData.tutor?.profile?.location?.city || 'N/A'}</p>
                  <p className="text-slate-600">Pincode: {viewModalData.tutor?.profile?.location?.pincode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {viewModalData.tutor?.profile?.kycStatus === 'VERIFIED' || viewModalData.tutor?.profile?.isApproved || viewModalData.tutor?.isApproved ? (
                  <button
                    onClick={() => {
                      const t = viewModalData.tutor;
                      setViewModalData({ isOpen: false, tutor: null, loading: false });
                      openUnapproveModal(t);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    ✕ Cancel Approval (Remove from Website)
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const t = viewModalData.tutor;
                        setViewModalData({ isOpen: false, tutor: null, loading: false });
                        openApproveModal(t);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      ✓ Approve Tutor &amp; Send Email
                    </button>
                    <button
                      onClick={() => {
                        handleReject(viewModalData.tutor._id);
                        setViewModalData({ isOpen: false, tutor: null, loading: false });
                      }}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      ✕ Reject Profile
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewModalData({ isOpen: false, tutor: null, loading: false })}
                className="admin-btn admin-btn-secondary text-xs"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: 🔗 CENTERED PROFILE STATUS & HEALTH MODAL           */}
      {/* ============================================================ */}
      {profileStatusModalData.isOpen && profileStatusModalData.tutor && (() => {
        const { score, checks, missing, isComplete } = calculateTutorProfileHealth(profileStatusModalData.tutor);
        return (
          <div className="admin-modal-overlay" onClick={() => setProfileStatusModalData({ isOpen: false, tutor: null })}>
            <div className="admin-modal-box max-w-lg text-left" onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <span>🔗</span> Profile Health &amp; Verification Readiness
                  </h3>
                  <p className="text-xs text-[#64748B]">Tutor: {profileStatusModalData.tutor.name}</p>
                </div>
                <button
                  onClick={() => setProfileStatusModalData({ isOpen: false, tutor: null })}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Progress Score */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-[#0F172A]">Completion Score:</span>
                  <span className="font-extrabold text-sm text-[#FF6B00]">{score}%</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className={isComplete ? 'admin-progress-fill-complete' : 'admin-progress-fill-incomplete'}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isComplete
                    ? '✓ Profile meets verification criteria for listing on MentorNearby marketplace.'
                    : '⚠️ Profile is incomplete. Admin cannot approve verification badge until mandatory teaching credentials are provided.'}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-4">
                <h4 className="font-bold text-xs text-[#0F172A] uppercase">Required Credentials Checklist:</h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {checks.map(c => (
                    <div key={c.key} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                      <span className="text-slate-700 font-medium">{c.label}</span>
                      {c.passed ? (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">✓ Complete</span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs flex items-center gap-1">❌ Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {missing.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <strong>Missing Credentials:</strong> {missing.join(', ')}
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-end">
                <button
                  onClick={() => setProfileStatusModalData({ isOpen: false, tutor: null })}
                  className="admin-btn admin-btn-secondary text-xs"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* MODAL 3: 🚫 CENTERED SUSPEND CONFIRMATION MODAL             */}
      {/* ============================================================ */}
      {suspendModalData.isOpen && suspendModalData.tutor && (
        <div className="admin-modal-overlay" onClick={() => setSuspendModalData({ isOpen: false, tutor: null, reason: 'Policy violation', customReason: '', submitting: false })}>
          <div className="admin-modal-box max-w-md text-left" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                🚫
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F172A] text-base">Suspend Tutor Account</h3>
                <p className="text-xs text-[#64748B]">Account: {suspendModalData.tutor.name} ({suspendModalData.tutor.email})</p>
              </div>
            </div>

            <form onSubmit={handleConfirmSuspend} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to suspend this tutor? The tutor will be removed from public search results and prevented from receiving new student inquiries.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Suspension *</label>
                <select
                  value={suspendModalData.reason}
                  onChange={(e) => setSuspendModalData({ ...suspendModalData, reason: e.target.value })}
                  className="admin-select w-full"
                >
                  <option value="Policy violation">Policy violation</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="Fake profile / documents">Fake profile / documents</option>
                  <option value="Duplicate account">Duplicate account</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Notes / Details</label>
                <textarea
                  rows="3"
                  placeholder="Optional details for admin audit log..."
                  value={suspendModalData.customReason}
                  onChange={(e) => setSuspendModalData({ ...suspendModalData, customReason: e.target.value })}
                  className="admin-input w-full"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalData({ isOpen: false, tutor: null, reason: 'Policy violation', customReason: '', submitting: false })}
                  className="admin-btn admin-btn-secondary"
                  disabled={suspendModalData.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendModalData.submitting}
                  className="admin-btn bg-rose-600 text-white hover:bg-rose-700"
                >
                  {suspendModalData.submitting ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3B: ♻️ CENTERED RESTORE ACCOUNT CONFIRMATION MODAL     */}
      {/* ============================================================ */}
      {reactivateModalData.isOpen && reactivateModalData.tutor && (
        <div className="admin-modal-overlay" onClick={() => setReactivateModalData({ isOpen: false, tutor: null, submitting: false })}>
          <div className="admin-modal-box max-w-md text-left" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                ♻️
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F172A] text-base">Restore Tutor Account</h3>
                <p className="text-xs text-[#64748B]">Account: {reactivateModalData.tutor.name} ({reactivateModalData.tutor.email})</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to restore this tutor account and make it active again? The tutor will immediately reappear in public search results and can receive student requests.
              </p>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReactivateModalData({ isOpen: false, tutor: null, submitting: false })}
                  className="admin-btn admin-btn-secondary"
                  disabled={reactivateModalData.submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReactivate}
                  disabled={reactivateModalData.submitting}
                  className="admin-btn bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {reactivateModalData.submitting ? 'Restoring...' : 'Restore Tutor'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: 🗑️ CENTERED PERMANENT DELETE CONFIRMATION MODAL     */}
      {/* ============================================================ */}
      {deleteModalData.isOpen && deleteModalData.tutor && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModalData({ ...deleteModalData, isOpen: false })}>
          <div className="admin-modal-box max-w-md text-left border-rose-300" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center gap-3 border-b border-rose-200 pb-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-rose-900 text-base">Delete Tutor Permanently?</h3>
                <p className="text-xs text-rose-700">Account: {deleteModalData.tutor.name} ({deleteModalData.tutor.email})</p>
              </div>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <p className="font-bold">⚠️ DANGER: This action is irreversible.</p>
                <p>
                  Permanently deletes the tutor account, teaching profile, KYC submissions, and reviews from the database.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Permanent Deletion</label>
                <select
                  value={deleteModalData.reasonCategory}
                  onChange={(e) => setDeleteModalData({ ...deleteModalData, reasonCategory: e.target.value })}
                  className="admin-select w-full"
                >
                  <option value="Policy violation">Policy violation</option>
                  <option value="User requested deletion">User requested deletion</option>
                  <option value="Spam / Fraudulent documents">Spam / Fraudulent documents</option>
                  <option value="GDPR / DPDP Compliance">GDPR / DPDP Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <strong className="text-rose-600 font-mono">DELETE</strong> to confirm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteModalData.confirmText}
                  onChange={(e) => setDeleteModalData({ ...deleteModalData, confirmText: e.target.value })}
                  className="admin-input w-full font-mono text-center tracking-widest uppercase border-rose-300"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalData({ ...deleteModalData, isOpen: false })}
                  className="admin-btn admin-btn-secondary"
                  disabled={deleteModalData.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteModalData.submitting || deleteModalData.confirmText !== 'DELETE'}
                  className="admin-btn bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
                >
                  {deleteModalData.submitting ? 'Deleting...' : 'Permanently Delete Tutor'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Centered Modal: 💎 Grant Subscription */}
      {subModalData.isOpen && subModalData.tutor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box max-w-md w-full">
            <div className="admin-modal-header bg-amber-500/10 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <h3 className="admin-modal-title text-amber-900">Grant Tutor Subscription</h3>
                  <p className="text-xs text-amber-700">Tutor: {subModalData.tutor.name || 'Teacher'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubModalData({ ...subModalData, isOpen: false })}
                className="admin-modal-close text-amber-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantSub} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <p className="font-bold">⭐ Top Listing &amp; Unlimited Leads</p>
                <p className="mt-1">
                  Granting a subscription will place this teacher at the TOP of search rankings and allow unlimited responses to student tuition leads.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Days)</label>
                <select
                  value={subModalData.days}
                  onChange={(e) => setSubModalData({ ...subModalData, days: Number(e.target.value) })}
                  className="admin-select w-full"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={15}>15 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>180 Days (6 Months)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Type</label>
                <select
                  value={subModalData.planType}
                  onChange={(e) => setSubModalData({ ...subModalData, planType: e.target.value })}
                  className="admin-select w-full"
                >
                  <option value="teacher">Teacher Plan (₹149/mo value)</option>
                  <option value="vip">VIP Unlimited</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubModalData({ ...subModalData, isOpen: false })}
                  className="admin-btn admin-btn-secondary"
                  disabled={subModalData.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subModalData.loading}
                  className="admin-btn bg-amber-600 text-white hover:bg-amber-700 font-bold"
                >
                  {subModalData.loading ? 'Granting...' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ✓ TUTOR APPROVAL & EMAIL NOTIFICATION MODAL           */}
      {/* ============================================================ */}
      {approveModalData.isOpen && approveModalData.tutor && (
        <div className="admin-modal-overlay" onClick={() => !approveModalData.submitting && setApproveModalData({ ...approveModalData, isOpen: false })}>
          <div className="admin-modal-box max-w-2xl text-left" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  src={approveModalData.tutor?.profile?.profilePhoto?.url}
                  name={approveModalData.tutor?.name}
                  size="md"
                />
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                    Approve Tutor Profile
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Pending Review
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    <strong>{approveModalData.tutor?.name}</strong> • {approveModalData.tutor?.email || approveModalData.tutor?.profile?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !approveModalData.submitting && setApproveModalData({ ...approveModalData, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
                disabled={approveModalData.submitting}
              >
                ✕
              </button>
            </div>

            {/* Incomplete Fields Inspection Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Profile Details Inspection
                </label>
                {approveModalData.missingDetails.length > 0 && (
                  <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={approveModalData.includeMissingDetails}
                      onChange={(e) => setApproveModalData({ ...approveModalData, includeMissingDetails: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Include recommendations in email</span>
                  </label>
                )}
              </div>

              {approveModalData.missingDetails.length > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      {approveModalData.missingDetails.length} optional details are currently empty:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {approveModalData.missingDetails.map((item) => (
                      <div key={item.key} className="bg-white/80 border border-amber-200/80 rounded-lg p-2 text-[11.5px] leading-snug">
                        <span className="font-bold text-amber-950">{item.title}:</span>{' '}
                        <span className="text-amber-800">{item.tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span><strong>100% Complete Profile:</strong> All profile fields, qualifications, and teaching details are filled.</span>
                </div>
              )}
            </div>

            {/* Editable Subject */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                value={approveModalData.subject}
                onChange={(e) => setApproveModalData({ ...approveModalData, subject: e.target.value })}
                className="admin-input w-full text-xs font-medium"
                placeholder="Congratulations! Your MentorNearby Tutor Profile Has Been Approved 🎉"
              />
            </div>

            {/* Optional Personal Note */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Review Note to Teacher (Optional)
              </label>
              <textarea
                value={approveModalData.customMessage}
                onChange={(e) => setApproveModalData({ ...approveModalData, customMessage: e.target.value })}
                rows={2}
                className="admin-input w-full text-xs"
                placeholder="e.g. Welcome! Your profile is verified and set to live status. We look forward to your student sessions."
              />
            </div>

            {/* Live Email Preview Box */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Personalized Email Preview
              </label>
              <div className="bg-[#0f172a] text-slate-200 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-48 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="text-amber-400 font-bold mb-2">Subject: {approveModalData.subject}</div>
                <div className="text-slate-300">
                  Hi {approveModalData.tutor?.name || 'Tutor'},<br/><br/>
                  Congratulations!<br/><br/>
                  Your tutor profile has been reviewed and approved by the MentorNearby team.<br/><br/>
                  You can now be discovered by students looking for tutors in your area.<br/><br/>
                  {approveModalData.includeMissingDetails && approveModalData.missingDetails.length > 0 && (
                    <div className="p-2 bg-slate-900/80 border border-amber-500/40 rounded my-2 text-amber-200">
                      <strong>To make your profile more useful to prospective students, please review any incomplete details listed below:</strong><br/>
                      {approveModalData.missingDetails.map((m) => `• ${m.title} — ${m.tip}`).join('\n')}<br/><br/>
                      You can update these details from your MentorNearby account.
                    </div>
                  )}
                  {approveModalData.customMessage && (
                    <div className="p-2 bg-blue-950/60 border border-blue-500/40 rounded my-2 text-blue-200">
                      <strong>Note from MentorNearby Review Team:</strong><br/>
                      {approveModalData.customMessage}
                    </div>
                  )}
                  Thank you for joining MentorNearby.<br/><br/>
                  Best wishes,<br/>
                  Team MentorNearby<br/>
                  Find. Learn. Grow.<br/>
                  https://mentornearby.com
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setApproveModalData({ ...approveModalData, isOpen: false })}
                className="admin-btn admin-btn-secondary text-xs"
                disabled={approveModalData.submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approveModalData.submitting}
                className="admin-btn bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {approveModalData.submitting ? 'Approving & Sending...' : '✓ Approve & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ✕ TUTOR UNAPPROVE / CORRECTION POPUP & EMAIL MODAL    */}
      {/* ============================================================ */}
      {unapproveModalData.isOpen && unapproveModalData.tutor && (
        <div className="admin-modal-overlay" onClick={() => !unapproveModalData.submitting && setUnapproveModalData({ ...unapproveModalData, isOpen: false })}>
          <div className="admin-modal-box max-w-2xl text-left" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  src={unapproveModalData.tutor?.profile?.profilePhoto?.url}
                  name={unapproveModalData.tutor?.name}
                  size="md"
                />
                <div>
                  <h3 className="text-lg font-black text-rose-700 flex items-center gap-2">
                    Action Required / Unapprove Tutor
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    <strong>{unapproveModalData.tutor?.name}</strong> • {unapproveModalData.tutor?.email || unapproveModalData.tutor?.profile?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !unapproveModalData.submitting && setUnapproveModalData({ ...unapproveModalData, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
                disabled={unapproveModalData.submitting}
              >
                ✕
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 mb-4">
              <strong>Notice:</strong> Cancelling approval will set this tutor's profile status to <em>Pending</em> and remove them from search listings and the homepage until requested corrections are completed.
            </div>

            {/* Reason Selector */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={unapproveModalData.reason}
                onChange={(e) => setUnapproveModalData({ ...unapproveModalData, reason: e.target.value })}
                className="admin-select w-full text-xs font-medium"
              >
                <option value="Required documents missing">Required documents missing</option>
                <option value="Uploaded documents are unclear or invalid">Uploaded documents are unclear or invalid</option>
                <option value="Qualification requires further verification">Qualification requires further verification</option>
                <option value="Profile information is incomplete">Profile information is incomplete</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Required Explanation Field */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Explanation for Teacher <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={unapproveModalData.explanation}
                onChange={(e) => setUnapproveModalData({ ...unapproveModalData, explanation: e.target.value })}
                rows={3}
                required
                className="admin-input w-full text-xs"
                placeholder="State clearly what information or document needs to be corrected or verified..."
              />
            </div>

            {/* Optional Correction Checklist */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correction Checklist (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {[
                  'Government Identity Proof (Aadhaar / Voter ID / Passport)',
                  'Address Proof / Current Location Verification',
                  'Educational Degree / Qualification Certificates',
                  'Clear Professional Profile Photograph',
                  'Detailed Teaching Bio & Experience Summary',
                  'Tuition Subject Selection & Accurate Fee Rates',
                ].map((item) => {
                  const checked = unapproveModalData.correctionChecklist.includes(item);
                  return (
                    <label key={item} className="flex items-center gap-2 cursor-pointer text-[11.5px] text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnapproveModalData({
                              ...unapproveModalData,
                              correctionChecklist: [...unapproveModalData.correctionChecklist, item],
                            });
                          } else {
                            setUnapproveModalData({
                              ...unapproveModalData,
                              correctionChecklist: unapproveModalData.correctionChecklist.filter((c) => c !== item),
                            });
                          }
                        }}
                        className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Editable Subject */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                value={unapproveModalData.subject}
                onChange={(e) => setUnapproveModalData({ ...unapproveModalData, subject: e.target.value })}
                className="admin-input w-full text-xs font-medium"
              />
            </div>

            {/* Live Email Preview Box */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Preview
              </label>
              <div className="bg-[#0f172a] text-slate-200 p-4 rounded-xl text-xs font-mono leading-relaxed max-h-40 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="text-amber-400 font-bold mb-1">Subject: {unapproveModalData.subject}</div>
                <div className="text-slate-300">
                  Hi {unapproveModalData.tutor?.name || 'Tutor'},<br/><br/>
                  Thank you for registering with MentorNearby.<br/><br/>
                  During our review, we found that some information needs to be corrected or verified before your profile can be approved.<br/><br/>
                  <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded my-1 text-rose-200">
                    <strong>Required corrections:</strong><br/>
                    • {unapproveModalData.reason}<br/>
                    {unapproveModalData.explanation && <span>Details: {unapproveModalData.explanation}<br/></span>}
                    {unapproveModalData.correctionChecklist.length > 0 && (
                      <span>Items to update:<br/>{unapproveModalData.correctionChecklist.map((c) => `  - ${c}`).join('\n')}<br/></span>
                    )}
                  </div>
                  Please log in to your MentorNearby account and update the requested information. Once the corrections are complete, follow the available resubmission process, or contact the MentorNearby team if you need assistance.<br/><br/>
                  We appreciate your cooperation.<br/><br/>
                  Best wishes,<br/>
                  Team MentorNearby<br/>
                  https://mentornearby.com
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setUnapproveModalData({ ...unapproveModalData, isOpen: false })}
                className="admin-btn admin-btn-secondary text-xs"
                disabled={unapproveModalData.submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnapprove}
                disabled={unapproveModalData.submitting || !unapproveModalData.explanation.trim()}
                className="admin-btn bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {unapproveModalData.submitting ? 'Updating & Sending...' : '✕ Confirm & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTutorsPage;
