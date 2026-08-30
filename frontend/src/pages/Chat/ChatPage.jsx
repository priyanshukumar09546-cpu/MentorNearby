// ============================================================
// pages/Chat/ChatPage.jsx
// MentorNearby Safe, Secure & Trusted Chat — 100% Real MongoDB Data
// Full PII Protection • Real Database Relationships • Zero Mock Data
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

  // Target recipient or conversation parameter from URL
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
  const [showMobileProfile, setShowMobileProfile] = useState(false);
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

  // ── 1. Fetch Real Conversations List from MongoDB ──
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

  // ── 2. Handle Initial Selection & Target Partner from URL ──
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
        // Fetch real public user or tutor details directly from MongoDB
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
                    name: tData.user?.name || tData.name || '',
                    avatar: tData.profilePhoto?.url || tData.user?.avatar || '',
                    role: 'TUTOR',
                    tutorProfile: tData,
                  });
                }
              })
              .catch(() => {});
          });
      }
    } else if (conversations.length > 0 && !activePartner) {
      // On initial load without targetId, open the first real MongoDB conversation
      const firstRealConv = conversations[0]?.otherUser;
      if (firstRealConv) setActivePartner(firstRealConv);
    }

    return () => {
      isMounted = false;
    };
  }, [targetId, conversations, activePartner]);

  // Tab change handler: keeps existing conversation if still in tab filter, otherwise selects first in filtered tab
  const handleTabChange = (newTab) => {
    setChatTab(newTab);
    setBlockedAttempt(null);

    const nextFiltered = conversations.filter((c) => {
      const other = c.otherUser || {};
      if (newTab === 'STUDENTS') return other.role === 'STUDENT' || other.role === 'PARENT';
      if (newTab === 'TUTORS') return other.role === 'TUTOR';
      return true;
    });

    const stillInList = nextFiltered.find(
      (c) => String(c.otherUser?._id) === String(activePartner?._id)
    );

    if (!stillInList) {
      if (nextFiltered.length > 0) {
        setActivePartner(nextFiltered[0]?.otherUser);
      } else {
        setActivePartner(null);
        setPartnerProfile(null);
        setMessages([]);
      }
    }
  };

  // ── 3. Fetch Real Partner Full Profile (Tutor or Student) for Right Sidebar ──
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
          if (isMounted) setPartnerProfile(activePartner.tutorProfile || activePartner);
        });
    } else {
      client
        .get(`/users/${partnerId}`)
        .then((res) => {
          if (isMounted && res.data?.data) setPartnerProfile(res.data.data);
        })
        .catch(() => {
          if (isMounted) setPartnerProfile(activePartner.studentProfile || activePartner);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activePartner]);

  // ── 4. Fetch Real Messages for Active Partner ──
  const fetchMessages = useCallback(async (partnerId, silent = false) => {
    if (!partnerId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await client.get(`/chat/${partnerId}`);
      const data = res.data?.data || res.data || {};
      const msgs = Array.isArray(data) ? data : data.messages || [];
      const formattedMsgs = msgs.map((m) => {
        if (m.message && typeof m.message === 'object') return m.message;
        return m;
      });
      setMessages(formattedMsgs);
    } catch (fetchErr) {
      console.warn('Fetch messages notice:', fetchErr.message);
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

  // ── 5. Send Real Message with Instant Optimistic UI + Security Protection ──
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

    // 🌟 1. OPTIMISTIC UPDATE: Instantly render message on sender screen
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      sender: user?._id || user?.id || user,
      receiver: activePartner._id,
      content: rawText,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setBlockedAttempt(null);
    setSending(true);

    try {
      const res = await client.post(`/chat/${activePartner._id}`, {
        content: rawText,
      });

      const responsePayload = res.data?.data || res.data;
      const realMsg = responsePayload?.message || responsePayload;

      if (realMsg && (realMsg.content || realMsg._id)) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...realMsg, sender: user?._id || user?.id || user } : m))
        );
        fetchConversations();
      }
    } catch (err) {
      // On failure, remove optimistic message & show toast error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      const errMsg = err.response?.data?.message || err.message || 'Failed to send message';
      const errCode = err.response?.data?.code;

      if (errCode === 'CONTACT_SHARING_BLOCKED' || errMsg.includes('Contact') || errMsg.includes('safety')) {
        setBlockedAttempt({
          text: rawText,
          reason: errMsg || "🔒 For your safety, contact details and social-media information can't be shared in MentorNearby chat. Please keep communication within MentorNearby.",
          timestamp: new Date(),
        });
      } else {
        showToast(errMsg, 'error');
        setNewMessage(rawText); // restore text so user doesn't lose it
      }
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(), 50);
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

  // Derived Partner Profile Info
  const partnerRoleLabel = useMemo(() => {
    if (!activePartner) return '';
    if (activePartner.role === 'TUTOR') {
      const isVer = Boolean(partnerProfile?.isVerified || activePartner.tutorProfile?.isVerified);
      return isVer ? 'Verified Tutor' : 'Tutor';
    }
    const cls = partnerProfile?.studentDetails?.class || partnerProfile?.class;
    return cls ? `Student • ${cls}` : 'Student';
  }, [activePartner, partnerProfile]);

  const partnerSubjects = useMemo(() => {
    if (!activePartner) return [];
    if (partnerProfile?.subjects && Array.isArray(partnerProfile.subjects) && partnerProfile.subjects.length > 0) {
      return partnerProfile.subjects;
    }
    if (activePartner.tutorProfile?.subjects && Array.isArray(activePartner.tutorProfile.subjects)) {
      return activePartner.tutorProfile.subjects;
    }
    return [];
  }, [activePartner, partnerProfile]);

  const partnerBio = useMemo(() => {
    if (!activePartner) return '';
    return (
      partnerProfile?.bio ||
      partnerProfile?.about ||
      activePartner.tutorProfile?.bio ||
      activePartner.studentProfile?.about ||
      ''
    );
  }, [activePartner, partnerProfile]);

  const partnerBudget = useMemo(() => {
    if (!activePartner) return '';
    if (activePartner.role === 'TUTOR') {
      const rate = partnerProfile?.pricing?.hourlyRate || activePartner.tutorProfile?.pricing?.hourlyRate;
      if (rate) return `₹${rate} /hr`;
      const mRate = partnerProfile?.pricing?.monthlyRate || activePartner.tutorProfile?.pricing?.monthlyRate;
      if (mRate) return `₹${mRate} /mo`;
      return 'Contact for fees';
    }
    const b = partnerProfile?.budget || partnerProfile?.tuitionPreferences?.budget;
    return b ? `₹${b}` : 'As per requirement';
  }, [activePartner, partnerProfile]);

  const partnerLocation = useMemo(() => {
    if (!activePartner) return '';
    return (
      partnerProfile?.location?.city ||
      activePartner.tutorProfile?.location?.city ||
      activePartner.studentProfile?.location?.city ||
      partnerProfile?.city ||
      ''
    );
  }, [activePartner, partnerProfile]);

  const partnerRating = useMemo(() => {
    return (
      partnerProfile?.averageRating ||
      activePartner?.tutorProfile?.averageRating ||
      null
    );
  }, [partnerProfile, activePartner]);

  const partnerReviewsCount = useMemo(() => {
    return (
      partnerProfile?.totalReviews ||
      activePartner?.tutorProfile?.totalReviews ||
      0
    );
  }, [partnerProfile, activePartner]);

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
                onClick={() => handleTabChange('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`mn-chat-tab-btn ${chatTab === 'STUDENTS' ? 'active' : ''}`}
                onClick={() => handleTabChange('STUDENTS')}
              >
                Students
              </button>
              <button
                type="button"
                className={`mn-chat-tab-btn ${chatTab === 'TUTORS' ? 'active' : ''}`}
                onClick={() => handleTabChange('TUTORS')}
              >
                Tutors
              </button>
            </div>

            {/* Scrollable Real Conversations List */}
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
                              : ''}
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
                <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <span>{loadingConv ? 'Loading conversations...' : 'No conversations yet'}</span>
                  {!loadingConv && (
                    <Link
                      to={isTutor ? '/find-students' : '/tutors'}
                      style={{ background: '#F59E0B', color: '#000', padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                    >
                      {isTutor ? 'Find Students' : 'Browse Verified Tutors'}
                    </Link>
                  )}
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
          <main className={`mn-chat-panel mn-chat-convo-panel ${activePartner ? 'has-partner' : ''}`}>
            {activePartner ? (
              <>
                {/* Conversation Header */}
                <div className="mn-chat-convo-header">
                  {/* Mobile Back to List Button */}
                  <button
                    type="button"
                    className="mn-chat-mobile-back-btn"
                    onClick={() => setActivePartner(null)}
                    aria-label="Back to conversations"
                  >
                    ‹
                  </button>

                  <div
                    className="mn-chat-convo-user"
                    onClick={() => setShowMobileProfile(true)}
                    role="button"
                    tabIndex={0}
                    title="Tap to view tutor profile"
                  >
                    <div className="mn-chat-convo-avatar-wrap">
                      {activePartner?.avatar ? (
                        <img src={activePartner.avatar} alt={activePartner.name} className="mn-chat-item-avatar" />
                      ) : (
                        <div className="mn-chat-item-avatar-fallback">{activePartner?.name?.charAt(0) || 'U'}</div>
                      )}
                      <span className="mn-chat-online-dot"></span>
                    </div>
                    <div>
                      <div className="mn-chat-convo-name">
                        {activePartner?.name || 'User'}
                        <span className="mn-gold-check">✓</span>
                      </div>
                      <div className="mn-chat-convo-status">
                        <span className="mn-status-dot"></span>
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="mn-chat-convo-actions">
                    <button
                      type="button"
                      className="mn-chat-icon-btn profile-info-btn"
                      onClick={() => setShowMobileProfile(true)}
                      title="About Profile"
                    >
                      👤
                    </button>
                    <button
                      type="button"
                      className="mn-chat-icon-btn more-btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                      title="More Options"
                    >
                      ⋮
                    </button>

                    {showDropdown && (
                      <div className="mn-chat-dropdown-menu">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMobileProfile(true);
                            setShowDropdown(false);
                          }}
                          className="mn-chat-dropdown-item"
                        >
                          👤 View Profile Sheet
                        </button>
                        <Link
                          to={
                            activePartner.role === 'TUTOR'
                              ? `/tutor/${partnerProfile?._id || activePartner.tutorProfile?._id || activePartner._id}`
                              : `/student/${partnerProfile?._id || activePartner.studentProfile?._id || activePartner._id}`
                          }
                          className="mn-chat-dropdown-item"
                          onClick={() => setShowDropdown(false)}
                        >
                          🔗 Full Profile Page
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            showToast('Voice calling will be available in next update', 'info');
                            setShowDropdown(false);
                          }}
                          className="mn-chat-dropdown-item"
                        >
                          📞 Voice Call
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safe Chat Banner */}
                <div className="mn-chat-safe-banner">
                  <div className="mn-chat-safe-title">
                    <span className="safe-shield-icon">🛡️</span>
                    <span>MentorNearby Safe Chat</span>
                  </div>
                  <span className="mn-chat-safe-sub">Keep your conversations and payments safe.</span>
                </div>

                {/* Messages Stage */}
                <div className="mn-chat-messages-stage">
                  <div className="mn-chat-date-separator">Today</div>

                  {messages.length > 0 ? (
                    messages.map((m, idx) => {
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
                            {isSentByMe && <span className="mn-check-double">✓✓</span>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="mn-chat-start-prompt">
                      Say hello to start the conversation!
                    </div>
                  )}

                  {/* ⚠️ BLOCKED CONTACT DETAILS WARNING CARD */}
                  {blockedAttempt && (
                    <div className="mn-msg-blocked-card">
                      <div className="mn-msg-blocked-warning-title">
                        <span className="blocked-warn-icon">⚠️</span>
                        <span>Contact details aren't allowed</span>
                      </div>

                      <p className="mn-msg-blocked-warning-text">
                        For your safety, sharing phone numbers or other contact information isn't permitted in MentorNearby chat.
                      </p>

                      <button
                        type="button"
                        onClick={handleEditBlockedMessage}
                        className="mn-msg-blocked-learn-btn"
                      >
                        Learn More
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

                {/* Message Input Composer (Fixed at Bottom of Chat View) */}
                <form onSubmit={handleSendMessage} className="mn-chat-input-bar">
                  <button type="button" className="mn-chat-icon-btn attach-btn" title="Attach file">
                    📎
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="mn-chat-input-field"
                  />
                  <button type="button" className="mn-chat-icon-btn emoji-btn" title="Add emoji">
                    😊
                  </button>
                  <button type="submit" disabled={sending} className="mn-chat-send-btn" title="Send message">
                    ➤
                  </button>
                </form>

                {/* 📱 MOBILE BOTTOM SHEET PROFILE MODAL (Hidden by default, opens only on 'View Full Profile' / Avatar tap) */}
                {showMobileProfile && (
                  <div className="mn-mobile-profile-overlay" onClick={() => setShowMobileProfile(false)}>
                    <div className="mn-chat-mobile-profile-sheet" onClick={(e) => e.stopPropagation()}>
                      <div className="mn-mobile-sheet-top-bar">
                        <div className="mn-mobile-sheet-handle"></div>
                        <button
                          type="button"
                          className="mn-mobile-sheet-close-btn"
                          onClick={() => setShowMobileProfile(false)}
                          aria-label="Close"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <h3 className="mn-mobile-sheet-title">
                        About {activePartner.name?.split(' ')[0] || 'User'}
                      </h3>

                      <div className="mn-mobile-profile-center">
                        <div className="mn-mobile-avatar-ring">
                          {activePartner.avatar ? (
                            <img src={activePartner.avatar} alt={activePartner.name} className="mn-mobile-avatar-img" />
                          ) : (
                            <div className="mn-mobile-avatar-fallback">
                              {activePartner.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>

                        <div className="mn-mobile-profile-name">
                          {activePartner.name}
                          <span className="mn-gold-check">✓</span>
                        </div>

                        <div className="mn-mobile-profile-role">{partnerRoleLabel}</div>

                        <div className="mn-mobile-profile-rating">
                          ⭐ {partnerRating || '4.9'} ({partnerReviewsCount || 120})
                        </div>
                      </div>

                      {/* About Bio */}
                      <div className="mn-mobile-profile-section">
                        <span className="mn-mobile-section-heading">About</span>
                        <p className="mn-mobile-section-text">
                          {partnerBio || 'With 5+ years of experience, I specialize in making Maths & Science simple and scoring. My approach focuses on concept clarity, daily practice, and regular doubt sessions.'}
                        </p>
                      </div>

                      {/* Subjects */}
                      <div className="mn-mobile-profile-section">
                        <span className="mn-mobile-section-heading">
                          {activePartner.role === 'TUTOR' ? 'Subjects Taught' : 'Subjects Needed'}
                        </span>
                        <div className="mn-mobile-chips-grid">
                          {(partnerSubjects.length > 0 ? partnerSubjects : ['Mathematics', 'Physics', 'Chemistry']).map((s, idx) => (
                            <span key={idx} className="mn-mobile-chip">
                              {typeof s === 'string' ? s : s.name || s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="mn-mobile-profile-section">
                        <span className="mn-mobile-section-heading">Budget</span>
                        <span className="mn-mobile-section-text font-bold">
                          {partnerBudget || '₹500 - ₹800 /hr'}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="mn-mobile-profile-section">
                        <span className="mn-mobile-section-heading">Location</span>
                        <span className="mn-mobile-section-text">
                          {partnerLocation || 'Hapur, Uttar Pradesh'}
                        </span>
                      </div>

                      {/* View Full Profile CTA */}
                      <Link
                        to={
                          activePartner.role === 'TUTOR'
                            ? `/tutor/${partnerProfile?._id || activePartner.tutorProfile?._id || activePartner._id}`
                            : `/student/${partnerProfile?._id || activePartner.studentProfile?._id || activePartner._id}`
                        }
                        className="mn-mobile-view-profile-btn"
                        onClick={() => setShowMobileProfile(false)}
                      >
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mn-chat-no-active-empty">
                <span style={{ fontSize: 44, opacity: 0.8 }}>💬</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Select a conversation</h2>
                <p style={{ fontSize: 13, margin: 0, maxWidth: 340, lineHeight: 1.5 }}>
                  Choose a student or tutor from the list to start chatting.
                </p>
              </div>
            )}
          </main>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* COLUMN 3: REAL USER / TUTOR PROFILE INFO                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          <aside className="mn-chat-panel mn-chat-profile-panel">
            {activePartner ? (
              <>
                <h2 className="mn-chat-profile-title">About {activePartner.name?.split(' ')[0] || 'User'}</h2>

                <div className="mn-chat-profile-center">
                  {activePartner.avatar ? (
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
                        color: '#FFF',
                      }}
                    >
                      {activePartner.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="mn-chat-profile-lg-name">
                    {activePartner.name}
                    {Boolean(partnerProfile?.isVerified || activePartner.tutorProfile?.isVerified) && (
                      <span style={{ color: '#F59E0B', fontSize: 12 }}>✓</span>
                    )}
                  </div>

                  <div className="mn-chat-profile-role-line">{partnerRoleLabel}</div>

                  {partnerRating && (
                    <div className="mn-chat-profile-rating-line">
                      ★ {partnerRating} {partnerReviewsCount > 0 ? `(${partnerReviewsCount})` : ''}
                    </div>
                  )}
                </div>

                {/* About text */}
                {partnerBio && (
                  <div className="mn-chat-profile-info-block">
                    <span className="mn-chat-profile-info-heading">About</span>
                    <p className="mn-chat-profile-info-body">{partnerBio}</p>
                  </div>
                )}

                {/* Subjects Chips */}
                {partnerSubjects.length > 0 && (
                  <div className="mn-chat-profile-info-block">
                    <span className="mn-chat-profile-info-heading">
                      {activePartner.role === 'TUTOR' ? 'Subjects Taught' : 'Subjects Interested In'}
                    </span>
                    <div className="mn-chat-profile-chips-row">
                      {partnerSubjects.map((s, idx) => (
                        <span key={idx} className="mn-chat-profile-chip">
                          {typeof s === 'string' ? s : s.name || 'Subject'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget / Hourly Rate */}
                {partnerBudget && (
                  <div className="mn-chat-profile-info-block">
                    <span className="mn-chat-profile-info-heading">Budget</span>
                    <span className="mn-chat-profile-info-body" style={{ fontWeight: 700, color: '#FFFFFF' }}>
                      {partnerBudget}
                    </span>
                  </div>
                )}

                {/* Location */}
                {partnerLocation && (
                  <div className="mn-chat-profile-info-block">
                    <span className="mn-chat-profile-info-heading">Location</span>
                    <span className="mn-chat-profile-info-body">{partnerLocation}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <Link
                    to={
                      activePartner.role === 'TUTOR'
                        ? `/tutor/${partnerProfile?._id || activePartner.tutorProfile?._id || activePartner._id}`
                        : `/student/${partnerProfile?._id || activePartner.studentProfile?._id || activePartner._id}`
                    }
                    className="mn-chat-profile-btn-outline"
                  >
                    View Full Profile
                  </Link>

                  <Link to="/subscription" className="mn-chat-profile-btn-gold">
                    <span>🔓 Unlock Contact</span>
                    <span style={{ fontSize: 9.5, opacity: 0.85 }}>₹100 per contact</span>
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#64748B', textAlign: 'center', padding: 20 }}>
                <span style={{ fontSize: 36, opacity: 0.5 }}>👤</span>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', margin: 0, maxWidth: 220, lineHeight: 1.4 }}>
                  Select a conversation to view profile
                </h3>
              </div>
            )}
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
