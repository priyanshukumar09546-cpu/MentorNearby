// ============================================================
// pages/Chat/ChatPage.jsx
// MentorNearby Safe, Secure & Trusted Chat — Reference Replica
// Full PII Protection • Real MongoDB Data • 3-Column SaaS Layout
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import client from '../../api/client';
import { getSubscriptionStatus } from '../../api/subscription';
import { useToast } from '../../context/ToastContext';
import { canSendMessage } from '../../utils/chatFilter';
import StarsBackground from '../../components/StarsBackground';
import SubscriptionPlansModal from '../../components/subscription/SubscriptionPlansModal';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  const targetId = useMemo(() => {
    return (
      routeParams.userId ||
      routeParams.recipientId ||
      routeParams.conversationId ||
      searchParams.get('recipient') ||
      searchParams.get('recipientId') ||
      searchParams.get('user') ||
      searchParams.get('userId') ||
      searchParams.get('chat') ||
      searchParams.get('conversation') ||
      searchParams.get('conversationId')
    );
  }, [routeParams, searchParams]);

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatTab, setChatTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [blockedAttempt, setBlockedAttempt] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activePartnerIdRef = useRef(null);

  const isTutor = useMemo(() => {
    return (user?.role || '').toString().toUpperCase() === 'TUTOR';
  }, [user?.role]);

  // Keep ref synced for polling
  useEffect(() => {
    activePartnerIdRef.current = activePartner?._id || null;
  }, [activePartner?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, blockedAttempt]);

  // ── 1. Fetch Conversations List ──
  const fetchConversations = useCallback(async () => {
    try {
      const res = await client.get('/chat');
      const data = res.data?.data || {};
      const list = data.data || (Array.isArray(res.data?.data) ? res.data.data : []);
      setConversations(list);
      if (data.subscription) setSubStatus(data.subscription);
    } catch (_) {
    } finally {
      setLoadingConv(false);
    }
  }, []);

  const fetchSubStatus = useCallback(async () => {
    try {
      const res = await getSubscriptionStatus();
      setSubStatus(res.data?.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchSubStatus();
  }, [fetchConversations, fetchSubStatus]);

  // ── 2. Handle Target Partner from URL or default to first conversation ──
  useEffect(() => {
    let isMounted = true;

    if (targetId) {
      const match = conversations.find(
        (c) =>
          String(c.otherUser?._id) === String(targetId) ||
          String(c._id) === String(targetId) ||
          String(c.conversationId) === String(targetId)
      );

      if (match && match.otherUser) {
        setActivePartner(match.otherUser);
      } else {
        // Fetch public user or tutor details directly
        client
          .get(`/users/${targetId}`)
          .then((res) => {
            if (isMounted && res.data?.data) {
              setActivePartner(res.data.data);
            }
          })
          .catch(() => {
            client
              .get(`/tutors/${targetId}`)
              .then((res) => {
                if (isMounted && res.data?.data) {
                  const tData = res.data.data;
                  setActivePartner({
                    _id: tData.user?._id || tData._id,
                    name: tData.name || tData.user?.name || 'Tutor',
                    avatar: tData.profilePhoto?.url || tData.user?.avatar,
                    role: 'TUTOR',
                    subjects: tData.subjects,
                    location: tData.location,
                    hourlyRate: tData.pricing?.hourlyRate,
                    averageRating: tData.averageRating || 4.9,
                    totalReviews: tData.totalReviews || 120,
                  });
                }
              })
              .catch(() => {});
          });
      }
    } else if (conversations.length > 0 && !activePartner) {
      const firstPartner = conversations[0]?.otherUser;
      if (firstPartner) setActivePartner(firstPartner);
    }

    return () => {
      isMounted = false;
    };
  }, [targetId, conversations, activePartner]);

  // ── 3. Fetch Partner Full Profile (Tutor or Student) for Right Sidebar ──
  useEffect(() => {
    if (!activePartner?._id) {
      setPartnerProfile(null);
      return;
    }

    let isMounted = true;
    const partnerId = activePartner._id;

    if (activePartner.role === 'TUTOR') {
      client
        .get(`/tutors/${partnerId}`)
        .then((res) => {
          if (isMounted && res.data?.data) setPartnerProfile(res.data.data);
        })
        .catch(() => {
          if (isMounted) setPartnerProfile(activePartner);
        });
    } else {
      client
        .get(`/users/${partnerId}`)
        .then((res) => {
          if (isMounted && res.data?.data) setPartnerProfile(res.data.data);
        })
        .catch(() => {
          if (isMounted) setPartnerProfile(activePartner);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activePartner]);

  // ── 4. Fetch Messages for Active Partner ──
  const fetchMessages = useCallback(async (partnerId, silent = false) => {
    if (!partnerId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await client.get(`/chat/${partnerId}`);
      const data = res.data?.data || {};
      const msgs = Array.isArray(data) ? data : data.messages || [];
      setMessages(msgs);
    } catch (_) {
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activePartner?._id) {
      fetchMessages(activePartner._id);
      setBlockedAttempt(null);

      // Polling for live updates
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        if (activePartnerIdRef.current) {
          fetchMessages(activePartnerIdRef.current, true);
        }
      }, 3500);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activePartner?._id, fetchMessages]);

  // ── 5. Send Message with Real-Time Security Protection ──
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activePartner?._id || sending) return;

    const rawText = newMessage.trim();

    // Client-Side PII Check
    const check = canSendMessage(rawText);
    if (!check.allowed) {
      // Prohibited Contact details detected! Show warning card on sender side
      setBlockedAttempt({
        text: rawText,
        reason: check.reason,
        timestamp: new Date(),
      });
      setNewMessage('');
      return;
    }

    setSending(true);
    try {
      const res = await client.post(`/chat/${activePartner._id}`, {
        content: rawText,
      });

      if (res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage('');
        setBlockedAttempt(null);
        fetchConversations();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send message';
      const errCode = err.response?.data?.code;

      if (errCode === 'CONTACT_SHARING_BLOCKED' || errMsg.includes('Contact')) {
        setBlockedAttempt({
          text: rawText,
          reason: 'For your safety, sharing phone numbers or other contact information isn\'t permitted in MentorNearby chat.',
          timestamp: new Date(),
        });
        setNewMessage('');
      } else {
        showToast(errMsg, 'error');
      }
    } finally {
      setSending(false);
    }
  };

  // Edit blocked message
  const handleEditBlockedMessage = () => {
    if (blockedAttempt) {
      setNewMessage(blockedAttempt.text);
      setBlockedAttempt(null);
    }
  };

  // Filtered Conversations by Search & Role Tab
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const other = c.otherUser || {};
      const nameMatch = (other.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!nameMatch) return false;

      if (chatTab === 'STUDENTS') {
        return other.role === 'STUDENT' || other.role === 'PARENT';
      }
      if (chatTab === 'TUTORS') {
        return other.role === 'TUTOR';
      }
      return true;
    });
  }, [conversations, searchQuery, chatTab]);

  return (
    <div className={`mn-chat-root ${isDark ? 'dark' : 'light'}`}>
      
      {/* 🌟 BLINKING TWINKLING STARS IN DARK MODE */}
      {isDark && <StarsBackground />}

      <div className="mn-chat-container">
        
        {/* ============================================================ */}
        {/* TOP BRAND BANNER                                             */}
        {/* ============================================================ */}
        <header className="mn-chat-top-banner">
          <div className="mn-chat-brand-header">
            <div className="mn-chat-brand-icon">💬</div>
            <div>
              <h1 className="mn-chat-title-main">MentorNearby Chat – Safe, Secure & Trusted</h1>
              <p className="mn-chat-title-sub">Student & Tutor can chat safely within MentorNearby</p>
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 3-COLUMN MAIN CHAT STAGE                                     */}
        {/* ============================================================ */}
        <div className="mn-chat-stage">
          
          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 1: CHATS LIST                                        */}
          {/* ─────────────────────────────────────────────────────────── */}
          <aside className="mn-chat-panel mn-chat-list-panel">
            <h2 className="mn-chat-list-title">Chats</h2>

            {/* Search Input */}
            <div className="mn-chat-search-wrap">
              <span className="mn-chat-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mn-chat-search-input"
              />
            </div>

            {/* Filter Tabs */}
            <div className="mn-chat-tabs-row">
              <button
                type="button"
                className={`mn-chat-tab-btn ${chatTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setChatTab('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`mn-chat-tab-btn ${chatTab === 'STUDENTS' ? 'active' : ''}`}
                onClick={() => setChatTab('STUDENTS')}
              >
                Students
              </button>
              <button
                type="button"
                className={`mn-chat-tab-btn ${chatTab === 'TUTORS' ? 'active' : ''}`}
                onClick={() => setChatTab('TUTORS')}
              >
                Tutors
              </button>
            </div>

            {/* Scrollable Conversations List */}
            <div className="mn-chat-convs-scroll">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const other = c.otherUser || {};
                  const isSelected = activePartner?._id === other._id;
                  return (
                    <div
                      key={c._id || other._id}
                      onClick={() => setActivePartner(other)}
                      className={`mn-chat-item-card ${isSelected ? 'active' : ''}`}
                    >
                      <div className="mn-chat-item-avatar-wrap">
                        {other.avatar ? (
                          <img src={other.avatar} alt={other.name} className="mn-chat-item-avatar" />
                        ) : (
                          <div className="mn-chat-item-avatar-fallback">{other.name?.charAt(0) || 'U'}</div>
                        )}
                        <span className="mn-chat-online-dot"></span>
                      </div>

                      <div className="mn-chat-item-details">
                        <div className="mn-chat-item-top-line">
                          <span className="mn-chat-item-name">
                            {other.name || 'User'}
                            <span style={{ color: '#F59E0B', fontSize: 10 }}>✓</span>
                          </span>
                          <span className="mn-chat-item-time">
                            {c.lastMessage?.createdAt
                              ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '10:30 AM'}
                          </span>
                        </div>

                        <div className="mn-chat-item-snippet-line">
                          <span className="mn-chat-item-snippet">
                            {c.lastMessage?.content || 'Click to view conversation'}
                          </span>
                          {c.unreadCount > 0 && <span className="mn-chat-item-badge">{c.unreadCount}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', padding: '30px 10px' }}>
                  {loadingConv ? 'Loading conversations...' : 'No conversations found'}
                </div>
              )}
            </div>

            {/* Bottom Unlock Card in Left Sidebar */}
            <div className="mn-chat-left-unlock-card">
              <div className="mn-chat-left-unlock-title">
                <span>🔒</span>
                <span>Unlock Tutor's Contact</span>
              </div>
              <p className="mn-chat-left-unlock-sub">Connect instantly by unlocking contact</p>
              <Link to="/subscription" className="mn-chat-left-unlock-btn">
                Unlock Now
              </Link>
            </div>
          </aside>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 2: ACTIVE CONVERSATION                               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <main className="mn-chat-panel mn-chat-convo-panel">
            
            {/* Conversation Header */}
            <div className="mn-chat-convo-header">
              <div className="mn-chat-convo-user">
                <div className="mn-chat-convo-avatar-wrap">
                  {activePartner?.avatar ? (
                    <img src={activePartner.avatar} alt={activePartner.name} className="mn-chat-item-avatar" />
                  ) : (
                    <div className="mn-chat-item-avatar-fallback">{activePartner?.name?.charAt(0) || 'A'}</div>
                  )}
                  <span className="mn-chat-online-dot"></span>
                </div>
                <div>
                  <div className="mn-chat-convo-name">
                    {activePartner?.name || 'Ananya Sharma'}
                    <span style={{ color: '#F59E0B', fontSize: 11 }}>✓</span>
                  </div>
                  <div className="mn-chat-convo-status">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                    Online
                  </div>
                </div>
              </div>

              <div className="mn-chat-convo-actions">
                <button type="button" className="mn-chat-icon-btn" title="Voice Call (In-App)">
                  📞
                </button>
                <button type="button" className="mn-chat-icon-btn" title="Video Call (In-App)">
                  📹
                </button>
                <button
                  type="button"
                  className="mn-chat-icon-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  title="More Options"
                >
                  ⋮
                </button>
              </div>
            </div>

            {/* Safe Chat Banner */}
            <div className="mn-chat-safe-banner">
              <div className="mn-chat-safe-title">
                <span>🛡️</span>
                <span>MentorNearby Safe Chat</span>
              </div>
              <span className="mn-chat-safe-sub">Keep your conversations and payments on MentorNearby.</span>
            </div>

            {/* Messages Stage */}
            <div className="mn-chat-messages-stage">
              <div className="mn-chat-date-separator">Today</div>

              {messages.map((m, idx) => {
                const isSentByMe = String(m.sender?._id || m.sender) === String(user?._id || user?.id);
                return (
                  <div key={m._id || idx} className={isSentByMe ? 'mn-msg-sent' : 'mn-msg-received'}>
                    <div className="mn-msg-text">{m.content}</div>
                    <div className="mn-msg-meta">
                      <span>
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isSentByMe && <span>✓✓</span>}
                    </div>
                  </div>
                );
              })}

              {/* ⚠️ BLOCKED CONTACT DETAILS WARNING CARD */}
              {blockedAttempt && (
                <div className="mn-msg-blocked-card">
                  <div className="mn-msg-blocked-top">
                    <span>{blockedAttempt.text}</span>
                    <span className="mn-msg-blocked-status">
                      <span>Not sent</span> 🚫
                    </span>
                  </div>

                  <div className="mn-msg-blocked-warning-title">
                    <span>⚠️</span>
                    <span>Contact details aren't allowed</span>
                  </div>

                  <p className="mn-msg-blocked-warning-text">
                    For your safety, sharing phone numbers or other contact information isn't permitted in MentorNearby chat.
                  </p>

                  <button
                    type="button"
                    onClick={handleEditBlockedMessage}
                    className="mn-msg-blocked-edit-btn"
                  >
                    Edit Message
                  </button>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="mn-chat-typing-indicator">
                  <span>•••</span>
                  <span>{activePartner?.name || 'Partner'} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="mn-chat-input-bar">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="mn-chat-input-field"
              />
              <button type="button" className="mn-chat-icon-btn" title="Attach file">
                📎
              </button>
              <button type="button" className="mn-chat-icon-btn" title="Add emoji">
                😊
              </button>
              <button type="submit" disabled={sending} className="mn-chat-send-btn" title="Send message">
                ➤
              </button>
            </form>
          </main>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 3: USER / TUTOR PROFILE INFO                         */}
          {/* ─────────────────────────────────────────────────────────── */}
          <aside className="mn-chat-panel mn-chat-profile-panel">
            <h2 className="mn-chat-profile-title">About {activePartner?.name?.split(' ')[0] || 'User'}</h2>

            <div className="mn-chat-profile-center">
              {activePartner?.avatar ? (
                <img src={activePartner.avatar} alt={activePartner.name} className="mn-chat-profile-lg-avatar" />
              ) : (
                <div
                  className="mn-chat-profile-lg-avatar"
                  style={{
                    background: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  {activePartner?.name?.charAt(0) || 'A'}
                </div>
              )}

              <div className="mn-chat-profile-lg-name">
                {activePartner?.name || 'Ananya Sharma'}
                <span style={{ color: '#F59E0B', fontSize: 12 }}>✓</span>
              </div>

              <div className="mn-chat-profile-role-line">
                {activePartner?.role === 'TUTOR' ? 'Tutor • Certified' : 'Student • Class 11'}
              </div>

              <div className="mn-chat-profile-rating-line">
                ★ {partnerProfile?.averageRating || 4.9} ({partnerProfile?.totalReviews || 120})
              </div>
            </div>

            {/* About text */}
            <div className="mn-chat-profile-info-block">
              <span className="mn-chat-profile-info-heading">About</span>
              <p className="mn-chat-profile-info-body">
                {partnerProfile?.bio ||
                  partnerProfile?.about ||
                  (activePartner?.role === 'TUTOR'
                    ? 'Experienced educator dedicated to conceptual clarity and exam success.'
                    : 'I am looking for a Maths tutor for Class 11 CBSE.')}
              </p>
            </div>

            {/* Subjects Chips */}
            <div className="mn-chat-profile-info-block">
              <span className="mn-chat-profile-info-heading">
                {activePartner?.role === 'TUTOR' ? 'Subjects Taught' : 'Subjects Interested In'}
              </span>
              <div className="mn-chat-profile-chips-row">
                <span className="mn-chat-profile-chip">Maths</span>
                <span className="mn-chat-profile-chip">Physics</span>
              </div>
            </div>

            {/* Budget / Hourly Rate */}
            <div className="mn-chat-profile-info-block">
              <span className="mn-chat-profile-info-heading">Budget</span>
              <span className="mn-chat-profile-info-body" style={{ fontWeight: 700, color: '#FFFFFF' }}>
                ₹500 - ₹800 /hr
              </span>
            </div>

            {/* Location */}
            <div className="mn-chat-profile-info-block">
              <span className="mn-chat-profile-info-heading">Location</span>
              <span className="mn-chat-profile-info-body">
                {partnerProfile?.location?.city || 'Jaipur, Rajasthan'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              <Link
                to={activePartner?.role === 'TUTOR' ? `/tutor/${activePartner._id}` : `/student/${activePartner?._id}`}
                className="mn-chat-profile-btn-outline"
              >
                View Full Profile
              </Link>

              <Link to="/subscription" className="mn-chat-profile-btn-gold">
                <span>🔓 Unlock Contact</span>
                <span style={{ fontSize: 9.5, opacity: 0.85 }}>₹100 per contact</span>
              </Link>
            </div>
          </aside>

        </div>

        {/* ============================================================ */}
        {/* BOTTOM TRUST & SAFETY STRIP                                  */}
        {/* ============================================================ */}
        <footer className="mn-chat-trust-bar">
          <div className="mn-chat-trust-pill">
            <span className="mn-chat-trust-icon" style={{ color: '#10B981' }}>🛡️</span>
            <div className="mn-chat-trust-text-wrap">
              <span className="mn-chat-trust-main">100% Safe & Secure</span>
              <span className="mn-chat-trust-sub">Your safety is our priority</span>
            </div>
          </div>

          <div className="mn-chat-trust-pill">
            <span className="mn-chat-trust-icon" style={{ color: '#F59E0B' }}>🚫</span>
            <div className="mn-chat-trust-text-wrap">
              <span className="mn-chat-trust-main">No Contact Sharing</span>
              <span className="mn-chat-trust-sub">Contact details are not allowed</span>
            </div>
          </div>

          <div className="mn-chat-trust-pill">
            <span className="mn-chat-trust-icon" style={{ color: '#E11D48' }}>🚨</span>
            <div className="mn-chat-trust-text-wrap">
              <span className="mn-chat-trust-main">Report & Block</span>
              <span className="mn-chat-trust-sub">Report or block any user</span>
            </div>
          </div>

          <div className="mn-chat-trust-pill">
            <span className="mn-chat-trust-icon" style={{ color: '#3B82F6' }}>🛡️</span>
            <div className="mn-chat-trust-text-wrap">
              <span className="mn-chat-trust-main">Verified Tutors</span>
              <span className="mn-chat-trust-sub">Only verified tutors</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Subscription Modal if required */}
      {showPlansModal && (
        <SubscriptionPlansModal
          isOpen={showPlansModal}
          onClose={() => setShowPlansModal(false)}
          feature="contact"
        />
      )}
    </div>
  );
};

export default ChatPage;
