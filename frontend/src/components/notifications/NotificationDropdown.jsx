// ============================================================
// components/notifications/NotificationDropdown.jsx
// MentorNearby User Notification Bell Dropdown
// Exact Recreation of Reference Image media_1787467268458.png
// ============================================================

import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { getTypeConfig, formatTimeAgo } from '../../utils/notificationHelpers';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    recentNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Only close if not clicking the trigger bell
        if (!e.target.closest('.nav-notification-btn')) {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    onClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate(`/notifications?id=${notification._id}`);
    }
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <div className="mn-notif-dropdown-root" ref={dropdownRef}>
      {/* Dropdown Header */}
      <div className="mn-notif-dd-header">
        <div className="mn-notif-dd-title-box">
          <h3 className="mn-notif-dd-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="mn-notif-dd-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="mn-notif-dd-mark-all"
            onClick={handleMarkAll}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Dropdown Body */}
      <div className="mn-notif-dd-body">
        {loading && recentNotifications.length === 0 ? (
          <div className="mn-notif-dd-empty">
            <div className="mn-notif-dd-spinner" />
            <p>Loading alerts...</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="mn-notif-dd-empty">
            <span className="mn-notif-dd-empty-icon">🔔</span>
            <h4>No notifications yet</h4>
            <p>We'll notify you about notes, tutor updates, and payments here.</p>
          </div>
        ) : (
          <div className="mn-notif-dd-list">
            {recentNotifications.map((notif) => {
              const conf = getTypeConfig(notif.type);
              return (
                <div
                  key={notif._id}
                  className={`mn-notif-dd-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {/* Category Icon */}
                  <div
                    className="mn-notif-dd-icon-box"
                    style={{
                      backgroundColor: conf.bgColor,
                      color: conf.iconColor,
                    }}
                  >
                    {conf.svgIcon}
                  </div>

                  {/* Text Content */}
                  <div className="mn-notif-dd-content">
                    <div className="mn-notif-dd-item-title">{notif.title}</div>
                    <div className="mn-notif-dd-item-msg">{notif.message}</div>
                    <div className="mn-notif-dd-item-time">
                      {formatTimeAgo(notif.createdAt || notif.sentAt)}
                    </div>
                  </div>

                  {/* Unread Blue Dot Indicator */}
                  {!notif.isRead && <span className="mn-notif-dd-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="mn-notif-dd-footer">
        <Link
          to="/notifications"
          className="mn-notif-dd-view-all"
          onClick={onClose}
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
