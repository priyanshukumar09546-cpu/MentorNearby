// ============================================================
// pages/Admin/AdminSubscriptionsPage.jsx
// MentorNearby Admin Subscriptions & Freemium Management
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminSubscriptions,
  grantUserSubscription,
  revokeUserSubscription,
} from '../../api/admin';
import { useToast } from '../../context/ToastContext';

const AdminSubscriptionsPage = () => {
  const { showToast } = useToast();

  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalStudentsSubscribed: 0,
    totalTutorsSubscribed: 0,
    estimatedMonthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Grant Modal state
  const [grantModal, setGrantModal] = useState({
    isOpen: false,
    user: null,
    days: 30,
    planType: 'student',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminSubscriptions({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter,
        page,
        limit: 25,
      });

      if (res.data?.success) {
        setSubscribers(res.data.data.subscribers || []);
        setTotalPages(res.data.data.pages || 1);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      showToast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, showToast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleGrant = async () => {
    if (!grantModal.user) return;
    try {
      setActionLoading(true);
      const res = await grantUserSubscription(grantModal.user._id, {
        days: grantModal.days,
        planType: grantModal.planType,
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Subscription granted successfully!', 'success');
        setGrantModal({ isOpen: false, user: null, days: 30, planType: 'student' });
        fetchSubscriptions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to grant subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (user) => {
    if (!window.confirm(`Are you sure you want to revoke the subscription for ${user.name}?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await revokeUserSubscription(user._id);
      if (res.data?.success) {
        showToast('Subscription revoked successfully', 'info');
        fetchSubscriptions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            💳 Subscriptions &amp; Monetization
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>
            Manage active premium members, free lead counters, and manual subscription overrides.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Active Subscribers</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>{stats.totalActive}</div>
          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>Active Paid Members</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Students Subscribed</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>{stats.totalStudentsSubscribed}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>₹99 / month Plan</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Teachers Subscribed</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#D97706', marginTop: '4px' }}>{stats.totalTutorsSubscribed}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>₹149 / month Plan</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Est. Monthly Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#16A34A', marginTop: '4px' }}>₹{stats.estimatedMonthlyRevenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Recurring MRR</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: '#FFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#FFF',
            }}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TUTOR">Tutors</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#FFF',
            }}
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            Loading subscriptions...
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <span style={{ fontSize: '36px' }}>💳</span>
            <h3 style={{ margin: '12px 0 4px', color: '#0F172A' }}>No Subscriptions Found</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>Try clearing filters or search queries.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 16px' }}>User</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Plan / Fee</th>
                  <th style={{ padding: '12px 16px' }}>Freemium Usage</th>
                  <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => {
                  const isActive = Boolean(
                    sub.isSubscribed &&
                    sub.subscriptionExpiry &&
                    new Date(sub.subscriptionExpiry) > new Date()
                  );
                  const expiryDateStr = sub.subscriptionExpiry
                    ? new Date(sub.subscriptionExpiry).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  const daysRemaining = sub.subscriptionExpiry
                    ? Math.ceil((new Date(sub.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <tr key={sub._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{sub.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{sub.email}</div>
                        {sub.phone && <div style={{ fontSize: '11px', color: '#64748B' }}>📞 {sub.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: sub.role === 'TUTOR' ? '#FEF3C7' : '#DBEAFE',
                            color: sub.role === 'TUTOR' ? '#92400E' : '#1E40AF',
                          }}
                        >
                          {sub.role === 'TUTOR' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>
                          {sub.role === 'TUTOR' ? '₹149 / mo' : '₹99 / mo'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {sub.subscriptionType || 'standard'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {sub.role === 'TUTOR' ? (
                          <div>
                            <span style={{ fontWeight: '600' }}>{sub.freeLeadsUsed ?? 0}</span> Leads Used
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: '600' }}>{sub.freeChatsUsed ?? 0}</span> / 3 Chats
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{expiryDateStr}</div>
                        {isActive && (
                          <div style={{ fontSize: '11px', color: daysRemaining < 5 ? '#DC2626' : '#16A34A', fontWeight: '600' }}>
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expiring today'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: isActive ? '#DCFCE7' : '#FEE2E2',
                            color: isActive ? '#166534' : '#991B1B',
                          }}
                        >
                          {isActive ? '● Active' : '○ Expired'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() =>
                            setGrantModal({
                              isOpen: true,
                              user: sub,
                              days: 30,
                              planType: sub.role === 'TUTOR' ? 'teacher' : 'student',
                            })
                          }
                          style={{
                            background: '#F0FDF4',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          + Grant Days
                        </button>
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(sub)}
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#B91C1C',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', gap: '8px', borderTop: '1px solid #E2E8F0' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', fontSize: '13px', color: '#64748B' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Grant Subscription Modal */}
      {grantModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div style={{ background: '#FFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
              Grant Subscription
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Granting subscription to <strong>{grantModal.user?.name}</strong> ({grantModal.user?.email}).
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Subscription Duration (Days)
              </label>
              <select
                value={grantModal.days}
                onChange={(e) => setGrantModal((m) => ({ ...m, days: Number(e.target.value) }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={15}>15 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={180}>180 Days (6 Months)</option>
                <option value={365}>365 Days (1 Year)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Plan Type
              </label>
              <select
                value={grantModal.planType}
                onChange={(e) => setGrantModal((m) => ({ ...m, planType: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="student">Student Plan (₹99/mo)</option>
                <option value="teacher">Teacher Plan (₹149/mo)</option>
                <option value="vip">VIP Unlimited</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                disabled={actionLoading}
                onClick={() => setGrantModal({ isOpen: false, user: null, days: 30, planType: 'student' })}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleGrant}
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  border: 'none',
                  color: '#FFF',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                }}
              >
                {actionLoading ? 'Granting...' : 'Confirm Grant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPage;
