import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import axios from "axios";

// Inline WhatsApp Icon
const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
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

// SVG Smooth Area Line Chart
const GrowthChart = ({ data = [] }) => {
  const [hoverIdx, setHoverIdx] = useState(null);

  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    return [
      { dateLabel: "18 May", users: 15 },
      { dateLabel: "19 May", users: 38 },
      { dateLabel: "20 May", users: 55 },
      { dateLabel: "21 May", users: 34 },
      { dateLabel: "22 May", users: 43 },
      { dateLabel: "23 May", users: 42 },
      { dateLabel: "24 May", users: 78 }
    ];
  }, [data]);

  const maxVal = Math.max(...chartData.map((d) => d.users || 0), 80);
  const width = 500;
  const height = 180;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = chartData.map((d, i) => {
    const x = padX + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const val = d.users || 0;
    const y = padY + chartH - (val / (maxVal || 1)) * chartH;
    return { x, y, val, label: d.dateLabel || `Day ${i + 1}` };
  });

  const pathD = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z` : "";

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="yellowAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padY + chartH * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#F0EAD6" strokeDasharray="3 3" />
              <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#A3A3A3" fontFamily="sans-serif">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#yellowAreaGrad)" />}

        {/* Smooth Curve */}
        {pathD && <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />}

        {/* Points & Hover */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 6 : 4} fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
            <text x={p.x} y={height - 2} textAnchor="middle" fontSize="9" fill="#737373" fontFamily="sans-serif">
              {p.label}
            </text>
            {hoverIdx === i && (
              <g>
                <rect x={p.x - 24} y={p.y - 28} width="48" height="20" rx="4" fill="#171717" />
                <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFFFFF">
                  {p.val}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ studentCount = 156, tutorCount = 98 }) => {
  const total = Math.max(studentCount + tutorCount, 1);
  const studentPct = ((studentCount / total) * 100).toFixed(1);
  const tutorPct = ((tutorCount / total) * 100).toFixed(1);

  const radius = 38;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const studentDash = (studentCount / total) * circumference;
  const tutorDash = (tutorCount / total) * circumference;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F5EFE0" strokeWidth={strokeWidth} />
          {/* Students (Blue) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${studentDash} ${circumference}`}
            strokeDashoffset="0"
          />
          {/* Tutors (Yellow/Amber) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeDasharray={`${tutorDash} ${circumference}`}
            strokeDashoffset={-studentDash}
          />
        </svg>
      </div>

      <div className="space-y-3 text-xs flex-1">
        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6] shrink-0 mt-1" />
          <div>
            <p className="font-bold text-gray-900 leading-none">Students</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{studentCount} ({studentPct}%)</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B] shrink-0 mt-1" />
          <div>
            <p className="font-bold text-gray-900 leading-none">Tutors</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{tutorCount} ({tutorPct}%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    client.get("/admin/dashboard-stats")
      .then((r) => {
        setData(r.data?.data || r.data);
        setLoading(false);
      })
      .catch(() => {
        axios.get("/api/admin/stats")
          .then((r) => {
            setData(r.data?.data || r.data);
            setLoading(false);
          })
          .catch(() => {
            setData(null);
            setLoading(false);
          });
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalUsers = data?.totalUsers ?? ((data?.totalStudents || 0) + (data?.totalTutors || 0)) ?? 0;
  const students = data?.totalStudents ?? data?.students ?? 0;
  const tutors = data?.totalTutors ?? data?.tutors ?? 0;
  const pendingKYC = data?.pendingKYC ?? 0;
  const reports = data?.totalReports ?? data?.reports ?? 0;
  const tutorRequests = data?.totalTutorRequests ?? data?.tutorRequests ?? 0;
  const unlocks = data?.totalUnlocks ?? data?.unlocks ?? 0;
  const revenue = data?.periodRevenue ?? data?.totalRevenue ?? data?.revenue ?? 0;

  const statCards = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString("en-IN"),
      growth: "12.5% this week",
      isPositive: true,
      icon: "👥",
      iconBg: "bg-[#F3E8FF] text-[#9333EA]",
      path: "/admin/users"
    },
    {
      title: "Students",
      value: students.toLocaleString("en-IN"),
      growth: "10.4% this week",
      isPositive: true,
      icon: "🎓",
      iconBg: "bg-[#E0F2FE] text-[#0284C7]",
      path: "/admin/students"
    },
    {
      title: "Tutors",
      value: tutors.toLocaleString("en-IN"),
      growth: "15.3% this week",
      isPositive: true,
      icon: "👤",
      iconBg: "bg-[#FFEDD5] text-[#EA580C]",
      path: "/admin/tutors"
    },
    {
      title: "Pending KYC",
      value: pendingKYC.toLocaleString("en-IN"),
      growth: "4.0% this week",
      isPositive: false,
      icon: "🛡️",
      iconBg: "bg-[#FEF9C3] text-[#CA8A04]",
      path: "/admin/kyc"
    },
    {
      title: "Reports",
      value: reports.toLocaleString("en-IN"),
      growth: "12.5% this week",
      isPositive: false,
      icon: "🚩",
      iconBg: "bg-[#FEE2E2] text-[#DC2626]",
      path: "/admin/reports"
    },
    {
      title: "Tutor Requests",
      value: tutorRequests.toLocaleString("en-IN"),
      growth: "23.1% this week",
      isPositive: true,
      icon: "📄",
      iconBg: "bg-[#EDE9FE] text-[#7C3AED]",
      path: "/admin/requests"
    },
    {
      title: "Contact Unlocks",
      value: unlocks.toLocaleString("en-IN"),
      growth: "18.2% this week",
      isPositive: true,
      icon: "🔒",
      iconBg: "bg-[#DBEAFE] text-[#2563EB]",
      path: "/admin/contact-unlocks"
    },
    {
      title: "Revenue (This Week)",
      value: `₹${Number(revenue).toLocaleString("en-IN")}`,
      growth: "20.6% this week",
      isPositive: true,
      icon: "₹",
      iconBg: "bg-[#DCFCE7] text-[#16A34A]",
      path: "/admin/payments"
    }
  ];

  return (
    <div className="space-y-5 bg-[#FFFBF5] min-h-screen">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Here's what's happening with MentorNearby today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E0D4] rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium flex items-center gap-2 shadow-2xs cursor-pointer">
            <span>📅 18 May - 24 May 2025</span>
            <span className="text-gray-400 text-[10px]">▼</span>
          </div>

          <button
            onClick={fetchDashboardData}
            className="bg-white hover:bg-gray-50 border border-[#E5E0D4] text-gray-800 rounded-lg px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <span className={loading ? "animate-spin inline-block" : ""}>🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2. 8 KPI Cards Grid (4 columns) */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' 
        }}
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white border border-[#F5EFE0] rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 leading-none">{card.title}</p>
                  <h3 className="text-2xl font-black text-gray-900 mt-1 tracking-tight leading-none">
                    {card.value}
                  </h3>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open("https://wa.me/919999999999", "_blank");
                }}
                className="w-7 h-7 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition border border-[#25D366]/20 cursor-pointer shadow-2xs"
                title="WhatsApp Contact"
              >
                <WhatsAppIcon size={14} />
              </button>
            </div>

            <div className="mt-3">
              <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${card.isPositive ? "text-emerald-600" : "text-rose-500"}`}>
                <span>{card.isPositive ? "↗" : "↘"}</span>
                <span>{card.growth}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Middle Row: Growth Chart (6) + Distribution Donut (3) + Recent Signups (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* User Growth Overview */}
        <div className="lg:col-span-6 bg-white border border-[#F5EFE0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">User Growth Overview</h2>
            <div className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-600 font-medium flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
              <span>This Week</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </div>
          </div>

          <GrowthChart data={data?.growthSeries} />
        </div>

        {/* Users Distribution */}
        <div className="lg:col-span-3 bg-white border border-[#F5EFE0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900">Users Distribution</h2>
            <div className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-600 font-medium flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
              <span>This Week</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </div>
          </div>

          <DonutChart studentCount={students || 156} tutorCount={tutors || 98} />
        </div>

        {/* Recent Signups */}
        <div className="lg:col-span-3 bg-white border border-[#F5EFE0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Signups</h2>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                  🎓
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-none">Students</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Today</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900">{data?.todayStudents ?? 23}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                  👨‍🏫
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-none">Tutors</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Today</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900">{data?.todayTutors ?? 14}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                  👥
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-none">Total Users</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Today</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900">{data?.todayUsers ?? 37}</span>
            </div>
          </div>

          <Link
            to="/admin/users"
            className="w-full py-2 mt-4 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl text-center transition border border-gray-200 block no-underline shadow-2xs"
          >
            View All Users
          </Link>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Users Table (7) + Recent Activities (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Users Table */}
        <div className="lg:col-span-7 bg-white border border-[#F5EFE0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-xs text-gray-500 hover:text-gray-900 font-semibold border border-gray-200 px-2.5 py-1 rounded-lg no-underline hover:bg-gray-50 transition"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="pb-2.5 font-bold">User</th>
                  <th className="pb-2.5 font-bold">Role</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Joined On</th>
                  <th className="pb-2.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.recentUsers || []).slice(0, 5).map((u, i) => {
                  const roleLabel = (u.role || "Student").toString().toUpperCase() === "TUTOR" ? "Tutor" : "Student";
                  const isVerified = u.kycStatus === "VERIFIED" || u.isVerified || !u.isSuspended;
                  const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "24 May 2025";

                  return (
                    <tr key={u._id || i} className="hover:bg-gray-50/60 transition">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (u.name?.[0]?.toUpperCase() || "U")}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none truncate max-w-[120px]">{u.name || "User"}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px] mt-0.5">{u.email || ""}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 text-gray-600 font-medium">{roleLabel}</td>

                      <td className="py-2.5">
                        {isVerified ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            Pending KYC
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 text-gray-500 text-[11px] whitespace-nowrap">{dateStr}</td>

                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => window.open(`https://wa.me/${u.phone ? u.phone.replace(/\\D/g, "") : "919999999999"}`, "_blank")}
                          className="w-6 h-6 inline-flex items-center justify-center rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition cursor-pointer"
                          title="WhatsApp User"
                        >
                          <WhatsAppIcon size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-5 bg-white border border-[#F5EFE0] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Activities</h2>
            <Link
              to="/admin/audit-logs"
              className="text-xs text-gray-500 hover:text-gray-900 font-semibold border border-gray-200 px-2.5 py-1 rounded-lg no-underline hover:bg-gray-50 transition"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.recentActivities || []).slice(0, 5).map((act, idx) => {
              const dateStr = act.createdAt ? new Date(act.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "24 May 2025, 10:30 AM";
              const icons = ["👤", "👨‍🏫", "🛡️", "🔒", "🚩"];
              const colors = ["bg-amber-50 text-amber-600", "bg-purple-50 text-purple-600", "bg-emerald-50 text-emerald-600", "bg-blue-50 text-blue-600", "bg-rose-50 text-rose-600"];

              return (
                <div key={act._id || idx} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${colors[idx % colors.length]}`}>
                      {icons[idx % icons.length]}
                    </span>
                    <p className="text-gray-700 font-medium truncate">{act.action || act.details || "Activity logged"}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
