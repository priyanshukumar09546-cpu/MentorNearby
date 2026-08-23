// ============================================================
// components/studyResources/StudyPaymentModal.jsx
// Centered Viewport Dialog via ReactDOM.createPortal
// Exact Recreation of Reference Screenshot media_1787434630244.png
// Supports Individual Download & Single-Class Single-Subject Combos
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createResourcePaymentOrder,
  createBundlePaymentOrder,
  verifyStudyPayment,
  downloadStudyResourceFile,
  downloadStudyResourceComboFile,
} from '../../api/studyResources';

// Helper to dynamically load Razorpay script
const loadRazorpayScript = () => {
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

const StudyPaymentModal = ({
  isOpen,
  onClose,
  resource = null,
  bundle = null,
  purchaseType = 'INDIVIDUAL', // 'INDIVIDUAL' | 'COMBO'
  classLevel = '',
  subject = '',
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isDirectCombo = purchaseType === 'COMBO' || Boolean(bundle);

  // Selection mode: 'INDIVIDUAL' or 'COMBO'
  const [selectedOption, setSelectedOption] = useState(isDirectCombo ? 'COMBO' : 'INDIVIDUAL');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Body Scroll Lock & ESC key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveClass = String(classLevel || bundle?.classLevel || resource?.classLevel || '9');
  const isSenior = ['11', '12'].includes(effectiveClass) || bundle?.classes?.includes('11') || bundle?.classes?.includes('12');
  const effectiveSubject = subject || bundle?.subject || resource?.subject || 'Science';
  const isFormula = bundle?.comboType === 'FORMULA_COMBO' || bundle?.type === 'FORMULA' || resource?.resourceType === 'FORMULA_SHEET';

  // Strict Single Class + Single Subject Pricing Matrix
  // CLASS 9 & 10:
  // Formula Sheet: Individual = ₹7, Combo = ₹50
  // Notes: Individual = ₹12, Combo = ₹100
  // CLASS 11 & 12:
  // Formula Sheet: Individual = ₹8, Combo = ₹60
  // Notes: Individual = ₹14, Combo = ₹120
  const individualPrice = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
  const singleComboPrice = isFormula ? (isSenior ? 60 : 50) : (isSenior ? 120 : 100);

  const comboPrice = bundle?.price || singleComboPrice;
  const comboOriginalVal = bundle?.originalPrice || (isFormula ? (isSenior ? 256 : 168) : (isSenior ? 448 : 288));

  const singleComboName = isFormula
    ? `Formula Sheets Combo (Class ${effectiveClass} ${effectiveSubject})`
    : `Notes Combo (Class ${effectiveClass} ${effectiveSubject})`;

  const singleComboSub = isFormula
    ? `Get all Formula Sheets (Class ${effectiveClass} ${effectiveSubject})`
    : `Get all Notes & Revision PDFs (Class ${effectiveClass} ${effectiveSubject})`;

  const comboName = bundle?.name || bundle?.title || singleComboName;
  const comboIncludedText = bundle?.includedText || bundle?.resourcesCount || (isFormula
    ? `All Formula Sheets for Class ${effectiveClass} ${effectiveSubject}`
    : `All Chapter Notes for Class ${effectiveClass} ${effectiveSubject}`);

  const activePrice = isDirectCombo || selectedOption === 'COMBO' ? comboPrice : individualPrice;

  const itemTitle = resource?.title || `${resource?.chapter || 'Chapter'} – ${resource?.chapterTitle || 'Study Resource'}`;

  // Trigger Automatic Post-Payment PDF Download
  const triggerPdfDownload = async (targetResId, targetTitle) => {
    try {
      const isComboDownload = isDirectCombo || selectedOption === 'COMBO';
      const res = isComboDownload
        ? await downloadStudyResourceComboFile(targetResId)
        : await downloadStudyResourceFile(targetResId);

      const downloadUrl = res?.data?.downloadUrl || res?.downloadUrl || res?.fileUrl || `/api/study-resources/stream/${targetResId}?download=true`;
      const cleanFileName = res?.data?.fileName || res?.fileName || `${(targetTitle || 'MentorNearby_Study_Material').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000';
      const streamUrl = downloadUrl.startsWith('http') ? downloadUrl : `${backendBase}${downloadUrl}`;

      const response = await fetch(streamUrl, { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }
    } catch (dErr) {
      console.error('Post-payment auto download failed:', dErr);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast('Please login to download study resources', 'info');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const isComboOrder = isDirectCombo || selectedOption === 'COMBO';
      const targetResId = resource?._id || resource?.id || (bundle?.id || 'c9-sci-ch1-formula');

      // 1. Create order on backend
      let orderRes;
      if (isComboOrder) {
        orderRes = await createBundlePaymentOrder({
          bundleId: bundle?._id || bundle?.id,
          classLevel: effectiveClass,
          subject: effectiveSubject,
          comboType: isFormula ? 'FORMULA_COMBO' : 'QA_COMBO',
        });
      } else {
        orderRes = await createResourcePaymentOrder(targetResId);
      }

      const orderData = orderRes.data || orderRes;
      const { orderId, amount, currency, keyId } = orderData;

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded && !orderId?.startsWith('stub_')) {
        setErrorMsg('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 3. Dev stub handler if Razorpay keys are in dev stub mode
      if (orderId?.startsWith('stub_order_') || !window.Razorpay) {
        const stubVerifyRes = await verifyStudyPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: `stub_payment_${Date.now()}`,
          razorpaySignature: 'stub_signature',
        });

        setPaymentSuccess(true);
        showToast(stubVerifyRes.message || 'Payment verified! Unlock complete.', 'success');
        if (!isDirectCombo && selectedOption === 'INDIVIDUAL') {
          await triggerPdfDownload(targetResId, itemTitle);
        }
        setLoading(false);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
        return;
      }

      // 4. Live Razorpay Options
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(Number(amount || activePrice) * 100).toString(),
        currency: currency || 'INR',
        name: 'MentorNearby',
        description: isComboOrder ? comboName : itemTitle,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#EA580C',
        },
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await verifyStudyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPaymentSuccess(true);
            showToast(verifyRes.message || 'Payment verified! Unlocked successfully.', 'success');
            if (!isDirectCombo && selectedOption === 'INDIVIDUAL') {
              await triggerPdfDownload(targetResId, itemTitle);
            }
            setTimeout(() => {
              onClose();
              if (onSuccess) onSuccess();
            }, 1200);
          } catch (vErr) {
            setErrorMsg(vErr.response?.data?.message || 'Payment verification failed on server');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMsg(resp.error?.description || 'Payment was cancelled or failed.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to initiate purchase');
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="sr-payment-modal-overlay"
      onClick={onClose}
    >
      <div
        className="sr-payment-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sr-payment-modal-header">
          <h3 className="sr-payment-modal-title">
            {isDirectCombo ? 'Buy Combo Pack' : 'Download this PDF'}
          </h3>
          <button
            type="button"
            className="sr-payment-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* A. DIRECT COMBO PACK PURCHASE UI                             */}
        {/* ------------------------------------------------------------ */}
        {isDirectCombo ? (
          <div>
            <div className="sr-payment-combo-summary">
              <div className={`sr-payment-combo-icon-box ${isFormula ? 'formula' : 'notes'}`}>
                {isFormula ? '📐' : '📚'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sr-payment-combo-name">
                  {comboName}
                </div>
                <div className="sr-payment-combo-inc">
                  {comboIncludedText}
                </div>
              </div>
            </div>

            {/* Value vs Price Breakdown */}
            <div className="sr-payment-breakdown-box">
              <div className="sr-payment-row">
                <span>Original Total Value:</span>
                <span className="sr-payment-strike">₹{comboOriginalVal}</span>
              </div>
              <div className="sr-payment-row green">
                <span>Bundle Discount:</span>
                <span>- ₹{comboOriginalVal - comboPrice}</span>
              </div>
              <div className="sr-payment-divider" />
              <div className="sr-payment-row total">
                <span>Amount to Pay:</span>
                <span className="sr-payment-price">₹{comboPrice}</span>
              </div>
            </div>

            <div className="sr-payment-trust-badge">
              <span>🛡️</span>
              <span>Secure Payment • Unlocks all {isFormula ? 'Formula Sheets' : 'Notes'} in this combo</span>
            </div>
          </div>
        ) : (
          /* ---------------------------------------------------------- */
          /* B. INDIVIDUAL CARD DOWNLOAD FLOW WITH COMBO OPTION         */
          /* (EXACT MATCH OF REFERENCE SCREENSHOT media_1787434630244)  */
          /* ---------------------------------------------------------- */
          <div>
            <div className="sr-payment-res-banner">
              <div className={`sr-payment-res-icon ${isFormula ? 'formula' : 'notes'}`}>
                📄
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="sr-payment-res-title" title={itemTitle}>
                  {itemTitle}
                </div>
                <div className="sr-payment-res-meta">
                  {isFormula ? 'Formula Sheet' : 'Notes'} • {effectiveSubject} • Class {effectiveClass}
                </div>
              </div>
            </div>

            {/* Free Online Reading Banner */}
            <div className="sr-payment-free-read">
              <span>✓</span>
              <span>Reading Online is FREE</span>
            </div>

            {/* Option Selection Area */}
            <div className="sr-payment-opts-header">
              <span>Choose an Option</span>
              <span className="sr-payment-shield">
                🛡️ Secure Payment
              </span>
            </div>

            <div className="sr-payment-options-list">
              {/* Option 1: Individual Download */}
              <label
                className={`sr-payment-opt-item ${selectedOption === 'INDIVIDUAL' ? 'active' : ''}`}
                onClick={() => setSelectedOption('INDIVIDUAL')}
              >
                <div className="sr-payment-opt-left">
                  <input
                    type="radio"
                    name="downloadOption"
                    checked={selectedOption === 'INDIVIDUAL'}
                    onChange={() => setSelectedOption('INDIVIDUAL')}
                  />
                  <div>
                    <div className="sr-payment-opt-title">Individual Download</div>
                    <div className="sr-payment-opt-sub">Download this specific PDF</div>
                  </div>
                </div>
                <div className="sr-payment-opt-price">
                  ₹{individualPrice}
                </div>
              </label>

              {/* Option 2: Single-Class Single-Subject Combo */}
              <label
                className={`sr-payment-opt-item ${selectedOption === 'COMBO' ? 'active' : ''}`}
                onClick={() => setSelectedOption('COMBO')}
              >
                <div className="sr-payment-opt-left">
                  <input
                    type="radio"
                    name="downloadOption"
                    checked={selectedOption === 'COMBO'}
                    onChange={() => setSelectedOption('COMBO')}
                  />
                  <div>
                    <div className="sr-payment-opt-title">{singleComboName}</div>
                    <div className="sr-payment-opt-sub">{singleComboSub}</div>
                  </div>
                </div>
                <div className="sr-payment-opt-price">
                  ₹{singleComboPrice}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="sr-payment-error-box">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="sr-payment-success-box">
            <div>✓ Payment Successful</div>
            <div className="sr-payment-success-sub">
              {isDirectCombo || selectedOption === 'COMBO'
                ? '✓ All Resources in Combo Unlocked!'
                : '✓ Download Starting Automatically...'}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          type="button"
          className="sr-payment-cta-btn"
          onClick={handleCheckout}
          disabled={loading || paymentSuccess}
        >
          {loading
            ? 'Processing Order...'
            : paymentSuccess
              ? '✓ Unlocked!'
              : isDirectCombo
                ? `Pay ₹${comboPrice} & Unlock Combo`
                : `Pay ₹${activePrice} & Download`}
        </button>

        <div className="sr-payment-footer-note">
          🛡️ Payments are secure and encrypted
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default StudyPaymentModal;
