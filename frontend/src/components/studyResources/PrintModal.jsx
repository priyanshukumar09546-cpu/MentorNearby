// ============================================================
// components/studyResources/PrintModal.jsx
// Professional Print My Notes Modal with "Coming Soon" Partner Architecture
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom';

const PRINTING_PARTNERS = [
  {
    name: 'Blinkit',
    service: 'Printing & 10-Min Doorstep Delivery',
    status: 'COMING_SOON',
    statusLabel: 'Coming Soon',
    icon: '⚡',
    theme: {
      bg: '#FEF9C3',
      color: '#854D0E',
      badgeBg: '#FEF08A',
      iconBg: '#FEF08A',
    },
    description: 'High-speed document printing with instant doorstep delivery across major metro areas.',
  },
  {
    name: 'Zepto',
    service: 'Quick Printing & Delivery',
    status: 'COMING_SOON',
    statusLabel: 'Coming Soon',
    icon: '🛵',
    theme: {
      bg: '#F5F3FF',
      color: '#6D28D9',
      badgeBg: '#EDE9FE',
      iconBg: '#EDE9FE',
    },
    description: 'Crisp color or black-and-white spiral prints delivered right to your study desk.',
  },
  {
    name: 'Nearby Print Store',
    service: 'Local Xerox & Binding Hubs',
    status: 'COMING_SOON',
    statusLabel: 'Coming Soon',
    icon: '🏪',
    theme: {
      bg: '#EFF6FF',
      color: '#1E40AF',
      badgeBg: '#DBEAFE',
      iconBg: '#DBEAFE',
    },
    description: 'Pickup or direct delivery from verified local stationery and print stores near your pincode.',
  },
];

const PrintModal = ({ isOpen, onClose, resourceTitle }) => {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            position: 'relative',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#2563EB', padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, marginBottom: 8 }}>
            <span>🖨️</span>
            <span>PRINT YOUR NOTES</span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '4px 0 2px' }}>
            Want a physical copy of your notes?
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Get your formula sheets and important Q&amp;A printed and delivered to your doorstep.
          </p>

          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: 16,
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Selected Document Info */}
          {resourceTitle && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: 20 }}>📄</span>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Target Document
                </span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  {resourceTitle}
                </div>
              </div>
            </div>
          )}

          {/* Coming Soon Alert Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px solid #FCD34D',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: 22 }}>🚀</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#78350F' }}>
                Printing Partnerships Coming Soon
              </div>
              <div style={{ fontSize: 11.5, color: '#92400E', lineHeight: 1.4 }}>
                We are actively integrating with top quick-commerce &amp; printing services.
              </div>
            </div>
          </div>

          {/* Partner Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRINTING_PARTNERS.map((partner) => (
              <div
                key={partner.name}
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: partner.theme.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {partner.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                        {partner.name}
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B' }}>
                        • {partner.service}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0', lineHeight: 1.35 }}>
                      {partner.description}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    background: partner.theme.badgeBg,
                    color: partner.theme.color,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🚀 {partner.statusLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Informational Footer Note */}
          <p
            style={{
              fontSize: 12,
              color: '#64748B',
              textAlign: 'center',
              margin: '18px 0 0',
              lineHeight: 1.5,
            }}
          >
            Printing partnerships will be available soon. In the meantime, you can download your purchased/free PDF and print it locally.
          </p>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PrintModal;
