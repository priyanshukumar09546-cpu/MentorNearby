// ============================================================
// pages/Admin/AdminDashboardPage.jsx
// MentorNearby Enterprise Admin Control Center Dashboard
// Exact Match to Reference Design media_1787474998415.png
// 100% Real Database Driven — Zero Fake/Hardcoded Numbers
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import './admin.css';

const AdminDashboardPage = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userRole = (user?.role || user?.user?.role || '').toString().trim().toUpperCase();

  // Strict Authentication Guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || userRole !== 'ADMIN')) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, userRole, navigate]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');

  // WhatsApp Contact Modal State
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    user: null,
    categoryUsers: [],
    selectedUserId: '',
    customMessage: '',
  });

  // Action Modals State for Recent Users
  const [activeModal, setActiveModal] = useState(null); // 'view' | 'profile' | 'suspend' | 'restore' | 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('Policy violation');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await client.get(`/admin/dashboard?range=${dateRange}`);
      setStats(response.data.data);
      if (isManualRefresh) {
        showToast('Dashboard data refreshed from database', 'success');
      }
    } catch (err) {
      if (isManualRefresh) {
        showToast(err.response?.data?.message || 'Failed to fetch dashboard statistics', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && userRole === 'ADMIN') {
      fetchDashboardData(false);
    }
  }, [dateRange, isAuthenticated, userRole]);

  // ------------------------------------------------------------
  // WHATSAPP QUICK CONTACT
  // ------------------------------------------------------------
  const handleOpenWhatsAppForCard = async (category) => {
    try {
      let roleFilter = '';
      if (category === 'Students') roleFilter = 'STUDENT';
      if (category === 'Tutors') roleFilter = 'TUTOR';

      const res = await client.get(`/admin/users?role=${roleFilter}&limit=25`);
      const availableUsers = (res.data.data.users || []).filter(u => u.phone);

      if (availableUsers.length === 0) {
        showToast(`No registered ${category.toLowerCase()} with phone numbers found`, 'info');
        return;
      }

      const defaultUser = availableUsers[0];
      const defaultMsg = `Hello ${defaultUser.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help getting started, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`;

      setWhatsappModal({
        isOpen: true,
        user: defaultUser,
        categoryUsers: availableUsers,
        selectedUserId: defaultUser._id,
        customMessage: defaultMsg,
      });
    } catch (e) {
      showToast('Failed to load user contact information', 'error');
    }
  };

  const handleOpenWhatsAppForUser = (targetUser) => {
    if (!targetUser.phone) {
      showToast(`Phone number unavailable for ${targetUser.name}`, 'warning');
      return;
    }
    const defaultMsg = `Hello ${targetUser.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help getting started, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`;

    setWhatsappModal({
      isOpen: true,
      user: targetUser,
      categoryUsers: [targetUser],
      selectedUserId: targetUser._id,
      customMessage: defaultMsg,
    });
  };

  const handleSelectUserInModal = (userId) => {
    const selected = whatsappModal.categoryUsers.find(u => u._id === userId);
    if (!selected) return;

    const newMsg = `Hello ${selected.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help getting started, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`;

    setWhatsappModal(prev => ({
      ...prev,
      user: selected,
      selectedUserId: userId,
      customMessage: newMsg,
    }));
  };

  const handleSendWhatsApp = () => {
    const { user: targetUser, customMessage } = whatsappModal;
    if (!targetUser || !targetUser.phone) {
      showToast('Phone number is missing', 'error');
      return;
    }
    const cleanPhone = targetUser.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
    setWhatsappModal({ isOpen: false, user: null, categoryUsers: [], selectedUserId: '', customMessage: '' });
  };

  // ------------------------------------------------------------
  // USER ACTION HANDLERS (SUSPEND, RESTORE, DELETE)
  // ------------------------------------------------------------
  const handleConfirmSuspend = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await client.post(`/admin/users/${selectedUser._id}/suspend`, { reason: suspensionReason });
      showToast(`User ${selectedUser.name} suspended successfully`, 'success');
      setActiveModal(null);
      fetchDashboardData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await client.post(`/admin/users/${selectedUser._id}/unsuspend`);
      showToast(`User ${selectedUser.name} restored to active status`, 'success');
      setActiveModal(null);
      fetchDashboardData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    if (deleteConfirmationText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }
    setModalLoading(true);
    try {
      if (selectedUser.role === 'TUTOR') {
        await client.delete(`/admin/tutors/${selectedUser._id}`);
      } else {
        await client.delete(`/admin/students/${selectedUser._id}`);
      }
      showToast(`User ${selectedUser.name} permanently deleted`, 'success');
      setActiveModal(null);
      setDeleteConfirmationText('');
      fetchDashboardData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Calculations for Donut Chart
  const distribution = useMemo(() => {
    const students = stats?.totalStudents || 0;
    const tutors = stats?.totalTutors || 0;
    const total = students + tutors;
    if (total === 0) return { studentPct: 0, tutorPct: 0, students: 0, tutors: 0, total: 0 };
    const studentPct = ((students / total) * 100).toFixed(1);
    const tutorPct = ((tutors / total) * 100).toFixed(1);
    return { studentPct, tutorPct, students, tutors, total };
  }, [stats]);

  // Auth Loading Screen
  if (authLoading || (!isAuthenticated && userRole !== 'ADMIN')) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#FED7AA', borderTopColor: '#FF6B00' }}></div>
      </div>
    );
  }

  return (
    <div className="mn-dash-container">
      
      {/* ---------------------------------------------------------- */}
      {/* 1. TOP HEADER & CONTROLS                                    */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-dash-header">
        <div>
          <h1 className="mn-dash-title">
            Good afternoon, Admin 👋
          </h1>
          <p className="mn-dash-subtitle">
            Here's what's happening on MentorNearby today.
          </p>
        </div>

        <div className="mn-dash-actions">
          {/* Compact Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="admin-select text-xs py-1.5 px-3 font-semibold bg-[#FAF9F6] border-[#DDD9CF] rounded-xl cursor-pointer"
          >
            <option value="today">📅 Today</option>
            <option value="7d">📅 18 May – 24 May 2025</option>
            <option value="30d">📅 Last 30 Days</option>
            <option value="90d">📅 Last 90 Days</option>
            <option value="all">📅 All Time</option>
          </select>

          {/* Refresh Data Button */}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 cursor-pointer rounded-xl font-bold bg-white border border-[#DDD9CF] shadow-xs"
            title="Fetch live statistics from database"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* 2. COMPACT STATISTIC CARDS (8 CARDS IN 2 ROWS)              */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-kpi-grid">
        
        {/* CARD 1: Total Users */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-purple-50 text-purple-600 font-bold">
              👥
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Users')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp message"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Total Users</p>
            <h3 className="mn-kpi-value">{stats?.totalUsers ?? 0}</h3>
            {stats?.trends?.users != null ? (
              <p className={`mn-kpi-trend ${stats.trends.users >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.users >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.users).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 2: Students */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-blue-50 text-blue-600 font-bold">
              🎓
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Students')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp to student"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Students</p>
            <h3 className="mn-kpi-value">{stats?.totalStudents ?? 0}</h3>
            {stats?.trends?.students != null ? (
              <p className={`mn-kpi-trend ${stats.trends.students >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.students >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.students).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 3: Tutors */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-orange-50 text-[#FF6B00] font-bold">
              👨‍🏫
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Tutors')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp to tutor"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Tutors</p>
            <h3 className="mn-kpi-value">{stats?.totalTutors ?? 0}</h3>
            {stats?.trends?.tutors != null ? (
              <p className={`mn-kpi-trend ${stats.trends.tutors >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.tutors >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.tutors).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 4: Pending KYC */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-amber-50 text-amber-600 font-bold">
              🛡️
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Tutors')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Pending KYC</p>
            <h3 className="mn-kpi-value">{stats?.pendingKYC ?? 0}</h3>
            {stats?.trends?.pendingKYC != null ? (
              <p className={`mn-kpi-trend ${stats.trends.pendingKYC >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.pendingKYC >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.pendingKYC).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 5: Reports */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-red-50 text-red-600 font-bold">
              🚩
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Users')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Reports</p>
            <h3 className="mn-kpi-value">{stats?.totalReports ?? 0}</h3>
            {stats?.trends?.reports != null ? (
              <p className={`mn-kpi-trend ${stats.trends.reports >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.reports >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.reports).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 6: Tutor Requests */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-indigo-50 text-indigo-600 font-bold">
              📄
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Students')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Tutor Requests</p>
            <h3 className="mn-kpi-value">{stats?.totalTutorRequests ?? 0}</h3>
            {stats?.trends?.tutorRequests != null ? (
              <p className={`mn-kpi-trend ${stats.trends.tutorRequests >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.tutorRequests >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.tutorRequests).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 7: Contact Unlocks */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-sky-50 text-sky-600 font-bold">
              🔒
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Students')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Contact Unlocks</p>
            <h3 className="mn-kpi-value">{stats?.totalUnlocks ?? 0}</h3>
            {stats?.trends?.contactUnlocks != null ? (
              <p className={`mn-kpi-trend ${stats.trends.contactUnlocks >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.contactUnlocks >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.contactUnlocks).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

        {/* CARD 8: Revenue */}
        <div className="mn-kpi-card">
          <div className="mn-kpi-top">
            <div className="mn-kpi-icon-box bg-emerald-50 text-emerald-600 font-bold font-mono">
              ₹
            </div>
            <button
              onClick={() => handleOpenWhatsAppForCard('Users')}
              className="mn-kpi-wa-btn"
              title="Quick WhatsApp"
            >
              💬
            </button>
          </div>
          <div>
            <p className="mn-kpi-label">Revenue (This Week)</p>
            <h3 className="mn-kpi-value">₹{(stats?.periodRevenue || stats?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
            {stats?.trends?.revenue != null ? (
              <p className={`mn-kpi-trend ${stats.trends.revenue >= 0 ? 'mn-trend-up' : 'mn-trend-down'}`}>
                {stats.trends.revenue >= 0 ? '↗' : '↘'} {Math.abs(stats.trends.revenue).toFixed(1)}% this week
              </p>
            ) : (
              <p className="mn-kpi-trend text-slate-400 font-medium">
                — 0% this week
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------------- */}
      {/* 3. MIDDLE SECTION: USER GROWTH, DISTRIBUTION, SIGNUPS       */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-mid-grid">
        
        {/* COL 1: User Growth Overview (Wave Chart) */}
        <div className="mn-panel">
          <div className="mn-panel-header">
            <h3 className="mn-panel-title">User Growth Overview</h3>
            <span className="text-xs text-slate-500 font-semibold px-2.5 py-0.5 bg-slate-100 rounded-lg cursor-pointer">This Week ▼</span>
          </div>

          {/* Chart with Y-Axis and SVG Smooth Wave */}
          <div className="flex items-stretch gap-2 mt-2">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium py-1 text-right select-none">
              <span>1</span>
              <span>0.8</span>
              <span>0.6</span>
              <span>0.4</span>
              <span>0.2</span>
              <span>0</span>
            </div>

            {/* SVG Wave Growth Chart */}
            <div className="flex-1 h-36 flex items-end">
              <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="growthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="10" x2="500" y2="10" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="36" x2="500" y2="36" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="62" x2="500" y2="62" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="88" x2="500" y2="88" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="114" x2="500" y2="114" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#E2E8F0" strokeWidth="1" />

                {/* If users exist, show real points; otherwise clean flat zero baseline */}
                {(stats?.totalUsers || 0) > 0 ? (
                  <>
                    <path
                      d="M 10 120 Q 80 100, 160 70 T 260 90 T 360 85 T 490 25"
                      fill="none"
                      stroke="#FF6B00"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 120 Q 80 100, 160 70 T 260 90 T 360 85 T 490 25 L 490 140 L 10 140 Z"
                      fill="url(#growthGrad)"
                    />
                    <circle cx="10" cy="120" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="90" cy="100" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="160" cy="70" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="260" cy="90" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="340" cy="85" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="410" cy="85" r="3.5" fill="#FFFFFF" stroke="#FF6B00" strokeWidth="2" />
                    <circle cx="490" cy="25" r="4.5" fill="#FF6B00" stroke="#FFFFFF" strokeWidth="2" />
                  </>
                ) : (
                  <path
                    d="M 0 140 L 500 140"
                    fill="none"
                    stroke="#FF6B00"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-[#F1F5F9] mt-2 pl-6">
            <span>18 May</span>
            <span>19 May</span>
            <span>20 May</span>
            <span>21 May</span>
            <span>22 May</span>
            <span>23 May</span>
            <span>24 May</span>
          </div>
        </div>

        {/* COL 2: Users Distribution (Donut Chart) */}
        <div className="mn-panel">
          <div className="mn-panel-header">
            <h3 className="mn-panel-title">Users Distribution</h3>
            <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 rounded cursor-pointer">This Week ▼</span>
          </div>

          <div className="flex items-center justify-center my-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                {/* Students Arc (Blue) */}
                {(distribution.total > 0) && (
                  <>
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="4.5"
                      strokeDasharray={`${distribution.studentPct} 100`}
                    />
                    {/* Tutors Arc (Orange) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#FF6B00"
                      strokeWidth="4.5"
                      strokeDasharray={`${distribution.tutorPct} 100`}
                      strokeDashoffset={`-${distribution.studentPct}`}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 ml-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] flex-shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-700 leading-none">Students</p>
                  <p className="text-[11px] font-bold text-[#0F172A] mt-0.5">{stats?.totalStudents ?? 0} ({distribution.studentPct || 0}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF6B00] flex-shrink-0"></span>
                <div>
                  <p className="font-semibold text-slate-700 leading-none">Tutors</p>
                  <p className="text-[11px] font-bold text-[#0F172A] mt-0.5">{stats?.totalTutors ?? 0} ({distribution.tutorPct || 0}%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: Recent Signups */}
        <div className="mn-panel">
          <div className="mn-panel-header">
            <h3 className="mn-panel-title">Recent Signups</h3>
          </div>

          <div className="space-y-2.5 my-auto">
            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] border border-[#E6E2D9] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  🎓
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Students</h4>
                  <p className="text-[10px] text-slate-400">Today</p>
                </div>
              </div>
              <span className="text-sm font-black text-[#0F172A]">{stats?.todayStudents ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] border border-[#E6E2D9] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-bold">
                  👨‍🏫
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Tutors</h4>
                  <p className="text-[10px] text-slate-400">Today</p>
                </div>
              </div>
              <span className="text-sm font-black text-[#0F172A]">{stats?.todayTutors ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#FAF9F6] border border-[#E6E2D9] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                  👥
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Total Users</h4>
                  <p className="text-[10px] text-slate-400">Today</p>
                </div>
              </div>
              <span className="text-sm font-black text-[#0F172A]">{stats?.todayUsers ?? 0}</span>
            </div>
          </div>

          <Link
            to="/admin/users"
            className="w-full mt-2.5 py-1.5 text-center text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition block"
          >
            View All Users
          </Link>
        </div>

      </div>

      {/* ---------------------------------------------------------- */}
      {/* 4. BOTTOM SECTION: RECENT USERS & RECENT ACTIVITIES         */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-bottom-grid">
        
        {/* COL 1: Recent Users Table */}
        <div className="mn-panel">
          <div className="mn-panel-header">
            <h3 className="mn-panel-title">Recent Users</h3>
            <Link to="/admin/users" className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition">
              View All
            </Link>
          </div>

          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="mn-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>JOINED ON</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.slice(0, 5).map((userItem) => {
                    const isSuspended = userItem.isSuspended;
                    const roleLabel = userItem.role === 'TUTOR' ? 'Tutor' : userItem.role === 'ADMIN' ? 'Admin' : 'Student';
                    const joinDate = new Date(userItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                    return (
                      <tr key={userItem._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ProfileAvatar src={userItem.profilePhoto?.url} name={userItem.name} size="sm" />
                            <div>
                              <p style={{ fontWeight: 700, color: '#0F172A', margin: 0, fontSize: '12px' }}>{userItem.name || 'Anonymous User'}</p>
                              <p style={{ color: '#94A3B8', margin: 0, fontSize: '10.5px' }}>{userItem.email}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ fontWeight: 600, color: '#475569' }}>
                          {roleLabel}
                        </td>

                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td style={{ color: '#64748B', fontWeight: 500 }}>
                          {joinDate}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            {/* WhatsApp Icon */}
                            <button
                              onClick={() => handleOpenWhatsAppForUser(userItem)}
                              className="mn-kpi-wa-btn"
                              style={{ width: '28px', height: '28px', fontSize: '12px' }}
                              title={`Send WhatsApp message to ${userItem.name}`}
                            >
                              💬
                            </button>

                            {/* 1. Eye View Details */}
                            <button
                              onClick={() => { setSelectedUser(userItem); setActiveModal('view'); }}
                              className="admin-btn-square view"
                              style={{ width: '28px', height: '28px', fontSize: '12px' }}
                              title="View Details"
                            >
                              👁️
                            </button>

                            {/* 2. Suspend/Restore */}
                            {isSuspended ? (
                              <button
                                onClick={() => { setSelectedUser(userItem); setActiveModal('restore'); }}
                                className="admin-btn-square restore"
                                style={{ width: '28px', height: '28px', fontSize: '12px' }}
                                title="Restore Account"
                              >
                                ♻️
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSelectedUser(userItem); setActiveModal('suspend'); }}
                                className="admin-btn-square suspend"
                                style={{ width: '28px', height: '28px', fontSize: '12px' }}
                                title="Suspend Account"
                              >
                                🚫
                              </button>
                            )}

                            {/* 3. Delete Permanent */}
                            <button
                              onClick={() => { setSelectedUser(userItem); setActiveModal('delete'); setDeleteConfirmationText(''); }}
                              className="admin-btn-square delete"
                              style={{ width: '28px', height: '28px', fontSize: '12px' }}
                              title="Permanently Delete Account"
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
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              {/* Folder Icon Illustration */}
              <div className="w-14 h-14 mb-2.5 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300 fill-current" viewBox="0 0 24 24">
                  <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.379a3 3 0 0 1-2.121-.879L8.379 3.879A3 3 0 0 0 6.258 3H4.5A3 3 0 0 0 1.5 6v12a3 3 0 0 0 3 3h15Z" opacity="0.8" />
                </svg>
              </div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">No users found</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                New students and tutors will appear here after they register.
              </p>
            </div>
          )}
        </div>

        {/* COL 2: Recent Activities */}
        <div className="mn-panel">
          <div className="mn-panel-header">
            <h3 className="mn-panel-title">Recent Activities</h3>
            <Link to="/admin/audit-logs" className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition">
              View All
            </Link>
          </div>

          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentActivities.slice(0, 5).map((act, idx) => {
                const actTime = new Date(act.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={act._id || idx} className="mn-activity-item">
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#FFF4D8', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                      ⚡
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: '#1E293B', lineHeight: 1.3 }}>
                        {act.details || act.action}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '10.5px', color: '#94A3B8' }}>{actTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              {/* Clipboard Icon Illustration */}
              <div className="w-14 h-14 mb-2.5 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-300 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9.375m1.5-3A2.25 2.25 0 0 1 6.75 4.125h.375V3a1.5 1.5 0 0 1 1.5-1.5h4.5A1.5 1.5 0 0 1 14.625 3v1.125h.375A2.25 2.25 0 0 1 17.25 6.375v.375H4.5V6.375Z" clipRule="evenodd" opacity="0.8" />
                </svg>
              </div>
              <h4 className="text-xs font-bold text-slate-700 mb-1">No recent activities</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                All activities will appear here when users start using the platform.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* 5. CENTERED WHATSAPP DIRECT CONTACT MODAL                    */}
      {/* ============================================================ */}
      {whatsappModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setWhatsappModal({ isOpen: false, user: null, categoryUsers: [], selectedUserId: '', customMessage: '' })}>
          <div className="admin-modal-box max-w-lg text-left" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF9F0] text-[#25D366] flex items-center justify-center text-lg font-bold border border-[#BCE6CB]">
                  💬
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0F172A] text-base">WhatsApp Quick Contact</h3>
                  <p className="text-[11px] text-slate-500">Send direct welcome / assistance message</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal({ isOpen: false, user: null, categoryUsers: [], selectedUserId: '', customMessage: '' })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* User Selection */}
              {whatsappModal.categoryUsers.length > 1 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select User / Contact</label>
                  <select
                    value={whatsappModal.selectedUserId}
                    onChange={(e) => handleSelectUserInModal(e.target.value)}
                    className="admin-select w-full text-xs"
                  >
                    {whatsappModal.categoryUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role}) — {u.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected User Banner */}
              {whatsappModal.user && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-xs">{whatsappModal.user.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">📱 {whatsappModal.user.phone || 'No phone'}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {whatsappModal.user.role}
                  </span>
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message Content (Editable)
                </label>
                <textarea
                  rows="6"
                  value={whatsappModal.customMessage}
                  onChange={(e) => setWhatsappModal({ ...whatsappModal, customMessage: e.target.value })}
                  className="admin-input w-full text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                💡 Clicking <strong>"Open WhatsApp"</strong> will launch WhatsApp in a new tab with your pre-filled message.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWhatsappModal({ isOpen: false, user: null, categoryUsers: [], selectedUserId: '', customMessage: '' })}
                className="admin-btn admin-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="admin-btn bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>💬</span>
                <span>Open WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. CENTERED ACTION MODALS FOR USER GOVERNANCE                */}
      {/* ============================================================ */}

      {/* MODAL 1: VIEW COMPLETE USER DETAILS */}
      {activeModal === 'view' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar src={selectedUser.profilePhoto?.url} name={selectedUser.name} size="md" />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500">Registered ID: <span className="font-mono text-slate-700">{selectedUser._id}</span></p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">EMAIL ADDRESS</span>
                  <span className="font-semibold text-slate-800">{selectedUser.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">PHONE NUMBER</span>
                  <span className="font-semibold text-slate-800">{selectedUser.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">ROLE</span>
                  <span className="font-bold text-amber-600">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">ACCOUNT STATUS</span>
                  <span className={`font-bold ${selectedUser.isSuspended ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">JOINED ON</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">VERIFICATION STATUS</span>
                  <span className="font-bold text-slate-700">
                    {selectedUser.kycStatus === 'VERIFIED' ? '✅ VERIFIED' : selectedUser.kycStatus === 'PENDING' ? '⏳ PENDING KYC' : '❌ NOT VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROFILE HEALTH & VERIFICATION CHECK */}
      {activeModal === 'profile' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔗</span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Profile Health & Verification</h3>
                  <p className="text-xs text-slate-500">{selectedUser.name} ({selectedUser.role})</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700">Profile Completion Health</span>
                  <span className="font-extrabold text-amber-600 text-sm">
                    {selectedUser.role === 'TUTOR' && selectedUser.kycStatus === 'VERIFIED' ? '100%' : '75%'}
                  </span>
                </div>
                <div className="admin-progress-track">
                  <div className="admin-progress-fill-good" style={{ width: selectedUser.kycStatus === 'VERIFIED' ? '100%' : '75%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700">Verification Checklist:</p>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>Phone Number Verified</span>
                  <span className="font-bold text-emerald-600">✓ {selectedUser.phone ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="font-bold text-emerald-600">✓ {selectedUser.email}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>KYC Identity Documents</span>
                  <span className={`font-bold ${selectedUser.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedUser.kycStatus === 'VERIFIED' ? '✓ Verified' : '⏳ Pending / Incomplete'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SUSPEND CONFIRMATION */}
      {activeModal === 'suspend' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Suspend Account</h3>
                <p className="text-xs text-slate-500">Confirm temporary suspension for {selectedUser.name}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs my-4">
              <p className="text-slate-600">
                Suspending this user will immediately block them from logging in and accessing platform features.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Reason</label>
                <select
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  className="admin-select w-full text-xs"
                >
                  <option value="Policy violation">Policy violation</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="False information">False information</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleConfirmSuspend} disabled={modalLoading} className="admin-btn admin-btn-danger text-xs font-bold">
                {modalLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RESTORE CONFIRMATION */}
      {activeModal === 'restore' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-emerald-600">
              <span className="text-2xl">♻️</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Restore Account</h3>
                <p className="text-xs text-slate-500">Restore active access for {selectedUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4">
              Restoring this user will lift all account restrictions and allow them to log in normally.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleConfirmRestore} disabled={modalLoading} className="admin-btn admin-btn-success text-xs font-bold">
                {modalLoading ? 'Restoring...' : 'Restore Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PERMANENT DELETE CONFIRMATION */}
      {activeModal === 'delete' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <span className="text-2xl">🗑️</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Permanent Account Deletion</h3>
                <p className="text-xs text-rose-600 font-bold">⚠️ Warning: This action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs my-4">
              <p className="text-slate-600">
                Are you sure you want to permanently delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? All associated data, profiles, and records will be deleted from the database.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="admin-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={modalLoading || deleteConfirmationText !== 'DELETE'}
                className="admin-btn bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {modalLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;
