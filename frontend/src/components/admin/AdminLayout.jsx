// ============================================================
// components/admin/AdminLayout.jsx
// MentorNearby Enterprise Admin Control Center Layout
// Theme System with Twinkling Stars Background in Dark Mode
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StarsBackground from '../StarsBackground';
import '../../styles/AdminDesign.css';
import '../../pages/Admin/admin.css';

const AdminLayout = ({ children }) => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);

  const localRole = (localStorage.getItem('role') || localStorage.getItem('mn_role') || '').toString().trim().toUpperCase();
  const userRole = (user?.role || user?.user?.role || localRole || '').toString().trim().toUpperCase();

  // Strict session and role check
  useEffect(() => {
    if (!isLoading) {
      const isAuthorized = (isAuthenticated && userRole === 'ADMIN') || localRole === 'ADMIN';
      if (!isAuthorized) {
        navigate('/admin', { replace: true, state: { from: location } });
      }
    }
  }, [isLoading, isAuthenticated, userRole, localRole, navigate, location]);

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { path: '/admin/users', label: 'Users Directory', icon: '👥' },
        { path: '/admin/students', label: 'Students Marketplace', icon: '👨‍🎓' },
        { path: '/admin/tutors', label: 'Tutors Marketplace', icon: '👨‍🏫' },
        { path: '/admin/requests', label: 'Tutor Requests', icon: '📋' },
        { path: '/admin/courses', label: 'Courses & PYQs', icon: '🎓' },
        { path: '/admin/study-resources', label: 'Study Resources & Store', icon: '📖' },
        { path: '/admin/content', label: 'NCERT & Free Books', icon: '📚' },
        { path: '/admin/footer-content', label: 'Footer & CMS', icon: '📄' },
      ],
    },
    {
      group: 'VERIFICATION & SAFETY',
      items: [
        { path: '/admin/kyc', label: 'KYC Verification', icon: '🛡️' },
        { path: '/admin/reports', label: 'Reports & Safety', icon: '🚨' },
      ],
    },
    {
      group: 'FINANCE',
      items: [
        { path: '/admin/subscriptions', label: 'Subscriptions & Paid Users', icon: '💎' },
        { path: '/admin/payments', label: 'Payments & Revenue', icon: '💳' },
        { path: '/admin/contact-unlocks', label: 'Contact Unlocks', icon: '📱' },
      ],
    },
    {
      group: 'INSIGHTS',
      items: [
        { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
        { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
      ],
    },
    {
      group: 'ADMIN',
      items: [
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
      ],
    },
  ];

  // Keyboard shortcut Ctrl + / listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/admin/users?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  // Prevent flash of admin dashboard while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F8FAFC] dark:bg-[#000000]">
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#FED7AA', borderTopColor: '#FF6B00' }}></div>
      </div>
    );
  }

  // If not authenticated as ADMIN, render nothing while redirecting
  if (!isAuthenticated && localRole !== 'ADMIN' && userRole !== 'ADMIN') {
    return null;
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'dark bg-[#000000] text-white' : 'light bg-[#F8FAFC] text-gray-900'} font-sans antialiased relative`}>
      
      {/* 🌟 BLINKING TWINKLING STARS IN DARK MODE (zIndex: 0) */}
      {isDark && <StarsBackground />}

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================ */}
      {/* SIDEBAR - Fixed 260px                                         */}
      {/* ============================================================ */}
      <aside
        className={`admin-sidebar w-[260px] min-w-[260px] max-w-[260px] fixed left-0 top-0 h-screen ${
          isDark ? 'bg-[#0B0F19]/95 border-white/10' : 'bg-[#FFFFFF] border-gray-200'
        } border-r flex flex-col z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: '260px', minWidth: '260px', maxWidth: '260px' }}
      >
        {/* Logo Wrapper */}
        <div className={`h-[70px] px-6 flex items-center justify-between border-b ${isDark ? 'border-white/10 bg-[#0B0F19]' : 'border-gray-200 bg-[#FFFFFF]'} flex-shrink-0`}>
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 no-underline">
            <img
              src="/logo.png"
              alt="MentorNearby"
              className="h-8 w-auto max-w-[140px] object-contain flex-shrink-0"
              style={{ height: '32px', maxHeight: '32px', maxWidth: '140px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className={`text-sm font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Mentor<span className="text-[#E11D48]">Nearby</span>
              </span>
              <span className={`text-[8px] font-bold tracking-widest uppercase mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                ADMIN CONTROL CENTER
              </span>
            </div>
          </Link>

          {/* Mobile Close Icon */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <p className={`text-[11px] font-bold tracking-widest mb-2 px-3 uppercase ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {grp.group}
              </p>
              <div className="space-y-1">
                {grp.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/'));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs font-medium transition no-underline ${
                        isActive
                          ? isDark
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B] font-bold border-l-4 border-[#F59E0B] shadow-xs'
                            : 'bg-amber-100 text-amber-950 font-bold border-l-4 border-amber-500 shadow-xs'
                          : isDark
                            ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar User Footer */}
        <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-[#07090E]' : 'border-gray-200 bg-gray-50'} flex-shrink-0`}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-black font-black flex items-center justify-center text-xs shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <p className={`text-xs font-black leading-none truncate max-w-[120px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || 'Admin'}
                </p>
                <p className={`text-[10px] font-medium mt-0.5 capitalize ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {user?.role || 'Super Admin'}
                </p>
              </div>
            </div>
            <span className="text-gray-400 text-xs">›</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT WRAPPER - Offset 260px (zIndex: 10 on stars)   */}
      {/* ============================================================ */}
      <div 
        className={`admin-main-wrapper flex-1 ml-0 md:ml-[260px] min-h-screen flex flex-col min-w-0 ${
          isDark ? 'bg-transparent' : 'bg-[#F8FAFC]'
        } overflow-x-hidden relative z-10`}
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth > 768 ? '260px' : '0' }}
      >
        
        {/* Top Navbar */}
        <header className={`${isDark ? 'bg-[#0B0F19]/90 border-white/10' : 'bg-[#FFFFFF] border-gray-200'} backdrop-blur-md border-b px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 flex-shrink-0`}>
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} text-xl p-1.5 rounded-lg cursor-pointer`}
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              ☰
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users, tutors, courses..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={`w-full ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:bg-[#111726]'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                } border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#F59E0B] transition`}
              />
            </form>
          </div>

          {/* Right Header Badges, Theme Toggle & Profile */}
          <div className="flex items-center gap-2.5 md:gap-3.5">
            
            {/* ☀️ / 🌙 THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition cursor-pointer border flex items-center justify-center text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notifications Link */}
            <Link
              to="/admin/notifications"
              className={`relative p-2 rounded-xl transition no-underline border flex items-center justify-center ${
                isDark
                  ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
              title="Notifications"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute -top-1 -right-1 bg-[#E11D48] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black">
                12
              </span>
            </Link>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full border transition cursor-pointer ${
                  isDark
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-black font-black flex items-center justify-center text-xs shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-xs font-black leading-none truncate max-w-[120px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'Admin'}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 capitalize ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {user?.role || 'Super Admin'}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 ml-0.5">▼</span>
              </button>

              {dropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-2xl shadow-xl p-2 z-50 animate-fadeIn ${
                  isDark ? 'bg-[#111726] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className={`px-3 py-2 border-b mb-1 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user?.name || 'Administrator'}
                    </p>
                    <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {user?.email || 'admin@mentornearby.com'}
                    </p>
                  </div>
                  <Link
                    to="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs no-underline ${
                      isDark ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    ⚙️ Settings
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setDropdownOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs no-underline ${
                      isDark ? 'text-zinc-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    📜 Audit Logs
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold mt-1 text-left cursor-pointer border-none bg-transparent"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
