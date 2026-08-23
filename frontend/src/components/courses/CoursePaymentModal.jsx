// ============================================================
// components/courses/CoursePaymentModal.jsx
// Razorpay Checkout Modal for Courses & Multi-Subject Combos
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  createCoursePaymentOrder,
  createBundlePaymentOrder,
  verifyCoursePayment,
} from '../../api/courses';

const CoursePaymentModal = ({
  isOpen,
  onClose,
  course,
  bundle,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const isBundle = Boolean(bundle);
  const itemTitle = isBundle ? bundle.name : course?.title;
  const price = isBundle ? bundle.price : course?.price;
  const originalPrice = isBundle ? bundle.originalPrice : course?.originalPrice;
  const savings = originalPrice ? originalPrice - price : 0;

  const handleRazorpayCheckout = async () => {
    if (!isAuthenticated) {
      onClose();
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Create Server-Side Order
      let orderRes;
      if (isBundle) {
        orderRes = await createBundlePaymentOrder(bundle._id);
      } else {
        orderRes = await createCoursePaymentOrder(course._id);
      }

      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Load Razorpay script if needed
      const loadScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay Modal
      const options = {
        key: keyId || 'rzp_test_placeholder',
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'MentorNearby Courses',
        description: itemTitle,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await verifyCoursePayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              if (onSuccess) onSuccess(verifyRes.data);
              onClose();
            }
          } catch (vErr) {
            setErrorMsg(vErr.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Payment initialization failed.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          maxWidth: 480,
          width: '100%',
          padding: 32,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 900, background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5 }}>
            {isBundle ? '🎯 STREAM COMBO PACK' : '🎓 PYQ MASTERY COURSE'}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.3 }}>
          {itemTitle}
        </h3>

        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
          {isBundle
            ? 'Instant lifetime access to 10-year video solutions, downloadable PPT notes, and board scoring strategies across all included subjects.'
            : 'Access all 10 years of CBSE Board Papers with step-by-step video solutions, PPT summaries, and official marking scheme templates.'}
        </p>

        {/* Inclusions List */}
        <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 18px', border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            What you will get:
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
              <span>10 Years of Complete Video Solutions</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
              <span>Downloadable Solution PPTs &amp; Notes</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
              <span>Official CBSE Marking Scheme Templates</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
              <span>Unlimited Mobile &amp; Desktop Access</span>
            </li>
          </ul>
        </div>

        {/* Price Box */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 18px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14 }}>
          <div>
            <span style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Total Payable Amount</span>
            {savings > 0 && (
              <span style={{ display: 'block', fontSize: 11, color: '#15803D', fontWeight: 800 }}>
                You save ₹{savings}!
              </span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {originalPrice && (
              <span style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'line-through', marginRight: 6 }}>
                ₹{originalPrice}
              </span>
            )}
            <span style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>
              ₹{price}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <button
          type="button"
          onClick={handleRazorpayCheckout}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
          }}
        >
          {loading ? (
            <span>Processing Checkout...</span>
          ) : (
            <>
              <span>💳 Pay with Razorpay</span>
              <span>(₹{price})</span>
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            🔒 256-Bit SSL Encrypted • 100% Verified Secure Payment via Razorpay
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoursePaymentModal;
