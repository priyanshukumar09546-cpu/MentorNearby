// ============================================================
// utils/notificationHelpers.jsx
// MentorNearby Notification Styling, Badges & Format Helpers
// Matches UI Reference Screenshots media_1787467268458.png
// ============================================================

import React from 'react';

export const NOTIFICATION_TYPE_CONFIG = {
  STUDY_RESOURCE: {
    label: 'Study Resource',
    icon: '📖',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    bgColor: '#EFF6FF', // Light Blue
    iconColor: '#2563EB', // Blue
    badgeClass: 'badge-blue',
  },
  TUTOR_REQUEST: {
    label: 'Tutor / Request',
    icon: '✓',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
    bgColor: '#ECFDF5', // Light Green
    iconColor: '#059669', // Emerald
    badgeClass: 'badge-green',
  },
  MESSAGE: {
    label: 'Message',
    icon: '💬',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    bgColor: '#F5F3FF', // Light Purple
    iconColor: '#7C3AED', // Purple
    badgeClass: 'badge-purple',
  },
  PAYMENT: {
    label: 'Payment',
    icon: '💳',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
      </svg>
    ),
    bgColor: '#FFF7ED', // Light Orange
    iconColor: '#EA580C', // Orange
    badgeClass: 'badge-orange',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: '📢',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    ),
    bgColor: '#FEF2F2', // Light Red
    iconColor: '#DC2626', // Red
    badgeClass: 'badge-red',
  },
  KYC_VERIFICATION: {
    label: 'KYC / Verification',
    icon: '🛡️',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    bgColor: '#F0FDFA', // Light Teal
    iconColor: '#0D9488', // Teal
    badgeClass: 'badge-teal',
  },
  SECURITY: {
    label: 'Security',
    icon: '🔒',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
    bgColor: '#FEFCE8', // Light Amber
    iconColor: '#D97706', // Amber
    badgeClass: 'badge-amber',
  },
  SYSTEM_UPDATE: {
    label: 'System Update',
    icon: '⚙️',
    svgIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
    bgColor: '#F1F5F9', // Light Slate
    iconColor: '#475569', // Slate
    badgeClass: 'badge-slate',
  },
};

// Aliases for backward compatibility
NOTIFICATION_TYPE_CONFIG.INFO = NOTIFICATION_TYPE_CONFIG.ANNOUNCEMENT;
NOTIFICATION_TYPE_CONFIG.SUCCESS = NOTIFICATION_TYPE_CONFIG.TUTOR_REQUEST;
NOTIFICATION_TYPE_CONFIG.WARNING = NOTIFICATION_TYPE_CONFIG.SECURITY;
NOTIFICATION_TYPE_CONFIG.KYC = NOTIFICATION_TYPE_CONFIG.KYC_VERIFICATION;
NOTIFICATION_TYPE_CONFIG.CONTACT = NOTIFICATION_TYPE_CONFIG.MESSAGE;
NOTIFICATION_TYPE_CONFIG.SYSTEM = NOTIFICATION_TYPE_CONFIG.SYSTEM_UPDATE;

export const getTypeConfig = (type) => {
  const norm = String(type || 'ANNOUNCEMENT').toUpperCase();
  return NOTIFICATION_TYPE_CONFIG[norm] || NOTIFICATION_TYPE_CONFIG.ANNOUNCEMENT;
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHour = Math.floor(diffInMin / 60);
  if (diffInHour < 24) return `${diffInHour}h ago`;
  const diffInDay = Math.floor(diffInHour / 24);
  if (diffInDay < 30) return `${diffInDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
