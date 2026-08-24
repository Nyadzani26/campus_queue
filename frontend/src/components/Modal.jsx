// frontend/src/components/Modal.jsx
import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  children,
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmColor = '#003366',
  loading = false,
  type = 'confirm'
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={type === 'alert' ? null : onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={styles.title}>{title}</h3>}
        {message && <p style={styles.message}>{message}</p>}
        
        {children ? (
          children
        ) : (
          <div style={styles.actions}>
            {type === 'confirm' && (
              <button 
                onClick={onClose} 
                style={styles.cancelBtn}
                disabled={loading}
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm} 
              style={{
                ...styles.confirmBtn,
                backgroundColor: confirmColor,
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: 'white',
    padding: '24px 28px',
    borderRadius: '14px',
    maxWidth: '480px',
    width: '90%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    border: '1px solid #e2e8f0',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#003366',
    fontSize: '1.25rem',
    fontWeight: '800',
  },
  message: {
    margin: '0 0 20px 0',
    color: '#64748b',
    fontSize: '0.98rem',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '700',
  },
  confirmBtn: {
    padding: '10px 22px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '700',
  },
};

export default Modal;