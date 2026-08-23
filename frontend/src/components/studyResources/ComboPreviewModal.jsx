// ============================================================
// components/studyResources/ComboPreviewModal.jsx
// Centered Viewport Modal for Dynamic Combo Package Previews
// Dynamically renders included chapters from the database
// ============================================================

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const ComboPreviewModal = ({
  isOpen,
  onClose,
  combo,
  allResources = [],
  onBuyCombo,
  onViewIncludedResources,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !combo) return null;

  const isFormula = combo.resourceType === 'FORMULA_SHEET' || combo.type === 'FORMULA';
  const classLevel = String(combo.classLevel || '9');
  const subject = combo.subject || 'Mathematics';

  // Dynamically extract included chapters from actual database resources
  const includedResources = allResources.filter((r) => {
    const matchClass = String(r.classLevel) === classLevel;
    const matchSubject = r.subject?.toLowerCase() === subject.toLowerCase();
    const matchType = isFormula
      ? r.resourceType === 'FORMULA_SHEET'
      : r.resourceType === 'NOTES' || r.resourceType === 'IMPORTANT_QUESTIONS_ANSWERS' || r.resourceType === 'REVISION_NOTES';
    return matchClass && matchSubject && matchType;
  });

  const modalContent = (
    <div
      className="sr-payment-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        margin: 0,
      }}
    >
      <div
        className="sr-payment-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface, #FFFFFF)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--text-primary, #0F172A)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border-color, #E2E8F0)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: isFormula ? '#F3E8FF' : '#DCFCE7',
                color: isFormula ? '#7C3AED' : '#15803D',
                marginBottom: 6,
              }}
            >
              {isFormula ? '📐 Formula Sheets Combo' : '📚 Notes Combo'}
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
              {combo.title || combo.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Pricing Banner */}
        <div
          style={{
            background: 'var(--bg-card, #F8FAFC)',
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748B)' }}>
              Complete {subject} Pack • Class {classLevel}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>
              ✓ Includes all available {isFormula ? 'Formula Sheets' : 'Chapter Notes'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#EA580C' }}>
              ₹{combo.price}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through' }}>
              ₹{isFormula ? (['11', '12'].includes(classLevel) ? 256 : 168) : (['11', '12'].includes(classLevel) ? 448 : 288)}
            </div>
          </div>
        </div>

        {/* Included Resources List */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary, #0F172A)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Included Chapter Resources ({includedResources.length})</span>
            <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>✓ All Unlocked on Purchase</span>
          </div>

          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: 8,
              padding: '8px 12px',
              background: 'var(--surface, #FFFFFF)',
            }}
          >
            {includedResources.length > 0 ? (
              includedResources.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: idx < includedResources.length - 1 ? '1px solid var(--border-color, #F1F5F9)' : 'none',
                    fontSize: 12,
                    color: 'var(--text-primary, #1E293B)',
                  }}
                >
                  <span style={{ color: '#16A34A', fontWeight: 900 }}>✓</span>
                  <span style={{ fontWeight: 600 }}>{item.title || `${item.chapter} – ${item.chapterTitle}`}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', padding: '12px 0', textAlign: 'center' }}>
                All official Class {classLevel} {subject} {isFormula ? 'Formula Sheets' : 'Notes'} from Chapter 1 to Final Chapter.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              if (onViewIncludedResources) onViewIncludedResources(combo);
              onClose();
            }}
            style={{
              flex: 1,
              height: 40,
              background: 'var(--surface, #FFFFFF)',
              border: '1px solid var(--border-color, #CBD5E1)',
              color: 'var(--text-primary, #0F172A)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            View Included Resources
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onBuyCombo) onBuyCombo(combo);
            }}
            style={{
              flex: 1.2,
              height: 40,
              background: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            Buy Combo – ₹{combo.price}
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', textAlign: 'center' }}>
          🛡️ Secure 256-bit Encrypted Payment • Instant PDF Download Access
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ComboPreviewModal;
