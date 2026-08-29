// ============================================================
// components/payment/UnlockContactModal.jsx
// Instant contact unlock with active test payment support
// ============================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { checkUnlockEligibility } from '../../api/contactUnlocks';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UnlockContactModal = ({ isOpen, onClose, tutorId }) => {
  const [step, setStep] = useState('checking');
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
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

      const isUserSubscribed = Boolean(
        user?.isSubscribed ||
        user?.subscriptionActive ||
        user?.plan === 'active' ||
        user?.role === 'ADMIN' ||
        (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
      );

      // 1. If subscribed, automatically fetch contact and display
      if (isUserSubscribed) {
        try {
          const tutorRes = await client.get(`/tutors/${tutorId}`);
          const tData = tutorRes.data?.data?.tutorProfile || tutorRes.data?.tutorProfile || tutorRes.data?.tutor || tutorRes.data?.data;
          const realPhone = tData?.phone || tData?.user?.phone || '';
          setContactInfo({
            phone: realPhone,
            whatsappNumber: tData?.whatsappNumber || realPhone,
            email: tData?.user?.email || tData?.email || '',
          });
          setStep('success');
          return;
        } catch (e) {
          // fallback to checkUnlockEligibility
        }
      }

      const res = await checkUnlockEligibility(tutorId);
      const isAlreadyUnlocked = res.data?.data?.alreadyUnlocked || res.data?.data?.isSubscribed;

      if (isAlreadyUnlocked && res.data?.data?.contactInfo) {
        setContactInfo(res.data.data.contactInfo);
        setStep('success');
      } else if (isUserSubscribed) {
        // Fetch directly from tutor profile
        const tutorRes = await client.get(`/tutors/${tutorId}`);
        const tData = tutorRes.data?.data?.tutorProfile || tutorRes.data?.tutorProfile || tutorRes.data?.tutor || tutorRes.data?.data;
        const realPhone = tData?.phone || tData?.user?.phone || '';
        setContactInfo({
          phone: realPhone,
          whatsappNumber: tData?.whatsappNumber || realPhone,
          email: tData?.user?.email || tData?.email || '',
        });
        setStep('success');
      } else {
        setStep('subscription-required');
      }
    } catch (err) {
      setStep('subscription-required');
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create order from backend
      const res = await client.post('/subscription/create-order', {
        amount: 99,
        planType: 'basic',
        tutorId,
      });

      const orderData = res.data?.data || res.data || {};
      const orderId = orderData.orderId || res.data?.orderId;
      const key = orderData.razorpayKeyId || res.data?.key || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder';
      const amount = orderData.amount || 9900;

      // 2. TEST MODE - Instant verification without popup
      if (
        !orderId ||
        orderId.startsWith('order_test_') ||
        orderId.startsWith('order_sim_') ||
        orderId.startsWith('order_mn_') ||
        !window.Razorpay ||
        key.includes('test') ||
        key.includes('placeholder')
      ) {
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderId || `order_test_${Date.now()}`,
          paymentId: `pay_test_${Date.now()}`,
          tutorId,
          plan: 'basic',
        });

        const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
        if (contact) {
          setContactInfo(contact);
        } else {
          // Fetch directly from tutor profile
          try {
            const tutorRes = await client.get(`/tutors/${tutorId}`);
            const tData = tutorRes.data?.data?.tutorProfile || tutorRes.data?.data;
            const realPhone = tData?.phone || tData?.user?.phone || '';
            setContactInfo({
              phone: realPhone,
              whatsappNumber: tData?.whatsappNumber || realPhone,
              email: tData?.user?.email || tData?.email || '',
            });
          } catch (_) {
            setContactInfo({
              phone: '',
              whatsappNumber: '',
              email: '',
            });
          }
        }

        setStep('success');
        setIsProcessing(false);
        return;
      }

      // 3. LIVE Razorpay Gateway (when production keys exist)
      const options = {
        key: key,
        amount: typeof amount === 'number' && amount < 1000 ? amount * 100 : amount,
        currency: 'INR',
        name: 'MentorNearby',
        description: 'Unlock 5 Tutor Contacts (₹99)',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async function (response) {
          try {
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tutorId,
              plan: 'basic',
            });

            const contact = verifyRes.data?.contactInfo || verifyRes.data?.data?.contactInfo;
            setContactInfo(contact || { phone: '', whatsappNumber: '' });
            setStep('success');
          } catch (err) {
            setError('Payment verification failed');
            setStep('error');
          } finally {
            setIsProcessing(false);
          }
        },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment failed or cancelled');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Tutor Contact">
      <div className="text-center p-2 sm:p-4">
        {step === 'auth-required' && (
          <div className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h4 className="text-xl font-bold text-gray-900">Login Required</h4>
            <p className="text-sm text-gray-600">You need to be logged in to view tutor phone numbers.</p>
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
            <p className="text-sm text-gray-600 font-medium">Checking unlock status...</p>
          </div>
        )}

        {(step === 'subscription-required' || step === 'decision') && (
          <div className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">Direct Contact Details are Locked</h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              To protect educator privacy, verified phone numbers and WhatsApp details are unlocked for active <strong>MentorNearby</strong> members.
            </p>

            <div className="bg-[#f8faff] border border-blue-100 rounded-2xl p-5 text-left shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <span>✨</span> <span>Choose a plan to start connecting directly:</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1.5 list-none p-0 m-0">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>100% Verified Direct Phone Numbers &amp; WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Zero Commission &amp; Zero Middleman Brokerage</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Unlimited Direct In-App Chat with Tutors</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/subscription');
                }}
                className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 px-6 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
              >
                <span>👑 View Subscription Plans →</span>
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-600 font-medium">Processing unlock request...</p>
          </div>
        )}

        {step === 'success' && contactInfo && (
          <div className="space-y-4">
            <div className="text-5xl">✅</div>
            <h4 className="text-2xl font-extrabold text-emerald-700">Contact Unlocked!</h4>
            <p className="text-xs text-gray-600">You can now reach out directly to the teacher.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <p className="text-[11px] uppercase font-bold text-gray-500">Phone Number</p>
                  <a href={`tel:${contactInfo.phone}`} className="text-base font-extrabold text-gray-900 hover:text-blue-600">
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              {contactInfo.whatsappNumber && (
                <div className="flex items-center gap-3 pt-2 border-t border-emerald-100">
                  <span className="text-xl">💬</span>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-500">WhatsApp</p>
                    <a
                      href={`https://wa.me/91${contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-extrabold text-emerald-700 hover:underline"
                    >
                      {contactInfo.whatsappNumber}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo.email && (
                <div className="flex items-center gap-3 pt-2 border-t border-emerald-100">
                  <span className="text-xl">✉️</span>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-gray-500">Email</p>
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
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer"
                onClick={handlePay}
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
