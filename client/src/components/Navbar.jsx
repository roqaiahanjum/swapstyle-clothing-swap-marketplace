import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, LogOut, User, Menu, X, PlusCircle, MessageSquare, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useSocket();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = (n) => {
    markAsRead(n._id);
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <nav className="glass-header" style={{ height: '70px', display: 'flex', alignItems: 'center' }}>
      <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            SwapStyle
          </span>
        </Link>

        {/* Desktop Menu */}
        <div style={{ display: 'none', md: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-nav">
          <Link to="/listings" style={navLinkStyle}>Browse</Link>
          {user && (
            <>
              <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
              <Link to="/swaps" style={navLinkStyle}>My Swaps</Link>
              <Link to="/listings/create" style={{ ...navLinkStyle, display: 'flex', alignItems: 'center', gap: '4px', color: '#FFF' }}>
                <PlusCircle size={16} color="var(--primary)" /> List Item
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ ...navLinkStyle, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={16} /> Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Desktop Right Hand Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={iconButtonStyle}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div style={notificationDropdownStyle}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              ...notificationItemStyle,
                              backgroundColor: n.read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                              borderLeft: n.read ? 'none' : '3px solid var(--primary)'
                            }}
                          >
                            <div style={{ fontSize: '0.85rem', color: '#FFF', marginBottom: '4px' }}>{n.text}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Link */}
              <Link to="/profile" style={iconButtonStyle} title="My Profile">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'https://swapstyle-clothing-swap-marketplace.onrender.com'}${user.profilePicture}`}
                    alt={user.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                  />
                ) : (
                  <User size={20} />
                )}
              </Link>

              {/* Logout */}
              <button onClick={handleLogout} style={iconButtonStyle} title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn-secondary-custom" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Login
              </Link>
              <Link to="/register" className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} style={mobileToggleStyle}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div style={mobileDrawerStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
            <Link to="/listings" style={mobileNavLinkStyle} onClick={() => setIsOpen(false)}>Browse Listings</Link>
            {user && (
              <>
                <Link to="/dashboard" style={mobileNavLinkStyle} onClick={() => setIsOpen(false)}>Dashboard</Link>
                <Link to="/swaps" style={mobileNavLinkStyle} onClick={() => setIsOpen(false)}>My Swaps</Link>
                <Link to="/listings/create" style={mobileNavLinkStyle} onClick={() => setIsOpen(false)}>List Clothing Item</Link>
                <Link to="/profile" style={mobileNavLinkStyle} onClick={() => setIsOpen(false)}>Edit Profile</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" style={{ ...mobileNavLinkStyle, color: 'var(--warning)' }} onClick={() => setIsOpen(false)}>Admin Console</Link>
                )}
                <button onClick={() => { setIsOpen(false); handleLogout(); }} style={{ ...mobileNavLinkStyle, background: 'none', border: 'none', textAlign: 'left', color: 'var(--danger)' }}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Inline styles for elements
const navLinkStyle = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: '500',
  transition: 'var(--transition-smooth)'
};

const iconButtonStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
  color: 'white',
  padding: '8px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'var(--transition-smooth)'
};

const mobileToggleStyle = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  padding: '4px'
};

const notificationDropdownStyle = {
  position: 'absolute',
  top: '45px',
  right: '0',
  width: '320px',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
  zIndex: 1100,
  overflow: 'hidden'
};

const notificationItemStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  cursor: 'pointer',
  transition: 'var(--transition-smooth)'
};

const mobileDrawerStyle = {
  position: 'fixed',
  top: '70px',
  left: 0,
  right: 0,
  backgroundColor: 'var(--bg-card)',
  borderBottom: '1px solid var(--border-color)',
  zIndex: 999
};

const mobileNavLinkStyle = {
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: '1.1rem',
  fontWeight: '500'
};
