// ============================================================
// pages/Notifications/NotificationsPage.jsx
// MentorNearby Full User Notifications Hub (Web & Mobile)
// Exact Recreation of Reference Image media_1787467268458.png
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  getUserNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../../api/notifications';
import {
  getTypeConfig,
  formatTimeAgo,
  formatFullDate,
  NOTIFICATION_TYPE_CONFIG,
} from '../../utils/notificationHelpers';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUnreadCount } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'read'
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // Initial load or param sync
  const initialNotifId = searchParams.get('id');

  const fetchPageNotifications = async () => {
    try {
      setLoading(true);
      const res = await getUserNotifications({
        limit: 50,
        tab: activeTab,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        search: searchQuery.trim() || undefined,
      });

      const list = res?.data?.notifications || res?.notifications || [];
      const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
      setNotifications(list);
      setUnreadCount(count);

      // Select requested or first notification
      if (list.length > 0) {
        if (initialNotifId) {
          const match = list.find((n) => n._id === initialNotifId);
          setSelectedNotif(match || list[0]);
        } else if (!selectedNotif || !list.some((n) => n._id === selectedNotif._id)) {
          setSelectedNotif(list[0]);
        }
      } else {
        setSelectedNotif(null);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageNotifications();
  }, [activeTab, selectedType]);

  // Handle single notification click
  const handleSelectNotification = async (notif) => {
    setSelectedNotif(notif);
    setMobileDetailsOpen(true);

    if (!notif.isRead) {
      try {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await apiMarkAsRead(notif._id);
        fetchUnreadCount();
      } catch (e) {
        console.error('Failed to mark read:', e);
      }
    }
  };

  // Handle Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await apiMarkAllAsRead();
      fetchUnreadCount();
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  // Handle Delete
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const remaining = notifications.filter((n) => n._id !== id);
      setNotifications(remaining);
      if (selectedNotif?._id === id) {
        setSelectedNotif(remaining[0] || null);
        setMobileDetailsOpen(false);
      }
      await apiDeleteNotification(id);
      fetchUnreadCount();
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  // Handle Action Button click in Details view
  const handleActionClick = () => {
    if (!selectedNotif) return;
    if (selectedNotif.actionUrl) {
      if (selectedNotif.actionUrl.startsWith('http')) {
        window.open(selectedNotif.actionUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(selectedNotif.actionUrl);
      }
    }
  };

  // Filter types list for mobile & desktop
  const filterTypeList = [
    { key: 'ALL', label: 'All Types', icon: '🔔' },
    { key: 'STUDY_RESOURCE', label: 'Study Resources', icon: '📖' },
    { key: 'TUTOR_REQUEST', label: 'Tutor / Requests', icon: '✓' },
    { key: 'MESSAGE', label: 'Messages', icon: '💬' },
    { key: 'PAYMENT', label: 'Payments', icon: '💳' },
    { key: 'ANNOUNCEMENT', label: 'Announcements', icon: '📢' },
    { key: 'KYC_VERIFICATION', label: 'Account / KYC', icon: '🛡️' },
    { key: 'SYSTEM_UPDATE', label: 'System', icon: '⚙️' },
  ];

  const selectedConf = selectedNotif ? getTypeConfig(selectedNotif.type) : null;

  return (
    <div className="mn-notif-page-root">
      <div className="mn-notif-container">

        {/* ---------------------------------------------------------- */}
        {/* TOP BAR: Title, Tabs & Mark All                            */}
        {/* ---------------------------------------------------------- */}
        <div className="mn-notif-topbar">
          <div className="mn-notif-title-wrap">
            <nav className="mn-notif-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span>›</span>
              <span className="current">Notifications</span>
            </nav>
            <h1 className="mn-notif-page-title">All Notifications</h1>
          </div>

          <div className="mn-notif-topbar-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="mn-notif-mark-all-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}

            <button
              type="button"
              className="mn-notif-mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <span>⚙️ Filter</span>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* TABS ROW (All / Unread / Read)                             */}
        {/* ---------------------------------------------------------- */}
        <div className="mn-notif-tabs-bar">
          <div className="mn-notif-tabs-group">
            <button
              type="button"
              className={`mn-notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`mn-notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread
              {unreadCount > 0 && (
                <span className="mn-notif-tab-badge">{unreadCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`mn-notif-tab ${activeTab === 'read' ? 'active' : ''}`}
              onClick={() => setActiveTab('read')}
            >
              Read
            </button>
          </div>

          {/* Desktop Type Filter Dropdown */}
          <div className="mn-notif-desktop-type-filter">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mn-notif-select"
            >
              {filterTypeList.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* MAIN TWO-PANE GRID                                         */}
        {/* ---------------------------------------------------------- */}
        <div className="mn-notif-grid">

          {/* LEFT PANE: NOTIFICATIONS LIST */}
          <div className={`mn-notif-list-pane ${mobileDetailsOpen ? 'mobile-hidden' : ''}`}>
            {loading ? (
              <div className="mn-notif-loading-box">
                <div className="mn-notif-spinner" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="mn-notif-empty-box">
                <div className="mn-notif-empty-icon">🔔</div>
                <h3>No {activeTab !== 'all' ? activeTab : ''} notifications</h3>
                <p>You’re all caught up! New alerts and updates will appear here.</p>
              </div>
            ) : (
              <div className="mn-notif-items-wrapper">
                {notifications.map((notif) => {
                  const conf = getTypeConfig(notif.type);
                  const isSelected = selectedNotif?._id === notif._id;

                  return (
                    <div
                      key={notif._id}
                      className={`mn-notif-card ${!notif.isRead ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectNotification(notif)}
                    >
                      {/* Icon */}
                      <div
                        className="mn-notif-card-icon"
                        style={{
                          backgroundColor: conf.bgColor,
                          color: conf.iconColor,
                        }}
                      >
                        {conf.svgIcon}
                      </div>

                      {/* Content */}
                      <div className="mn-notif-card-content">
                        <div className="mn-notif-card-title">{notif.title}</div>
                        <div className="mn-notif-card-msg">{notif.message}</div>
                        <div className="mn-notif-card-footer">
                          <span className="mn-notif-card-time">
                            {formatTimeAgo(notif.createdAt || notif.sentAt)}
                          </span>
                        </div>
                      </div>

                      {/* Right Indicator: Unread Dot or Trash Button */}
                      <div className="mn-notif-card-right">
                        {!notif.isRead && <span className="mn-notif-blue-dot" />}
                        <button
                          type="button"
                          className="mn-notif-card-del-btn"
                          onClick={(e) => handleDelete(notif._id, e)}
                          title="Delete notification"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANE: NOTIFICATION DETAILS (Web) */}
          <div className={`mn-notif-details-pane ${mobileDetailsOpen ? 'mobile-visible' : ''}`}>
            {selectedNotif ? (
              <div className="mn-notif-detail-card">

                {/* Mobile Back Button */}
                <div className="mn-notif-detail-mobile-header">
                  <button
                    type="button"
                    className="mn-notif-back-btn"
                    onClick={() => setMobileDetailsOpen(false)}
                  >
                    ← Back to Notifications
                  </button>
                </div>

                <div className="mn-notif-detail-header">
                  <div
                    className="mn-notif-detail-big-icon"
                    style={{
                      backgroundColor: selectedConf.bgColor,
                      color: selectedConf.iconColor,
                    }}
                  >
                    {selectedConf.svgIcon}
                  </div>

                  <h2 className="mn-notif-detail-title">{selectedNotif.title}</h2>
                  <p className="mn-notif-detail-msg">{selectedNotif.message}</p>
                </div>

                {/* Embedded Resource Card Preview (If relevant) */}
                <div className="mn-notif-detail-embedded-box">
                  <div className="mn-notif-embedded-left">
                    <span className="mn-notif-embedded-icon">📄</span>
                    <div>
                      <div className="mn-notif-embedded-title">
                        {selectedNotif.classLevel
                          ? `${selectedNotif.classLevel} ${selectedNotif.title}`
                          : selectedNotif.title}
                      </div>
                      <div className="mn-notif-embedded-sub">
                        {selectedNotif.actionUrl
                          ? selectedNotif.actionUrl
                          : 'Official Study Material & Platform Update'}
                      </div>
                    </div>
                  </div>

                  {selectedNotif.actionUrl && (
                    <button
                      type="button"
                      className="mn-notif-action-btn"
                      onClick={handleActionClick}
                    >
                      {selectedNotif.actionText || 'View Now'}
                    </button>
                  )}
                </div>

                {/* Date & Meta Info */}
                <div className="mn-notif-detail-timestamp">
                  {formatFullDate(selectedNotif.createdAt || selectedNotif.sentAt)}
                </div>

              </div>
            ) : (
              <div className="mn-notif-detail-empty">
                <div className="mn-notif-empty-icon">👈</div>
                <h3>Select a notification</h3>
                <p>Click on any notification from the list to view its complete details.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ---------------------------------------------------------- */}
      {/* MOBILE FILTER MODAL / BOTTOM SHEET                         */}
      {/* ---------------------------------------------------------- */}
      {mobileFilterOpen && (
        <div
          className="mn-notif-filter-overlay"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            className="mn-notif-filter-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mn-notif-filter-header">
              <h3>Filter by Type</h3>
              <button
                type="button"
                className="mn-notif-filter-close"
                onClick={() => setMobileFilterOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mn-notif-filter-options">
              {filterTypeList.map((t) => (
                <label
                  key={t.key}
                  className={`mn-notif-filter-row ${selectedType === t.key ? 'selected' : ''}`}
                >
                  <div className="mn-notif-filter-row-left">
                    <span className="mn-notif-filter-row-icon">{t.icon}</span>
                    <span className="mn-notif-filter-row-label">{t.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="notificationType"
                    value={t.key}
                    checked={selectedType === t.key}
                    onChange={() => setSelectedType(t.key)}
                  />
                </label>
              ))}
            </div>

            <div className="mn-notif-filter-footer">
              <button
                type="button"
                className="mn-notif-filter-apply-btn"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationsPage;
