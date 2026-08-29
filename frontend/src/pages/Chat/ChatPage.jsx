// ============================================================
// pages/Chat/ChatPage.jsx
// Chat UI with freemium counter + PaywallModal + message filter
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { getSubscriptionStatus } from '../../api/subscription';
import { useToast } from '../../context/ToastContext';
import PaywallModal from '../../components/subscription/PaywallModal';

const ChatPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

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
        showToast('⚠️ Kuch information filter kar di gayi (phone/email/address blocked)', 'warning');
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
      if (err.response?.status === 403 && errData?.paywall) {
        // Show paywall modal
        setPaywallData({ plan: errData.plan || 99, planType: errData.planType || 'student' });
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
  const isSubscribed = subStatus?.isSubscribed;
  const freeLimit = subStatus?.freeChatsLimit ?? (user?.role === 'TUTOR' ? 5 : 3);
  const chatsUsed = subStatus?.freeChatsUsed ?? 0;
  const chatsRemaining = isSubscribed ? null : Math.max(0, freeLimit - chatsUsed);

  const counterColor = () => {
    if (isSubscribed) return '#16A34A';
    if (chatsRemaining === 0) return '#DC2626';
    if (chatsRemaining === 1) return '#D97706';
    return '#2563EB';
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#F1F5F9' }}>
      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <div
        style={{
          width: 300,
          minWidth: 250,
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Messages</h2>

          {/* Chat counter pill */}
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: isSubscribed ? '#DCFCE7' : chatsRemaining === 0 ? '#FEE2E2' : '#EFF6FF',
              border: `1px solid ${counterColor()}33`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: counterColor(),
            }}
          >
            {isSubscribed ? (
              <>✅ Subscribed — Unlimited Chats</>
            ) : (
              <>
                💬 Free {user?.role === 'TUTOR' ? 'leads' : 'chats'} left:{' '}
                {chatsRemaining}/{freeLimit}
              </>
            )}
          </div>

          {/* Upgrade link if near limit */}
          {!isSubscribed && chatsRemaining !== null && chatsRemaining <= 1 && (
            <button
              onClick={() => {
                setPaywallData({
                  plan: user?.role === 'TUTOR' ? 149 : 99,
                  planType: user?.role === 'TUTOR' ? 'teacher' : 'student',
                });
                setPaywallOpen(true);
              }}
              style={{
                marginTop: 8,
                display: 'block',
                width: '100%',
                padding: '7px',
                background: '#2563EB',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🚀 Subscribe now — ₹{user?.role === 'TUTOR' ? 149 : 99}/mo
            </button>
          )}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConv ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeConversation?.otherUser?._id === other?._id;
              return (
                <div
                  key={other?._id}
                  onClick={() => setActiveConversation(conv)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: isActive ? '#EFF6FF' : '#FFF',
                    borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: '#DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#1D4ED8',
                        fontSize: 15,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {other?.avatar ? (
                        <img src={other.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        other?.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {other?.name || 'Unknown'}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: '14px 20px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#1D4ED8',
                  fontSize: 15,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {activeConversation.otherUser?.avatar ? (
                  <img src={activeConversation.otherUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  activeConversation.otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#0F172A' }}>
                  {activeConversation.otherUser?.name || 'Unknown'}
                </p>
                <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>● Online</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 20 }}>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 40 }}>
                  👋 Say hello to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender) === String(user?._id);
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          maxWidth: '68%',
                          background: isMine ? '#2563EB' : '#FFFFFF',
                          color: isMine ? '#FFF' : '#1E293B',
                          border: isMine ? 'none' : '1px solid #E2E8F0',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '10px 14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{msg.content}</p>
                        <span style={{ fontSize: 10, marginTop: 4, display: 'block', color: isMine ? '#BFDBFE' : '#94A3B8', textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ padding: '14px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
              {/* Warning banner if at limit and not subscribed */}
              {!isSubscribed && chatsRemaining === 0 && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '8px 14px',
                    marginBottom: 10,
                    fontSize: 12,
                    color: '#991B1B',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>🔒 Free chats khatam! Subscribe to continue</span>
                  <button
                    onClick={() => {
                      setPaywallData({ plan: user?.role === 'TUTOR' ? 149 : 99, planType: user?.role === 'TUTOR' ? 'teacher' : 'student' });
                      setPaywallOpen(true);
                    }}
                    style={{
                      background: '#DC2626',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    !isSubscribed && chatsRemaining === 0
                      ? '🔒 Subscribe to send more messages'
                      : 'Type a message... (phone/email/address blocked)'
                  }
                  disabled={!isSubscribed && chatsRemaining === 0}
                  style={{
                    flex: 1,
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 24,
                    padding: '10px 18px',
                    fontSize: 13.5,
                    outline: 'none',
                    background: !isSubscribed && chatsRemaining === 0 ? '#F8FAFC' : '#FFF',
                    color: '#1E293B',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || (!isSubscribed && chatsRemaining === 0)}
                  style={{
                    background: sending ? '#93C5FD' : '#2563EB',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 24,
                    padding: '10px 22px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: (!newMessage.trim() || sending || (!isSubscribed && chatsRemaining === 0)) ? 0.6 : 1,
                  }}
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Select a conversation</p>
            <p style={{ fontSize: 13, margin: '6px 0 0' }}>Choose a chat from the left to start messaging</p>
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
