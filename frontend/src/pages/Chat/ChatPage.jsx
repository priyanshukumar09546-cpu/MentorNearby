// ============================================================
// pages/Chat/ChatPage.jsx
// MentorNearby Safe Chat System — Pixel-Accurate Reference Match
// Full-Screen / Viewport Application Layout • Zero Website Footer
// Real Database Schema Data • Strict PII Leak-Proof Protection
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
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
  const routeParams = useParams();

  // Target recipient or conversation parameter
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
  const pollIntervalRef = useRef(null);
  const activePartnerIdRef = useRef(null);

  const isTutor = useMemo(() => {
    return (user?.role || '').toString().toUpperCase() === 'TUTOR';
  }, [user?.role]);

  // Keep ref synced to prevent stale closures in polling
  useEffect(() => {
    activePartnerIdRef.current = activePartner?._id || null;
  }, [activePartner?._id]);

  // ── 1. Fetch Conversations & Subscription (Stable on Mount) ──
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

  // ── 2. Determine Active Partner from Target ID (Exact same DB fields as Profile Page) ──
  useEffect(() => {
    let isMounted = true;

    if (targetId) {
      // Check existing conversations first
      const match = conversations.find(
        (c) =>
          String(c.otherUser?._id) === String(targetId) ||
          String(c._id) === String(targetId)
      );

      if (match?.otherUser) {
        if (isMounted) setActivePartner(match.otherUser);
        return;
      }

      // Fetch from API using exact same data source as TutorProfilePage
      const fetchPartnerDetails = async () => {
        try {
          // 1. Try Tutors profile endpoint
          const tRes = await client.get(`/tutors/${targetId}`);
          const tData = tRes.data?.data?.tutorProfile || tRes.data?.data;
          if (tData && isMounted) {
            // Extract real education / degree
            const degree = tData.education?.[0]?.degree || tData.qualification || '';
            const field = tData.education?.[0]?.field || '';
            const fullDegree = degree ? `${degree}${field ? ` ${field}` : ''}` : '';

            // Extract real experience
            const expYears =
              typeof tData.experience === 'object'
                ? tData.experience?.years
                : tData.experience;
            const expString = expYears
              ? `${expYears}+ Years`
              : (tData.teachingExperience ? `${tData.teachingExperience}` : '');

            // Extract real subjects
            const subjectsList =
              Array.isArray(tData.subjects) && tData.subjects.length > 0
                ? tData.subjects.slice(0, 3).join(' & ')
                : (tData.subject || '');

            // Extract real classes / grades
            const classesList =
              Array.isArray(tData.grades) && tData.grades.length > 0
                ? `Class ${tData.grades.join(', ')}`
                : (Array.isArray(tData.classes)
                ? `Class ${tData.classes.join(', ')}`
                : (tData.classes || ''));

            const teachesFormatted = [fullDegree, subjectsList, classesList]
              .filter(Boolean)
              .join(' • ');

            setActivePartner({
              _id: tData.user?._id || tData.user || targetId,
              name: tData.user?.name || tData.name || 'Tutor',
              avatar:
                tData.profilePhoto?.url ||
                tData.profilePhoto ||
                tData.user?.avatar ||
                tData.avatar ||
                '',
              role: 'TUTOR',
              subject: subjectsList || tData.subject || '',
              degree: fullDegree,
              qualification: fullDegree,
              experience: expString,
              classes: classesList,
              teaches: teachesFormatted || subjectsList || fullDegree || 'Verified Educator',
              phone: tData.phone || tData.user?.phone || '',
              email: tData.user?.email || tData.email || '',
              whatsappNumber: tData.whatsappNumber || tData.phone || tData.user?.phone || '',
              isVerified: tData.kycStatus === 'VERIFIED' || tData.isVerified === true,
              isKYCVerified: tData.kycStatus === 'VERIFIED' || tData.isVerified === true,
            });
            return;
          }
        } catch (_) {}

        try {
          // 2. Try Users profile endpoint
          const uRes = await client.get(`/users/${targetId}`);
          if (uRes.data?.data?.user && isMounted) {
            const uData = uRes.data.data.user;
            setActivePartner({
              _id: uData._id || targetId,
              name: uData.name || 'Student',
              avatar: uData.avatar || '',
              role: uData.role || 'STUDENT',
              class: uData.studentClass ? `Class ${uData.studentClass}` : (uData.class || 'Student'),
              subject: uData.subject || uData.learningNeeds || 'All Subjects',
              phone: uData.phone || '',
              email: uData.email || '',
              isVerified: uData.isVerified || uData.phoneVerified || true,
            });
            return;
          }
        } catch (_) {}

        if (isMounted) {
          setActivePartner({
            _id: targetId,
            name: isTutor ? 'Student' : 'Tutor',
            role: isTutor ? 'STUDENT' : 'TUTOR',
            isVerified: true,
          });
        }
      };

      fetchPartnerDetails();
    } else if (conversations.length > 0 && !activePartner) {
      if (isMounted) setActivePartner(conversations[0].otherUser);
    }

    return () => {
      isMounted = false;
    };
  }, [targetId, conversations, isTutor]);

  // ── 3. Load & Poll Messages (Flicker-Free, No Loop) ─────────
  const fetchMessagesForPartner = useCallback(
    async (partnerId, silent = false) => {
      if (!partnerId) return;
      if (!silent) setLoadingMessages(true);
      try {
        const res = await client.get(`/chat/${partnerId}`);
        const list = res.data?.data?.data || res.data?.data || [];
        if (Array.isArray(list)) {
          setMessages(list);
        }
      } catch (_) {
        // quiet
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    const currentId = activePartner?._id;
    if (!currentId) return;

    // Initial load
    fetchMessagesForPartner(currentId, false);

    // Stable background polling every 3.5s without re-triggering dependency changes
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      if (activePartnerIdRef.current) {
        fetchMessagesForPartner(activePartnerIdRef.current, true);
      }
    }, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activePartner?._id, fetchMessagesForPartner]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── 4. Live PII Filter on Typing / Paste ────────────────────
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
        'For safety, personal contact details are not allowed in introduction chat. Please keep conversation about studies. You can unlock direct contact after subscription.',
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

  // ── Computed Partner Info (Real Profile Data Display) ───────
  const otherIsTutor = useMemo(() => {
    return (activePartner?.role || '').toString().toUpperCase() === 'TUTOR';
  }, [activePartner?.role]);

  const partnerName = activePartner?.name || (otherIsTutor ? 'Tutor' : 'Student');
  const partnerBadge = otherIsTutor ? 'Verified Tutor' : 'Verified Student';

  const partnerSubline = useMemo(() => {
    if (otherIsTutor) {
      const parts = [];
      if (activePartner?.teaches) {
        parts.push(`Teaches: ${activePartner.teaches}`);
      } else if (activePartner?.degree || activePartner?.subject || activePartner?.classes) {
        const tStr = [activePartner.degree, activePartner.subject, activePartner.classes]
          .filter(Boolean)
          .join(' • ');
        if (tStr) parts.push(`Teaches: ${tStr}`);
      }
      if (activePartner?.experience) {
        parts.push(`Exp: ${activePartner.experience}`);
      }
      return parts.join(' | ') || 'Verified Tutor on MentorNearby';
    } else {
      const parts = [];
      if (activePartner?.class) parts.push(activePartner.class);
      if (activePartner?.subject) parts.push(`Looking for: ${activePartner.subject}`);
      return parts.join(' | ') || 'Student on MentorNearby';
    }
  }, [otherIsTutor, activePartner]);

  const isSubscribed = Boolean(
    user?.isSubscribed ||
      subStatus?.isSubscribed ||
      (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
  );

  return (
    <div className="w-full h-full flex bg-[#F9FAFB] text-slate-900 font-sans overflow-hidden select-none">
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR (280px / w-72, Exactly Like Reference)        */}
      {/* ============================================================ */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-5 flex-shrink-0 h-full overflow-y-auto">
        <div>
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-7 text-decoration-none">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg border border-red-100 shadow-2xs">
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
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#FEE2E2] text-[#DC2626] font-extrabold transition shadow-2xs"
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

        {/* Bottom Safe & Trusted Card */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 text-left shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 font-bold text-sm">
              🛡️
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mb-2">Safe &amp; Trusted</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 font-medium list-none p-0 m-0">
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
      {/* 2. RIGHT MAIN CHAT AREA (Full Height, Independent Scroll)    */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col bg-[#FCFCFD] h-full overflow-hidden relative">
        
        {/* ── A. CHAT HEADER (White card, compact, border-b) ───────── */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 z-10 flex-shrink-0">
          
          {/* Left: Back Button + Avatar 48px + Real Name & Subject */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => navigate(isTutor ? '/find-students' : '/search')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold text-xs md:text-sm bg-transparent border-none cursor-pointer transition p-1"
              title="Go Back"
            >
              <span className="text-base">←</span>
              <span className="hidden sm:inline">
                {isTutor ? 'Back to Students' : 'Back to Tutors'}
              </span>
            </button>

            <div className="relative flex-shrink-0">
              <img
                src={
                  activePartner?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partnerName)}`
                }
                alt={partnerName}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                style={{ width: '48px', height: '48px' }}
              />
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                title="Online"
              />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm md:text-base text-slate-900 m-0">
                  {partnerName}
                </h2>
                <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <span>✓</span> {partnerBadge}
                </span>
              </div>

              {/* 2nd line: Teaches / Degree & Exp */}
              <p className="text-[11px] md:text-xs text-slate-500 m-0 mt-0.5 font-medium line-clamp-1">
                {partnerSubline}
              </p>

              {/* 3rd line: Online dot */}
              <div className="flex items-center gap-1 text-[10px] md:text-[11px] text-emerald-600 font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Right: Verified Badges + Options Menu */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-semibold">
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-emerald-700 inline-flex items-center gap-1 shadow-2xs">
                <span>🛡️</span> <span>Identity Verified</span>
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 inline-flex items-center gap-1 shadow-2xs">
                <span>👤</span> <span>MentorNearby Member</span>
              </span>
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-amber-700 inline-flex items-center gap-1 shadow-2xs">
                <span>{otherIsTutor ? '⭐' : '👥'}</span>{' '}
                <span>{otherIsTutor ? 'Highly Rated Tutor' : 'Genuine Student'}</span>
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold text-lg border-none bg-transparent cursor-pointer"
                title="Options"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 w-44 z-50 text-xs text-slate-700 text-left">
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
        </header>

        {/* ── B. SAFE INTRODUCTION BANNER (Light blue #EFF6FF) ───────── */}
        <div className="px-4 md:px-6 pt-3 flex-shrink-0">
          <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-3 md:p-3.5 flex items-center justify-between gap-3 text-left shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-blue-600 text-lg flex-shrink-0">ℹ️</span>
              <div>
                <span className="font-bold text-xs text-[#1E3A8A] mr-1.5">
                  You are in a Safe Introduction Chat
                </span>
                <span className="text-[11px] text-[#3B82F6]">
                  Get to know each other before unlocking direct contact details.
                </span>
              </div>
            </div>
            <span className="text-blue-400 text-base flex-shrink-0">🛡️</span>
          </div>

          {/* REAL UNLOCKED DIRECT CONTACT CARD (When Subscribed) */}
          {isSubscribed && (activePartner?.phone || activePartner?.email) && (
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 mt-2.5 flex flex-wrap items-center justify-between gap-3 text-left shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  🔓
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-900 m-0">Direct Contact Unlocked</h4>
                  <div className="text-xs text-emerald-800 flex flex-wrap gap-x-4 gap-y-1 mt-0.5 font-medium">
                    {activePartner.phone && (
                      <span>📞 Phone: <strong className="text-emerald-950">{activePartner.phone}</strong></span>
                    )}
                    {activePartner.whatsappNumber && activePartner.whatsappNumber !== activePartner.phone && (
                      <span>💬 WhatsApp: <strong className="text-emerald-950">{activePartner.whatsappNumber}</strong></span>
                    )}
                    {activePartner.email && (
                      <span>✉️ Email: <strong className="text-emerald-950">{activePartner.email}</strong></span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-emerald-700 text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                Active Plan
              </span>
            </div>
          )}
        </div>

        {/* ── C. MESSAGES SCROLL AREA (Flex-1, Beautiful Bubbles) ──── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-[#FCFCFD]">
          
          {/* DATE SEPARATOR */}
          <div className="flex items-center justify-center my-2">
            <span className="bg-[#F1F5F9] text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs border border-slate-200/60">
              Today
            </span>
          </div>

          {/* MESSAGES LIST */}
          {loadingMessages ? (
            <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
              Loading secure introduction chat...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">👋</span>
              <p className="text-xs font-semibold text-slate-600">
                Say hello to {partnerName} to start discussing tuition requirements!
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero commission • 100% Verified profiles • Safe environment
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe =
                String(m.sender?._id || m.sender) === String(user?._id || user?.id);

              if (isMe) {
                // Outgoing message (You, right aligned)
                return (
                  <div key={m._id || m.createdAt} className="flex justify-end my-2">
                    <div className="flex items-start justify-end gap-2.5 max-w-[85%] md:max-w-[70%]">
                      <div className="flex flex-col items-end">
                        <div
                          className={`p-3 md:p-3.5 rounded-2xl rounded-tr-sm shadow-2xs text-left ${
                            isTutor
                              ? 'bg-[#F0FDF4] border border-emerald-100 text-slate-900'
                              : 'bg-[#FFF0F0] border border-red-100 text-slate-900'
                          }`}
                        >
                          <p
                            className={`text-xs font-bold mb-1 ${
                              isTutor ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {isTutor ? 'You (Tutor)' : 'You'}
                          </p>
                          <p className="text-[13px] text-slate-800 leading-relaxed m-0 font-normal">
                            {m.content || m.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 mr-1">
                          <span>
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-blue-500 font-bold">✓✓</span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-extrabold text-xs flex-shrink-0 mt-0.5 border border-red-200">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Incoming message (Other person, left aligned)
                return (
                  <div key={m._id || m.createdAt} className="flex justify-start my-2">
                    <div className="flex items-start gap-2.5 max-w-[85%] md:max-w-[70%]">
                      <img
                        src={
                          activePartner?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partnerName)}`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-slate-200"
                      />

                      <div className="flex flex-col items-start">
                        <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm p-3 md:p-3.5 shadow-sm text-left">
                          <p className="text-xs font-bold text-slate-900 mb-1">
                            {partnerName}
                          </p>
                          <p className="text-[13px] text-slate-800 leading-relaxed m-0 font-normal">
                            {m.content || m.text}
                          </p>
                        </div>

                        <span className="text-[11px] text-slate-400 mt-1 ml-1">
                          {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── D. INPUT COMPOSER (Sticky at bottom, Only Text + Emoji) ─ */}
        <div className="bg-white border-t border-slate-200 p-3 md:p-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-1.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:border-red-400 focus-within:bg-white transition shadow-inner">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              />

              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-base px-1"
                title="Add Emoji"
              >
                😊
              </button>

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
                  width="14"
                  height="14"
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

            {/* LIVE LEAK-PROOF WARNING TEXT */}
            {filterWarning && (
              <div className="text-left text-red-600 text-[11px] font-semibold px-3 py-1 flex items-center gap-1.5 animate-pulse">
                <span>⚠️</span>
                <span>Personal contact details aren't allowed in introduction chat.</span>
              </div>
            )}
          </form>
        </div>

        {/* ── E. BOTTOM UNLOCK BANNER (Yellow #FFFBEB, Final Section) ── */}
        {!isSubscribed && (
          <div className="bg-[#FFFBEB] border-t border-[#FEF08A] p-3 px-6 flex flex-wrap items-center justify-between gap-3 text-left flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-2xs">
                🔒
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 m-0">
                  Want to connect directly?
                </h4>
                <p className="text-[11px] text-slate-600 m-0 mt-0.5">
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
