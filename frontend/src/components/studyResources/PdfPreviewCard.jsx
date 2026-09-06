// ============================================================
// components/studyResources/PdfPreviewCard.jsx
// Shows 2-page preview of a note/formula sheet
// Protected: no right-click, no text select, subscribe CTA
// ============================================================

import React, { useState } from 'react';
import { getNotePreviewUrl, downloadWatermarkedNote } from '../../api/notes';
import { createSubscriptionOrder, verifySubscriptionPayment } from '../../api/subscription';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// ── Razorpay Loader ────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ── Main Component ─────────────────────────────────────────
const PdfPreviewCard = ({ resource, onSubscriptionSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  if (!resource) return null;

  const resourceId = resource._id || resource.id;
  const previewUrl = getNotePreviewUrl(resourceId);

  const isSubscribed =
    user?.isSubscribed &&
    user?.subscriptionExpiry &&
    new Date(user.subscriptionExpiry) > new Date();

  const planPrice = user?.role === 'TUTOR' ? 149 : 99;
  const planType = user?.role === 'TUTOR' ? 'teacher' : 'student';

  // ── Handle Watermarked Download ──────────────────────────
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const res = await downloadWatermarkedNote(resourceId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MentorNearby_${resource.title || 'notes'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('✅ PDF downloaded successfully (Free)!', 'success');
    } catch (err) {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  // ── Handle Subscribe via Razorpay ────────────────────────
  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      showToast('Please login to subscribe', 'error');
      return;
    }
    setSubscribeLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        showToast('Payment gateway load failed. Check your connection.', 'error');
        return;
      }
      const orderRes = await createSubscriptionOrder(planType);
      const { orderId, amount, currency, razorpayKeyId, userEmail, userName } =
        orderRes.data.data;

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'MentorNearby',
        description: `${planType === 'teacher' ? 'Teacher' : 'Student'} Plan — Unlimited Notes + Chats`,
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
            showToast('🎉 Subscribed! Download your PDF now.', 'success');
            if (onSubscriptionSuccess) onSubscriptionSuccess();
          } catch {
            showToast('Payment done but verification failed. Contact support.', 'error');
          }
        },
        modal: { ondismiss: () => setSubscribeLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start payment', 'error');
    } finally {
      setSubscribeLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#FFF' }}>
            {resource.title || 'Study Notes'}
          </h3>
          <span
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255,255,255,0.2)',
              color: '#FFF',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            🎁 100% Free Access
          </span>
        </div>
        <span style={{ fontSize: 24 }}>📄</span>
      </div>

      {/* ── 2-Page PDF Preview (iframe) ─────────────────── */}
      <div
        style={{ position: 'relative', background: '#F8FAFC' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          title={`Preview: ${resource.title}`}
          style={{
            width: '100%',
            height: 420,
            border: 'none',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none', // Disable all mouse interaction on iframe content
          }}
          allow="fullscreen"
        />

        {/* Invisible overlay to block right-click download on PDF iframe */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'transparent',
            cursor: 'default',
          }}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />

        {/* Bottom blur overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: 'linear-gradient(to top, rgba(248,250,252,0.98) 50%, transparent)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '12px 16px',
            zIndex: 11,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: '#166534',
              fontWeight: 700,
              textAlign: 'center',
              width: '100%',
            }}
          >
            🎁 100% Free Educational Access — Download Complete PDF Below
          </p>
        </div>
      </div>

      {/* ── CTA Section ─────────────────────────────────── */}
      <div style={{ padding: '16px 18px', borderTop: '1px solid #F1F5F9' }}>
        <button
          onClick={handleDownload}
          disabled={downloadLoading}
          style={{
            width: '100%',
            padding: '13px',
            background: downloadLoading ? '#86EFAC' : '#16A34A',
            color: '#FFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: downloadLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
          }}
        >
          {downloadLoading ? (
            '⏳ Downloading PDF...'
          ) : (
            <>
              <span>⬇️</span>
              <span>Download Full PDF (Free)</span>
            </>
          )}
        </button>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          {['✅ 100% Free Access', '✅ Complete PDF Download', '✅ Safe & Direct'].map((f) => (
            <span key={f} style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewCard;
