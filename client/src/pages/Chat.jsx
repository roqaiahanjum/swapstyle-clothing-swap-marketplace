import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchSwapById, fetchChatMessages, markChatAsRead } from '../api';
import { Send, ArrowLeft, ArrowRightLeft } from 'lucide-react';

export default function Chat() {
  const { swapRequestId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [swap, setSwap] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  // Load swap details & initial messages
  useEffect(() => {
    const initChat = async () => {
      try {
        const [swapRes, messagesRes] = await Promise.all([
          fetchSwapById(swapRequestId),
          fetchChatMessages(swapRequestId)
        ]);
        setSwap(swapRes.data);
        setMessages(messagesRes.data);

        // Mark messages read on API
        await markChatAsRead(swapRequestId);
      } catch (err) {
        console.error('Error initializing chat room:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initChat();
  }, [swapRequestId]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !user) return;

    // Join room
    socket.emit('joinRoom', {
      swapRequestId,
      userId: user.id || user._id
    });

    // Listen for new messages
    socket.on('newMessage', (msg) => {
      if (msg.swapRequestId === swapRequestId) {
        setMessages((prev) => [...prev, msg]);
        
        // Mark message as read if sender is not current user
        const currentUserId = user.id || user._id;
        if (msg.sender._id !== currentUserId && msg.sender !== currentUserId) {
          socket.emit('joinRoom', { swapRequestId, userId: currentUserId }); // re-trigger read actions
        }
      }
    });

    // Listen for typing indicator status
    socket.on('typingStatus', ({ senderName, isTyping }) => {
      if (isTyping) {
        setTypingUser(senderName);
      } else {
        setTypingUser('');
      }
    });

    // Clean up
    return () => {
      socket.emit('leaveRoom', { swapRequestId });
      socket.off('newMessage');
      socket.off('typingStatus');
    };
  }, [socket, swapRequestId, user]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!socket || !user) return;

    // Handle typing events
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        swapRequestId,
        senderName: user.name,
        isTyping: true
      });
    }

    // Debounce typing end
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        swapRequestId,
        senderName: user.name,
        isTyping: false
      });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !user) return;

    // Cancel typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit('typing', {
      swapRequestId,
      senderName: user.name,
      isTyping: false
    });

    // Emit message
    socket.emit('sendMessage', {
      swapRequestId,
      senderId: user.id || user._id,
      text: text.trim()
    });

    setText('');
  };

  if (loading) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Entering secure negotiation room...
      </div>
    );
  }

  if (!swap) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>Could not access chat room details.</p>
        <button onClick={() => navigate('/swaps')} className="btn-premium">Back to Swaps</button>
      </div>
    );
  }

  const partner = (user.id === swap.fromUser._id || user._id === swap.fromUser._id) ? swap.toUser : swap.fromUser;
  const backendUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com';

  const offeredImg = swap.offeredItem.images && swap.offeredItem.images.length > 0
    ? `${backendUrl}${swap.offeredItem.images[0]}`
    : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300';
  
  const requestedImg = swap.requestedItem.images && swap.requestedItem.images.length > 0
    ? `${backendUrl}${swap.requestedItem.images[0]}`
    : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300';

  return (
    <div className="fadeIn container-custom" style={{ marginTop: '20px' }}>
      
      {/* Back button */}
      <button onClick={() => navigate('/swaps')} style={backButtonStyle}>
        <ArrowLeft size={16} /> Back to My Swaps
      </button>

      {/* Chat Room Layout */}
      <div className="chat-wrapper">
        
        {/* Sidebar: Swap context info */}
        <div className="chat-sidebar" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Swap Details
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {/* Offered item */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img src={offeredImg} alt={swap.offeredItem.title} style={sidebarThumbStyle} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>Offered (From Closet)</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{swap.offeredItem.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Val: {swap.offeredItem.estimatedSwapValue} pts</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <ArrowRightLeft size={18} style={{ transform: 'rotate(90deg)' }} />
            </div>

            {/* Requested item */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img src={requestedImg} alt={swap.requestedItem.title} style={sidebarThumbStyle} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '600' }}>Requested (For Closet)</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{swap.requestedItem.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Val: {swap.requestedItem.estimatedSwapValue} pts</div>
              </div>
            </div>

          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Trade partner: <strong style={{ color: '#FFF' }}>{partner.name}</strong><br />
            Location: {partner.location?.city || 'Unknown'}<br />
            Status: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{swap.status}</span>
          </div>
        </div>

        {/* Main: Messages stream */}
        <div className="chat-main">
          
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {partner.profilePicture ? (
                <img src={`${backendUrl}${partner.profilePicture}`} alt={partner.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {partner.name.charAt(0)}
                </div>
              )}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'white' }}>{partner.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Online Negotiation Active</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px' }}>
                No negotiation messages yet. Start chatting about shipping or local handoff arrangements!
              </div>
            ) : (
              messages.map((msg) => {
                const currentUserId = user.id || user._id;
                const isSentByMe = (msg.sender._id || msg.sender) === currentUserId;

                return (
                  <div
                    key={msg._id}
                    className={`message-bubble ${isSentByMe ? 'message-sent' : 'message-received'}`}
                  >
                    <div>{msg.text}</div>
                    <div style={{ fontSize: '0.65rem', color: isSentByMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator Bubble */}
            {typingUser && (
              <div className="message-bubble message-received" style={{ fontStyle: 'italic', color: 'var(--text-secondary)', padding: '8px 14px' }}>
                {typingUser} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="chat-input-area" style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={text}
              onChange={handleInputChange}
              placeholder="Write a message to negotiate shipping details..."
              className="form-control-custom"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-premium" style={{ padding: '0 20px' }}>
              <Send size={18} /> Send
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}

const backButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.9rem',
  marginBottom: '16px',
  padding: '4px 0'
};

const sidebarThumbStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '6px',
  objectFit: 'cover',
  backgroundColor: '#1E293B',
  border: '1px solid var(--border-color)'
};
