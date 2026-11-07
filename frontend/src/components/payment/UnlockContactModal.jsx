// ============================================================
// components/payment/UnlockContactModal.jsx
// MentorNearby All Access Contact Unlock Modal (₹199/month)
// ============================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { checkUnlockEligibility } from '../../api/contactUnlocks';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UNIFIED_PLAN } from '../../config/subscription';
import { useNavigate } from 'react-router-dom';

const UnlockContactModal = ({ isOpen, onClose, tutorId, contactName, onSuccess }) => {
  const [step, setStep] = useState('checking');
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState('+91 XXXXXXX123');
  const [isProcessing, setIsProcessing] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        setStep('auth-required');
        return;
      }
      checkEligibility();
    }
  }, [isOpen, isAuthenticated, tutorId]);

  const checkEligibility = async () => {
    try {
      setStep('checking');
      setError(null);

      const res = await checkUnlockEligibility(tutorId);
      const data = res.data?.data || {};

      if (data.maskedPhone) {
        setMaskedPhone(data.maskedPhone);
      }

      // If already unlocked and contactInfo is provided, show it
      if (data.alreadyUnlocked && data.isUnlocked && data.contactInfo) {
        setContactInfo(data.contactInfo);
        setStep('success');
        if (onSuccess) onSuccess(data.contactInfo);
        return;
      }

      // If user has an active subscription, unlock right away
      if (data.hasActiveSubscription) {
        setStep('ready-to-unlock');
        await performUnlock();
        return;
      }

      // User does NOT have active subscription
      setStep('subscription-required');
    } catch (err) {
      console.warn('Unlock eligibility check note:', err);
      setStep('subscription-required');
    }
  };

  const performUnlock = async () => {
    try {
      setIsProcessing(true);
      const res = await client.post(`/contact-unlocks/unlock/${tutorId}`);
      if (res.data?.success && res.data?.data?.isUnlocked) {
        setContactInfo(res.data.data.contactInfo);
        setStep('success');
        if (onSuccess) onSuccess(res.data.data.contactInfo);
      } else {
        throw new Error(res.data?.message || 'Failed to unlock contact');
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.needSubscription) {
        setStep('subscription-required');
      } else {
        setError(err.response?.data?.message || err.message || 'Unlock failed');
        setStep('error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribeNow = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create order from backend
      const res = await client.post('/subscription/create-order', {
        amount: UNIFIED_PLAN.amount,
        planType: UNIFIED_PLAN.id,
        tutorId,
      });

      const orderData = res.data?.data || res.data || {};
      const orderId = orderData.orderId || res.data?.orderId;
      const key =
        orderData.razorpayKeyId ||
        res.data?.key ||
        import.meta.env.VITE_RAZORPAY_KEY ||
        'rzp_test_placeholder';

      // TEST MODE / SIMULATION fallback
      if (
        !orderId ||
        orderData.isTestMode ||
        orderId.startsWith('order_test_') ||
        orderId.startsWith('sub_test_') ||
        !window.Razorpay ||
        key.includes('test') ||
        key.includes('placeholder')
      ) {
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderId || `order_test_${Date.now()}`,
          paymentId: `pay_test_${Date.now()}`,
          subscriptionId: orderData.subscriptionId || `sub_test_${Date.now()}`,
          tutorId,
          planType: UNIFIED_PLAN.id,
        });

        const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
        if (contact) {
          setContactInfo(contact);
        } else {
          // Fetch unlocked contact from API
          const unlockRes = await client.post(`/contact-unlocks/unlock/${tutorId}`);
          setContactInfo(unlockRes.data?.data?.contactInfo || { phone: '', whatsappNumber: '' });
        }

        setStep('success');
        setIsProcessing(false);
        if (onSuccess) onSuccess(contact);
        return;
      }

      // LIVE Razorpay recurring checkout
      const options = {
        key: key,
        amount: orderData.amount || UNIFIED_PLAN.amountInPaise,
        currency: 'INR',
        name: 'MentorNearby',
        description: 'MentorNearby All Access — ₹199/month AutoPay',
        order_id: orderId,
        subscription_id: orderData.subscriptionId || undefined,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async function (response) {
          try {
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id || orderData.subscriptionId,
              razorpay_signature: response.razorpay_signature,
              tutorId,
              planType: UNIFIED_PLAN.id,
            });

            const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
            setContactInfo(contact || { phone: '', whatsappNumber: '' });
            setStep('success');
            if (onSuccess) onSuccess(contact);
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            setStep('error');
          } finally {
            setIsProcessing(false);
          }
        },
        theme: { color: '#E11D48' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment authorization failed');
        setStep('error');
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed');
      setStep('error');
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Contact Details">
      <div className="text-center p-2 sm:p-4">
        {step === 'auth-required' && (
          <div className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h4 className="text-xl font-bold text-gray-900">Login Required</h4>
            <p className="text-sm text-gray-600">You need to be logged in to view private mobile numbers.</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer"
                onClick={() => navigate('/login')}
              >
                Login Now
              </button>
            </div>
          </div>
        )}

        {step === 'checking' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">Verifying subscription entitlement...</p>
          </div>
        )}

        {step === 'ready-to-unlock' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">All Access verified! Unlocking contact...</p>
          </div>
        )}

        {step === 'subscription-required' && (
          <div className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Unlock Contact Details
            </h4>
            
            {/* Masked phone banner */}
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-mono text-base font-bold">
              <span>📞</span> <span>{maskedPhone}</span>
            </div>

            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Subscribe to <strong>MentorNearby All Access</strong> for <strong>₹{UNIFIED_PLAN.amount}/month</strong> to unlock tutor and student contact details.
            </p>

            <div className="bg-[#fff1f2] border border-rose-200 rounded-2xl p-5 text-left shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <span>👑</span> <span>MentorNearby All Access (₹{UNIFIED_PLAN.amount}/month):</span>
              </div>
              <ul className="text-xs text-gray-700 space-y-1.5 list-none p-0 m-0">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Unlimited</strong> tutor and student direct phone reveals</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>1-Click direct WhatsApp &amp; voice calling</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Zero brokerage and 0% commission forever</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>AutoPay monthly billing • Cancel anytime with 1 click</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={handleSubscribeNow}
                disabled={isProcessing}
                className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 px-6 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
              >
                <span>{isProcessing ? 'Connecting to AutoPay...' : `Subscribe Now – ₹${UNIFIED_PLAN.amount}/month`}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'success' && contactInfo && (
          <div className="space-y-4">
            <div className="text-5xl">✅</div>
            <h4 className="text-2xl font-extrabold text-emerald-700">Contact Details Unlocked!</h4>
            <p className="text-xs text-gray-600">
              Verified contact information for {contactInfo.name || contactName || 'the educator'}:
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-[11px] uppercase font-bold text-gray-500">Mobile Number</p>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-lg font-black text-gray-900 hover:text-rose-600"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              {contactInfo.whatsappNumber && (
                <div className="flex items-center gap-3 pt-2.5 border-t border-emerald-100">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-500">WhatsApp</p>
                    <a
                      href={`https://wa.me/91${contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-emerald-700 hover:underline"
                    >
                      {contactInfo.whatsappNumber}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.email && (
                <div className="flex items-center gap-3 pt-2.5 border-t border-emerald-100">
                  <span className="text-xl">✉️</span>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-500">Email Address</p>
                    <p className="text-xs font-semibold text-gray-800">{contactInfo.email}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition cursor-pointer"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="text-5xl">❌</div>
            <h4 className="text-xl font-bold text-rose-600">Unlock Failed</h4>
            <p className="text-xs text-gray-600">{error || 'Something went wrong while processing the unlock.'}</p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm cursor-pointer"
                onClick={handleSubscribeNow}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UnlockContactModal;
