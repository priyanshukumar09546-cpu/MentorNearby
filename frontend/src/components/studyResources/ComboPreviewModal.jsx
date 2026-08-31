// ============================================================
// components/studyResources/ComboPreviewModal.jsx
// Centered Viewport Modal for Dynamic Combo Package Previews
// Dynamically renders included chapters from the catalog/database
// Supports individual chapter previews & direct combo unlocks
// ============================================================

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const ComboPreviewModal = ({
  isOpen,
  onClose,
  combo,
  allResources = [],
  onBuyCombo,
  onViewPdf,
  onViewIncludedResources,
  isUnlocked = false,
}) => {
  const [downloadingAll, setDownloadingAll] = useState(false);

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

  const isFormula = combo.resourceType === 'FORMULA_SHEET' || combo.type === 'FORMULA' || combo.comboType === 'FORMULA_COMBO';
  const classLevel = String(combo.classLevel || '9');
  const subject = combo.subject || 'Mathematics';

  // Dynamically extract included chapters from catalog/database
  const includedResources = allResources.filter((r) => {
    const matchClass = String(r.classLevel) === classLevel;
    const matchSubject = r.subject?.toLowerCase() === subject.toLowerCase();
    const matchType = isFormula
      ? r.resourceType === 'FORMULA_SHEET'
      : r.resourceType === 'NOTES' || r.resourceType === 'IMPORTANT_QUESTIONS_ANSWERS' || r.resourceType === 'REVISION_NOTES';
    return matchClass && matchSubject && matchType;
  });

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      if (includedResources.length > 0) {
        for (let i = 0; i < includedResources.length; i++) {
          const item = includedResources[i];
          const targetUrl = item.fileUrl || item.fileReference?.url || `/api/study-resources/stream/${item.id || item._id}?download=true`;
          const cleanTitle = (item.title || `${item.chapter}_${item.chapterTitle}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = item.fileName || `MentorNearby_Class_${classLevel}_${subject}_${cleanTitle}.pdf`;

          const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
            ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
            : (typeof window !== 'undefined' ? window.location.origin : 'https://api.mentornearby.com');
          const streamUrl = targetUrl.startsWith('http') ? targetUrl : `${backendBase}${targetUrl}`;

          const link = document.createElement('a');
          link.href = streamUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Small stagger delay for browser download queue
          await new Promise((res) => setTimeout(res, 400));
        }
      }
    } catch (err) {
      console.error('Error initiating batch downloads:', err);
    } finally {
      setDownloadingAll(false);
    }
  };

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
          width: '92%',
          maxWidth: 520,
          maxHeight: '90vh',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--modal-bg, #FFFFFF)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--text-primary, #0F172A)',
          position: 'relative',
          border: '1px solid var(--border-color, #E2E8F0)',
        }}
      >
        {/* Fixed Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface, #FFFFFF)',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: isFormula ? '#F3E8FF' : '#DCFCE7',
                color: isFormula ? '#7C3AED' : '#15803D',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isFormula ? '📐 Formula Sheets Combo' : '📚 Notes Combo'}
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
              {combo.title || combo.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-card, #F1F5F9)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: 16,
              color: 'var(--text-muted, #64748B)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', WebkitOverflowScrolling: 'touch' }}>
          {/* Pricing Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.03) 100%)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1E293B)' }}>
                Complete {subject} Pack • Class {classLevel}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#16A34A', marginTop: 3 }}>
                ✓ Includes all {includedResources.length || 'official'} Chapter {isFormula ? 'Formula Sheets' : 'Notes'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#EA580C', lineHeight: 1.1 }}>
                ₹{combo.price}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted, #94A3B8)', textDecoration: 'line-through', marginTop: 2 }}>
                ₹{isFormula ? (['11', '12'].includes(classLevel) ? 256 : 168) : (['11', '12'].includes(classLevel) ? 448 : 288)}
              </div>
            </div>
          </div>

          {/* Included Resources List */}
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: 'var(--text-primary, #0F172A)',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Included Chapter PDFs ({includedResources.length})</span>
              <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>
                {isUnlocked ? '✓ Unlocked' : '✓ Preview Mode Active'}
              </span>
            </div>

            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: 10,
                padding: '6px 10px',
                background: 'var(--surface, #FFFFFF)',
              }}
            >
              {includedResources.length > 0 ? (
                includedResources.map((item, idx) => (
                  <div
                    key={item.id || item._id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 4px',
                      borderBottom: idx < includedResources.length - 1 ? '1px solid var(--border-color, #F1F5F9)' : 'none',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>📄</span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary, #1E293B)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.title || `${item.chapter} – ${item.chapterTitle}`}
                        >
                          {item.chapter || `Chapter ${idx + 1}`}: {item.chapterTitle || item.title || 'Key Concepts'}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748B)' }}>
                          PDF • {isFormula ? 'Formula Sheet' : 'Notes'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onViewPdf) {
                          onViewPdf(item);
                        }
                      }}
                      style={{
                        flexShrink: 0,
                        height: 28,
                        padding: '0 10px',
                        background: 'rgba(234, 88, 12, 0.08)',
                        border: '1px solid rgba(234, 88, 12, 0.3)',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#EA580C',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>👁️</span> View PDF
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)', padding: '16px 0', textAlign: 'center' }}>
                  All official Class {classLevel} {subject} {isFormula ? 'Formula Sheets' : 'Notes'} from Chapter 1 to Final Chapter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Footer (BUTTONS ALWAYS VISIBLE!) */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 20px calc(14px + env(safe-area-inset-bottom, 0px)) 20px',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            backgroundColor: 'var(--modal-bg, #FFFFFF)',
            zIndex: 10,
          }}
        >
          {isUnlocked ? (
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                style={{
                  flex: 1,
                  height: 42,
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>⬇️</span> {downloadingAll ? 'Downloading All...' : 'Download All PDFs'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (onViewIncludedResources) onViewIncludedResources(combo);
                  onClose();
                }}
                style={{
                  flex: 1,
                  height: 42,
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
                  flex: 1.3,
                  height: 42,
                  background: '#EA580C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>⚡</span> Pay ₹{combo.price} &amp; Unlock Combo
              </button>
            </div>
          )}

          <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748B)', textAlign: 'center' }}>
            🛡️ Secure 256-bit Encrypted Payment • Instant Lifetime PDF Access
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ComboPreviewModal;
