// ============================================================
// pages/Admin/AdminSubscriptionsPage.jsx
// MentorNearby Admin — Subscriptions & AutoPay Management Center
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminSubscriptions,
  getAdminSubscriptionPayments,
  grantUserSubscription,
  revokeUserSubscription,
} from '../../api/admin';
import { UNIFIED_PLAN } from '../../config/subscription';
import { useToast } from '../../context/ToastContext';

const AdminSubscriptionsPage = () => {
  const { showToast } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    activeTutorSubscriptions: 0,
    activeStudentSubscriptions: 0,
    pendingSubscriptions: 0,
    cancelledSubscriptions: 0,
    failedPayments: 0,
    authorizedAutoPayMandates: 0,
    monthlyRecurringRevenue: 0,
    successfulPaymentCollections: 0,
    upcomingRenewals: 0,
    unifiedPlanPrice: 199,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal State (Audit Log)
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    subscription: null,
    payments: [],
    loadingPayments: false,
  });

  // Grant Modal State
  const [grantModal, setGrantModal] = useState({
    isOpen: false,
    user: null,
    days: 30,
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
        const subs = res.data.data.subscriptions || res.data.data.subscribers || [];
        setSubscriptions(subs);
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

  const handleExportCSV = () => {
    window.open('/api/admin/subscriptions/export/csv', '_blank');
    showToast('Exporting subscriptions CSV report...', 'info');
  };

  const handleViewDetails = async (sub) => {
    const subId = sub._id || sub.user?._id;
    setDetailModal({
      isOpen: true,
      subscription: sub,
      payments: [],
      loadingPayments: true,
    });

    try {
      const res = await getAdminSubscriptionPayments(subId);
      setDetailModal((prev) => ({
        ...prev,
        payments: res.data?.data?.payments || [],
        loadingPayments: false,
      }));
    } catch (err) {
      console.error('Error fetching payments:', err);
      setDetailModal((prev) => ({
        ...prev,
        loadingPayments: false,
      }));
    }
  };

  const handleGrant = async () => {
    if (!grantModal.user) return;
    try {
      setActionLoading(true);
      const res = await grantUserSubscription(grantModal.user._id, {
        days: grantModal.days,
        planType: 'all_access_monthly',
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Subscription granted successfully!', 'success');
        setGrantModal({ isOpen: false, user: null, days: 30 });
        fetchSubscriptions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to grant subscription', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (user) => {
    const userName = user.name || 'User';
    if (!window.confirm(`Are you sure you want to revoke the subscription for ${userName}?`)) {
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
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
            👑 MentorNearby All Access Subscriptions
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0' }}>
            Unified ₹199/month recurring AutoPay subscriptions, bank mandate authorizations &amp; payment audit trail.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📥</span> Export to CSV
          </button>

          <button
            type="button"
            onClick={fetchSubscriptions}
            style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards (11 Stats) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Subscribers</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>{stats.totalSubscribers}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>All-time registered</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Active Subscribers</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#16A34A', marginTop: '4px' }}>{stats.activeSubscribers}</div>
          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '2px', fontWeight: '600' }}>Active All Access</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Active Tutors</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#D97706', marginTop: '4px' }}>{stats.activeTutorSubscriptions}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Subscribed educators</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Active Students</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>{stats.activeStudentSubscriptions}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Subscribed learners</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #FEF08A', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#854D0E', textTransform: 'uppercase' }}>Pending Subscriptions</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#CA8A04', marginTop: '4px' }}>{stats.pendingSubscriptions}</div>
          <div style={{ fontSize: '11px', color: '#854D0E', marginTop: '2px' }}>Awaiting mandate auth</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Cancelled Mandates</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748B', marginTop: '4px' }}>{stats.cancelledSubscriptions}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>AutoPay stopped</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#991B1B', textTransform: 'uppercase' }}>Failed Payments</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', marginTop: '4px' }}>{stats.failedPayments}</div>
          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '2px' }}>Declined transactions</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase' }}>AutoPay Mandates</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>{stats.authorizedAutoPayMandates}</div>
          <div style={{ fontSize: '11px', color: '#1E40AF', marginTop: '2px' }}>Active bank mandates</div>
        </div>

        <div style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9F1239', textTransform: 'uppercase' }}>Monthly Recurring (MRR)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E11D48', marginTop: '4px' }}>₹{stats.monthlyRecurringRevenue?.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '11px', color: '#9F1239', marginTop: '2px', fontWeight: '600' }}>Active × ₹199 / month</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Successful Collections</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#16A34A', marginTop: '4px' }}>{stats.successfulPaymentCollections}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Captured payments</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Upcoming Renewals</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#4F46E5', marginTop: '4px' }}>{stats.upcomingRenewals}</div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Next 7 days</div>
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
        <div style={{ flex: '1 1 260px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or Sub ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
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
              padding: '9px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#FFF',
            }}
          >
            <option value="">All Roles</option>
            <option value="TUTOR">Tutors</option>
            <option value="STUDENT">Students</option>
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
              padding: '9px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#FFF',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Only</option>
            <option value="cancelled">Cancelled Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            Loading subscriptions &amp; AutoPay mandates...
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
            <span style={{ fontSize: '36px' }}>👑</span>
            <h3 style={{ margin: '12px 0 4px', color: '#0F172A' }}>No Subscriptions Found</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your search or status filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 16px' }}>Subscriber</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Plan &amp; Billing</th>
                  <th style={{ padding: '12px 16px' }}>AutoPay Mandate</th>
                  <th style={{ padding: '12px 16px' }}>Next Billing Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const u = sub.user && typeof sub.user === 'object' ? sub.user : sub;
                  const isActive = Boolean(
                    sub.status === 'ACTIVE' ||
                    (u.isSubscribed && u.subscriptionExpiry && new Date(u.subscriptionExpiry) > new Date())
                  );
                  const isCancelled = sub.status === 'CANCELLED' || sub.cancelAtPeriodEnd;
                  const mandateStatus = sub.mandateStatus || (isActive ? 'AUTHORIZED' : 'NONE');

                  const nextBillDate = sub.nextBillingDate || u.subscriptionExpiry;
                  const formattedNextBill = nextBillDate
                    ? new Date(nextBillDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={sub._id || u._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{u.name || 'User'}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{u.email}</div>
                        {u.phone && <div style={{ fontSize: '11px', color: '#64748B' }}>📞 {u.phone}</div>}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: (sub.userRole || u.role) === 'TUTOR' ? '#FEF3C7' : '#DBEAFE',
                            color: (sub.userRole || u.role) === 'TUTOR' ? '#92400E' : '#1E40AF',
                          }}
                        >
                          {(sub.userRole || u.role) === 'TUTOR' ? '👨‍🏫 Tutor' : '👨‍🎓 Student'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#E11D48' }}>
                          ₹{sub.amount || UNIFIED_PLAN.amount} / month
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          MentorNearby All Access
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background:
                              mandateStatus === 'AUTHORIZED'
                                ? '#DCFCE7'
                                : mandateStatus === 'CANCELLED'
                                ? '#FEF3C7'
                                : '#F1F5F9',
                            color:
                              mandateStatus === 'AUTHORIZED'
                                ? '#166534'
                                : mandateStatus === 'CANCELLED'
                                ? '#B45309'
                                : '#475569',
                          }}
                        >
                          {mandateStatus === 'AUTHORIZED'
                            ? '✓ Authorized'
                            : mandateStatus === 'CANCELLED'
                            ? 'Cancelled'
                            : mandateStatus}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0F172A' }}>{formattedNextBill}</div>
                        {isActive && !isCancelled && (
                          <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600' }}>
                            Auto-Renewing
                          </div>
                        )}
                        {isCancelled && (
                          <div style={{ fontSize: '11px', color: '#D97706', fontWeight: '600' }}>
                            Ends on billing date
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
                            background: isActive
                              ? isCancelled
                                ? '#FEF3C7'
                                : '#DCFCE7'
                              : '#FEE2E2',
                            color: isActive
                              ? isCancelled
                                ? '#B45309'
                                : '#166534'
                              : '#991B1B',
                          }}
                        >
                          {isActive
                            ? isCancelled
                              ? '● AutoPay Cancelled'
                              : '● Active'
                            : '○ Expired'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(sub)}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            padding: '5px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          👁️ Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGrantModal({
                              isOpen: true,
                              user: u,
                              days: 30,
                            })
                          }
                          style={{
                            background: '#F0FDF4',
                            border: '1px solid #86EFAC',
                            color: '#15803D',
                            padding: '5px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginRight: '6px',
                          }}
                        >
                          + Grant
                        </button>

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(u)}
                            style={{
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#B91C1C',
                              padding: '5px 9px',
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
      </div>

      {/* Detail Modal with Payment Audit Logs */}
      {detailModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDetailModal({ isOpen: false, subscription: null, payments: [], loadingPayments: false })}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Subscription &amp; Payment Audit Details
              </h3>
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, subscription: null, payments: [], loadingPayments: false })}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {detailModal.subscription && (
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px', marginBottom: '20px', fontSize: '13px' }}>
                <div><strong>User:</strong> {detailModal.subscription.user?.name || detailModal.subscription.name} ({detailModal.subscription.user?.email || detailModal.subscription.email})</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> MentorNearby All Access (₹199/month)</div>
                <div style={{ marginTop: '4px' }}><strong>Mandate Status:</strong> {detailModal.subscription.mandateStatus || 'N/A'}</div>
                <div style={{ marginTop: '4px' }}><strong>Razorpay Subscription ID:</strong> <code>{detailModal.subscription.razorpaySubscriptionId || 'N/A'}</code></div>
              </div>
            )}

            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>
              Payment Audit History
            </h4>

            {detailModal.loadingPayments ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>Loading payment audit records...</p>
            ) : detailModal.payments.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>No payment audit records recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Amount</th>
                      <th style={{ padding: '8px' }}>Payment ID</th>
                      <th style={{ padding: '8px' }}>Cycle</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.payments.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '8px', fontWeight: '700' }}>₹{p.amount || 199}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{p.razorpayPaymentId || 'pay_test'}</td>
                        <td style={{ padding: '8px' }}>#{p.cycleNumber || 1}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: p.status === 'CAPTURED' ? '#16A34A' : '#DC2626', fontWeight: '700' }}>
                            {p.status || 'CAPTURED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {grantModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setGrantModal({ isOpen: false, user: null, days: 30 })}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>
              Grant MentorNearby All Access
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Granting subscription to <strong>{grantModal.user?.name}</strong>.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={grantModal.days}
                onChange={(e) => setGrantModal({ ...grantModal, days: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setGrantModal({ isOpen: false, user: null, days: 30 })}
                style={{ background: '#F1F5F9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrant}
                disabled={actionLoading}
                style={{ background: '#E11D48', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                {actionLoading ? 'Granting...' : 'Grant All Access'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubscriptionsPage;
