// ============================================================
// components/studyResources/PdfPreview.jsx
// Displays 2-page preview images with anti-copy protection,
// "Free Preview (2 Pages) - Full PDF ke liye Subscribe karein",
// and subscription-gated watermarked PDF download.
// ============================================================

import React, { useState, useEffect } from 'react';
import { getNotePreviewUrl, downloadWatermarkedNote } from '../../api/notes';
import { createSubscriptionOrder, verifySubscriptionPayment } from '../../api/subscription';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Helper to load Razorpay script
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const PdfPreview = ({ resource, onSubscriptionSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [previewPages, setPreviewPages] = useState([]);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  const resourceId = resource?._id || resource?.id;
  const rawPreviewUrl = resourceId ? getNotePreviewUrl(resourceId) : '';

  const isSubscribed = Boolean(
    user?.isSubscribed &&
    user?.subscriptionExpiry &&
    new Date(user.subscriptionExpiry) > new Date()
  );

  const planPrice = user?.role === 'TUTOR' ? 149 : 99;
  const planType = user?.role === 'TUTOR' ? 'teacher' : 'student';

  useEffect(() => {
    if (!resourceId) return;

    // Fetch preview info (page 1 and page 2 image URLs)
    const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
      ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : '');

    fetch(`${backendBase}/api/notes/${resourceId}/preview?format=json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.pages && data.pages.length > 0) {
          const fullUrls = data.pages.map((p) => (p.startsWith('http') ? p : `${backendBase}${p}`));
          setPreviewPages(fullUrls);
        } else {
          setUseIframeFallback(true);
        }
      })
      .catch(() => {
        setUseIframeFallback(true);
      });
  }, [resourceId]);

  // ── Handle Watermarked Download ──────────────────────────
  const handleDownload = async () => {
    if (!isAuthenticated) {
      showToast('Please login to download notes', 'error');
      return;
    }
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
      showToast('✅ PDF downloaded with personal watermark!', 'success');
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('Subscribe to download full PDFs', 'error');
        handleSubscribe();
      } else {
        showToast('Download failed. Please try again.', 'error');
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  // ── Handle Razorpay Subscription ─────────────────────────
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
            showToast('🎉 Subscribed! You can now download all PDFs.', 'success');
            if (onSubscriptionSuccess) onSubscriptionSuccess();
          } catch {
            showToast('Payment completed but verification failed. Please contact support.', 'error');
          }
        },
        modal: { ondismiss: () => setSubscribeLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start subscription payment', 'error');
    } finally {
      setSubscribeLoading(false);
    }
  };

  if (!resource) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginBottom: 24,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Card Header */}
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
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
            {resource.title || 'Study Material'}
          </h3>
          <span
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            👁️ Free Preview (2 Pages)
          </span>
        </div>
        <span style={{ fontSize: 26 }}>📄</span>
      </div>

      {/* ── 2 Pages Preview (Images with Right-Click Protection) ── */}
      <div
        style={{
          position: 'relative',
          background: '#F8FAFC',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxHeight: 520,
          overflowY: 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {previewPages.length > 0 ? (
          previewPages.map((pageUrl, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#FFF',
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                style={{
                  background: '#E2E8F0',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#475569',
                  textAlign: 'right',
                }}
              >
                Page {idx + 1} of 2 (Preview)
              </div>
              <img
                src={pageUrl}
                alt={`Preview Page ${idx + 1}`}
                draggable={false}
                onError={() => setUseIframeFallback(true)}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          ))
        ) : useIframeFallback ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <iframe
              src={`${rawPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title={`Preview: ${resource.title}`}
              style={{
                width: '100%',
                height: 420,
                border: 'none',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Transparent click blocker overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 5,
                background: 'transparent',
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
            ⏳ Loading preview pages...
          </div>
        )}
      </div>

      {/* ── Subtitle Banner ── */}
      <div
        style={{
          background: '#FEF3C7',
          borderTop: '1px solid #FDE68A',
          borderBottom: '1px solid #FDE68A',
          padding: '10px 16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🔒</span>
          <span>Free Preview (2 Pages) - Full PDF ke liye Subscribe karein</span>
        </p>
      </div>

      {/* ── Action CTA Button ── */}
      <div style={{ padding: '16px 20px', background: '#FFFFFF' }}>
        {isSubscribed ? (
          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            style={{
              width: '100%',
              padding: '13px',
              background: downloadLoading ? '#86EFAC' : '#16A34A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: downloadLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            }}
          >
            {downloadLoading ? (
              '⏳ Generating Watermarked PDF...'
            ) : (
              <>
                <span>📥</span>
                <span>Download Watermarked PDF</span>
              </>
            )}
          </button>
        ) : (
          <div>
            <button
              onClick={handleSubscribe}
              disabled={subscribeLoading}
              style={{
                width: '100%',
                padding: '13px',
                background: subscribeLoading ? '#93C5FD' : '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: subscribeLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                marginBottom: 10,
              }}
            >
              {subscribeLoading ? (
                '⏳ Initializing Razorpay...'
              ) : (
                <>
                  <span>🔓</span>
                  <span>Unlock Full PDF + All Notes - Rs {planPrice}/month</span>
                </>
              )}
            </button>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {['✨ All Notes & Formula Sheets', '💬 Unlimited Chats', '🔒 Personal Watermark', '❌ Cancel Anytime'].map(
                (perk) => (
                  <span key={perk} style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    {perk}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
