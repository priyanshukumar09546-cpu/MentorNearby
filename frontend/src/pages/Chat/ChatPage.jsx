import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ChatPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await client.get('/chat/conversations');
        setConversations(response.data.data.conversations || []);
      } catch (err) {
        // Handle error gracefully
      } finally {
        setLoadingConv(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
          const response = await client.get(`/chat/${activeConversation._id}`);
          setMessages(response.data.data.messages || []);
        } catch (err) {
          showToast('Failed to load messages', 'error');
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
    }
  }, [activeConversation, showToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const recipient = activeConversation.participants.find(p => p._id !== user._id);
    
    try {
      const response = await client.post('/chat/send', {
        receiverId: recipient._id,
        content: newMessage
      });
      setMessages([...messages, response.data.data.message]);
      setNewMessage('');
    } catch (err) {
      showToast('Failed to send message', 'error');
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p._id !== user._id);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex">
      {/* Sidebar - Conversations list */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col max-w-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            conversations.map(conv => {
              const otherUser = getOtherParticipant(conv);
              return (
                <div 
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${activeConversation?._id === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {otherUser?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{otherUser?.name}</h3>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {conv.lastMessage?.content || 'New conversation'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main - Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {getOtherParticipant(activeConversation)?.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{getOtherParticipant(activeConversation)?.name}</h3>
                <span className="text-xs text-green-500 font-medium">Available</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-gray-500 py-4">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Say hello to start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        <p>{msg.content}</p>
                        <span className={`text-[10px] mt-1 block ${isMine ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white rounded-full p-2 px-6 font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xl font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
