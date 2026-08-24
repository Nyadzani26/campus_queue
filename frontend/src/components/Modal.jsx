// frontend/src/components/Modal.jsx
import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmColor = '#1a73e8',
  loading = false,
  type = 'confirm' // 'confirm' or 'alert'
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={type === 'alert' ? null : onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        
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
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px 35px',
    borderRadius: '8px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  message: {
    margin: '0 0 25px 0',
    color: '#555',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  confirmBtn: {
    padding: '10px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default Modal;