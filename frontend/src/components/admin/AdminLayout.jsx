// ============================================================
// components/admin/AdminLayout.jsx
// MentorNearby Enterprise Admin Control Center Layout
// Fixed 260px Sidebar, Exact Logo Bounds (h-8 max-w-[140px]), No Main Contamination
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminDesign.css';
import '../../pages/Admin/admin.css';

const AdminLayout = ({ children }) => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
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
      <div className="flex justify-center items-center min-h-screen bg-[#F8FAFC]">
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#FED7AA', borderTopColor: '#FF6B00' }}></div>
      </div>
    );
  }

  // If not authenticated as ADMIN, render nothing while redirecting
  if (!isAuthenticated && localRole !== 'ADMIN' && userRole !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-gray-900 font-sans antialiased relative">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================ */}
      {/* SIDEBAR - Fixed 260px                                         */}
      {/* ============================================================ */}
      <aside
        className={`admin-sidebar w-[260px] min-w-[260px] max-w-[260px] fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: '260px', minWidth: '260px', maxWidth: '260px' }}
      >
        {/* Logo Wrapper (h-[70px] px-6 border-b) */}
        <div className="h-[70px] px-6 flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
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
              <span className="text-sm font-black text-gray-900 tracking-tight leading-none">
                Mentor<span className="text-[#FF6B00]">Nearby</span>
              </span>
              <span className="text-[8px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
                ADMIN
              </span>
            </div>
          </Link>

          {/* Mobile Close Icon */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <p className="text-[11px] font-bold text-gray-400 tracking-widest mb-2 px-3 uppercase">
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
                          ? 'bg-[#fef9c3] text-amber-950 font-bold border-l-4 border-amber-500 shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        <div className="p-3 border-t border-gray-200 bg-gray-50/70 flex-shrink-0">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white font-black flex items-center justify-center text-xs shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-gray-900 uppercase leading-none">ADMIN</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Super Admin</p>
              </div>
            </div>
            <span className="text-gray-400 text-xs">›</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT WRAPPER - Offset 260px                           */}
      {/* ============================================================ */}
      <div 
        className="admin-main-wrapper flex-1 ml-0 md:ml-[260px] min-h-screen flex flex-col min-w-0 bg-[#f8fafc] overflow-x-hidden"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth > 768 ? '260px' : '0' }}
      >
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 text-xl p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
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
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition"
              />
            </form>
          </div>

          {/* Right Header Badges & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Notifications Link */}
            <Link
              to="/admin/notifications"
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition no-underline"
              title="Notifications"
            >
              <span className="text-base">🔔</span>
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                12
              </span>
            </Link>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white font-black flex items-center justify-center text-xs shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-gray-900 leading-none">Admin Super</p>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Super Admin</p>
                </div>
                <span className="text-[10px] text-gray-400 ml-0.5">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.email || 'admin@tutornearby.in'}</p>
                  </div>
                  <Link
                    to="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 no-underline"
                  >
                    ⚙️ Settings
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 no-underline"
                  >
                    📜 Audit Logs
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-bold mt-1 text-left cursor-pointer border-none bg-transparent"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 bg-[#f8fafc] p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
