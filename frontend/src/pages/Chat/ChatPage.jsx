// ============================================================
// pages/Chat/ChatPage.jsx
// Responsive WhatsApp-style Chat UI for Mobile & Desktop
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { getSubscriptionStatus } from '../../api/subscription';
import { useToast } from '../../context/ToastContext';
import PaywallModal from '../../components/subscription/PaywallModal';

const ChatPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const recipientId = searchParams.get('recipient') || searchParams.get('recipientId') || searchParams.get('userId');
  const conversationId = searchParams.get('conversation') || searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Subscription / paywall state
  const [subStatus, setSubStatus] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallData, setPaywallData] = useState({ plan: 99, planType: 'student' });

  const messagesEndRef = useRef(null);

  // ── Fetch conversations + subscription status ────────────
  const fetchConversations = useCallback(async () => {
    try {
      const response = await client.get('/chat');
      const data = response.data?.data || {};
      setConversations(data.data || []);
      if (data.subscription) setSubStatus(data.subscription);
    } catch (err) {
      // ignore silently
    } finally {
      setLoadingConv(false);
    }
  }, []);

  // Also pull subscription status on mount
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

  // ── Handle URL recipient query parameter ──────────────────
  useEffect(() => {
    if (!recipientId) return;

    const matched = conversations.find(
      (c) => String(c.otherUser?._id) === String(recipientId) || String(c._id) === String(conversationId)
    );

    if (matched) {
      setActiveConversation(matched);
    } else {
      const loadRecipient = async () => {
        try {
          let name = 'Teacher';
          let avatar = '';
          let role = 'TUTOR';

          try {
            const userRes = await client.get(`/users/${recipientId}`);
            if (userRes.data?.data?.user) {
              name = userRes.data.data.user.name;
              avatar = userRes.data.data.user.avatar;
              role = userRes.data.data.user.role;
            }
          } catch (_) {
            try {
              const tutorRes = await client.get(`/tutors/${recipientId}`);
              const tData = tutorRes.data?.data?.tutorProfile || tutorRes.data?.data;
              if (tData) {
                name = tData.name || tData.user?.name || 'Teacher';
                avatar = tData.profilePhoto?.url || tData.user?.avatar || '';
              }
            } catch (__) {}
          }

          const placeholderConv = {
            _id: conversationId || `conv_${recipientId}`,
            otherUser: {
              _id: recipientId,
              name,
              avatar,
              role,
            },
            lastMessage: null,
          };

          setActiveConversation(placeholderConv);
          setConversations((prev) => {
            if (prev.some((c) => String(c.otherUser?._id) === String(recipientId))) {
              return prev;
            }
            return [placeholderConv, ...prev];
          });
        } catch (e) {
          console.warn('Could not auto-open recipient:', e);
        }
      };

      loadRecipient();
    }
  }, [recipientId, conversationId, conversations]);

  // ── Fetch messages for active conversation ───────────────
  useEffect(() => {
    if (!activeConversation) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await client.get(`/chat/${activeConversation.otherUser?._id}`);
        setMessages(response.data?.data?.data || []);
      } catch (err) {
        showToast('Failed to load messages', 'error');
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeConversation, showToast]);

  // ── Auto scroll ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    const receiverId = activeConversation.otherUser?._id;
    setSending(true);

    try {
      const response = await client.post(`/chat/${receiverId}`, {
        content: newMessage.trim(),
      });

      const msgData = response.data?.data;
      if (msgData?.message) {
        setMessages((prev) => [...prev, msgData.message]);
      }

      // Show filter warning if message was modified
      if (msgData?.wasFiltered) {
        showToast('⚠️ Phone / email filter kar diya gaya (Direct calls ke liye Contact Unlock karein)', 'warning');
      }

      setNewMessage('');

      // Refresh subscription status after send
      if (msgData) {
        setSubStatus((prev) => ({
          ...prev,
          freeChatsUsed: msgData.freeChatsUsed ?? prev?.freeChatsUsed,
          chatsRemaining: prev?.freeChatsLimit
            ? Math.max(0, prev.freeChatsLimit - (msgData.freeChatsUsed ?? prev?.freeChatsUsed ?? 0))
            : null,
        }));
      }
    } catch (err) {
      const errData = err.response?.data;
      if (err.response?.status === 403 && (errData?.needSubscription || errData?.paywall)) {
        setPaywallData({
          plan: errData.plan || (user?.role === 'TUTOR' ? 149 : 99),
          planType: errData.planType || (user?.role === 'TUTOR' ? 'teacher' : 'student'),
        });
        setPaywallOpen(true);
      } else {
        showToast(errData?.message || 'Failed to send message', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  // ── Paywall success → refresh status ────────────────────
  const handleSubscriptionSuccess = () => {
    showToast('🎉 Subscription activated! Ab unlimited chats karo!', 'success');
    fetchSubStatus();
    fetchConversations();
  };

  // ── UI Helpers ───────────────────────────────────────────
  const isSubscribed = Boolean(
    subStatus?.isSubscribed || (user?.isSubscribed && new Date(user.subscriptionExpiry) > new Date())
  );
  const freeLimit = subStatus?.freeChatsLimit ?? (user?.role === 'TUTOR' ? 5 : 3);
  const chatsUsed = subStatus?.freeChatsUsed ?? (user?.freeChatsUsed || 0);
  const chatsRemaining = isSubscribed ? null : Math.max(0, freeLimit - chatsUsed);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8faff] overflow-hidden">
      
      {/* ── LEFT PANEL: Conversation List (Full width on mobile when no chat selected, hidden on mobile when chat open) ── */}
      <div
        className={`
          w-full md:w-[360px] lg:w-[380px] bg-white border-r border-gray-200 flex-col flex-shrink-0
          ${activeConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-gray-900">Messages</h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isSubscribed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : chatsRemaining === 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isSubscribed ? '✨ Subscribed' : `💬 Free left: ${chatsRemaining}/${freeLimit}`}
            </span>
          </div>

          {!isSubscribed && chatsRemaining !== null && chatsRemaining <= 1 && (
            <button
              onClick={() => navigate('/subscription')}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              🚀 Upgrade Plan — ₹99/mo (5 Unlocks)
            </button>
          )}
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingConv ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm space-y-2">
              <span className="text-4xl block">💬</span>
              <p className="font-semibold text-gray-700">No messages yet</p>
              <p className="text-xs text-gray-500">Find a tutor and click "Message Tutor" to start chatting!</p>
              <button
                onClick={() => navigate('/search')}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Find Tutors Near Me
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeConversation?.otherUser?._id === other?._id;
              return (
                <div
                  key={other?._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-4 flex items-center gap-3.5 cursor-pointer transition ${
                    isActive ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center flex-shrink-0 text-base overflow-hidden">
                    {other?.avatar ? (
                      <img src={other.avatar} alt={other?.name} className="w-full h-full object-cover" />
                    ) : (
                      other?.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-gray-900 truncate">{other?.name || 'Tutor'}</p>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat Window (Full width on mobile when chat selected, hidden when no chat selected on mobile) ── */}
      <div
        className={`
          flex-1 flex-col bg-[#f8faff] min-w-0 h-full
          ${!activeConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {activeConversation ? (
          <>
            {/* Active Chat Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-xs sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-800 font-bold transition flex-shrink-0 cursor-pointer"
                  title="Back to conversations"
                >
                  ←
                </button>

                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {activeConversation.otherUser?.avatar ? (
                    <img
                      src={activeConversation.otherUser.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeConversation.otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-gray-900 truncate">
                    {activeConversation.otherUser?.name || 'Teacher'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Verified Tutor
                  </p>
                </div>
              </div>

              {/* Quick Contact Unlock / Call Button */}
              <button
                type="button"
                onClick={() => navigate(`/teacher/${activeConversation.otherUser?._id}`)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
              >
                👤 View Profile
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
              {loadingMessages ? (
                <div className="text-center text-gray-400 text-xs py-8">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 space-y-2">
                  <span className="text-4xl">👋</span>
                  <p className="font-bold text-gray-800 text-base">Say hello to start the conversation!</p>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Discuss learning requirements, subjects, timing, and fee directly.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender) === String(user?._id);
                  return (
                    <div
                      key={msg._id || msg.createdAt}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <span
                          className={`text-[10px] mt-1 block ${
                            isMine ? 'text-blue-200 text-right' : 'text-gray-400 text-left'
                          }`}
                        >
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box - Sticky at Bottom */}
            <div className="bg-white p-3 sm:p-4 border-t border-gray-200 sticky bottom-0 z-10 shadow-md">
              {!isSubscribed && chatsRemaining === 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-2.5 flex items-center justify-between text-xs text-rose-800 font-semibold">
                  <span>🔒 Free chat quota reached! Unlock unlimited chats.</span>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription')}
                    className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Subscribe
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    !isSubscribed && chatsRemaining === 0
                      ? '🔒 Subscribe to send more messages'
                      : 'Type a message...'
                  }
                  disabled={!isSubscribed && chatsRemaining === 0}
                  className="flex-1 bg-gray-100 hover:bg-gray-50 focus:bg-white text-gray-900 border border-gray-200 focus:border-blue-500 rounded-full px-4 py-3 text-sm outline-none transition disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || (!isSubscribed && chatsRemaining === 0)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm transition cursor-pointer border-none"
                  aria-label="Send message"
                >
                  {sending ? '...' : '➤'}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Desktop Empty State (when no conversation is selected) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4 shadow-xs">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-800">Select a Conversation</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              Choose a tutor from the left panel to start chatting directly without middleman brokerage.
            </p>
          </div>
        )}
      </div>

      {/* ── PAYWALL MODAL ────────────────────────────────── */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        planType={paywallData.planType}
        planPrice={paywallData.plan}
        onSuccess={handleSubscriptionSuccess}
        user={user}
      />
    </div>
  );
};

export default ChatPage;
