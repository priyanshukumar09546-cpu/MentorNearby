// ============================================================
// pages/Subscription/SubscriptionPage.jsx
// MentorNearby Official Subscription & Contact Unlock Plans
// Pixel-Perfect Replica of Master Reference Design
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SubscriptionPage.css';

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

const SubscriptionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [subStatus, setSubStatus] = useState(null);

  // Coupon state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      client
        .get('/subscription/status')
        .then((res) => {
          if (res.data?.data) {
            setSubStatus(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'MENTOR25' || code === 'SAVE25') {
      setAppliedDiscount(25);
      showToast('Coupon applied! 25% discount activated on all plans.', 'success');
      setShowCouponModal(false);
    } else if (code === 'WELCOME10' || code === 'TUTOR10') {
      setAppliedDiscount(10);
      showToast('Coupon applied! 10% discount activated.', 'success');
      setShowCouponModal(false);
    } else {
      showToast('Invalid or expired coupon code.', 'error');
    }
  };

  const handleSubscribe = async (planKey) => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to choose a plan.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    // Determine actual backend plan key
    const actualPlanKey = billingCycle === 'yearly' ? `${planKey}_yearly` : planKey;
    setLoadingPlan(planKey);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Could not load payment gateway. Please check your internet connection.', 'error');
        setLoadingPlan(null);
        return;
      }

      const res = await client.post('/subscription/create-order', {
        planType: actualPlanKey,
        billingCycle,
        discountPercent: appliedDiscount,
      });

      const orderData = res.data?.data || res.data;

      if (!orderData || !orderData.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      // If test order simulation (Render/Local test keys)
      if (orderData.isTestMode || orderData.orderId.startsWith('order_test_')) {
        showToast('Processing test activation...', 'info');
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderData.orderId,
          paymentId: `pay_test_${Date.now()}`,
          planType: actualPlanKey,
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
          color: planKey === 'growth' ? '#F59E0B' : '#2563EB',
        },
        handler: async (response) => {
          try {
            showToast('Verifying payment and activating your plan...', 'info');
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'simulated_sig',
              planType: actualPlanKey,
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

  const isYearly = billingCycle === 'yearly';
  const currentPlan = subStatus?.plan || user?.subscriptionType || 'free';
  const hasActiveCredits = (subStatus?.contactUnlocks ?? user?.contactUnlocks ?? 0) > 0;
  const isSubscribed = Boolean(
    subStatus?.isSubscribed ||
      (user?.isSubscribed && user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
  );

  return (
    <div className="mn-sub-root">
      <div className="mn-sub-container">
        
        {/* ============================================================ */}
        {/* TOP BRAND & GUARANTEE HEADER                                 */}
        {/* ============================================================ */}
        <header className="mn-sub-top-header">
          <Link to="/" className="mn-sub-brand-logo">
            <div>
              <div className="mn-sub-logo-text">
                Mentor<span className="mn-sub-logo-accent">Nearby</span>
              </div>
              <div className="mn-sub-logo-tagline">FIND. LEARN. GROW.</div>
            </div>
          </Link>

          <div className="mn-sub-guarantee-badge">
            <svg className="mn-sub-guarantee-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span>All plans come with a 7-day money back guarantee</span>
          </div>
        </header>

        {/* ============================================================ */}
        {/* CENTER HERO & TITLE                                          */}
        {/* ============================================================ */}
        <section className="mn-sub-hero">
          <div className="mn-sub-tag-pill">
            <span>👑</span>
            <span>Subscription Plans</span>
          </div>

          <h1 className="mn-sub-title">
            Choose the <span className="mn-sub-title-highlight">Perfect Plan</span> for Your Learning Journey
          </h1>

          <p className="mn-sub-subtitle">
            Unlock tutor contacts, connect instantly and take the next step towards your success.
          </p>

          {/* Social Proof (Left) & Billing Cycle Toggle (Right) Row */}
          <div className="mn-sub-controls-row">
            
            {/* Left Floating Social Proof */}
            <div className="mn-sub-social-proof-card">
              <div className="mn-sub-avatars-group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
                  alt="Student"
                  className="mn-sub-avatar-img"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces"
                  alt="Student"
                  className="mn-sub-avatar-img"
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces"
                  alt="Student"
                  className="mn-sub-avatar-img"
                />
              </div>
              <div>
                <div className="mn-sub-social-title">Trusted by 50K+ Students</div>
                <div className="mn-sub-social-sub">Connecting students with the best tutors across India</div>
              </div>
            </div>

            {/* Right Billing Toggle */}
            <div className="mn-sub-toggle-wrap">
              <span
                className={`mn-sub-toggle-label ${!isYearly ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={isYearly}
                onClick={() => setBillingCycle(isYearly ? 'monthly' : 'yearly')}
                className={`mn-sub-toggle-switch ${isYearly ? 'yearly-active' : ''}`}
              >
                <span className="mn-sub-toggle-circle"></span>
              </button>

              <span
                className={`mn-sub-toggle-label ${isYearly ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
              </span>

              <span className="mn-sub-save-badge">Save up to 25%</span>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* ACTIVE ENTITLEMENT BANNER (If user already has active plan) */}
        {/* ============================================================ */}
        {(isSubscribed || hasActiveCredits) && (
          <div className="mn-sub-active-banner">
            <div>
              <div className="mn-sub-active-title">
                <span>✨ Active Entitlement:</span>
                <span className="mn-sub-active-pill">{currentPlan}</span>
              </div>
              <div className="mn-sub-active-text">
                Available Contact Unlocks: <strong>{subStatus?.remainingUnlocksFormatted || `${user?.contactUnlocks ?? 0} Remaining`}</strong>
                {user?.subscriptionExpiry && (
                  <span> • Valid till: {new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student-dashboard')}
              className="mn-sub-btn growth"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '12px' }}
            >
              View in Dashboard →
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4 PRICING CARDS (Starter | Growth | Pro | Premium)           */}
        {/* ============================================================ */}
        <div className="mn-sub-cards-grid">
          
          {/* ────────────────────────────────────────────────────────── */}
          {/* CARD 1: STARTER (Green)                                     */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="mn-sub-card">
            <div>
              <div className="mn-sub-card-header">
                <div className="mn-sub-plan-icon-wrap starter">
                  {/* Paper Plane / Rocket Icon */}
                  <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 className="mn-sub-plan-title">Starter</h3>
                  <p className="mn-sub-plan-subtitle">Perfect to get started</p>
                </div>
              </div>

              <div className="mn-sub-price-block">
                <div className="mn-sub-price-row">
                  <span className="mn-sub-price-num starter">
                    ₹{isYearly ? 74 : 99}
                  </span>
                  <span className="mn-sub-price-period">/month</span>
                </div>
                <div className="mn-sub-price-billed">
                  {isYearly ? 'Billed ₹891 yearly' : 'Billed monthly'}
                </div>
              </div>

              <ul className="mn-sub-features-list">
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon starter">✓</span>
                  <span>Unlock {isYearly ? '36' : '3'} Tutor Contacts / {isYearly ? 'year' : 'month'}</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon starter">✓</span>
                  <span>View Tutor Profiles</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon starter">✓</span>
                  <span>Basic Search Filters</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon starter">✓</span>
                  <span>Chat Support</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleSubscribe('starter')}
              disabled={loadingPlan === 'starter'}
              className="mn-sub-btn starter"
            >
              {loadingPlan === 'starter' ? 'Opening Gateway...' : 'Choose Starter'}
            </button>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* CARD 2: GROWTH (Gold / Most Popular Highlighted)            */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="mn-sub-card most-popular">
            <div className="mn-sub-popular-badge">
              <span>👑</span>
              <span>Most Popular</span>
            </div>

            <div>
              <div className="mn-sub-card-header">
                <div className="mn-sub-plan-icon-wrap growth">
                  {/* Rocket Icon */}
                  <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="mn-sub-plan-title">Growth</h3>
                  <p className="mn-sub-plan-subtitle">For serious learners</p>
                </div>
              </div>

              <div className="mn-sub-price-block">
                <div className="mn-sub-price-row">
                  <span className="mn-sub-price-num growth">
                    ₹{isYearly ? 149 : 199}
                  </span>
                  <span className="mn-sub-price-period">/month</span>
                </div>
                <div className="mn-sub-price-billed">
                  {isYearly ? 'Billed ₹1,791 yearly' : 'Billed monthly'}
                </div>
              </div>

              <ul className="mn-sub-features-list">
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon growth">✓</span>
                  <span>Unlock {isYearly ? '120' : '10'} Tutor Contacts / {isYearly ? 'year' : 'month'}</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon growth">✓</span>
                  <span>Advanced Search Filters</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon growth">✓</span>
                  <span>Priority Support</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon growth">✓</span>
                  <span>Save Favorite Tutors</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon growth">✓</span>
                  <span>View Tutor Availability</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleSubscribe('growth')}
              disabled={loadingPlan === 'growth'}
              className="mn-sub-btn growth"
            >
              {loadingPlan === 'growth' ? 'Opening Gateway...' : 'Choose Growth'}
            </button>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* CARD 3: PRO (Purple)                                        */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="mn-sub-card">
            <div>
              <div className="mn-sub-card-header">
                <div className="mn-sub-plan-icon-wrap pro">
                  {/* Diamond / Gem Icon */}
                  <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9Z"></path>
                    <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                    <path d="M2 9h20"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="mn-sub-plan-title">Pro</h3>
                  <p className="mn-sub-plan-subtitle">For dedicated students</p>
                </div>
              </div>

              <div className="mn-sub-price-block">
                <div className="mn-sub-price-row">
                  <span className="mn-sub-price-num pro">
                    ₹{isYearly ? 299 : 399}
                  </span>
                  <span className="mn-sub-price-period">/month</span>
                </div>
                <div className="mn-sub-price-billed">
                  {isYearly ? 'Billed ₹3,591 yearly' : 'Billed monthly'}
                </div>
              </div>

              <ul className="mn-sub-features-list">
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>Unlock {isYearly ? '300' : '25'} Tutor Contacts / {isYearly ? 'year' : 'month'}</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>All Advanced Features</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>Direct Chat with Tutors</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>Priority Support</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>No Ads Experience</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon pro">✓</span>
                  <span>Early Access to New Features</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleSubscribe('pro')}
              disabled={loadingPlan === 'pro'}
              className="mn-sub-btn pro"
            >
              {loadingPlan === 'pro' ? 'Opening Gateway...' : 'Choose Pro'}
            </button>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* CARD 4: PREMIUM (Blue)                                      */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="mn-sub-card">
            <div>
              <div className="mn-sub-card-header">
                <div className="mn-sub-plan-icon-wrap premium">
                  {/* Crown / Shield Icon */}
                  <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="mn-sub-plan-title">Premium</h3>
                  <p className="mn-sub-plan-subtitle">Unlimited opportunities</p>
                </div>
              </div>

              <div className="mn-sub-price-block">
                <div className="mn-sub-price-row">
                  <span className="mn-sub-price-num premium">
                    ₹{isYearly ? 524 : 699}
                  </span>
                  <span className="mn-sub-price-period">/month</span>
                </div>
                <div className="mn-sub-price-billed">
                  {isYearly ? 'Billed ₹6,291 yearly' : 'Billed monthly'}
                </div>
              </div>

              <ul className="mn-sub-features-list">
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span><strong>Unlimited Tutor Contacts</strong></span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span>All Premium Features</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span>Personalized Recommendations</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span>Priority Support</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span>No Ads Experience</span>
                </li>
                <li className="mn-sub-feature-item">
                  <span className="mn-sub-check-icon premium">✓</span>
                  <span>Early Access to New Features</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium'}
              className="mn-sub-btn premium"
            >
              {loadingPlan === 'premium' ? 'Opening Gateway...' : 'Choose Premium'}
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* BOTTOM TRUST & COUPON STRIP                                  */}
        {/* ============================================================ */}
        <footer className="mn-sub-trust-strip">
          <div className="mn-sub-trust-items">
            
            {/* 1. Secure Payments */}
            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Secure Payments</div>
                <div className="mn-sub-trust-sub">100% Safe & Encrypted</div>
              </div>
            </div>

            {/* 2. Instant Access */}
            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Instant Access</div>
                <div className="mn-sub-trust-sub">Start using immediately</div>
              </div>
            </div>

            {/* 3. Cancel Anytime */}
            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Cancel Anytime</div>
                <div className="mn-sub-trust-sub">No questions asked</div>
              </div>
            </div>

            {/* 4. Trusted Platform */}
            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Trusted Platform</div>
                <div className="mn-sub-trust-sub">50K+ students trust us</div>
              </div>
            </div>

          </div>

          {/* Right Coupon Code Action */}
          <button
            type="button"
            onClick={() => setShowCouponModal(true)}
            className="mn-sub-coupon-link"
          >
            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>Have a coupon code? <span className="mn-sub-coupon-apply">Apply Now</span></span>
          </button>
        </footer>

        {/* ============================================================ */}
        {/* COUPON CODE MODAL                                            */}
        {/* ============================================================ */}
        {showCouponModal && (
          <div className="mn-coupon-modal-overlay" onClick={() => setShowCouponModal(false)}>
            <div className="mn-coupon-modal-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Apply Promo Coupon</h3>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                Enter your promo code below to get instant discounts on MentorNearby plans.
              </p>

              <form onSubmit={handleApplyCoupon} className="mn-coupon-input-row">
                <input
                  type="text"
                  placeholder="e.g. MENTOR25"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="mn-coupon-input"
                  autoFocus
                />
                <button type="submit" className="mn-coupon-apply-btn">
                  Apply
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionPage;
