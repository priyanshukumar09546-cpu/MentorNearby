// ============================================================
// pages/Admin/AdminNotificationsPage.jsx
// MentorNearby Admin Notification Management Center
// Exact Recreation of Reference Image media_1787467268458.png
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  getAdminNotificationStats,
  getAdminNotificationHistory,
  createAdminNotification,
  resendAdminNotification,
  deleteAdminNotification,
} from '../../api/notifications';
import { useToast } from '../../context/ToastContext';
import {
  getTypeConfig,
  formatFullDate,
  NOTIFICATION_TYPE_CONFIG,
} from '../../utils/notificationHelpers';
import './AdminNotifications.css';

const AdminNotificationsPage = () => {
  const { showToast } = useToast();
  const formRef = useRef(null);

  // Stats State
  const [stats, setStats] = useState({
    totalSent: 125,
    scheduled: 8,
    delivered: 117,
    failed: 3,
  });

  // History State
  const [history, setHistory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState('ALL');
  const [filterAudience, setFilterAudience] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'STUDY_RESOURCE',
    targetAudience: 'STUDENTS',
    classLevel: 'All Classes',
    targetUserEmail: '',
    icon: '',
    image: '',
    actionText: 'View Now',
    actionUrl: '',
    scheduleForLater: false,
    scheduledAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal State
  const [viewingItem, setViewingItem] = useState(null);

  // Load Stats & History
  const loadData = async () => {
    try {
      setLoadingHistory(true);
      const [statsRes, histRes] = await Promise.all([
        getAdminNotificationStats(),
        getAdminNotificationHistory({
          page: currentPage,
          limit: 8,
          type: filterType !== 'ALL' ? filterType : undefined,
          audience: filterAudience !== 'ALL' ? filterAudience : undefined,
          startDate: filterDate || undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      const histData = histRes?.data || histRes || {};
      setHistory(histData.history || []);
      setTotalCount(histData.total || 0);
      setTotalPages(histData.pages || 1);
    } catch (err) {
      console.warn('Failed to load admin notifications:', err?.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, filterType, filterAudience, filterDate]);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Reset Form
  const handleResetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'STUDY_RESOURCE',
      targetAudience: 'STUDENTS',
      classLevel: 'All Classes',
      targetUserEmail: '',
      icon: '',
      image: '',
      actionText: 'View Now',
      actionUrl: '',
      scheduleForLater: false,
      scheduledAt: '',
    });
  };

  // Submit Notification Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a notification title', 'warning');
      return;
    }
    if (!formData.message.trim()) {
      showToast('Please enter a notification message', 'warning');
      return;
    }
    if (formData.scheduleForLater && !formData.scheduledAt) {
      showToast('Please select a date and time to schedule', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createAdminNotification(formData);
      showToast(res?.message || 'Notification dispatched successfully!', 'success');
      handleResetForm();
      loadData();
    } catch (err) {
      console.error('Failed to send notification:', err);
      showToast(err?.response?.data?.message || 'Failed to dispatch notification', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend Notification
  const handleResend = async (id) => {
    if (!window.confirm('Are you sure you want to resend this notification to its target audience?')) return;
    try {
      const res = await resendAdminNotification(id);
      showToast(res?.message || 'Notification resent successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to resend notification', 'error');
    }
  };

  // Delete Notification
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification record?')) return;
    try {
      await deleteAdminNotification(id);
      showToast('Notification deleted', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  // Scroll to Form on "+ Create New Notification" click
  const handleCreateNewClick = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    formRef.current?.querySelector('input[name="title"]')?.focus();
  };

  return (
    <div className="mn-admin-notif-root">
      
      {/* ---------------------------------------------------------- */}
      {/* PAGE HEADER                                                */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-admin-header-row">
        <div>
          <div className="mn-admin-eyebrow">Notification Management</div>
          <h1 className="mn-admin-title">Notifications</h1>
          <p className="mn-admin-subtitle">Create and send notifications to users</p>
        </div>

        <button
          type="button"
          className="mn-admin-btn-primary"
          onClick={handleCreateNewClick}
        >
          <span>+</span> Create New Notification
        </button>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN LAYOUT                                     */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-admin-grid">

        {/* LEFT COLUMN: CREATE NOTIFICATION FORM */}
        <div className="mn-admin-card mn-admin-form-card" ref={formRef}>
          <h2 className="mn-admin-card-title">Create New Notification</h2>

          <form onSubmit={handleSubmit} className="mn-admin-form">
            {/* Title */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">
                Title <span className="req">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
                className="mn-admin-input"
                required
              />
            </div>

            {/* Message with char counter */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">
                Message <span className="req">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter notification message"
                maxLength={500}
                rows={4}
                className="mn-admin-textarea"
                required
              />
              <div className="mn-admin-char-count">
                {formData.message.length}/500
              </div>
            </div>

            {/* Notification Type */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">
                Notification Type <span className="req">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mn-admin-select"
              >
                <option value="STUDY_RESOURCE">📖 Study Resource</option>
                <option value="TUTOR_REQUEST">✓ Tutor / Request</option>
                <option value="MESSAGE">💬 Message</option>
                <option value="PAYMENT">💳 Payment</option>
                <option value="ANNOUNCEMENT">📢 Announcement</option>
                <option value="KYC_VERIFICATION">🛡️ KYC / Verification</option>
                <option value="SECURITY">🔒 Security</option>
                <option value="SYSTEM_UPDATE">⚙️ System Update</option>
              </select>
            </div>

            {/* Target Audience */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">
                Target Audience <span className="req">*</span>
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="mn-admin-select"
              >
                <option value="ALL">All Users</option>
                <option value="STUDENTS">Students</option>
                <option value="TUTORS">Tutors</option>
                <option value="CLASS_9">Students (Class 9)</option>
                <option value="CLASS_10">Students (Class 10)</option>
                <option value="CLASS_11">Students (Class 11)</option>
                <option value="CLASS_12">Students (Class 12)</option>
                <option value="SPECIFIC_USER">Specific User</option>
              </select>
            </div>

            {/* Specific User Email (Conditional) */}
            {formData.targetAudience === 'SPECIFIC_USER' && (
              <div className="mn-admin-field">
                <label className="mn-admin-label">
                  User Email / User ID <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="targetUserEmail"
                  value={formData.targetUserEmail}
                  onChange={handleInputChange}
                  placeholder="Enter student or tutor email"
                  className="mn-admin-input"
                  required
                />
              </div>
            )}

            {/* Class (Optional) */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">Class (Optional)</label>
              <select
                name="classLevel"
                value={formData.classLevel}
                onChange={handleInputChange}
                className="mn-admin-select"
              >
                <option value="All Classes">All Classes</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            {/* Attachment / Icon (Optional) */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">Attachment / Icon (Optional)</label>
              <div className="mn-admin-upload-dropzone">
                <span className="mn-admin-upload-icon">📤</span>
                <div className="mn-admin-upload-text">Upload Image</div>
                <div className="mn-admin-upload-sub">PNG, JPG up to 2MB</div>
              </div>
            </div>

            {/* Action Button Text */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">Action Button Text (Optional)</label>
              <input
                type="text"
                name="actionText"
                value={formData.actionText}
                onChange={handleInputChange}
                placeholder="e.g. View Now"
                className="mn-admin-input"
              />
            </div>

            {/* Action Link */}
            <div className="mn-admin-field">
              <label className="mn-admin-label">Action Link (Optional)</label>
              <input
                type="text"
                name="actionUrl"
                value={formData.actionUrl}
                onChange={handleInputChange}
                placeholder="https://example.com or /study-resources"
                className="mn-admin-input"
              />
            </div>

            {/* Schedule for later Checkbox */}
            <div className="mn-admin-checkbox-row">
              <label className="mn-admin-checkbox-label">
                <input
                  type="checkbox"
                  name="scheduleForLater"
                  checked={formData.scheduleForLater}
                  onChange={handleInputChange}
                />
                <span>Schedule for later</span>
              </label>
            </div>

            {/* Scheduled At DateTime Picker */}
            {formData.scheduleForLater && (
              <div className="mn-admin-field">
                <label className="mn-admin-label">
                  Schedule Date &amp; Time <span className="req">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleInputChange}
                  className="mn-admin-input"
                  required
                />
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="mn-admin-form-actions">
              <button
                type="button"
                className="mn-admin-btn-secondary"
                onClick={handleResetForm}
                disabled={submitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="mn-admin-btn-submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Processing...'
                  : formData.scheduleForLater
                  ? 'Schedule Notification'
                  : 'Send Now'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: STATS CARDS & NOTIFICATION HISTORY TABLE */}
        <div className="mn-admin-right-pane">

          {/* 4 SUMMARY STAT CARDS */}
          <div className="mn-admin-stats-grid">
            {/* 1. Total Sent */}
            <div className="mn-admin-stat-card">
              <div className="mn-admin-stat-top">
                <div>
                  <div className="mn-admin-stat-title">Total Sent</div>
                  <div className="mn-admin-stat-number">{stats.totalSent}</div>
                </div>
                <div className="mn-admin-stat-icon-wrap blue">
                  <span>✈️</span>
                </div>
              </div>
              <div className="mn-admin-stat-desc">All time notifications</div>
            </div>

            {/* 2. Scheduled */}
            <div className="mn-admin-stat-card">
              <div className="mn-admin-stat-top">
                <div>
                  <div className="mn-admin-stat-title">Scheduled</div>
                  <div className="mn-admin-stat-number">{stats.scheduled}</div>
                </div>
                <div className="mn-admin-stat-icon-wrap purple">
                  <span>📅</span>
                </div>
              </div>
              <div className="mn-admin-stat-desc">Upcoming notifications</div>
            </div>

            {/* 3. Delivered */}
            <div className="mn-admin-stat-card">
              <div className="mn-admin-stat-top">
                <div>
                  <div className="mn-admin-stat-title">Delivered</div>
                  <div className="mn-admin-stat-number">{stats.delivered}</div>
                </div>
                <div className="mn-admin-stat-icon-wrap green">
                  <span>✓</span>
                </div>
              </div>
              <div className="mn-admin-stat-desc">Successfully delivered</div>
            </div>

            {/* 4. Failed */}
            <div className="mn-admin-stat-card">
              <div className="mn-admin-stat-top">
                <div>
                  <div className="mn-admin-stat-title">Failed</div>
                  <div className="mn-admin-stat-number">{stats.failed}</div>
                </div>
                <div className="mn-admin-stat-icon-wrap red">
                  <span>✕</span>
                </div>
              </div>
              <div className="mn-admin-stat-desc">Failed to deliver</div>
            </div>
          </div>

          {/* NOTIFICATION HISTORY TABLE CARD */}
          <div className="mn-admin-card mn-admin-history-card">
            <div className="mn-admin-history-header">
              <h2 className="mn-admin-card-title">Notification History</h2>

              {/* Filters Bar */}
              <div className="mn-admin-history-filters">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="mn-admin-filter-select"
                >
                  <option value="ALL">All Types</option>
                  <option value="STUDY_RESOURCE">Study Resource</option>
                  <option value="TUTOR_REQUEST">Tutor / Request</option>
                  <option value="MESSAGE">Message</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="KYC_VERIFICATION">KYC / Verification</option>
                  <option value="SECURITY">Security</option>
                  <option value="SYSTEM_UPDATE">System Update</option>
                </select>

                <select
                  value={filterAudience}
                  onChange={(e) => setFilterAudience(e.target.value)}
                  className="mn-admin-filter-select"
                >
                  <option value="ALL">All Audience</option>
                  <option value="STUDENTS">Students</option>
                  <option value="TUTORS">Tutors</option>
                  <option value="CLASS_9">Class 9</option>
                  <option value="CLASS_10">Class 10</option>
                  <option value="CLASS_11">Class 11</option>
                  <option value="CLASS_12">Class 12</option>
                  <option value="SPECIFIC_USER">Specific User</option>
                </select>

                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="mn-admin-filter-date"
                />
              </div>
            </div>

            {/* Table */}
            <div className="mn-admin-table-container">
              <table className="mn-admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Sent At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan="6" className="mn-admin-td-loading">
                        <div className="mn-admin-table-spinner" />
                        <span>Loading notification history...</span>
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="mn-admin-td-empty">
                        No notifications match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => {
                      const conf = getTypeConfig(item.type);
                      const statusNorm = String(item.status || 'DELIVERED').toUpperCase();

                      return (
                        <tr key={item._id || item.id}>
                          {/* Title */}
                          <td className="mn-admin-td-title">
                            <div className="mn-admin-row-title">{item.title}</div>
                            <div className="mn-admin-row-msg">{item.message}</div>
                          </td>

                          {/* Type */}
                          <td>
                            <span
                              className="mn-admin-type-icon-pill"
                              style={{ color: conf.iconColor }}
                              title={conf.label}
                            >
                              {conf.icon}
                            </span>
                          </td>

                          {/* Audience */}
                          <td className="mn-admin-td-audience">
                            {item.targetAudience === 'ALL'
                              ? 'All Users'
                              : item.targetAudience === 'STUDENTS'
                              ? 'Students'
                              : item.targetAudience === 'TUTORS'
                              ? 'Tutors'
                              : item.classLevel && item.classLevel !== 'All Classes'
                              ? `Students (${item.classLevel})`
                              : item.targetAudience}
                          </td>

                          {/* Sent At */}
                          <td className="mn-admin-td-date">
                            {item.sentAt || item.createdAt
                              ? formatFullDate(item.sentAt || item.createdAt)
                              : 'Pending'}
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`mn-admin-status-pill ${statusNorm.toLowerCase()}`}>
                              {statusNorm === 'DELIVERED'
                                ? 'Delivered'
                                : statusNorm === 'SCHEDULED'
                                ? 'Scheduled'
                                : 'Failed'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="mn-admin-td-actions">
                            <button
                              type="button"
                              className="mn-admin-action-icon-btn"
                              onClick={() => setViewingItem(item)}
                              title="View Notification Details"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              className="mn-admin-action-icon-btn"
                              onClick={() => handleResend(item._id)}
                              title="Resend to Audience"
                            >
                              🔄
                            </button>
                            <button
                              type="button"
                              className="mn-admin-action-icon-btn del"
                              onClick={() => handleDelete(item._id)}
                              title="Delete Record"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="mn-admin-pagination-footer">
              <div className="mn-admin-pagination-info">
                Showing {history.length > 0 ? (currentPage - 1) * 8 + 1 : 0} to{' '}
                {Math.min(currentPage * 8, totalCount)} of {totalCount} results
              </div>

              {totalPages > 1 && (
                <div className="mn-admin-page-pills">
                  <button
                    type="button"
                    className="mn-admin-page-pill"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      className={`mn-admin-page-pill ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mn-admin-page-pill"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ---------------------------------------------------------- */}
      {/* PREVIEW / DETAIL MODAL                                     */}
      {/* ---------------------------------------------------------- */}
      {viewingItem && (
        <div
          className="mn-admin-modal-overlay"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="mn-admin-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mn-admin-modal-header">
              <h3>Notification Preview</h3>
              <button
                type="button"
                className="mn-admin-modal-close"
                onClick={() => setViewingItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="mn-admin-modal-body">
              <div className="mn-admin-preview-top">
                <div className="mn-admin-preview-icon">
                  {getTypeConfig(viewingItem.type).icon}
                </div>
                <div>
                  <h4 className="mn-admin-preview-title">{viewingItem.title}</h4>
                  <span className="mn-admin-preview-badge">
                    {viewingItem.type}
                  </span>
                </div>
              </div>

              <div className="mn-admin-preview-content">
                <p>{viewingItem.message}</p>
              </div>

              <div className="mn-admin-preview-meta-grid">
                <div>
                  <span className="label">Target Audience:</span>
                  <strong>{viewingItem.targetAudience}</strong>
                </div>
                <div>
                  <span className="label">Class Level:</span>
                  <strong>{viewingItem.classLevel || 'All Classes'}</strong>
                </div>
                <div>
                  <span className="label">Status:</span>
                  <strong>{viewingItem.status}</strong>
                </div>
                <div>
                  <span className="label">Recipients:</span>
                  <strong>{viewingItem.deliveredCount || viewingItem.recipientsCount || 0} users</strong>
                </div>
                <div>
                  <span className="label">Action Text:</span>
                  <strong>{viewingItem.actionText || 'View Now'}</strong>
                </div>
                <div>
                  <span className="label">Action URL:</span>
                  <strong>{viewingItem.actionUrl || 'None'}</strong>
                </div>
                <div>
                  <span className="label">Sent At:</span>
                  <strong>{formatFullDate(viewingItem.sentAt || viewingItem.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div className="mn-admin-modal-footer">
              <button
                type="button"
                className="mn-admin-btn-secondary"
                onClick={() => setViewingItem(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="mn-admin-btn-submit"
                onClick={() => {
                  handleResend(viewingItem._id);
                  setViewingItem(null);
                }}
              >
                Resend Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotificationsPage;
