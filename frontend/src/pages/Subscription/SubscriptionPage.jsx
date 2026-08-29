// ============================================================
// pages/Subscription/SubscriptionPage.jsx
// MentorNearby Official Subscription & Contact Unlock Plans
// ============================================================

import React, { useState } from 'react';
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSubscribe = async (planKey) => {
    if (planKey === 'free') {
      showToast('You are already on the standard free plan.', 'info');
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
      const orderData = res.data?.data;

      if (!orderData || !orderData.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      const options = {
        key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'MentorNearby',
        description: orderData.planLabel || `${planKey.toUpperCase()} Subscription Plan`,
        order_id: orderData.orderId.startsWith('order_mn_') || orderData.orderId.startsWith('order_sim_') ? undefined : orderData.orderId,
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
            showToast('Verifying payment and activating subscription...', 'info');
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_sig',
              planType: planKey,
            });

            showToast(verifyRes.data?.message || 'Subscription activated successfully!', 'success');
            
            // Redirect back to chat or student dashboard
            const params = new URLSearchParams(location.search);
            const redirectUrl = params.get('redirect') || '/student-dashboard';
            navigate(redirectUrl);
          } catch (err) {
            showToast(err.response?.data?.message || 'Payment verification failed', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment window closed.', 'info');
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast(`Payment failed: ${response.error.description || 'Transaction declined'}`, 'error');
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(err.response?.data?.message || err.message || 'Payment checkout error', 'error');
      setLoadingPlan(null);
    }
  };

  const isSubscribed = Boolean(
    user?.isSubscribed && user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()
  );

  return (
    <div className="min-h-screen bg-[#f8faff] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-blue-200">
            ⭐ 100% Direct & Transparent
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Unlock Teacher Contacts &amp; Chat Without Brokerage
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Choose a plan that fits your learning needs. Directly chat, call, and unlock verified tutors within 5km of your location.
          </p>
        </div>

        {/* Current Status Banner (if subscribed) */}
        {isSubscribed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-extrabold text-emerald-900 text-base">
                ✨ Active Subscription: {user?.subscriptionType?.toUpperCase() || 'SUBSCRIBED'}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Expires on: {new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Contact Unlocks: <strong>{user?.contactUnlocks ?? 0}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/student-dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Plan 1: Free */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-gray-500">Starter</span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">Free Plan</h3>
                <p className="text-xs text-gray-500 mt-1">Explore teachers and send your first messages.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-gray-900">₹0</span>
                <span className="text-xs text-gray-500"> / forever</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 3 Free Direct Messages
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Browse &amp; Search Verified Tutors
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Free 2-Page Study Notes Previews
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-300 font-bold">✕</span> No Direct Phone Unlocks
                </li>
              </ul>
            </div>

            <button
              disabled
              className="mt-8 w-full bg-gray-100 text-gray-500 font-bold text-xs py-3 rounded-xl cursor-default"
            >
              Current Free Plan
            </button>
          </div>

          {/* Plan 2: Basic (₹99/mo) - Highlighted */}
          <div className="bg-white border-2 border-blue-600 rounded-3xl p-6 shadow-lg relative flex flex-col justify-between transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
              ⭐ Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-blue-600">Recommended</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">Basic Plan</h3>
                <p className="text-xs text-gray-500 mt-1">Best for students finding local home tutors.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-blue-600">₹99</span>
                <span className="text-xs text-gray-500"> / month</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 border-t border-gray-100">
                <li className="flex items-center gap-2 font-semibold text-gray-900">
                  <span className="text-emerald-600 font-bold">✓</span> <strong>5 Direct Phone Number Unlocks</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> <strong>Unlimited Direct Chats</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Download Full Watermarked PDF Notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Formula Sheets &amp; NCERT Solutions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> 30-Day Full Access
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loadingPlan === 'basic'}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              {loadingPlan === 'basic' ? 'Opening Gateway...' : 'Unlock 5 Contacts — ₹99/mo'}
            </button>
          </div>

          {/* Plan 3: Premium (₹199/mo) */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-indigo-600">Complete Master</span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">Premium VIP</h3>
                <p className="text-xs text-gray-500 mt-1">For students preparing for board exams &amp; competitions.</p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-indigo-600">₹199</span>
                <span className="text-xs text-gray-500"> / month</span>
              </div>

              <ul className="space-y-2.5 pt-4 text-xs text-gray-700 border-t border-gray-100">
                <li className="flex items-center gap-2 font-semibold text-gray-900">
                  <span className="text-emerald-600 font-bold">✓</span> <strong>15 Direct Phone Number Unlocks</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> <strong>Unlimited Direct Chats</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> All 10+ Years Board PYQs &amp; Video Solved Papers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Priority Tutor Matching Support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> 30-Day VIP Pass
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium'}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              {loadingPlan === 'premium' ? 'Opening Gateway...' : 'Upgrade to Premium — ₹199/mo'}
            </button>
          </div>

        </div>

        {/* Trust Badges Footer */}
        <div className="pt-6 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-gray-600">
          <div>🔒 Secure Razorpay Payments</div>
          <div>⚡ Instant Contact &amp; Chat Access</div>
          <div>📞 100% Direct Teacher Phone Numbers</div>
          <div>🚫 Zero Brokerage Commissions</div>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPage;
