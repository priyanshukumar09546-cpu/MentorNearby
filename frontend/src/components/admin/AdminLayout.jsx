// ============================================================
// components/admin/AdminLayout.jsx
// Enterprise Admin Layout with Integrated Authentication Guard
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
  const [collapsed, setCollapsed] = useState(false);
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
        { path: '/admin/courses', label: 'Courses & PYQs', icon: '🎓' },
        { path: '/admin/study-resources', label: 'Study Resources & Store', icon: '📖' },
        { path: '/admin/content', label: 'NCERT & Free Books', icon: '📚' },
        { path: '/admin/footer-content', label: 'Footer & CMS', icon: '📄' },
        { path: '/admin/requests', label: 'Tutor Requests', icon: '📋' },
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
      group: 'SYSTEM',
      items: [
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📜' },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap(g => g.items);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F7F5F0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#FED7AA', borderTopColor: '#FF6B00' }}></div>
      </div>
    );
  }

  // If not authenticated as ADMIN, render nothing while redirecting
  if (!isAuthenticated || userRole !== 'ADMIN') {
    return null;
  }

  const currentPage = allNavItems.find((item) => item.path === location.pathname) || {
    label: 'Control Center',
    icon: '👑',
  };

  return (
    <div className="admin-app-root admin-shell-container">
      
      {/* Admin Sidebar Navigation */}
      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-[#E7E2D8] bg-[#FCFBF8] flex-shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 no-underline">
            <img
              src="/logo.png"
              alt="MentorNearby Logo"
              className="w-10 h-10 object-contain rounded-xl flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-[#0F172A] tracking-tight leading-tight">
                  Mentor<span className="text-[#FF6B00]">Nearby</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#85857D] uppercase mt-0.5">
                  ADMIN CONTROL CENTER
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Item Groups (Independent Scroll) */}
        <nav className="admin-sidebar-nav custom-scrollbar flex-1 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.group} className="admin-nav-group">
              {!collapsed && (
                <div className="admin-nav-heading">{grp.group}</div>
              )}
              {grp.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {!collapsed && <span className="admin-nav-label">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar User Footer */}
        <div className="p-3 border-t border-[#E7E2D8] bg-[#FCFBF8] flex-shrink-0">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F3ED] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white font-black flex items-center justify-center text-xs shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              {!collapsed && (
                <div className="text-left">
                  <p className="text-xs font-black text-[#0F172A] uppercase leading-none">ADMIN</p>
                  <p className="text-[10px] text-[#85857D] font-medium mt-0.5">Super Admin</p>
                </div>
              )}
            </div>
            {!collapsed && <span className="text-slate-400 text-xs">›</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#E7E2D8] px-6 py-3 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileOpen(!mobileOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-slate-600 hover:text-slate-900 text-lg p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Toggle Sidebar"
            >
              ☰
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users, tutors, courses..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Shortcut with Badge */}
            <Link
              to="/admin/notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Notifications"
            >
              <span className="text-base">🔔</span>
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                12
              </span>
            </Link>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white font-black flex items-center justify-center text-xs shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-[#0F172A] leading-none">Admin Super</p>
                  <p className="text-[10px] text-[#85857D] font-medium mt-0.5">Super Admin</p>
                </div>
                <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E6E2D9] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-[#F3F1EB] mb-1">
                    <p className="text-xs font-bold text-[#1C1C1A]">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-[#85857D] truncate">{user?.email || 'admin@mentornearby.com'}</p>
                  </div>
                  <Link
                    to="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#575752] hover:bg-[#FAF9F6] hover:text-[#1C1C1A]"
                  >
                    ⚙️ Settings
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#575752] hover:bg-[#FAF9F6] hover:text-[#1C1C1A]"
                  >
                    📜 Audit Logs
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-bold mt-1 text-left cursor-pointer"
                  >
                    🚪 Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="admin-page-content">
          {children}
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
