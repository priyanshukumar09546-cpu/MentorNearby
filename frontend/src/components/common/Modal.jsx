import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        margin: 0,
      }}
    >
      <div className={`modal-content modal-${size}`} ref={modalRef}>
        <div className="modal-header flex justify-between items-center">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
