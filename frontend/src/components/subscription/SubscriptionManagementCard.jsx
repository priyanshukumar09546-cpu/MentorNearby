// ============================================================
// components/subscription/SubscriptionManagementCard.jsx
// Dedicated User Subscription & AutoPay Management Section
// Used in Tutor Dashboard & Student Dashboard
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSubscriptionStatus, cancelSubscription } from '../../api/subscription';
import { UNIFIED_PLAN } from '../../config/subscription';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SubscriptionManagementCard.css';

const SubscriptionManagementCard = ({ role = 'STUDENT' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getSubscriptionStatus();
      if (res.data?.data) {
        setSubData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCancelAutoPay = async () => {
    try {
      setCancelling(true);
      const res = await cancelSubscription(cancelReason);
      showToast(
        res.data?.message || 'Recurring AutoPay stopped successfully. Benefits preserved till period end.',
        'success'
      );
      setShowCancelModal(false);
      await fetchStatus();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to cancel AutoPay. Please try again or contact support.',
        'error'
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mn-sub-mgmt-card skeleton">
        <div className="mn-sub-mgmt-skeleton-line title"></div>
        <div className="mn-sub-mgmt-skeleton-line text"></div>
      </div>
    );
  }

  const isSubscribed = Boolean(
    subData?.isSubscribed ||
      (user?.isSubscribed &&
        user?.subscriptionExpiry &&
        new Date(user.subscriptionExpiry) > new Date())
  );

  const status = subData?.status || (isSubscribed ? 'ACTIVE' : 'INACTIVE');
  const mandateStatus = subData?.mandateStatus || 'NONE';
  const autoPayActive = mandateStatus === 'AUTHORIZED' && status === 'ACTIVE';
  const cancelAtPeriodEnd = subData?.cancelAtPeriodEnd || status === 'CANCELLED';

  const renewalDate = subData?.nextBillingDate || subData?.subscriptionExpiry || user?.subscriptionExpiry;
  const formattedRenewalDate = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const payments = subData?.paymentHistory || subData?.payments || [];
  const lastPayment = payments.length > 0 ? payments[0] : null;
  const lastPaymentDate = subData?.lastPaymentDate || lastPayment?.createdAt || null;
  const formattedLastPaymentDate = lastPaymentDate
    ? new Date(lastPaymentDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mn-sub-mgmt-card">
      <div className="mn-sub-mgmt-header">
        <div className="mn-sub-mgmt-title-group">
          <div className="mn-sub-mgmt-icon">👑</div>
          <div>
            <h3 className="mn-sub-mgmt-heading">MentorNearby All Access</h3>
            <p className="mn-sub-mgmt-subheading">
              ₹{UNIFIED_PLAN.amount}/month • Monthly Recurring AutoPay
            </p>
          </div>
        </div>

        <div className="mn-sub-mgmt-status-badge-wrap">
          {isSubscribed ? (
            cancelAtPeriodEnd ? (
              <span className="mn-status-badge cancelling">
                AutoPay Cancelled (Valid till {formattedRenewalDate})
              </span>
            ) : (
              <span className="mn-status-badge active">
                ● Active (AutoPay Enabled)
              </span>
            )
          ) : (
            <span className="mn-status-badge inactive">
              No Active Subscription
            </span>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="mn-sub-mgmt-grid">
        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">Plan Name</span>
          <span className="mn-sub-mgmt-value">
            MentorNearby All Access
          </span>
        </div>

        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">Pricing</span>
          <span className="mn-sub-mgmt-value">
            ₹{UNIFIED_PLAN.amount} / month
          </span>
        </div>

        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">Subscription Status</span>
          <span className="mn-sub-mgmt-value">
            {isSubscribed ? (
              <span style={{ color: '#16A34A', fontWeight: 800 }}>Active</span>
            ) : (
              <span style={{ color: '#E11D48', fontWeight: 800 }}>Inactive</span>
            )}
          </span>
        </div>

        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">AutoPay Mandate</span>
          <span className="mn-sub-mgmt-value">
            {autoPayActive ? (
              <strong style={{ color: '#16A34A' }}>✓ Authorized &amp; Active</strong>
            ) : cancelAtPeriodEnd ? (
              <span style={{ color: '#D97706' }}>Cancelled (No Deductions)</span>
            ) : isSubscribed ? (
              <span style={{ color: '#2563EB' }}>Active</span>
            ) : (
              <span style={{ color: '#64748B' }}>Not Authorized</span>
            )}
          </span>
        </div>

        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">
            {cancelAtPeriodEnd ? 'Access Valid Until' : 'Next Billing Date'}
          </span>
          <span className="mn-sub-mgmt-value highlight">
            {isSubscribed ? (formattedRenewalDate || '30 days from cycle start') : 'Pending Subscription'}
          </span>
        </div>

        <div className="mn-sub-mgmt-grid-item">
          <span className="mn-sub-mgmt-label">Last Successful Payment</span>
          <span className="mn-sub-mgmt-value">
            {formattedLastPaymentDate ? `${formattedLastPaymentDate} (₹${UNIFIED_PLAN.amount})` : isSubscribed ? `Recent (₹${UNIFIED_PLAN.amount})` : 'No payments yet'}
          </span>
        </div>
      </div>

      {/* Entitlement Summary */}
      <div className="mn-sub-mgmt-benefits-strip">
        <div className="mn-sub-mgmt-benefits-title">
          {role === 'TUTOR' ? 'Tutor All Access Entitlements:' : 'Student All Access Entitlements:'}
        </div>
        <div className="mn-sub-mgmt-benefits-tags">
          <span className="mn-benefit-pill">✓ Unlimited Contact Unlocks</span>
          <span className="mn-benefit-pill">✓ Direct Phone &amp; WhatsApp Call</span>
          <span className="mn-benefit-pill">✓ Priority Search Visibility</span>
          <span className="mn-benefit-pill">✓ Instant Messaging</span>
          <span className="mn-benefit-pill">✓ Study Downloads</span>
          <span className="mn-benefit-pill">✓ Zero Commission</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mn-sub-mgmt-actions">
        {isSubscribed ? (
          <>
            {autoPayActive && !cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="mn-sub-cancel-btn"
              >
                Cancel Subscription (Stop AutoPay)
              </button>
            ) : (
              <Link to="/subscription" className="mn-sub-upgrade-btn">
                Reactivate AutoPay (₹199/month) →
              </Link>
            )}
          </>
        ) : (
          <Link to="/subscription" className="mn-sub-upgrade-btn">
            Subscribe Now – ₹199/month →
          </Link>
        )}
      </div>

      {/* Payment History Table (Audit Log) */}
      {payments.length > 0 && (
        <div className="mn-sub-history-section">
          <h4 className="mn-sub-history-title">Payment &amp; Mandate History</h4>
          <div className="mn-sub-history-table-wrap">
            <table className="mn-sub-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      {new Date(p.createdAt || p.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>₹{p.amount || UNIFIED_PLAN.amount}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {p.razorpayPaymentId || 'pay_online'}
                    </td>
                    <td>
                      <span className={`mn-history-status ${p.status?.toLowerCase() || 'captured'}`}>
                        {p.status || 'CAPTURED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="mn-cancel-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="mn-cancel-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mn-cancel-modal-header">
              <h4 className="mn-cancel-modal-title">Stop AutoPay Recurring Billing?</h4>
              <button
                type="button"
                className="mn-cancel-modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mn-cancel-modal-body">
              <p className="mn-cancel-modal-text">
                By stopping AutoPay, no future monthly deductions will be made from your card or bank account.
              </p>

              <div className="mn-cancel-notice-box">
                🛡️ <strong>Your benefits are preserved:</strong> You will continue enjoying full <strong>MentorNearby All Access</strong> privileges until <strong>{formattedRenewalDate}</strong>.
              </div>

              <div className="mn-cancel-reason-group">
                <label className="mn-cancel-reason-label">
                  Reason for cancelling (Optional):
                </label>
                <textarea
                  className="mn-cancel-reason-input"
                  rows="3"
                  placeholder="Tell us how we can improve..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mn-cancel-modal-footer">
              <button
                type="button"
                className="mn-cancel-back-btn"
                onClick={() => setShowCancelModal(false)}
              >
                Keep My Subscription
              </button>
              <button
                type="button"
                className="mn-cancel-confirm-btn"
                disabled={cancelling}
                onClick={handleCancelAutoPay}
              >
                {cancelling ? 'Stopping AutoPay...' : 'Confirm Stop AutoPay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementCard;
