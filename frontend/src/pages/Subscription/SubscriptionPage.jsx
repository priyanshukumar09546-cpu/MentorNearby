// ============================================================
// pages/Subscription/SubscriptionPage.jsx
// MentorNearby Official Subscription & Contact Unlock Plans
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Helper to load Razorpay script
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

const SubscriptionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [subStatus, setSubStatus] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      client.get('/subscription/status')
        .then((res) => {
          if (res.data?.data) {
            setSubStatus(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSubscribe = async (planKey) => {
    if (planKey === 'free') {
      showToast('You are on the Free plan. Browse up to 3 profiles daily.', 'info');
      const params = new URLSearchParams(location.search);
      const redirectUrl = params.get('redirect') || '/search';
      navigate(redirectUrl);
      return;
    }

    if (!isAuthenticated) {
      showToast('Please login or register to choose a plan.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    setLoadingPlan(planKey);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Could not load payment gateway. Please check your internet connection.', 'error');
        setLoadingPlan(null);
        return;
      }

      const res = await client.post('/subscription/create-order', { planType: planKey });
      const orderData = res.data?.data || res.data;

      if (!orderData || !orderData.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      // If test order simulation
      if (orderData.isTestMode || orderData.orderId.startsWith('order_test_')) {
        showToast('Processing test activation...', 'info');
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderData.orderId,
          paymentId: `pay_test_${Date.now()}`,
          planType: planKey,
        });

        showToast(verifyRes.data?.message || 'Plan activated successfully!', 'success');
        setLoadingPlan(null);

        const params = new URLSearchParams(location.search);
        const redirectUrl = params.get('redirect') || '/student-dashboard';
        navigate(redirectUrl);
        return;
      }

      const options = {
        key: orderData.razorpayKeyId || orderData.key || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'MentorNearby',
        description: orderData.planLabel || `${planKey.toUpperCase()} Plan`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2563EB',
        },
        handler: async (response) => {
          try {
            showToast('Verifying payment and activating your plan...', 'info');
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_sig',
              planType: planKey,
            });

            showToast(verifyRes.data?.message || 'Plan activated successfully!', 'success');
            
            const params = new URLSearchParams(location.search);
            const redirectUrl = params.get('redirect') || '/student-dashboard';
            navigate(redirectUrl);
          } catch (err) {
            showToast(err.response?.data?.message || 'Payment verification failed', 'error');
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'info');
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast(`Payment failed: ${response.error?.description || 'Transaction declined'}`, 'error');
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(err.response?.data?.message || err.message || 'Payment checkout error', 'error');
      setLoadingPlan(null);
    }
  };

  const currentPlan = subStatus?.plan || user?.subscriptionType || 'free';
  const hasActiveCredits = (subStatus?.contactUnlocks ?? user?.contactUnlocks ?? 0) > 0;
  const isSubscribed = Boolean(
    subStatus?.isSubscribed ||
    (user?.isSubscribed && user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
  );

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            ⭐ 100% Direct • Zero Brokerage
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Choose Your Plan to Connect
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Choose the right plan to unlock teacher contact details, call directly, chat on WhatsApp, and learn without middleman brokerage.
          </p>
        </div>

        {/* Current Status Banner (if active) */}
        {(isSubscribed || hasActiveCredits) && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs">
            <div>
              <p className="font-extrabold text-emerald-900 dark:text-emerald-300 text-base flex items-center gap-2">
                <span>✨ Active Entitlement:</span>
                <span className="uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs">
                  {currentPlan === 'single' ? 'Single Unlock Pass' : currentPlan}
                </span>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Available Contact Unlocks: <strong>{subStatus?.remainingUnlocksFormatted || `${user?.contactUnlocks ?? 0} Remaining`}</strong>
                {user?.subscriptionExpiry && (
                  <span> • Valid till: {new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/student-dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              View in Dashboard →
            </button>
          </div>
        )}

        {/* 4 Pricing Cards Grid (1 col on mobile, 2 cols on tablet, 4 cols on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* ============================================================ */}
          {/* PLAN 1: FREE (₹0)                                           */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-[#121217] border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-gray-500 dark:text-zinc-400">Basic</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">FREE</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Explore tutors and send introductory enquiries.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">₹0</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400"> / forever</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 dark:text-zinc-300 border-t border-gray-100 dark:border-zinc-800">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 3 tutor/student profile views per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Search verified tutors near you
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Send direct enquiry messages
                </li>
                <li className="flex items-center gap-2 text-gray-400 dark:text-zinc-500">
                  <span className="text-gray-300 dark:text-zinc-600 font-bold">✕</span> No phone number unlock
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('free')}
              className="mt-8 w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
            >
              Continue with Free
            </button>
          </div>

          {/* ============================================================ */}
          {/* PLAN 2: SINGLE UNLOCK (₹99) - ONE-TIME [HIGHLIGHTED]        */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-[#121217] border-2 border-blue-600 dark:border-blue-500 rounded-3xl p-6 shadow-xl relative flex flex-col justify-between transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
              ⚡ One-Time
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Quick Connect</span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">SINGLE UNLOCK</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Instant unlock without recurring subscription.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">₹99</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium"> / one-time</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 dark:text-zinc-300 border-t border-gray-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  <span className="text-emerald-500 font-bold">✓</span> <strong>2 contact unlocks instantly</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Direct Phone + WhatsApp access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> One-time payment (no auto-debit)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> No monthly subscription commitment
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('single')}
              disabled={loadingPlan === 'single'}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition cursor-pointer"
            >
              {loadingPlan === 'single' ? 'Opening Gateway...' : 'Unlock Contacts – ₹99'}
            </button>
          </div>

          {/* ============================================================ */}
          {/* PLAN 3: STARTER (₹199/mo)                                   */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-[#121217] border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs relative flex flex-col justify-between hover:shadow-md transition">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
              🔥 Most Popular for Students
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Monthly Pass</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">STARTER</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Ideal for active students looking for multiple tutors.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">₹199</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400"> / month</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 dark:text-zinc-300 border-t border-gray-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  <span className="text-emerald-500 font-bold">✓</span> <strong>20 contacts unlock per month</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Unlimited profile views
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Direct WhatsApp chat
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Validity: 30 days
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Starter badge
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loadingPlan === 'starter'}
              className="mt-8 w-full bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              {loadingPlan === 'starter' ? 'Opening Gateway...' : 'Get Starter – ₹199'}
            </button>
          </div>

          {/* ============================================================ */}
          {/* PLAN 4: PRO (₹499/mo)                                       */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-[#121217] border border-purple-200 dark:border-purple-900/50 rounded-3xl p-6 shadow-xs relative flex flex-col justify-between hover:shadow-md transition">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
              👑 Best for Tutors
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Professional</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">PRO</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Top visibility and unlimited leads for tutors &amp; centers.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">₹499</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400"> / month</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 dark:text-zinc-300 border-t border-gray-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  <span className="text-emerald-500 font-bold">✓</span> <strong>Unlimited contacts unlock</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Unlimited profile views + search
                </li>
                <li className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-300">
                  <span className="text-emerald-500 font-bold">✓</span> Top listing in Featured Tutors
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Verified badge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 0% commission leads
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Validity: 30 days
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loadingPlan === 'pro'}
              className="mt-8 w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              {loadingPlan === 'pro' ? 'Opening Gateway...' : 'Get Pro – ₹499'}
            </button>
          </div>

        </div>

        {/* Trust Badges Footer */}
        <div className="pt-8 border-t border-gray-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-gray-600 dark:text-zinc-400">
          <div className="flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>Secure Razorpay Checkout</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span>⚡</span>
            <span>Instant Phone &amp; WhatsApp Access</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span>📞</span>
            <span>100% Direct Teacher Contacts</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span>🚫</span>
            <span>Zero Middleman Brokerage</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPage;
