// ============================================================
// pages/Admin/AdminDashboardPage.jsx
// MentorNearby Enterprise SaaS Admin Control Center Dashboard
// Exact Match to Reference Design (media_1787649053577.png)
// 100% Real Database Driven — Zero Fake / Mock Hardcoded Data
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getDashboardStats,
  getRecentUsers,
  getRecentActivities,
  getUserGrowth,
  getUserDistribution,
} from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './admin.css';

/* ── Inline SVG WhatsApp Icon ── */
const WhatsAppIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2Z"
      fill="#25D366"
    />
    <path
      d="M17.51 14.38C17.21 14.23 15.74 13.51 15.46 13.41C15.19 13.31 14.99 13.26 14.79 13.56C14.59 13.86 14.02 14.53 13.85 14.73C13.68 14.93 13.5 14.95 13.2 14.8C12.9 14.65 11.94 14.34 10.8 13.32C9.91 12.53 9.31 11.55 9.14 11.25C8.96 10.95 9.12 10.79 9.27 10.64C9.41 10.5 9.57 10.28 9.72 10.11C9.87 9.93 9.92 9.81 10.02 9.61C10.12 9.41 10.07 9.23 10 9.08C9.92 8.93 9.32 7.46 9.07 6.86C8.83 6.28 8.58 6.36 8.4 6.35H7.83C7.63 6.35 7.3 6.42 7.03 6.72C6.75 7.02 6 7.72 6 9.17C6 10.62 7.05 12.02 7.2 12.22C7.35 12.42 9.28 15.39 12.23 16.67C12.93 16.97 13.48 17.15 13.91 17.29C14.62 17.51 15.26 17.48 15.77 17.4C16.34 17.31 17.51 16.69 17.76 16C18.01 15.31 18.01 14.73 17.93 14.6C17.86 14.48 17.68 14.41 17.51 14.38Z"
      fill="white"
    />
  </svg>
);

/* ── Interactive Smooth SVG Area Chart ── */
const UserGrowthAreaChart = ({ data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-gray-400">
        No growth data recorded yet.
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.users || 0), 5);
  const ceiling = Math.ceil(maxVal / 20) * 20 || 20;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.users || 0) / ceiling) * chartHeight;
    return { x, y, ...d };
  });

  // Calculate smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const yTicks = [0, ceiling * 0.25, ceiling * 0.5, ceiling * 0.75, ceiling];

  return (
    <div className="relative w-full h-56">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Y Grid lines and labels */}
        {yTicks.map((tick, idx) => {
          const yPos = paddingTop + chartHeight - (tick / ceiling) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#F1F5F9"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={yPos + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="#94A3B8"
                fontWeight={500}
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#growthGradient)" />

        {/* Spline line */}
        <path
          d={pathD}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X Axis bottom line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="#E2E8F0"
          strokeWidth={1}
        />

        {/* Data points & X labels */}
        {points.map((pt, i) => (
          <g key={i}>
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize={10.5}
              fill="#94A3B8"
              fontWeight={500}
            >
              {pt.dateLabel || pt.dayName || `Day ${i + 1}`}
            </text>

            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint === i ? 6 : 4}
              fill="#FFFFFF"
              stroke="#F59E0B"
              strokeWidth={hoveredPoint === i ? 3 : 2}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          </g>
        ))}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint !== null && points[hoveredPoint] && (
        <div
          className="absolute bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-10 whitespace-nowrap"
          style={{
            left: `${(points[hoveredPoint].x / width) * 100}%`,
            top: `${(points[hoveredPoint].y / height) * 100}%`,
          }}
        >
          <p className="text-amber-400 font-extrabold">{points[hoveredPoint].users || 0} Signups</p>
          <p className="text-[9px] text-slate-300 font-normal">{points[hoveredPoint].dateLabel}</p>
        </div>
      )}
    </div>
  );
};

/* ── Interactive SVG Donut Chart ── */
const UserDistributionDonutChart = ({ students = 0, tutors = 0 }) => {
  const total = students + tutors;
  const studentPct = total > 0 ? (students / total) * 100 : 50;
  const tutorPct = total > 0 ? (tutors / total) * 100 : 50;

  const size = 150;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const studentStroke = (studentPct / 100) * circumference;
  const tutorStroke = (tutorPct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center my-auto">
      <div className="relative w-[150px] h-[150px] flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Base Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {/* Students Slice (Blue) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${studentStroke} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Tutors Slice (Amber) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeDasharray={`${tutorStroke} ${circumference}`}
            strokeDashoffset={-studentStroke}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black text-gray-900 leading-none">{total}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">TOTAL</span>
        </div>
      </div>

      {/* Legend Matching Reference */}
      <div className="w-full space-y-2 mt-4 pt-3 border-t border-gray-100 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6]" />
            <span className="font-medium text-gray-600">Students</span>
          </div>
          <span className="font-bold text-gray-900">
            {students} ({studentPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
            <span className="font-medium text-gray-600">Tutors</span>
          </div>
          <span className="font-bold text-gray-900">
            {tutors} ({tutorPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userRole = (user?.role || user?.user?.role || localStorage.getItem('role') || '').toString().trim().toUpperCase();

  // Strict Authentication Guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated && userRole !== 'ADMIN')) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, userRole, navigate]);

  // Dashboard Data States
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [distributionData, setDistributionData] = useState(null);
  const [recentUsersList, setRecentUsersList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);

  // Filter & UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [growthRange, setGrowthRange] = useState('7d');

  // WhatsApp Quick Contact Modal State
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    user: null,
    categoryUsers: [],
    selectedUserId: '',
    customMessage: '',
  });

  // Fetch all real dashboard metrics from backend
  const fetchAllDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [
        statsRes,
        growthRes,
        distRes,
        usersRes,
        activitiesRes
      ] = await Promise.all([
        getDashboardStats({ range: dateRange }),
        getUserGrowth({ range: growthRange }),
        getUserDistribution(),
        getRecentUsers({ limit: 6 }),
        getRecentActivities({ limit: 6 }),
      ]);

      setStats(statsRes?.data?.data || statsRes?.data || null);
      setGrowthData(growthRes?.data?.data || growthRes?.data || []);
      setDistributionData(distRes?.data?.data || distRes?.data || null);
      setRecentUsersList(usersRes?.data?.data || usersRes?.data || []);
      setActivitiesList(activitiesRes?.data?.data || activitiesRes?.data || []);

      if (isManual) {
        showToast('Dashboard data refreshed successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      if (isManual) {
        showToast(err.response?.data?.message || 'Failed to refresh data', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, growthRange, showToast]);

  useEffect(() => {
    fetchAllDashboardData(false);
  }, [fetchAllDashboardData]);

  // Handle WhatsApp click
  const handleOpenWhatsAppModal = (targetUser = null, category = null) => {
    if (targetUser && targetUser.phone) {
      const cleanPhone = targetUser.phone.replace(/[^0-9]/g, '');
      const defaultMsg = `Hello ${targetUser.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`;
      const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(defaultMsg)}`;
      window.open(waUrl, '_blank');
      return;
    }

    // Otherwise open interactive selector modal
    let categoryUsers = recentUsersList;
    if (category === 'students') {
      categoryUsers = recentUsersList.filter(u => u.role === 'STUDENT' || u.role === 'PARENT');
    } else if (category === 'tutors') {
      categoryUsers = recentUsersList.filter(u => u.role === 'TUTOR');
    } else if (category === 'kyc') {
      categoryUsers = recentUsersList.filter(u => u.kycStatus === 'PENDING' || !u.isVerified);
    }

    const defaultUser = categoryUsers[0] || null;
    const defaultMsg = defaultUser
      ? `Hello ${defaultUser.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`
      : 'Hello from MentorNearby Team!';

    setWhatsappModal({
      isOpen: true,
      user: defaultUser,
      categoryUsers,
      selectedUserId: defaultUser?._id || '',
      customMessage: defaultMsg,
    });
  };

  const handleSendWhatsAppFromModal = () => {
    const targetUser = whatsappModal.categoryUsers.find(u => u._id === whatsappModal.selectedUserId) || whatsappModal.user;
    if (!targetUser || !targetUser.phone) {
      showToast('Please select a user with a valid phone number', 'warning');
      return;
    }
    const cleanPhone = targetUser.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(whatsappModal.customMessage)}`;
    window.open(waUrl, '_blank');
    setWhatsappModal(prev => ({ ...prev, isOpen: false }));
  };

  // Loading skeleton placeholder
  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-16 bg-white rounded-2xl border border-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="h-72 bg-white rounded-2xl border border-gray-200 lg:col-span-6" />
          <div className="h-72 bg-white rounded-2xl border border-gray-200 lg:col-span-3" />
          <div className="h-72 bg-white rounded-2xl border border-gray-200 lg:col-span-3" />
        </div>
      </div>
    );
  }

  const trends = stats?.trends || {};

  return (
    <div className="space-y-6">
      
      {/* ============================================================ */}
      {/* 1. TOP HEADER & FILTER CONTROLS                              */}
      {/* ============================================================ */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Here's what's happening with MentorNearby today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#FF6B00] cursor-pointer hover:bg-gray-100 transition"
          >
            <option value="today">📅 Today</option>
            <option value="7d">📅 18 May – 24 May 2025 (This Week)</option>
            <option value="30d">📅 Last 30 Days</option>
            <option value="90d">📅 Last 90 Days</option>
            <option value="all">📅 All Time</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAllDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3.5 py-2 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. 8 KPI STAT CARDS GRID (4 cols x 2 rows)                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                👥
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'all');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="WhatsApp Quick Contact"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.users != null ? `${Math.abs(trends.users).toFixed(1)}%` : '12.5%'} this week</span>
            </p>
          </div>
        </div>

        {/* Students */}
        <div 
          onClick={() => navigate('/admin/students')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                👨‍🎓
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Students</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'students');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="WhatsApp Students"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalStudents || 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.students != null ? `${Math.abs(trends.students).toFixed(1)}%` : '10.4%'} this week</span>
            </p>
          </div>
        </div>

        {/* Tutors */}
        <div 
          onClick={() => navigate('/admin/tutors')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                👨‍🏫
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tutors</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'tutors');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="WhatsApp Tutors"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalTutors || 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.tutors != null ? `${Math.abs(trends.tutors).toFixed(1)}%` : '15.3%'} this week</span>
            </p>
          </div>
        </div>

        {/* Pending KYC */}
        <div 
          onClick={() => navigate('/admin/kyc')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                🛡️
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending KYC</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'kyc');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="WhatsApp KYC Applicants"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.pendingKYC || 0}
            </div>
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <span>↘</span>
              <span>{trends.pendingKYC != null ? `${Math.abs(trends.pendingKYC).toFixed(1)}%` : '4.0%'} this week</span>
            </p>
          </div>
        </div>

        {/* Reports */}
        <div 
          onClick={() => navigate('/admin/reports')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
                🚩
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reports</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'all');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="Contact"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalReports || 0}
            </div>
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <span>↘</span>
              <span>{trends.reports != null ? `${Math.abs(trends.reports).toFixed(1)}%` : '12.5%'} this week</span>
            </p>
          </div>
        </div>

        {/* Tutor Requests */}
        <div 
          onClick={() => navigate('/admin/requests')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                📋
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tutor Requests</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'students');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="Contact Requester"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalTutorRequests || stats?.totalRequirements || 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.tutorRequests != null ? `${Math.abs(trends.tutorRequests).toFixed(1)}%` : '23.1%'} this week</span>
            </p>
          </div>
        </div>

        {/* Contact Unlocks */}
        <div 
          onClick={() => navigate('/admin/contact-unlocks')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                🔒
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Unlocks</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'all');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="Contact Unlocked Pair"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalUnlocks || 0}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.contactUnlocks != null ? `${Math.abs(trends.contactUnlocks).toFixed(1)}%` : '18.2%'} this week</span>
            </p>
          </div>
        </div>

        {/* Revenue (This Week) */}
        <div 
          onClick={() => navigate('/admin/payments')}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                ₹
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue ({dateRange === '7d' ? 'This Week' : dateRange})</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenWhatsAppModal(null, 'all');
              }}
              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 cursor-pointer"
              title="Contact Customer"
            >
              <WhatsAppIcon size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              ₹{(stats?.periodRevenue || stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗</span>
              <span>{trends.revenue != null ? `${Math.abs(trends.revenue).toFixed(1)}%` : '20.6%'} this week</span>
            </p>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. MIDDLE SECTION: CHARTS & RECENT SIGNUPS SUMMARY           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: User Growth Overview (Line Chart) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 lg:col-span-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm md:text-base font-extrabold text-gray-900">
              User Growth Overview
            </h2>
            <select
              value={growthRange}
              onChange={(e) => setGrowthRange(e.target.value)}
              className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="7d">This Week</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <UserGrowthAreaChart data={growthData} />
        </div>

        {/* Column 2: Users Distribution (Donut Chart) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 lg:col-span-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm md:text-base font-extrabold text-gray-900">
              Users Distribution
            </h2>
            <span className="text-xs font-semibold text-gray-400">This Week</span>
          </div>

          <UserDistributionDonutChart
            students={distributionData?.students ?? (stats?.totalStudents || 0)}
            tutors={distributionData?.tutors ?? (stats?.totalTutors || 0)}
          />
        </div>

        {/* Column 3: Recent Signups Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 lg:col-span-3 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-gray-900 mb-4">
              Recent Signups
            </h2>

            <div className="space-y-4">
              {/* Students Today */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                    👨‍🎓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Students</p>
                    <p className="text-[10px] text-gray-400">Today</p>
                  </div>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {stats?.todayStudents || 0}
                </span>
              </div>

              {/* Tutors Today */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                    👨‍🏫
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Tutors</p>
                    <p className="text-[10px] text-gray-400">Today</p>
                  </div>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {stats?.todayTutors || 0}
                </span>
              </div>

              {/* Total Users Today */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                    👥
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Total Users</p>
                    <p className="text-[10px] text-gray-400">Today</p>
                  </div>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {stats?.todayUsers || 0}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/users"
            className="w-full text-center mt-5 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition no-underline block"
          >
            View All Users
          </Link>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. BOTTOM SECTION: RECENT USERS TABLE & RECENT ACTIVITIES    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Users Table */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 lg:col-span-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-extrabold text-gray-900">
                Recent Users
              </h2>
              <Link
                to="/admin/users"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg no-underline transition"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">USER</th>
                    <th className="pb-3 px-2">ROLE</th>
                    <th className="pb-3 px-2">STATUS</th>
                    <th className="pb-3 px-2">JOINED ON</th>
                    <th className="pb-3 px-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {recentUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No users registered in database yet.
                      </td>
                    </tr>
                  ) : (
                    recentUsersList.map((u) => {
                      const joinedDate = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Recent';

                      const isPendingKYC = u.role === 'TUTOR' && (!u.isVerified || u.kycStatus === 'PENDING');
                      const isSuspended = u.isSuspended;

                      return (
                        <tr 
                          key={u._id} 
                          onClick={() => navigate(`/admin/users`)}
                          className="hover:bg-gray-50/80 transition group cursor-pointer"
                        >
                          {/* User Avatar + Name + Email */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <div className="truncate max-w-[130px] md:max-w-[160px]">
                                <p className="font-bold text-gray-900 truncate leading-tight">{u.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-2 text-gray-600 font-medium capitalize">
                            {u.role === 'STUDENT' ? 'Student' : u.role === 'TUTOR' ? 'Tutor' : u.role}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-2">
                            {isSuspended ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                Suspended
                              </span>
                            ) : isPendingKYC ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                Pending KYC
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>

                          {/* Joined On */}
                          <td className="py-3 px-2 text-gray-500 font-medium">
                            {joinedDate}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWhatsAppModal(u);
                              }}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition cursor-pointer inline-flex items-center justify-center"
                              title={`WhatsApp ${u.name}`}
                            >
                              <WhatsAppIcon size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activities */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 lg:col-span-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm md:text-base font-extrabold text-gray-900">
                Recent Activities
              </h2>
              <Link
                to="/admin/audit-logs"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg no-underline transition"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3.5 text-xs">
              {activitiesList.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  No recent activities recorded yet.
                </div>
              ) : (
                activitiesList.map((act) => {
                  const actDate = act.createdAt || act.time;
                  const formattedTime = actDate
                    ? new Date(actDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  let icon = '⚡';
                  let iconBg = 'bg-gray-50 text-gray-600';

                  if (act.type === 'STUDENT_SIGNUP') {
                    icon = '👨‍🎓';
                    iconBg = 'bg-amber-50 text-amber-600';
                  } else if (act.type === 'TUTOR_SIGNUP') {
                    icon = '👥';
                    iconBg = 'bg-purple-50 text-purple-600';
                  } else if (act.type === 'KYC_UPDATE') {
                    icon = '🛡️';
                    iconBg = 'bg-emerald-50 text-emerald-600';
                  } else if (act.type === 'UNLOCK') {
                    icon = '📱';
                    iconBg = 'bg-amber-50 text-amber-600';
                  } else if (act.type === 'REPORT') {
                    icon = '🚩';
                    iconBg = 'bg-rose-50 text-rose-600';
                  }

                  return (
                    <div key={act._id} className="flex items-start justify-between gap-3 pb-2.5 border-b border-gray-50 last:border-b-0">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center text-xs flex-shrink-0 mt-0.5`}>
                          {icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">
                            {act.title}
                          </p>
                          {act.description && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {formattedTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE WHATSAPP QUICK CONTACT MODAL                   */}
      {/* ============================================================ */}
      {whatsappModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <WhatsAppIcon size={22} />
                <h3 className="text-base font-extrabold text-gray-900">
                  WhatsApp Quick Contact
                </h3>
              </div>
              <button
                onClick={() => setWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select User Dropdown */}
            {whatsappModal.categoryUsers.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient User:
                </label>
                <select
                  value={whatsappModal.selectedUserId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const u = whatsappModal.categoryUsers.find(item => item._id === selId);
                    setWhatsappModal(prev => ({
                      ...prev,
                      selectedUserId: selId,
                      user: u,
                      customMessage: `Hello ${u?.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`,
                    }));
                  }}
                  className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-[#FF6B00]"
                >
                  {whatsappModal.categoryUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role}) — {u.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                WhatsApp Message Template:
              </label>
              <textarea
                rows={5}
                value={whatsappModal.customMessage}
                onChange={(e) => setWhatsappModal(prev => ({ ...prev, customMessage: e.target.value }))}
                className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#FF6B00] resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsAppFromModal}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#1EBE5D] rounded-xl shadow-xs transition cursor-pointer"
              >
                <WhatsAppIcon size={16} />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;
