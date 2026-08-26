import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import axios from "axios";

// ── Multi-Series Platform Overview Chart ──
const PlatformOverviewChart = ({ series = [] }) => {
  const [hoverIdx, setHoverIdx] = useState(null);

  const chartData = useMemo(() => {
    if (series && series.length > 0) return series;
    return [
      { dateLabel: "May 20", users: 18, students: 12, tutors: 6, revenue: 350 },
      { dateLabel: "May 21", users: 24, students: 15, tutors: 9, revenue: 480 },
      { dateLabel: "May 22", users: 22, students: 14, tutors: 8, revenue: 420 },
      { dateLabel: "May 23", users: 38, students: 25, tutors: 13, revenue: 920 },
      { dateLabel: "May 24", users: 31, students: 20, tutors: 11, revenue: 680 },
      { dateLabel: "May 25", users: 35, students: 22, tutors: 13, revenue: 590 },
      { dateLabel: "May 26", users: 32, students: 21, tutors: 11, revenue: 520 },
    ];
  }, [series]);

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.users || 0, d.students || 0, d.tutors || 0)), 40);
  const width = 600;
  const height = 200;
  const padLeft = 35;
  const padRight = 35;
  const padTop = 15;
  const padBottom = 25;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getPoints = (key) =>
    chartData.map((d, i) => {
      const x = padLeft + (i / Math.max(chartData.length - 1, 1)) * chartW;
      const val = d[key] || 0;
      const y = padTop + chartH - (val / (maxVal || 1)) * chartH;
      return { x, y, val, label: d.dateLabel };
    });

  const usersPts = getPoints("users");
  const studentsPts = getPoints("students");
  const tutorsPts = getPoints("tutors");

  const buildPath = (pts) =>
    pts.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = a[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      const cp2y = p.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }, "");

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible">
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padTop + chartH * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" className="dark:stroke-zinc-800" />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9CA3AF" fontFamily="sans-serif">
                {val}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        <path d={buildPath(usersPts)} fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" />
        <path d={buildPath(studentsPts)} fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
        <path d={buildPath(tutorsPts)} fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" />

        {/* Dots */}
        {usersPts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3.5} fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={studentsPts[i].x} cy={studentsPts[i].y} r={hoverIdx === i ? 5 : 3.5} fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={tutorsPts[i].x} cy={tutorsPts[i].y} r={hoverIdx === i ? 5 : 3.5} fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fill="#6B7280" fontFamily="sans-serif" className="dark:fill-zinc-400">
              {p.label}
            </text>

            {hoverIdx === i && (
              <g>
                <rect x={Math.min(Math.max(p.x - 45, 10), width - 100)} y={Math.max(p.y - 50, 5)} width="90" height="42" rx="6" fill="#18181B" className="shadow-lg" />
                <text x={Math.min(Math.max(p.x - 45, 10), width - 100) + 45} y={Math.max(p.y - 50, 5) + 14} textAnchor="middle" fontSize="8.5" fill="#E4E4E7" fontWeight="bold">
                  {p.label}
                </text>
                <text x={Math.min(Math.max(p.x - 45, 10), width - 100) + 45} y={Math.max(p.y - 50, 5) + 26} textAnchor="middle" fontSize="8.5" fill="#818CF8">
                  Users: {p.val} | Students: {studentsPts[i].val}
                </text>
                <text x={Math.min(Math.max(p.x - 45, 10), width - 100) + 45} y={Math.max(p.y - 50, 5) + 36} textAnchor="middle" fontSize="8.5" fill="#60A5FA">
                  Tutors: {tutorsPts[i].val}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── 30-Day User Growth Area Chart ──
const UserGrowthAreaChart = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    return [
      { dateLabel: "Apr 27", users: 10 },
      { dateLabel: "May 4", users: 25 },
      { dateLabel: "May 11", users: 48 },
      { dateLabel: "May 18", users: 70 },
      { dateLabel: "May 26", users: 110 },
    ];
  }, [data]);

  const maxVal = Math.max(...chartData.map((d) => d.users || 0), 100);
  const width = 360;
  const height = 130;
  const padX = 20;
  const padY = 15;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = chartData.map((d, i) => {
    const x = padX + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const val = d.users || 0;
    const y = padY + chartH - (val / (maxVal || 1)) * chartH;
    return { x, y, val, label: d.dateLabel };
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

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${height - 5} L ${points[0].x} ${height - 5} Z` : "";

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <defs>
          <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {areaD && <path d={areaD} fill="url(#purpleAreaGrad)" />}
        {pathD && <path d={pathD} fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />}

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
            {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
              <text x={p.x} y={height - 2} textAnchor="middle" fontSize="8.5" fill="#9CA3AF" fontFamily="sans-serif">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Multi-Source Revenue Donut Chart ──
const RevenueDonutChart = ({ breakdown = [] }) => {
  const data = useMemo(() => {
    if (breakdown && breakdown.length > 0) return breakdown;
    return [
      { source: "PPT / Study Material", amount: 78450, color: "#8B5CF6" },
      { source: "Courses & PYQs", amount: 28750, color: "#10B981" },
      { source: "Tutor Requests", amount: 9860, color: "#F59E0B" },
      { source: "Contact Unlocks", amount: 7520, color: "#3B82F6" },
    ];
  }, [breakdown]);

  const total = Math.max(data.reduce((acc, item) => acc + (item.amount || 0), 0), 1);
  const radius = 38;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} className="dark:stroke-zinc-800" />
          {data.map((item, idx) => {
            const itemPct = (item.amount || 0) / total;
            const strokeDasharray = `${itemPct * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercent * circumference;
            cumulativePercent += itemPct;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={item.color || "#8B5CF6"}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      <div className="w-full space-y-2 text-xs">
        {data.map((item, idx) => {
          const pct = (((item.amount || 0) / total) * 100).toFixed(1);
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-zinc-300 text-[11px]">{item.source}</span>
              </div>
              <div className="font-bold text-gray-900 dark:text-white text-[11px]">
                ₹{(item.amount || 0).toLocaleString("en-IN")} <span className="text-gray-400 font-normal">({pct}%)</span>
              </div>
            </div>
          );
        })}
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
    client
      .get("/admin/dashboard-stats")
      .then((r) => {
        setData(r.data?.data || r.data);
        setLoading(false);
      })
      .catch(() => {
        axios
          .get("/api/admin/stats")
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
  const tutorRequests = data?.totalTutorRequests ?? data?.tutorRequests ?? 0;
  const courses = data?.totalCourses ?? 12;
  const studyResources = data?.totalStudyResources ?? 34;
  const books = data?.totalBooks ?? 18;
  const payments = data?.totalPayments ?? 24;
  const unlocks = data?.totalUnlocks ?? data?.unlocks ?? 0;
  const revenue = data?.totalRevenue ?? data?.periodRevenue ?? data?.revenue ?? 0;

  const topKPIs = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString("en-IN"),
      growth: "↗ 8.5% from last week",
      icon: "👥",
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
      path: "/admin/users",
    },
    {
      title: "Students",
      value: students.toLocaleString("en-IN"),
      growth: "↗ 7.2% from last week",
      icon: "👤",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      path: "/admin/students",
    },
    {
      title: "Tutors",
      value: tutors.toLocaleString("en-IN"),
      growth: "↗ 6.1% from last week",
      icon: "🎓",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      path: "/admin/tutors",
    },
    {
      title: "Tutor Requests",
      value: tutorRequests.toLocaleString("en-IN"),
      growth: "↗ 12.4% from last week",
      icon: "📋",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      path: "/admin/requests",
    },
    {
      title: "Courses & PYQs",
      value: courses.toLocaleString("en-IN"),
      growth: "↗ 9.3% from last week",
      icon: "📖",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      path: "/admin/courses",
    },
  ];

  const subKPIs = [
    {
      title: "Study Resources",
      value: studyResources.toLocaleString("en-IN"),
      growth: "↗ 11.6%",
      icon: "📗",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      path: "/admin/study-resources",
    },
    {
      title: "NCERT & Books",
      value: books.toLocaleString("en-IN"),
      growth: "↗ 7.8%",
      icon: "📘",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      path: "/admin/content",
    },
    {
      title: "Payments",
      value: payments.toLocaleString("en-IN"),
      growth: "↗ 9.4%",
      icon: "💳",
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
      path: "/admin/payments",
    },
    {
      title: "Contact Unlocks",
      value: unlocks.toLocaleString("en-IN"),
      growth: "↗ 8.7%",
      icon: "🔒",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      path: "/admin/contact-unlocks",
    },
  ];

  const topTutorsList = data?.topTutors || [
    { rank: 1, name: "Ankit Sir", rating: 4.9, reviews: 120, studentsCount: 520 },
    { rank: 2, name: "Priya Ma'am", rating: 4.8, reviews: 98, studentsCount: 430 },
    { rank: 3, name: "Ravi Sir", rating: 4.7, reviews: 85, studentsCount: 390 },
    { rank: 4, name: "Neha Ma'am", rating: 4.6, reviews: 76, studentsCount: 350 },
  ];

  const recentRequestsList = data?.recentRequests || [
    { studentName: "Rahul Kumar", classLevel: "Class 10", subject: "Maths", timeAgo: "2 min ago", status: "New" },
    { studentName: "Priya Sharma", classLevel: "Class 11", subject: "Physics", timeAgo: "15 min ago", status: "Pending" },
    { studentName: "Aman Verma", classLevel: "Class 12", subject: "Chemistry", timeAgo: "35 min ago", status: "Pending" },
    { studentName: "Neha Singh", classLevel: "Class 9", subject: "Science", timeAgo: "1 hour ago", status: "New" },
    { studentName: "Vikram Patel", classLevel: "Class 11", subject: "Biology", timeAgo: "2 hours ago", status: "Resolved" },
  ];

  return (
    <div className="space-y-6 pb-8 bg-[#F8F9FA] dark:bg-[#0A0A0A] min-h-screen text-gray-900 dark:text-white transition-colors duration-200">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Welcome back, Admin! Here's what's happening on MentorNearby.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-200 flex items-center gap-2 shadow-xs cursor-pointer hover:border-gray-300">
            <span>📅 May 20 – May 26, 2025</span>
          </div>

          <button
            onClick={fetchDashboardData}
            className="bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-white rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className={loading ? "animate-spin inline-block" : ""}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 5 TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {topKPIs.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">{card.title}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">{card.value}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{card.growth}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${card.iconBg}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT: 2 COLUMNS (LEFT 8 COLS + RIGHT 4 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── LEFT COLUMN (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Platform Overview */}
          <div className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Platform Overview</h2>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Users</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Students</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Tutors</span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-300 font-medium flex items-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-zinc-900">
                <span>Last 7 Days</span>
                <span className="text-[10px] text-gray-400">▼</span>
              </div>
            </div>

            <PlatformOverviewChart series={data?.growthSeries} />
          </div>

          {/* Sub-grid: 4 Sub-KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {subKPIs.map((card, idx) => (
              <div
                key={idx}
                onClick={() => navigate(card.path)}
                className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 leading-tight">{card.title}</p>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mt-1">{card.value}</h4>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{card.growth}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${card.iconBg}`}>{card.icon}</div>
              </div>
            ))}
          </div>

          {/* Bottom Sub-grid: Top Performing Tutors (6) + User Growth (6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Performing Tutors */}
            <div className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Performing Tutors</h3>
                <Link to="/admin/tutors" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 no-underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3.5">
                {topTutorsList.map((tutor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-3">{tutor.rank || idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {tutor.avatar ? <img src={tutor.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (tutor.name?.[0]?.toUpperCase() || "T")}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{tutor.name}</p>
                        <p className="text-[10px] text-amber-500 font-semibold">{tutor.rating} ★ <span className="text-gray-400 font-normal">({tutor.reviews})</span></p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-bold text-gray-700 dark:text-zinc-300">
                        <span className="text-[10px] text-gray-400 font-normal">Students </span>{tutor.studentsCount}
                      </p>
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((tutor.studentsCount / 600) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Growth */}
            <div className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">User Growth</h3>
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-gray-600 dark:text-zinc-300 font-medium flex items-center gap-1 bg-gray-50 dark:bg-zinc-900">
                  <span>Last 30 Days</span>
                  <span className="text-[10px] text-gray-400">▼</span>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Users</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-gray-900 dark:text-white">{totalUsers.toLocaleString("en-IN")}</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">↗ 8.5%</span>
                </div>
              </div>

              <UserGrowthAreaChart data={data?.growth30d} />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 COLS) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Revenue Overview */}
          <div className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
              <div className="border border-gray-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-gray-600 dark:text-zinc-300 font-medium flex items-center gap-1 bg-gray-50 dark:bg-zinc-900">
                <span>Last 7 Days</span>
                <span className="text-[10px] text-gray-400">▼</span>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Revenue</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">₹{Number(revenue).toLocaleString("en-IN")}</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">↗ 10.3% from last week</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-700 dark:text-zinc-300 mt-4 mb-2">Revenue by Source</p>
            <RevenueDonutChart breakdown={data?.revenueBySource} />
          </div>

          {/* Card 2: Recent Tutor Requests */}
          <div className="astro-glow bg-white dark:bg-[#141414] border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Tutor Requests</h3>
              <Link to="/admin/requests" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 no-underline">
                View All
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentRequestsList.map((req, idx) => {
                const isNew = req.status === "New";
                const isPending = req.status === "Pending";
                const badgeStyle = isNew
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                  : isPending
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";

                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {req.avatar ? <img src={req.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : (req.studentName?.[0]?.toUpperCase() || "S")}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{req.studentName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">{req.classLevel} • {req.subject}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{req.timeAgo || "Recently"}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {req.status || "New"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
