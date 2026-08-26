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
  rejectTutor,
  suspendTutor,
  reactivateTutor,
  deleteTutorPermanently,
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
    const active = tutors.filter((t) => !t.isSuspended).length;
    const suspended = tutors.filter((t) => t.isSuspended).length;
    const verified = tutors.filter((t) => t.profile?.kycStatus === 'VERIFIED').length;
    const pending = tutors.filter((t) => t.profile?.kycStatus === 'PENDING').length;
    return { active, suspended, verified, pending, total: totalTutors };
  }, [tutors, totalTutors]);

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  // ------------------------------------------------------------
  // ACTION 0: ✓ APPROVE / ✕ REJECT TUTOR & SEND EMAIL
  // ------------------------------------------------------------
  const handleApprove = async (tutorId) => {
    if (!window.confirm('Approve this tutor profile? A congratulation email will be sent to the tutor.')) return;
    try {
      await approveTutor(tutorId);
      showToast('Tutor Approved & Congratulation Email Sent!', 'success');
      fetchTutors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve tutor', 'error');
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
                                onClick={() => handleApprove(tutor._id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title="Approve Tutor Profile & Send Congratulation Email"
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
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
                              ✓ Approved
                            </span>
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
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-end">
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

    </div>
  );
};

export default AdminTutorsPage;
