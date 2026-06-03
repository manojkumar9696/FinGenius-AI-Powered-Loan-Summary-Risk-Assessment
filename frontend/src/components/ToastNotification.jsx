import React from 'react';
import { useToast } from '../context/ToastContext';

const ToastNotification = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((toast) => {
        let typeStyles = styles.info;
        let icon = 'ℹ️';

        if (toast.type === 'success') {
          typeStyles = styles.success;
          icon = '✅';
        } else if (toast.type === 'danger' || toast.type === 'error') {
          typeStyles = styles.danger;
          icon = '❌';
        } else if (toast.type === 'warning') {
          typeStyles = styles.warning;
          icon = '⚠️';
        }

        return (
          <div key={toast.id} style={{ ...styles.toast, ...typeStyles }} className="glass-panel">
            <div style={styles.content}>
              <span style={styles.icon}>{icon}</span>
              <span style={styles.message}>{toast.message}</span>
              <button style={styles.closeBtn} onClick={() => removeToast(toast.id)}>✕</button>
            </div>
            <div style={{ ...styles.progressBar, ...typeStyles.progressBg }} className="toast-progress-bar" />
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '320px',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    position: 'relative',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(14, 19, 34, 0.9)',
    borderLeft: '4px solid #3B82F6',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  icon: {
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#F3F4F6',
    flexGrow: 1,
    textAlign: 'left',
    lineHeight: '1.4',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    width: '100%',
    animation: 'shrinkProgress 4s linear forwards',
  },
  // Type-specific styling tokens
  success: {
    borderLeftColor: '#10B981',
    progressBg: {
      backgroundColor: '#10B981',
    }
  },
  danger: {
    borderLeftColor: '#EF4444',
    progressBg: {
      backgroundColor: '#EF4444',
    }
  },
  warning: {
    borderLeftColor: '#F59E0B',
    progressBg: {
      backgroundColor: '#F59E0B',
    }
  },
  info: {
    borderLeftColor: '#06B6D4',
    progressBg: {
      backgroundColor: '#06B6D4',
    }
  }
};

export default ToastNotification;
