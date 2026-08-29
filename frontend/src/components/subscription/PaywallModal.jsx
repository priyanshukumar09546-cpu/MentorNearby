// ============================================================
// components/subscription/PaywallModal.jsx
// Beautiful paywall modal shown when chat limit is exceeded
// ============================================================

import React, { useState } from 'react';
import { createSubscriptionOrder, verifySubscriptionPayment } from '../../api/subscription';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaywallModal = ({
  isOpen,
  onClose,
  planType = 'student',   // 'student' | 'teacher'
  planPrice = 99,
  onSuccess,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isTeacher = planType === 'teacher';
  const planLabel = isTeacher ? 'Teacher Plan' : 'Student Plan';
  const freeLimit = isTeacher ? 5 : 3;
  const freeLimitLabel = isTeacher ? 'leads' : 'chats';

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError('Could not load payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      const orderRes = await createSubscriptionOrder(planType);
      const { orderId, amount, currency, razorpayKeyId, userEmail, userName } =
        orderRes.data.data;

      const options = {
        key: razorpayKeyId || RAZORPAY_KEY,
        amount,
        currency,
        name: 'MentorNearby',
        description: `${planLabel} — ₹${planPrice}/month`,
        image: '/favicon.png',
        order_id: orderId,
        prefill: {
          name: userName || user?.name || '',
          email: userEmail || user?.email || '',
        },
        theme: { color: '#2563EB' },
        handler: async (response) => {
          try {
            await verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planType,
            });
            if (onSuccess) onSuccess();
            onClose();
          } catch (verifyErr) {
            setError('Payment succeeded but verification failed. Please contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '40px 32px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: '#94A3B8',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>

        {/* Title */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#0F172A',
            margin: '0 0 8px',
            lineHeight: 1.3,
          }}
        >
          {freeLimit} Free {freeLimitLabel.charAt(0).toUpperCase() + freeLimitLabel.slice(1)} Khatam!
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 15, color: '#475569', margin: '0 0 24px', lineHeight: 1.5 }}>
          Unlimited {freeLimitLabel} ke liye{' '}
          <strong style={{ color: '#2563EB' }}>₹{planPrice}/month</strong> lo aur bina ruke
          connect karo.
        </p>

        {/* Features */}
        <div
          style={{
            background: '#F0F7FF',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          {[
            `✅ Unlimited ${freeLimitLabel} with ${isTeacher ? 'students' : 'tutors'}`,
            '✅ Direct contact numbers visible',
            '✅ Priority listings & badges',
            '✅ Cancel anytime',
          ].map((feat) => (
            <p key={feat} style={{ margin: '4px 0', fontSize: 13, color: '#1E40AF', fontWeight: 600 }}>
              {feat}
            </p>
          ))}
        </div>

        {/* Price badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FEF9C3',
            border: '1.5px solid #FDE047',
            borderRadius: 8,
            padding: '6px 16px',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 700,
            color: '#713F12',
          }}
        >
          🎯 {planLabel} &nbsp;·&nbsp; ₹{planPrice}/month
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{error}</p>
        )}

        {/* CTA Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#93C5FD' : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '⏳ Please wait...' : `🚀 Subscribe ₹${planPrice}/month`}
        </button>

        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12 }}>
          Secure payment via Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
};

export default PaywallModal;
