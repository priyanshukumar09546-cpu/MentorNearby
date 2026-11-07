// ============================================================
// pages/Subscription/SubscriptionPage.jsx
// MentorNearby All Access — Unified ₹199/month Subscription
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import client from '../../api/client';
import { UNIFIED_PLAN } from '../../config/subscription';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SubscriptionPage.css';

// Helper to dynamically load Razorpay checkout script
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

  const [activeTab, setActiveTab] = useState(
    user?.role === 'TUTOR' ? 'tutor' : 'student'
  );
  const [loading, setLoading] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [showFaqIndex, setShowFaqIndex] = useState(null);

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

  const isSubscribed = Boolean(
    subStatus?.isSubscribed ||
      (user?.isSubscribed &&
        user?.subscriptionExpiry &&
        new Date(user.subscriptionExpiry) > new Date())
  );

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to activate All Access.', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    if (isSubscribed) {
      showToast('You already have an active MentorNearby All Access subscription!', 'info');
      const dest = user?.role === 'TUTOR' ? '/tutor-dashboard' : '/student-dashboard';
      navigate(dest);
      return;
    }

    setLoading(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Could not load payment gateway. Please check your internet connection.', 'error');
        setLoading(false);
        return;
      }

      // Create subscription order / mandate on backend
      const res = await client.post('/subscription/create-order', {
        planType: UNIFIED_PLAN.id,
      });

      const orderData = res.data?.data || res.data;

      if (!orderData || !orderData.orderId) {
        throw new Error(res.data?.message || 'Failed to create payment order');
      }

      // If test order simulation (Render / Local test keys fallback)
      if (orderData.isTestMode || orderData.orderId.startsWith('order_test_') || orderData.orderId.startsWith('sub_sim_')) {
        showToast('Processing AutoPay mandate test authorization...', 'info');
        const verifyRes = await client.post('/subscription/verify', {
          orderId: orderData.orderId,
          paymentId: `pay_test_${Date.now()}`,
          subscriptionId: orderData.subscriptionId || `sub_test_${Date.now()}`,
          planType: UNIFIED_PLAN.id,
        });

        showToast(verifyRes.data?.message || 'MentorNearby All Access activated successfully! 🎉', 'success');
        setLoading(false);

        const params = new URLSearchParams(location.search);
        const redirectUrl = params.get('redirect') || (user?.role === 'TUTOR' ? '/tutor-dashboard' : '/student-dashboard');
        navigate(redirectUrl);
        return;
      }

      const options = {
        key: orderData.razorpayKeyId || orderData.key || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
        amount: orderData.amount || UNIFIED_PLAN.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'MentorNearby',
        description: 'MentorNearby All Access — ₹199/month AutoPay',
        order_id: orderData.orderId,
        subscription_id: orderData.subscriptionId || undefined,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#E11D48',
        },
        handler: async (response) => {
          try {
            showToast('Verifying AutoPay authorization & activating plan...', 'info');
            const verifyRes = await client.post('/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_subscription_id: response.razorpay_subscription_id || orderData.subscriptionId,
              razorpay_signature: response.razorpay_signature || 'simulated_sig',
              planType: UNIFIED_PLAN.id,
            });

            showToast(verifyRes.data?.message || 'MentorNearby All Access activated successfully! 🎉', 'success');

            const params = new URLSearchParams(location.search);
            const redirectUrl = params.get('redirect') || (user?.role === 'TUTOR' ? '/tutor-dashboard' : '/student-dashboard');
            navigate(redirectUrl);
          } catch (err) {
            showToast(err.response?.data?.message || 'Payment verification failed', 'error');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('AutoPay setup was cancelled.', 'info');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast(`Payment failed: ${response.error?.description || 'Transaction declined'}`, 'error');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Subscription error:', err);
      showToast(err.response?.data?.message || err.message || 'Payment setup failed', 'error');
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'What is MentorNearby All Access?',
      a: 'MentorNearby All Access is our single, unified premium plan for ₹199/month. Both tutors and students get complete access to unlimited contacts, leads, messaging, demo classes, priority search placement, and study material downloads.',
    },
    {
      q: 'Is there a free subscription tier?',
      a: 'No. MentorNearby operates strictly on a single, transparent plan: MentorNearby All Access for ₹199/month recurring AutoPay. There are zero free subscription tiers, zero basic free plans, and no hidden charges. All members enjoy unlimited verified contact reveals, direct phone calling, and premium features.',
    },
    {
      q: 'How does recurring AutoPay work?',
      a: 'When you activate All Access, a recurring monthly mandate of ₹199 is set up via Razorpay AutoPay. Your plan renews automatically every 30 days so your connections and leads are never interrupted.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes, absolutely. You can cancel recurring AutoPay with one click directly from your Tutor or Student Dashboard at any time. When cancelled, you retain all All Access benefits until the end of your current 30-day billing period.',
    },
    {
      q: 'What payment methods are supported for AutoPay?',
      a: 'Razorpay AutoPay supports all major Indian debit cards, credit cards, UPI AutoPay (Google Pay, PhonePe, Paytm, BHIM), and NetBanking e-mandates.',
    },
    {
      q: 'Are handwritten notes and study resources included?',
      a: 'Yes! All Access members get full unrestricted access to read, explore, and download all chapter-wise study notes, formula sheets, NCERT books, and revision materials.',
    },
  ];

  return (
    <div className="mn-sub-root">
      <div className="mn-sub-container">
        
        {/* Top Header */}
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
            <span>7-Day Money Back Guarantee • Cancel Anytime</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mn-sub-hero">
          <div className="mn-sub-tag-pill">
            <span>👑</span>
            <span>One Unified Plan</span>
          </div>

          <h1 className="mn-sub-title">
            MentorNearby <span className="mn-sub-title-highlight">All Access</span>
          </h1>

          <p className="mn-sub-subtitle">
            One simple, powerful membership for Tutors and Students. Unlock unlimited contacts, student leads, priority search, and premium study materials.
          </p>

          {/* Active Entitlement Banner */}
          {isSubscribed && (
            <div className="mn-sub-active-banner">
              <div>
                <div className="mn-sub-active-title">
                  <span>✨ Active Subscription:</span>
                  <span className="mn-sub-active-pill">MentorNearby All Access</span>
                </div>
                <div className="mn-sub-active-text">
                  Unlimited contact reveals & leads active
                  {user?.subscriptionExpiry && (
                    <span> • Renews on: {new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(user?.role === 'TUTOR' ? '/tutor-dashboard' : '/student-dashboard')}
                className="mn-sub-btn growth"
                style={{ width: 'auto', padding: '10px 20px', fontSize: '13px' }}
              >
                Go to Dashboard →
              </button>
            </div>
          )}

          {/* Role Switcher Tabs */}
          <div className="mn-sub-role-tabs">
            <button
              type="button"
              className={`mn-sub-role-tab ${activeTab === 'tutor' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutor')}
            >
              👨‍🏫 For Tutors & Teachers
            </button>
            <button
              type="button"
              className={`mn-sub-role-tab ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              🎓 For Students & Parents
            </button>
            <button
              type="button"
              className={`mn-sub-role-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              🌟 All Benefits Combined
            </button>
          </div>
        </section>

        {/* Centerpiece Plan Showcase Card */}
        <div className="mn-sub-unified-showcase">
          <div className="mn-sub-unified-card">
            
            <div className="mn-sub-card-ribbon">
              <span>UNIFIED ALL ACCESS</span>
            </div>

            <div className="mn-sub-card-main-header">
              <div className="mn-sub-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>

              <div>
                <h2 className="mn-sub-unified-title">MentorNearby All Access</h2>
                <p className="mn-sub-unified-desc">
                  Full unrestricted access to India's most trusted home & online tutoring network.
                </p>
              </div>
            </div>

            <div className="mn-sub-unified-pricing">
              <div className="mn-sub-price-num-wrap">
                <span className="mn-sub-currency">₹</span>
                <span className="mn-sub-amount">{UNIFIED_PLAN.amount}</span>
                <span className="mn-sub-cycle">/month</span>
              </div>
              <div className="mn-sub-cycle-desc">
                Recurring monthly AutoPay • Zero hidden charges • Cancel anytime
              </div>
            </div>

            {/* Features Checklist */}
            <div className="mn-sub-unified-features">
              <h4 className="mn-sub-features-heading">
                {activeTab === 'tutor'
                  ? 'Everything Included for Tutors & Teachers:'
                  : activeTab === 'student'
                  ? 'Everything Included for Students & Parents:'
                  : 'Complete Unified Features List:'}
              </h4>

              <div className="mn-sub-features-columns">
                {(activeTab === 'tutor'
                  ? UNIFIED_PLAN.tutorBenefits
                  : activeTab === 'student'
                  ? UNIFIED_PLAN.studentBenefits
                  : [...UNIFIED_PLAN.tutorBenefits.slice(0, 6), ...UNIFIED_PLAN.studentBenefits.slice(0, 6)]
                ).map((benefit, idx) => (
                  <div key={idx} className="mn-sub-feature-row">
                    <span className="mn-sub-check-badge">✓</span>
                    <span className="mn-sub-feature-text">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AutoPay Disclosure Notice */}
            <div className="mn-sub-autopay-disclosure">
              <div className="mn-sub-autopay-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Recurring AutoPay Terms</span>
              </div>
              <p className="mn-sub-autopay-text">
                {UNIFIED_PLAN.autoPayDisclosure}
              </p>
            </div>

            {/* CTA Subscribe Button */}
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading || isSubscribed}
              className="mn-sub-cta-btn"
            >
              {loading
                ? 'Connecting to Razorpay AutoPay...'
                : isSubscribed
                ? 'All Access Active (Subscribed)'
                : `Activate All Access for ₹${UNIFIED_PLAN.amount}/month →`}
            </button>

            <div className="mn-sub-free-listing-note">
              🛡️ <strong>Single Unified Plan:</strong> MentorNearby All Access at ₹199/month. Zero hidden fees, zero brokerage, and no alternative plans.
            </div>

          </div>
        </div>

        {/* All Access Entitlements Breakdown Table */}
        <section className="mn-sub-comparison-section">
          <h3 className="mn-sub-comp-title">MentorNearby All Access Entitlements</h3>
          <p className="mn-sub-comp-subtitle">Everything included in your ₹199/month monthly recurring AutoPay membership.</p>

          <div className="mn-sub-comp-table-wrap">
            <table className="mn-sub-comp-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Core Privilege</th>
                  <th style={{ width: '30%', textAlign: 'center' }}>Student Account</th>
                  <th style={{ width: '30%', textAlign: 'center', color: '#E11D48' }}>Tutor Account</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Direct Phone Number &amp; WhatsApp Reveals</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>✨ Unlimited Tutor Unlocks</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>✨ Unlimited Student Unlocks</td>
                </tr>
                <tr>
                  <td>Lead &amp; Enquiry Management</td>
                  <td style={{ textAlign: 'center' }}>✅ Unlimited Enquiries</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>✨ Unlimited Student Leads</td>
                </tr>
                <tr>
                  <td>Direct In-App Messaging &amp; Calling</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>✨ Unlimited Chat &amp; Calling</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>✨ Unlimited Chat &amp; Calling</td>
                </tr>
                <tr>
                  <td>Search Placement &amp; Discoverability</td>
                  <td style={{ textAlign: 'center' }}>✅ 5km Radius Discovery</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>⭐ Priority Boost Ranking</td>
                </tr>
                <tr>
                  <td>Verification Trust Badge</td>
                  <td style={{ textAlign: 'center' }}>🛡️ Student Verified Badge</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>🛡️ KYC Verified Tutor Badge</td>
                </tr>
                <tr>
                  <td>Study Notes, Formula Sheets &amp; PDF Downloads</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>📥 Full Unrestricted Downloads</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>📥 Full Unrestricted Downloads</td>
                </tr>
                <tr>
                  <td>Monthly Recurring Billing</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#E11D48' }}>₹199 / month</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#E11D48' }}>₹199 / month</td>
                </tr>
                <tr>
                  <td>AutoPay Mandate Support</td>
                  <td style={{ textAlign: 'center' }}>✅ Cancel Anytime with 1 Click</td>
                  <td style={{ textAlign: 'center' }}>✅ Cancel Anytime with 1 Click</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Trust Badges Bar */}
        <section className="mn-sub-trust-strip">
          <div className="mn-sub-trust-items">
            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Razorpay AutoPay</div>
                <div className="mn-sub-trust-sub">RBI-compliant bank mandates</div>
              </div>
            </div>

            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Cancel Anytime</div>
                <div className="mn-sub-trust-sub">1-click dashboard cancellation</div>
              </div>
            </div>

            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Instant Activation</div>
                <div className="mn-sub-trust-sub">Immediate unlock access</div>
              </div>
            </div>

            <div className="mn-sub-trust-item">
              <svg className="mn-sub-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div>
                <div className="mn-sub-trust-main">Zero Commission</div>
                <div className="mn-sub-trust-sub">100% earnings go to tutors</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="mn-sub-faq-section">
          <h3 className="mn-sub-faq-title">Frequently Asked Questions</h3>
          <div className="mn-sub-faq-grid">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`mn-sub-faq-card ${showFaqIndex === idx ? 'expanded' : ''}`}
                onClick={() => setShowFaqIndex(showFaqIndex === idx ? null : idx)}
              >
                <div className="mn-sub-faq-header">
                  <span className="mn-sub-faq-q">{faq.q}</span>
                  <span className="mn-sub-faq-toggle">{showFaqIndex === idx ? '−' : '+'}</span>
                </div>
                {showFaqIndex === idx && (
                  <p className="mn-sub-faq-a">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SubscriptionPage;
