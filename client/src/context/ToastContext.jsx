import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import API from '../api';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Block showing token expiry details but catch deactivation alerts
          if (error.response.status === 401) {
            if (error.response.data?.message?.toLowerCase().includes('deactivated')) {
              showToast(error.response.data.message, 'error');
            }
          } else {
            showToast(error.response.data?.message || 'API request failed.', 'error');
          }
        } else {
          showToast('Network error, please check connection.', 'error');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container Overlay */}
      <div style={containerStyle}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...toastStyle,
              borderLeft: `4px solid ${
                toast.type === 'success'
                  ? 'var(--success)'
                  : toast.type === 'warning'
                  ? 'var(--warning)'
                  : 'var(--danger)'
              }`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              {toast.type === 'success' ? (
                <CheckCircle size={18} color="var(--success)" />
              ) : toast.type === 'warning' ? (
                <Info size={18} color="var(--warning)" />
              ) : (
                <AlertCircle size={18} color="var(--danger)" />
              )}
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={closeButtonStyle}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// Styling
const containerStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  zIndex: 3000,
  maxWidth: '360px',
  width: '100%'
};

const toastStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  padding: '14px 16px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  pointerEvents: 'auto'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '2px',
  display: 'flex',
  alignItems: 'center'
};

// CSS Keyframes are injected in index.css for slide-in transition:
// @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
