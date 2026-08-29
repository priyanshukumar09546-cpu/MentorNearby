// ============================================================
// pages/Chat/ChatPage.jsx
// MentorNearby Safe Chat System — Pixel-Accurate UI for Both Roles
// Supports Student Chatting with Tutor & Tutor Chatting with Student
// Built-in Leak-Proof PII Filter & Real-Time Sync
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { getSubscriptionStatus } from '../../api/subscription';
import { useToast } from '../../context/ToastContext';
import { canSendMessage } from '../../utils/chatFilter';
import SubscriptionPlansModal from '../../components/subscription/SubscriptionPlansModal';

const ChatPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const recipientId =
    searchParams.get('recipient') ||
    searchParams.get('recipientId') ||
    searchParams.get('user') ||
    searchParams.get('userId');
  const conversationParam =
    searchParams.get('chat') ||
    searchParams.get('conversation') ||
    searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [filterWarning, setFilterWarning] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const isTutor = (user?.role || '').toString().toUpperCase() === 'TUTOR';

  // ── 1. Fetch Conversations & Subscription ──────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await client.get('/chat');
      const data = res.data?.data || {};
      const list = data.data || (Array.isArray(res.data?.data) ? res.data.data : []);
      setConversations(list);
      if (data.subscription) setSubStatus(data.subscription);
    } catch (_) {
      // quiet fail
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

  // ── 2. Determine Active Chat Partner ───────────────────────
  useEffect(() => {
    if (recipientId) {
      // Find from conversations
      const match = conversations.find(
        (c) =>
          String(c.otherUser?._id) === String(recipientId) ||
          String(c._id) === String(recipientId)
      );
      if (match?.otherUser) {
        setActivePartner(match.otherUser);
      } else {
        // Fetch user profile from DB
        const loadUser = async () => {
          try {
            const uRes = await client.get(`/users/${recipientId}`);
            if (uRes.data?.data?.user) {
              setActivePartner(uRes.data.data.user);
              return;
            }
          } catch (_) {}

          try {
            const tRes = await client.get(`/tutors/${recipientId}`);
            const tData = tRes.data?.data?.tutorProfile || tRes.data?.data;
            if (tData) {
              setActivePartner({
                _id: tData.user?._id || tData.user || recipientId,
                name: tData.user?.name || tData.name || 'Tutor',
                avatar: tData.user?.avatar || tData.avatar || '',
                role: 'TUTOR',
                subject: tData.subjects?.[0] || tData.subject || 'Academic Mentor',
                experience: tData.experience ? `${tData.experience}+ Years` : '3+ Years',
                classes: tData.classes ? `Class ${tData.classes}` : 'Class 8 - 12',
              });
            }
          } catch (_) {
            setActivePartner({
              _id: recipientId,
              name: isTutor ? 'Student' : 'Tutor',
              role: isTutor ? 'STUDENT' : 'TUTOR',
            });
          }
        };
        loadUser();
      }
    } else if (conversations.length > 0 && !activePartner) {
      setActivePartner(conversations[0].otherUser);
    }
  }, [recipientId, conversations, isTutor, activePartner]);

  // ── 3. Load Messages for Active Partner ─────────────────────
  const fetchMessages = useCallback(async (silent = false) => {
    if (!activePartner?._id) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await client.get(`/chat/${activePartner._id}`);
      const list = res.data?.data?.data || res.data?.data || [];
      if (Array.isArray(list)) {
        setMessages(list);
      }
    } catch (_) {
      // quiet
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [activePartner]);

  useEffect(() => {
    fetchMessages();
    // Real-time polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 4. Live PII Filter on Typing ────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (!val.trim()) {
      setFilterWarning('');
      return;
    }

    const check = canSendMessage(val);
    if (!check.allowed) {
      setFilterWarning(check.reason);
    } else {
      setFilterWarning('');
    }
  };

  // ── 5. Send Message with Strict Leak-Proof Validation ───────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner?._id || sending) return;

    // Strict PII Check
    const check = canSendMessage(newMessage);
    if (!check.allowed) {
      showToast(
        'For safety, personal contact details are not allowed in introduction chat. Please keep conversation about studies. You can unlock contact after subscription.',
        'error'
      );
      setFilterWarning(check.reason);
      return;
    }

    const textToSend = newMessage.trim();
    setNewMessage('');
    setFilterWarning('');
    setSending(true);

    try {
      const res = await client.post(`/chat/${activePartner._id}`, {
        content: textToSend,
      });

      if (res.data?.success) {
        const savedMsg = res.data.data?.message || {
          _id: Date.now().toString(),
          sender: user?._id || user?.id,
          receiver: activePartner._id,
          content: textToSend,
          createdAt: new Date().toISOString(),
          read: false,
        };
        setMessages((prev) => [...prev, savedMsg]);
        fetchConversations();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        'Failed to send message. Please try again.';
      showToast(errMsg, 'error');
      if (err.response?.status === 403 || err.response?.data?.needSubscription) {
        setShowPlansModal(true);
      }
    } finally {
      setSending(false);
    }
  };

  // ── Details Formatting Helpers ──────────────────────────────
  const otherIsTutor =
    (activePartner?.role || '').toString().toUpperCase() === 'TUTOR';
  const partnerName = activePartner?.name || (otherIsTutor ? 'Rahul Sharma' : 'Ananya Singh');
  const partnerBadge = otherIsTutor ? '✔ Verified Tutor' : '✔ Verified Student';
  const partnerSubline = otherIsTutor
    ? `${activePartner?.subject || 'Mathematics Tutor'} • Experience: ${activePartner?.experience || '3+ Years'} • Teaches: ${activePartner?.classes || 'Class 8 - 12'}`
    : `${activePartner?.class || 'Class 11 Student'} • Looking for: ${activePartner?.subject || 'Mathematics Tutor'}`;

  const isSubscribed = Boolean(
    user?.isSubscribed ||
      subStatus?.isSubscribed ||
      (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (EXACT MATCH TO REFERENCE DESIGN)            */}
      {/* ============================================================ */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-5 flex-shrink-0">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 text-decoration-none">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg border border-red-100 shadow-sm">
              🎓
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Mentor<span className="text-red-600">Nearby</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-medium text-sm text-slate-600">
            <Link
              to="/messages"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold transition shadow-sm"
            >
              <span className="text-base">💬</span>
              <span>Chats</span>
            </Link>

            <Link
              to={isTutor ? '/tutor/requests' : '/saved-tutors'}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span className="text-base">👥</span>
              <span>My Connections</span>
            </Link>

            <Link
              to={isTutor ? '/find-students' : '/search'}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span className="text-base">{isTutor ? '👤' : '🔍'}</span>
              <span>{isTutor ? 'Find Students' : 'Find Tutors'}</span>
            </Link>

            <Link
              to="/subscription"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span className="text-base">👑</span>
              <span>Subscription</span>
            </Link>

            <Link
              to="/notifications"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span className="text-base">🔔</span>
              <span>Notifications</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span className="text-base">👤</span>
              <span>Profile</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Sidebar Badges */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {/* Safe & Trusted Card */}
          <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 text-left">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 font-bold text-sm">
              🛡️
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mb-2">Safe &amp; Trusted</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Verified Profiles
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Identity Checked
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> MentorNearby Member
              </li>
            </ul>
          </div>

          {/* Need Help Support */}
          <div className="flex items-center gap-3 px-2 text-xs text-slate-500">
            <span className="text-base">🎧</span>
            <div>
              <div>Need Help?</div>
              <Link to="/contact" className="text-red-600 font-bold hover:underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MAIN CHAT AREA (HEADER, BANNER, MESSAGES, INPUT, PLANS)   */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col h-screen max-h-screen bg-white md:bg-[#FAF8F5] overflow-hidden">
        {/* TOP BAR: Back Link + Actions */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(isTutor ? '/find-students' : '/search')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-sm bg-transparent border-none cursor-pointer"
          >
            <span>←</span>
            <span>{isTutor ? 'Back to Students' : 'Back to Tutors'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border-none bg-transparent cursor-pointer"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 w-44 z-50 text-xs text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/report-issue');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 border-none bg-transparent cursor-pointer text-slate-700"
                >
                  🚩 Report User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowPlansModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 border-none bg-transparent cursor-pointer text-slate-700 font-bold text-red-600"
                >
                  🔓 Unlock Direct Contact
                </button>
              </div>
            )}
          </div>
        </div>

        {/* HEADER PROFILE CARD (Verified Badges & Status) */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <img
                src={
                  activePartner?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`
                }
                alt={partnerName}
                className="w-13 h-13 rounded-full object-cover border-2 border-slate-100"
                style={{ width: '52px', height: '52px' }}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900">{partnerName}</h2>
                <span className="bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  {partnerBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{partnerSubline}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Right: 3 Verified Indicators */}
          <div className="hidden lg:flex flex-col items-end gap-1 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 text-cyan-600">
              <span>🛡️</span> <span>Identity Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <span>👤</span> <span>MentorNearby Member</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <span>{otherIsTutor ? '⭐' : '👥'}</span>{' '}
              <span>{otherIsTutor ? 'Highly Rated Tutor' : 'Genuine Student'}</span>
            </div>
          </div>
        </div>

        {/* CHAT MESSAGES SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* BLUE NOTICE BANNER */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <span className="text-blue-600 text-lg flex-shrink-0">🛡️</span>
              <div>
                <h5 className="font-bold text-xs text-[#1E3A8A] mb-0.5">
                  You are in a Safe Introduction Chat
                </h5>
                <p className="text-[11px] text-[#3B82F6] leading-tight">
                  Get to know each other before unlocking direct contact details.
                </p>
              </div>
            </div>
            <span className="text-blue-400 text-base flex-shrink-0">🛡️</span>
          </div>

          {/* TODAY DATE SEPARATOR */}
          <div className="flex items-center justify-center my-3">
            <span className="bg-[#F1F5F9] text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
              Today
            </span>
          </div>

          {/* MESSAGES LIST */}
          {loadingMessages ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">👋</span>
              <p className="text-xs font-semibold text-slate-600">No messages yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Say hello to start discussing tuition requirements safely!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe =
                String(m.sender?._id || m.sender) === String(user?._id || user?.id);

              return (
                <div
                  key={m._id || m.createdAt}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Name */}
                  <div
                    className={`text-[11px] font-bold mb-1 px-1 ${
                      isMe
                        ? isTutor
                          ? 'text-emerald-600'
                          : 'text-red-600'
                        : otherIsTutor
                        ? 'text-slate-900'
                        : 'text-red-600'
                    }`}
                  >
                    {isMe ? (isTutor ? 'You (Tutor)' : 'You') : partnerName}
                  </div>

                  {/* Message Bubble Row */}
                  <div className={`flex items-end gap-2 max-w-[82%] md:max-w-[70%]`}>
                    {!isMe && (
                      <img
                        src={
                          activePartner?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`
                        }
                        alt=""
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                      />
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                        isMe
                          ? isTutor
                            ? 'bg-[#DCFCE7] text-slate-900 rounded-br-none'
                            : 'bg-[#FEE2E2] text-slate-900 rounded-br-none'
                          : 'bg-[#F1F5F9] text-slate-900 rounded-bl-none'
                      }`}
                    >
                      <p className="m-0 font-medium">{m.content || m.text}</p>
                    </div>

                    {isMe && (
                      <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 mb-1">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span className={isTutor ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM + LEAK-PROOF HINT */}
        <div className="bg-white border-t border-slate-200 p-3 md:p-4">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-full px-4 py-2 focus-within:border-red-400 focus-within:bg-white transition shadow-inner">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-base"
                title="Add Emoji"
              >
                😊
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              />

              <button
                type="submit"
                disabled={!newMessage.trim() || Boolean(filterWarning) || sending}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white border-none transition cursor-pointer flex-shrink-0 shadow-md ${
                  !newMessage.trim() || Boolean(filterWarning) || sending
                    ? 'bg-slate-300 opacity-60 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:scale-95'
                }`}
                title="Send Message"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* LIVE LEAK-PROOF WARNING BANNER */}
            {filterWarning && (
              <div className="flex items-center gap-2 text-left bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg animate-pulse">
                <span>⚠️</span>
                <span>{filterWarning}</span>
              </div>
            )}
          </form>
        </div>

        {/* BOTTOM SUBSCRIPTION / CONTACT UNLOCK BANNER (Hidden if subscribed) */}
        {!isSubscribed && (
          <div className="bg-[#FEF9C3] border-t border-[#FDE047] p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                🔒
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Want to connect directly?</h4>
                <p className="text-[11px] text-slate-600">
                  Unlock contact details after choosing your MentorNearby plan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPlansModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl border-none cursor-pointer transition shadow-sm flex items-center gap-1.5"
            >
              <span>View Subscription Plans</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* BOTTOM SAFETY TRUST ROW (3 COLUMNS) */}
        <div className="bg-white border-t border-slate-100 px-5 py-2.5 hidden md:flex items-center justify-around text-center text-slate-500 text-[11px] font-medium">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">🛡️</span>
            <div>
              <strong className="text-slate-800">Secure Platform</strong>
              <div className="text-[10px] text-slate-400">Your safety is our priority</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-sm">👥</span>
            <div>
              <strong className="text-slate-800">Trusted Community</strong>
              <div className="text-[10px] text-slate-400">Verified tutors &amp; students</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-sm">🎧</span>
            <div>
              <strong className="text-slate-800">24/7 Support</strong>
              <div className="text-[10px] text-slate-400">We are here to help</div>
            </div>
          </div>
        </div>
      </main>

      {/* Subscription Plans Modal */}
      {showPlansModal && (
        <SubscriptionPlansModal
          isOpen={showPlansModal}
          onClose={() => setShowPlansModal(false)}
          tutor={otherIsTutor ? activePartner : null}
          student={!otherIsTutor ? activePartner : null}
        />
      )}
    </div>
  );
};

export default ChatPage;
