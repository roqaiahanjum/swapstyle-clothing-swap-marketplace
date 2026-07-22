import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    let activeSocket = null;

    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://swapstyle-clothing-swap-marketplace.onrender.com');
      activeSocket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        withCredentials: true
      });

      activeSocket.on('connect', () => {
        console.log('Socket.io connected:', activeSocket.id);
        activeSocket.emit('registerUser', user.id || user._id);
      });

      // Load initial notifications
      const loadNotifications = async () => {
        try {
          const res = await fetchNotifications();
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      };
      loadNotifications();

      // Listen for real-time notifications
      activeSocket.on('newNotification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      setSocket(activeSocket);
    }

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [user]);

  // Read a single notification
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Read all notifications
  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
