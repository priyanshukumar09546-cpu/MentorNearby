// ============================================================
// pages/ReferAndEarn/ReferAndEarnPage.jsx
// MentorNearby Refer & Earn Coins — Master Visual Recreation
// 100% Real Database Data • Dynamic Referral Link & Code • Dark/Light Mode
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import client from '../../api/client';
import StarsBackground from '../../components/StarsBackground';
import './ReferAndEarnPage.css';

const ReferAndEarnPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referralCode: '',
    referralLink: '',
    wallet: {
      totalCoinsEarned: 0,
      pendingCoins: 0,
      availableCoins: 0,
    },
    statistics: {
      totalReferrals: 0,
      verifiedReferrals: 0,
      premiumPurchased: 0,
      coinsEarned: 0,
    },
    referrals: [],
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const referralCardRef = useRef(null);

  // Fetch real referral metrics from MongoDB
  const fetchReferralStats = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await client.get('/referrals/my-stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Referral fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  // Derived user referral link & code (strictly dynamic from DB)
  const referralCode = stats.referralCode || user?.referralCode || (user?._id ? `MN-${user._id.slice(-6).toUpperCase()}` : 'MN-TUTOR');
  const referralLink = stats.referralLink || `${window.location.origin}/register?role=TUTOR&ref=${referralCode}`;

  const copyToClipboard = (text, type = 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        showToast('Referral link copied to clipboard!', 'success');
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
        showToast('Referral code copied to clipboard!', 'success');
      }
    } else {
      showToast(`Copied: ${text}`, 'info');
    }
  };

  const scrollToReferral = () => {
    referralCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Social Share Handlers
  const shareMessage = `Join MentorNearby as a verified Tutor using my referral code ${referralCode} and grow your teaching career! Sign up here: ${referralLink}`;

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join MentorNearby with code ${referralCode}!`)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareViaTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareViaNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Refer & Earn Coins on MentorNearby',
        text: shareMessage,
        url: referralLink,
      }).catch(() => {});
    } else {
      copyToClipboard(referralLink, 'link');
    }
  };

  return (
    <div className={`mn-refer-page ${isDark ? 'dark' : 'light'}`}>
      {/* 🌟 BLINKING TWINKLING STARS IN DARK MODE */}
      {isDark && <StarsBackground />}

      <div className="mn-refer-container">
        
        {/* ============================================================ */}
        {/* HERO SECTION                                                 */}
        {/* ============================================================ */}
        <section className="mn-refer-hero">
          <div className="mn-refer-hero-left">
            <h1 className="mn-refer-hero-title">
              Refer &amp; Earn <span className="mn-gold-highlight">Coins!</span>
            </h1>
            <p className="mn-refer-hero-subtitle">
              Invite other tutors to MentorNearby and earn exciting coins.
            </p>

            {/* Golden Reward Callout Box */}
            <div className="mn-refer-hero-card">
              <div className="mn-refer-coin-badge">
                <span className="mn-3d-coin">🪙</span>
              </div>
              <div className="mn-refer-hero-card-content">
                <h3 className="mn-refer-hero-card-title">Earn 100 Coins</h3>
                <p className="mn-refer-hero-card-desc">
                  When your referred tutor purchases a Premium plan.
                </p>
                <span className="mn-refer-hero-card-note">
                  *Coins are credited after successful payment and verification.
                </span>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={scrollToReferral}
              className="mn-refer-hero-cta"
            >
              <span className="mn-cta-gift">🎁</span>
              <span>Refer Now</span>
              <span className="mn-cta-arrow">➔</span>
            </button>
          </div>

          <div className="mn-refer-hero-right">
            {/* 3D Referral & Cheerful Mentors Illustration */}
            <div className="mn-refer-illustration-wrap">
              <div className="mn-refer-chest">
                <div className="mn-chest-glow"></div>
                <div className="mn-chest-stars">
                  <span className="star s1">✨</span>
                  <span className="star s2">⭐</span>
                  <span className="star s3">✨</span>
                  <span className="star s4">⭐</span>
                </div>
                <div className="mn-chest-box">
                  <div className="mn-chest-lid">
                    <span className="chest-star-icon">⭐</span>
                  </div>
                  <div className="mn-chest-coins-burst">
                    <span className="burst-coin c1">🪙</span>
                    <span className="burst-coin c2">🪙</span>
                    <span className="burst-coin c3">🪙</span>
                    <span className="burst-coin c4">🪙</span>
                  </div>
                </div>
              </div>

              {/* Cheerful 3D Vector Characters */}
              <div className="mn-hero-avatar-pair">
                <div className="mn-avatar-char char-left">
                  <div className="char-head">
                    <span className="char-face">😄</span>
                    <span className="char-megaphone">📢</span>
                  </div>
                  <div className="char-body yellow-tshirt"></div>
                </div>
                <div className="mn-avatar-char char-right">
                  <div className="char-head">
                    <span className="char-face">😊</span>
                    <span className="char-thumbs">👍</span>
                  </div>
                  <div className="char-body purple-tshirt"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* HOW IT WORKS SECTION (4 STEPS)                                */}
        {/* ============================================================ */}
        <section className="mn-refer-how-it-works">
          <div className="mn-section-heading-wrap">
            <span className="dash">—</span>
            <h2 className="mn-section-title">How it works?</h2>
            <span className="dash">—</span>
          </div>

          <div className="mn-how-steps-grid">
            {/* Step 1 */}
            <div className="mn-how-step-card">
              <div className="mn-step-badge step-1">1</div>
              <div className="mn-step-icon-circle bg-yellow">
                <span className="step-icon">🔗</span>
              </div>
              <h3 className="mn-step-title">Refer a Tutor</h3>
              <p className="mn-step-desc">
                Share your unique referral link or code with other tutors.
              </p>
            </div>

            <div className="mn-step-connector">
              <span>›</span>
            </div>

            {/* Step 2 */}
            <div className="mn-how-step-card">
              <div className="mn-step-badge step-2">2</div>
              <div className="mn-step-icon-circle bg-green">
                <span className="step-icon">👤✓</span>
              </div>
              <h3 className="mn-step-title">They Join &amp; Get Verified</h3>
              <p className="mn-step-desc">
                When a tutor joins using your link and completes verification.
              </p>
            </div>

            <div className="mn-step-connector">
              <span>›</span>
            </div>

            {/* Step 3 */}
            <div className="mn-how-step-card">
              <div className="mn-step-badge step-3">3</div>
              <div className="mn-step-icon-circle bg-purple">
                <span className="step-icon">👑</span>
              </div>
              <h3 className="mn-step-title">They Buy Premium</h3>
              <p className="mn-step-desc">
                When your referred tutor purchases any Premium plan.
              </p>
            </div>

            <div className="mn-step-connector">
              <span>›</span>
            </div>

            {/* Step 4 */}
            <div className="mn-how-step-card">
              <div className="mn-step-badge step-4">4</div>
              <div className="mn-step-icon-circle bg-gold">
                <span className="step-icon">🪙</span>
              </div>
              <h3 className="mn-step-title">You Earn 100 Coins</h3>
              <p className="mn-step-desc">
                You get 100 MentorNearby Coins in your wallet. Use them for Premium subscriptions &amp; more.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3-COLUMN MAIN DASHBOARD SECTION                              */}
        {/* ============================================================ */}
        <section className="mn-refer-main-grid">
          
          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 1: YOUR REFERRAL                                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mn-refer-card" ref={referralCardRef}>
            <h2 className="mn-card-title">Your Referral</h2>

            {/* Referral Link Field */}
            <div className="mn-field-group">
              <label className="mn-field-label">Your Referral Link</label>
              <div className="mn-input-copy-box">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="mn-copy-input"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralLink, 'link')}
                  className={`mn-copy-btn ${copiedLink ? 'copied' : ''}`}
                  title="Copy link"
                >
                  {copiedLink ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Referral Code Field */}
            <div className="mn-field-group">
              <label className="mn-field-label">Your Referral Code</label>
              <div className="mn-input-copy-box">
                <input
                  type="text"
                  readOnly
                  value={referralCode}
                  className="mn-copy-input code-style"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(referralCode, 'code')}
                  className={`mn-copy-btn ${copiedCode ? 'copied' : ''}`}
                  title="Copy code"
                >
                  {copiedCode ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Share via Row */}
            <div className="mn-share-row-wrap">
              <span className="mn-share-label">Share via</span>
              <div className="mn-share-icons-row">
                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="mn-share-btn whatsapp"
                  title="Share on WhatsApp"
                >
                  💬
                </button>
                <button
                  type="button"
                  onClick={shareViaTelegram}
                  className="mn-share-btn telegram"
                  title="Share on Telegram"
                >
                  ✈️
                </button>
                <button
                  type="button"
                  onClick={shareViaFacebook}
                  className="mn-share-btn facebook"
                  title="Share on Facebook"
                >
                  f
                </button>
                <button
                  type="button"
                  onClick={shareViaTwitter}
                  className="mn-share-btn twitter"
                  title="Share on X"
                >
                  𝕏
                </button>
                <button
                  type="button"
                  onClick={shareViaNative}
                  className="mn-share-btn more"
                  title="More sharing options"
                >
                  •••
                </button>
              </div>
              <span className="mn-share-more-caption">More</span>
            </div>

            {/* Important Notes */}
            <div className="mn-important-notes-box">
              <div className="mn-notes-header">
                <span className="notes-check-icon">✓</span>
                <span className="notes-heading">Important Notes</span>
              </div>
              <ul className="mn-notes-list">
                <li>Coins will be credited only when your referred tutor purchases a Premium plan.</li>
                <li>Self-referral or fake accounts will not be rewarded.</li>
                <li>Coins have no cash value and cannot be withdrawn.</li>
                <li>Coins can be used for Premium subscriptions and other eligible services on MentorNearby.</li>
              </ul>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 2: YOUR EARNINGS                                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mn-refer-card">
            <h2 className="mn-card-title">Your Earnings</h2>

            {/* Big Total Coins Box */}
            <div className="mn-total-coins-hero-box">
              <span className="mn-total-coins-lbl">Total Coins Earned</span>
              <div className="mn-total-coins-num-row">
                <span className="coin-icon-lg">🪙</span>
                <span className="coin-amount-lg">{stats.wallet.totalCoinsEarned}</span>
              </div>
            </div>

            {/* Split Pending / Available Tiles */}
            <div className="mn-coins-split-grid">
              <div className="mn-coin-mini-tile">
                <span className="mini-tile-lbl">Pending Coins</span>
                <div className="mini-tile-val">
                  <span className="coin-sm">🪙</span>
                  <span>{stats.wallet.pendingCoins}</span>
                </div>
              </div>

              <div className="mn-coin-mini-tile">
                <span className="mini-tile-lbl">Available Coins</span>
                <div className="mini-tile-val">
                  <span className="coin-sm">🪙</span>
                  <span>{stats.wallet.availableCoins}</span>
                </div>
              </div>
            </div>

            {/* Earning Status Summary */}
            <div className="mn-earning-status-block">
              <h3 className="mn-earning-status-title">Earning Status</h3>
              
              <ul className="mn-status-metrics-list">
                <li className="mn-metric-row">
                  <span className="metric-dot">•</span>
                  <span className="metric-name">Total Referrals</span>
                  <span className="metric-num purple-highlight">{stats.statistics.totalReferrals}</span>
                </li>

                <li className="mn-metric-row">
                  <span className="metric-dot">•</span>
                  <span className="metric-name">Verified Referrals</span>
                  <span className="metric-num green-highlight">{stats.statistics.verifiedReferrals}</span>
                </li>

                <li className="mn-metric-row">
                  <span className="metric-dot">•</span>
                  <span className="metric-name">Premium Purchased</span>
                  <span className="metric-num blue-highlight">{stats.statistics.premiumPurchased}</span>
                </li>

                <li className="mn-metric-row">
                  <span className="metric-dot">•</span>
                  <span className="metric-name">Coins Earned</span>
                  <span className="metric-num gold-highlight">
                    🪙 {stats.statistics.coinsEarned}
                  </span>
                </li>
              </ul>
            </div>

            {/* View Earnings History Button */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="mn-view-history-btn"
            >
              <span className="btn-chart-icon">📈</span>
              <span>View Earnings History</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 3: REWARDS INFORMATION                               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mn-refer-card">
            <h2 className="mn-card-title">Rewards Information</h2>

            {/* Top Stacked Coins Graphic Card */}
            <div className="mn-rewards-promo-card">
              <div className="mn-rewards-coin-stack">
                <span className="coin-layer c-top">🪙</span>
                <span className="coin-layer c-mid">🪙</span>
                <span className="coin-layer c-bot">🪙</span>
              </div>
              <div className="mn-rewards-promo-info">
                <h3 className="mn-rewards-promo-title">Earn 100 Coins</h3>
                <p className="mn-rewards-promo-sub">
                  When your referred tutor purchases a Premium plan.
                </p>
              </div>
            </div>

            {/* Where can you use Coins */}
            <div className="mn-coins-utility-block">
              <h3 className="mn-utility-title">Where can you use Coins?</h3>

              <div className="mn-utility-items-list">
                {/* Item 1: Premium Subscription */}
                <div className="mn-utility-item">
                  <div className="mn-utility-icon-box purple-bg">
                    <span>👑</span>
                  </div>
                  <div className="mn-utility-item-details">
                    <span className="utility-name">Premium Subscription</span>
                    <p className="utility-desc">Use coins to get discounts on Premium plans.</p>
                  </div>
                </div>

                {/* Item 2: Profile Boost */}
                <div className="mn-utility-item">
                  <div className="mn-utility-icon-box green-bg">
                    <span>🚀</span>
                  </div>
                  <div className="mn-utility-item-details">
                    <span className="utility-name">Profile Boost</span>
                    <p className="utility-desc">Use coins to boost your profile visibility.</p>
                  </div>
                </div>

                {/* Item 3: Featured Listing */}
                <div className="mn-utility-item">
                  <div className="mn-utility-icon-box orange-bg">
                    <span>⭐</span>
                  </div>
                  <div className="mn-utility-item-details">
                    <span className="utility-name">Featured Listing</span>
                    <p className="utility-desc">Use coins to get featured in search results.</p>
                  </div>
                </div>

                {/* Item 4: More Coming Soon */}
                <div className="mn-utility-item">
                  <div className="mn-utility-icon-box pink-bg">
                    <span>🎁</span>
                  </div>
                  <div className="mn-utility-item-details">
                    <span className="utility-name">And More Coming Soon!</span>
                    <p className="utility-desc">More exciting ways to use your coins.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* BOTTOM SAFE & TRUSTED PLATFORM BANNER                        */}
        {/* ============================================================ */}
        <section className="mn-refer-trust-banner">
          <div className="mn-trust-banner-left">
            <div className="mn-trust-shield-icon">
              <span>🛡️</span>
            </div>
            <div className="mn-trust-banner-text">
              <h3 className="mn-trust-main-heading">Safe &amp; Trusted Platform</h3>
              <p className="mn-trust-sub-heading">
                We ensure a safe and trusted environment for every tutor. Invite more, earn more!
              </p>
            </div>
          </div>

          <div className="mn-trust-banner-right">
            <div className="mn-trust-avatar-pair">
              <span className="tutor-avatar t1">🧑‍🏫</span>
              <span className="trust-badge-center">🛡️✓</span>
              <span className="tutor-avatar t2">👩‍🏫</span>
            </div>
          </div>
        </section>

      </div>

      {/* ============================================================ */}
      {/* REAL EARNINGS & REFERRAL TRACKING MODAL                       */}
      {/* ============================================================ */}
      {showHistoryModal && (
        <div className="mn-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
          <div className="mn-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mn-history-modal-header">
              <div>
                <h3 className="mn-modal-title">📈 Referral &amp; Earnings History</h3>
                <p className="mn-modal-sub">Real-time status of your invited tutors and credited coins</p>
              </div>
              <button
                type="button"
                className="mn-modal-close-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mn-history-modal-body">
              {stats.referrals && stats.referrals.length > 0 ? (
                <div className="mn-history-table-wrap">
                  <table className="mn-history-table">
                    <thead>
                      <tr>
                        <th>Tutor Name</th>
                        <th>Joined Date</th>
                        <th>Status</th>
                        <th>Coins Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.referrals.map((ref) => (
                        <tr key={ref._id}>
                          <td>
                            <div className="mn-table-user-cell">
                              {ref.user.avatar ? (
                                <img src={ref.user.avatar} alt={ref.user.name} className="table-avatar" />
                              ) : (
                                <div className="table-avatar-fallback">{ref.user.name.charAt(0)}</div>
                              )}
                              <div>
                                <span className="table-user-name">{ref.user.name}</span>
                                {ref.user.isVerified && <span className="table-ver-badge">✓ Verified</span>}
                              </div>
                            </div>
                          </td>
                          <td>{new Date(ref.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`mn-status-pill step-${ref.step}`}>
                              {ref.displayStatus}
                            </span>
                          </td>
                          <td>
                            <span className="table-coin-val">
                              {ref.coinsRewarded > 0 ? `+${ref.coinsRewarded} 🪙` : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mn-modal-empty-state">
                  <span style={{ fontSize: 40 }}>🎁</span>
                  <h4>No Referrals Yet</h4>
                  <p>Share your unique referral link or code above to invite tutors and earn 100 Coins per Premium subscriber!</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryModal(false);
                      scrollToReferral();
                    }}
                    className="mn-modal-cta-btn"
                  >
                    Share Referral Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReferAndEarnPage;
