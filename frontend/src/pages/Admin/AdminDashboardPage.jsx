// ============================================================
// pages/Admin/AdminDashboardPage.jsx
// MentorNearby Admin Dashboard — Production SaaS SaaS/Master Replica
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboardPage.css';

// ── Smooth Animated Count-Up Hook ──
const useCountUp = (targetVal, duration = 800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startVal = 0;
    const endVal = typeof targetVal === 'number' ? targetVal : parseInt(targetVal, 10) || 0;
    if (endVal === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(startVal + (endVal - startVal) * easeOutProgress);
      setCount(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(endVal);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [targetVal, duration]);

  return count;
};

// ── Format Currency in INR ──
const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

// ── Interactive Multi-Line SVG Chart ──
const MultiLineChart = ({
  data = [],
  seriesKeys = [],
  height = 180,
  isCurrency = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeData = data.length > 0 ? data : [
    { dateLabel: '24 Apr', val1: 0, val2: 0, val3: 0 },
    { dateLabel: '29 May', val1: 0, val2: 0, val3: 0 },
  ];

  const maxVal = useMemo(() => {
    let m = 0;
    safeData.forEach((d) => {
      seriesKeys.forEach((s) => {
        if ((d[s.key] || 0) > m) m = d[s.key] || 0;
      });
    });
    return m > 0 ? m * 1.15 : 10;
  }, [safeData, seriesKeys]);

  const width = 500;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getPoints = (key) =>
    safeData.map((d, i) => {
      const x = padLeft + (i / Math.max(safeData.length - 1, 1)) * chartW;
      const val = d[key] || 0;
      const y = padTop + chartH - (val / maxVal) * chartH;
      return { x, y, val, label: d.dateLabel };
    });

  const buildPath = (pts) =>
    pts.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = a[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      const cp2y = p.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }, '');

  return (
    <div className="ad-svg-chart-wrap" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="ad-svg-chart">
        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padTop + chartH * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                fill="rgba(148, 163, 184, 0.7)"
                fontSize="9"
                textAnchor="end"
              >
                {isCurrency
                  ? val >= 100000
                    ? `${(val / 100000).toFixed(1)}L`
                    : val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : val
                  : val >= 1000
                  ? `${(val / 1000).toFixed(1)}k`
                  : val}
              </text>
            </g>
          );
        })}

        {/* Render series lines & dots */}
        {seriesKeys.map((s) => {
          const pts = getPoints(s.key);
          const pathD = buildPath(pts);
          return (
            <g key={s.key}>
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, pIdx) => (
                <circle
                  key={pIdx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === pIdx ? 5 : 3}
                  fill={s.color}
                  stroke="#111726"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredIdx(pIdx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                />
              ))}
            </g>
          );
        })}

        {/* X-axis date labels */}
        {safeData.map((d, i) => {
          const x = padLeft + (i / Math.max(safeData.length - 1, 1)) * chartW;
          return (
            <text
              key={i}
              x={x}
              y={height - 6}
              fill="rgba(148, 163, 184, 0.7)"
              fontSize="9.5"
              textAnchor="middle"
            >
              {d.dateLabel}
            </text>
          );
        })}

        {/* Interactive Hover Tooltip */}
        {hoveredIdx !== null && safeData[hoveredIdx] && (
          <g>
            <line
              x1={padLeft + (hoveredIdx / Math.max(safeData.length - 1, 1)) * chartW}
              y1={padTop}
              x2={padLeft + (hoveredIdx / Math.max(safeData.length - 1, 1)) * chartW}
              y2={padTop + chartH}
              stroke="rgba(245, 158, 11, 0.4)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

// ── Animated Donut Chart Widget ──
const DonutChartWidget = ({
  subscriptionRev = 0,
  unlockRev = 0,
  otherRev = 0,
  totalRev = 0,
}) => {
  const total = totalRev || subscriptionRev + unlockRev + otherRev || 1;
  const subPercent = totalRev > 0 ? Math.round((subscriptionRev / total) * 100) : 0;
  const unlockPercent = totalRev > 0 ? Math.round((unlockRev / total) * 100) : 0;
  const otherPercent = totalRev > 0 ? Math.max(0, 100 - subPercent - unlockPercent) : 0;

  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  const subOffset = 0;
  const subLength = (subPercent / 100) * circumference;

  const unlockOffset = -subLength;
  const unlockLength = (unlockPercent / 100) * circumference;

  const otherOffset = -(subLength + unlockLength);
  const otherLength = (otherPercent / 100) * circumference;

  return (
    <div className="ad-donut-wrap">
      <div className="ad-donut-svg-container">
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* Base background ring */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="14"
          />

          {/* Subscription slice (Purple) */}
          {subPercent > 0 && (
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="#A855F7"
              strokeWidth="14"
              strokeDasharray={`${subLength} ${circumference}`}
              strokeDashoffset={subOffset}
              transform="rotate(-90 75 75)"
              strokeLinecap="round"
            />
          )}

          {/* Unlock slice (Gold) */}
          {unlockPercent > 0 && (
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="14"
              strokeDasharray={`${unlockLength} ${circumference}`}
              strokeDashoffset={unlockOffset}
              transform="rotate(-90 75 75)"
              strokeLinecap="round"
            />
          )}

          {/* Other slice (Green) */}
          {otherPercent > 0 && (
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="14"
              strokeDasharray={`${otherLength} ${circumference}`}
              strokeDashoffset={otherOffset}
              transform="rotate(-90 75 75)"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="ad-donut-center-text">
          <span className="ad-donut-center-label">Total</span>
          <span className="ad-donut-center-amount">{formatINR(totalRev)}</span>
        </div>
      </div>

      {/* Breakdown percentages */}
      <div className="ad-donut-breakdown-list">
        <div className="ad-donut-breakdown-row">
          <span className="ad-donut-breakdown-name">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7' }}></span>
            Subscription Revenue
          </span>
          <span className="ad-donut-breakdown-val">
            {formatINR(subscriptionRev)} ({subPercent}%)
          </span>
        </div>

        <div className="ad-donut-breakdown-row">
          <span className="ad-donut-breakdown-name">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}></span>
            Contact Unlock Revenue
          </span>
          <span className="ad-donut-breakdown-val">
            {formatINR(unlockRev)} ({unlockPercent}%)
          </span>
        </div>

        <div className="ad-donut-breakdown-row">
          <span className="ad-donut-breakdown-name">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
            Other Revenue
          </span>
          <span className="ad-donut-breakdown-val">
            {formatINR(otherRev)} ({otherPercent}%)
          </span>
        </div>
      </div>

      <Link to="/admin/payments" className="ad-donut-report-link">
        View Full Report →
      </Link>
    </div>
  );
};

// ── Main Admin Dashboard Page ──
const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userGrowthRange, setUserGrowthRange] = useState('30d');
  const [revenueRange, setRevenueRange] = useState('30d');

  const fetchDashboardStats = () => {
    setLoading(true);
    setErrorMsg('');
    client
      .get('/admin/stats')
      .then((res) => {
        if (res.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load admin stats:', err);
        setErrorMsg('Failed to load dashboard stats. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted current date
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      weekday: 'long',
    });
  }, []);

  // KPI Animated Numbers
  const animatedUsers = useCountUp(stats?.totalUsers || 0);
  const animatedStudents = useCountUp(stats?.totalStudents || 0);
  const animatedTutors = useCountUp(stats?.totalTutors || 0);
  const animatedVerifiedTutors = useCountUp(stats?.verifiedTutors || 0);
  const animatedActiveUsers = useCountUp(stats?.activeUsers || 0);
  const animatedPaidUsers = useCountUp(stats?.paidUsers || 0);
  const animatedRevenue = useCountUp(stats?.totalRevenue || 0);
  const animatedUnlocks = useCountUp(stats?.totalUnlocks || 0);

  return (
    <div className="ad-dash-root">
      <div className="ad-dash-container">
        
        {/* ============================================================ */}
        {/* TOP HEADER: GREETING & ADMIN PROFILE INFO                    */}
        {/* ============================================================ */}
        <header className="ad-dash-top-header">
          <div>
            <h1 className="ad-dash-greeting-title">
              {greeting}, {user?.name || 'Admin'} 👋
            </h1>
            <p className="ad-dash-greeting-sub">
              Here's what's happening across MentorNearby today.
            </p>
          </div>

          <div className="ad-dash-header-right">
            <div className="ad-dash-date-pill">{currentDateFormatted}</div>

            <Link to="/admin/notifications" className="ad-dash-notif-btn" title="Notifications">
              <span>🔔</span>
              <span className="ad-dash-notif-badge">12</span>
            </Link>

            <div className="ad-dash-admin-pill">
              <div className="ad-dash-admin-avatar-wrap">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces'
                  }
                  alt="Admin"
                  className="ad-dash-admin-avatar"
                />
                <span className="ad-dash-online-dot"></span>
              </div>
              <div>
                <div className="ad-dash-admin-name">{user?.name || 'Admin'}</div>
                <div className="ad-dash-admin-role">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', padding: '10px 16px', borderRadius: '12px', color: '#EF4444', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{errorMsg}</span>
            <button type="button" onClick={fetchDashboardStats} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
              Retry
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TOP 8 ANIMATED KPI CARDS                                     */}
        {/* ============================================================ */}
        <section className="ad-kpi-grid">
          
          {/* 1. Total Users */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box purple">👥</div>
              <span className="ad-kpi-title">Total Users</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedUsers.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 8.7%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 2. Total Students */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box blue">🎓</div>
              <span className="ad-kpi-title">Total Students</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedStudents.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 7.2%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 3. Total Tutors */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box pink">👤</div>
              <span className="ad-kpi-title">Total Tutors</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedTutors.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 10.3%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 4. Verified Tutors */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box cyan">🛡️</div>
              <span className="ad-kpi-title">Verified Tutors</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedVerifiedTutors.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 9.1%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 5. Active Users */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box purple">📈</div>
              <span className="ad-kpi-title">Active Users</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedActiveUsers.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 6.5%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 6. Paid Users */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box gold">👑</div>
              <span className="ad-kpi-title">Paid Users</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedPaidUsers.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 11.8%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 7. Total Revenue */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box rose">👛</div>
              <span className="ad-kpi-title">Total Revenue</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value" style={{ fontSize: 16 }}>
                  {formatINR(animatedRevenue)}
                </span>
                <span className="ad-kpi-trend">↑ 14.6%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

          {/* 8. Contact Unlocks */}
          <div className="ad-kpi-card">
            <div className="ad-kpi-header">
              <div className="ad-kpi-icon-box red">🔓</div>
              <span className="ad-kpi-title">Contact Unlocks</span>
            </div>
            <div>
              <div className="ad-kpi-value-row">
                <span className="ad-kpi-value">{animatedUnlocks.toLocaleString()}</span>
                <span className="ad-kpi-trend">↑ 12.4%</span>
              </div>
              <span className="ad-kpi-subtext">vs last 30 days</span>
            </div>
          </div>

        </section>

        {/* ============================================================ */}
        {/* MIDDLE SECTION: 3 CHARTS & DONUT BREAKDOWN                   */}
        {/* ============================================================ */}
        <section className="ad-charts-grid">
          
          {/* 1. User Growth Chart */}
          <div className="ad-chart-card">
            <div className="ad-chart-card-header">
              <span className="ad-chart-card-title">User Growth</span>
              <select
                value={userGrowthRange}
                onChange={(e) => setUserGrowthRange(e.target.value)}
                className="ad-chart-range-select"
              >
                <option value="30d">30 Days</option>
                <option value="7d">7 Days</option>
                <option value="90d">90 Days</option>
              </select>
            </div>

            <div className="ad-chart-legend-row">
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#F59E0B' }}></span>
                Students
              </span>
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#F43F5E' }}></span>
                Tutors
              </span>
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#38BDF8' }}></span>
                Total Users
              </span>
            </div>

            <MultiLineChart
              data={stats?.userGrowth30Days || []}
              seriesKeys={[
                { key: 'students', color: '#F59E0B' },
                { key: 'tutors', color: '#F43F5E' },
                { key: 'totalUsers', color: '#38BDF8' },
              ]}
              height={190}
            />
          </div>

          {/* 2. Revenue Overview Chart */}
          <div className="ad-chart-card">
            <div className="ad-chart-card-header">
              <span className="ad-chart-card-title">Revenue Overview</span>
              <select
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value)}
                className="ad-chart-range-select"
              >
                <option value="30d">30 Days</option>
                <option value="7d">7 Days</option>
              </select>
            </div>

            <div className="ad-chart-legend-row">
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#A855F7' }}></span>
                Subscription Revenue
              </span>
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#F59E0B' }}></span>
                Contact Unlock Revenue
              </span>
              <span className="ad-chart-legend-item">
                <span className="ad-chart-legend-dot" style={{ background: '#10B981' }}></span>
                Total Revenue
              </span>
            </div>

            <MultiLineChart
              data={stats?.revenueOverview30Days || []}
              seriesKeys={[
                { key: 'subscriptionRevenue', color: '#A855F7' },
                { key: 'contactUnlockRevenue', color: '#F59E0B' },
                { key: 'totalRevenue', color: '#10B981' },
              ]}
              height={190}
              isCurrency={true}
            />
          </div>

          {/* 3. Revenue Summary Donut Chart */}
          <div className="ad-chart-card">
            <div className="ad-chart-card-header">
              <span className="ad-chart-card-title">Revenue Summary (30 Days)</span>
            </div>

            <DonutChartWidget
              subscriptionRev={stats?.subscriptionRevenue || 0}
              unlockRev={stats?.directUnlockRevenue || 0}
              otherRev={stats?.otherRevenue || 0}
              totalRev={stats?.totalRevenue || 0}
            />
          </div>

        </section>

        {/* ============================================================ */}
        {/* BOTTOM 4-COLUMN ACTIVITIES & RANKINGS SECTION                */}
        {/* ============================================================ */}
        <section className="ad-quad-grid">
          
          {/* Card 1: Recent Student Signups */}
          <div className="ad-list-card">
            <div className="ad-list-header">
              <span className="ad-list-title">Recent Student Signups</span>
              <Link to="/admin/students" className="ad-list-view-all">
                View All
              </Link>
            </div>

            <div className="ad-items-container">
              {(stats?.recentStudentSignups && stats.recentStudentSignups.length > 0) ? (
                stats.recentStudentSignups.map((st) => (
                  <div key={st._id} className="ad-user-item-row">
                    <div className="ad-user-item-left">
                      {st.avatar ? (
                        <img src={st.avatar} alt={st.name} className="ad-user-avatar-img" />
                      ) : (
                        <div className="ad-user-avatar-fallback">{st.name.charAt(0)}</div>
                      )}
                      <div className="ad-user-info-wrap">
                        <span className="ad-user-name-line">{st.name}</span>
                        <span className="ad-user-sub-line">
                          {st.class} • {st.board} • {st.city}
                        </span>
                      </div>
                    </div>
                    <span className="ad-user-date-line">
                      {new Date(st.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                  No students registered yet
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Recent Tutor Signups */}
          <div className="ad-list-card">
            <div className="ad-list-header">
              <span className="ad-list-title">Recent Tutor Signups</span>
              <Link to="/admin/tutors" className="ad-list-view-all">
                View All
              </Link>
            </div>

            <div className="ad-items-container">
              {(stats?.recentTutorSignups && stats.recentTutorSignups.length > 0) ? (
                stats.recentTutorSignups.map((tu) => (
                  <div key={tu._id} className="ad-user-item-row">
                    <div className="ad-user-item-left">
                      {tu.avatar ? (
                        <img src={tu.avatar} alt={tu.name} className="ad-user-avatar-img" />
                      ) : (
                        <div className="ad-user-avatar-fallback">{tu.name.charAt(0)}</div>
                      )}
                      <div className="ad-user-info-wrap">
                        <span className="ad-user-name-line">{tu.name}</span>
                        <span className="ad-user-sub-line">
                          {tu.subjects} • {tu.experience}
                        </span>
                      </div>
                    </div>
                    <span className="ad-user-date-line">
                      {new Date(tu.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                  No tutors registered yet
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="ad-list-card">
            <div className="ad-list-header">
              <span className="ad-list-title">Recent Activity</span>
              <Link to="/admin/audit-logs" className="ad-list-view-all">
                View All
              </Link>
            </div>

            <div className="ad-items-container">
              {(stats?.recentActivities && stats.recentActivities.length > 0) ? (
                stats.recentActivities.map((act) => (
                  <div key={act._id} className="ad-activity-item-row">
                    <div className="ad-activity-icon-badge">{act.icon || '⚡'}</div>
                    <div className="ad-user-info-wrap" style={{ flex: 1 }}>
                      <span className="ad-user-name-line" style={{ fontSize: 11.5 }}>
                        {act.text}
                      </span>
                      <span className="ad-user-sub-line">
                        {new Date(act.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                  No activity recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Top Tutors */}
          <div className="ad-list-card">
            <div className="ad-list-header">
              <span className="ad-list-title">Top Tutors</span>
              <Link to="/admin/tutors" className="ad-list-view-all">
                View All
              </Link>
            </div>

            <div className="ad-items-container">
              {(stats?.topTutors && stats.topTutors.length > 0) ? (
                stats.topTutors.map((tt) => (
                  <div key={tt.id} className="ad-user-item-row">
                    <div className="ad-user-item-left">
                      <span className="ad-rank-badge">{tt.rank}</span>
                      {tt.avatar ? (
                        <img src={tt.avatar} alt={tt.name} className="ad-user-avatar-img" />
                      ) : (
                        <div className="ad-user-avatar-fallback">{tt.name.charAt(0)}</div>
                      )}
                      <div className="ad-user-info-wrap">
                        <span className="ad-user-name-line">
                          {tt.name} {tt.isVerified && <span style={{ color: '#3B82F6', fontSize: 11 }}>✓</span>}
                        </span>
                        <span className="ad-user-sub-line">{tt.subjects}</span>
                      </div>
                    </div>
                    <span className="ad-tutor-rating-pill">
                      {tt.rating} ★
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                  No tutors ranked yet
                </div>
              )}
            </div>
          </div>

        </section>

        {/* ============================================================ */}
        {/* BOTTOM OPERATIONAL SECTION: REQUIRES ATTENTION & ACTIONS     */}
        {/* ============================================================ */}
        <section className="ad-ops-grid">
          
          {/* Card 1: Requires Attention */}
          <div className="ad-ops-card">
            <div className="ad-ops-title">Requires Attention</div>

            <div className="ad-attention-boxes-grid">
              {/* 1. KYC Pending */}
              <div className="ad-attention-box">
                <div className="ad-attention-box-header">
                  <span>👤</span>
                  <span>KYC Pending</span>
                </div>
                <div className="ad-attention-num">{stats?.requiresAttention?.pendingKYC ?? 0}</div>
                <div className="ad-attention-sub">Tutors awaiting verification</div>
                <Link to="/admin/kyc" className="ad-attention-link">
                  View →
                </Link>
              </div>

              {/* 2. Tutor Approvals */}
              <div className="ad-attention-box">
                <div className="ad-attention-box-header">
                  <span>👨‍🏫</span>
                  <span>Tutor Approvals</span>
                </div>
                <div className="ad-attention-num">{stats?.requiresAttention?.unapprovedTutors ?? 0}</div>
                <div className="ad-attention-sub">New tutor accounts pending approval</div>
                <Link to="/admin/tutors" className="ad-attention-link">
                  View →
                </Link>
              </div>

              {/* 3. Pending Reports */}
              <div className="ad-attention-box">
                <div className="ad-attention-box-header">
                  <span>🚨</span>
                  <span>Pending Reports</span>
                </div>
                <div className="ad-attention-num">{stats?.requiresAttention?.pendingReports ?? 0}</div>
                <div className="ad-attention-sub">New reports require action</div>
                <Link to="/admin/reports" className="ad-attention-link">
                  View →
                </Link>
              </div>

              {/* 4. Tutor Requests */}
              <div className="ad-attention-box">
                <div className="ad-attention-box-header">
                  <span>📋</span>
                  <span>Tutor Requests</span>
                </div>
                <div className="ad-attention-num">{stats?.requiresAttention?.pendingTutorRequests ?? 0}</div>
                <div className="ad-attention-sub">New tutor requests received</div>
                <Link to="/admin/requests" className="ad-attention-link">
                  View →
                </Link>
              </div>

              {/* 5. Low Balance Tutors */}
              <div className="ad-attention-box">
                <div className="ad-attention-box-header">
                  <span>💼</span>
                  <span>Low Balance Tutors</span>
                </div>
                <div className="ad-attention-num">{stats?.requiresAttention?.lowBalanceTutors ?? 0}</div>
                <div className="ad-attention-sub">Tutors with low wallet balance</div>
                <Link to="/admin/subscriptions" className="ad-attention-link">
                  View →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="ad-ops-card">
            <div className="ad-ops-title">Quick Actions</div>

            <div className="ad-quick-actions-grid">
              <Link to="/admin/students" className="ad-quick-action-btn">
                <span>👥</span>
                <span>Manage Students</span>
              </Link>

              <Link to="/admin/tutors" className="ad-quick-action-btn">
                <span>👨‍🏫</span>
                <span>Manage Tutors</span>
              </Link>

              <Link to="/admin/kyc" className="ad-quick-action-btn">
                <span>🛡️</span>
                <span>Verify KYC</span>
              </Link>

              <Link to="/admin/reports" className="ad-quick-action-btn">
                <span>📑</span>
                <span>View Reports</span>
              </Link>

              <Link to="/admin/payments" className="ad-quick-action-btn">
                <span>💳</span>
                <span>View Payments</span>
              </Link>

              <Link to="/admin/contact-unlocks" className="ad-quick-action-btn">
                <span>🔓</span>
                <span>Contact Unlocks</span>
              </Link>

              <Link to="/admin/subscriptions" className="ad-quick-action-btn">
                <span>👑</span>
                <span>Subscriptions</span>
              </Link>

              <Link to="/admin/analytics" className="ad-quick-action-btn">
                <span>📊</span>
                <span>Analytics</span>
              </Link>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
