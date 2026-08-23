// ============================================================
// components/studyResources/BookChapterDrawerModal.jsx
// Modal / Drawer for Chapter-Level Navigation and Official Book Sources
// 100% FREE • Direct Official Portal Links • Chapter-Wise Access
// ============================================================

import React from 'react';

const BookChapterDrawerModal = ({ isOpen, onClose, book }) => {
  if (!isOpen || !book) return null;

  const chapters = book.chapters || [];
  const isHindi = book.medium === 'Hindi';
  const boardBadge = book.board === 'UP_BOARD_ENGLISH' ? 'UP Board (EM)' : (book.board === 'UP_BOARD_HINDI' ? 'UP Board (HM)' : book.board);

  // Helper to open link in a secure new tab
  const handleOpenLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (book.officialBookUrl) {
      window.open(book.officialBookUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="sr-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="sr-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {boardBadge}
              </span>
              <span
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {isHindi ? `कक्षा ${book.classLevel}` : `Class ${book.classLevel}`}
              </span>
              <span
                style={{
                  background: '#059669',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {book.medium} Medium
              </span>
              <span
                style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                ⚡ 100% FREE
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px', lineHeight: 1.3 }}>
              {book.title}
            </h2>

            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 10px', lineHeight: 1.4, maxWidth: '580px' }}>
              {book.description}
            </p>

            <div style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏛️ Source:</span>
              <strong style={{ color: '#0F172A' }}>{book.sourceName || 'Official Education Portal'}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#E2E8F0',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#475569',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Complete Book Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#1E40AF', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📚</span>
            <span>Complete Book Available on Official Portal</span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenLink(book.officialBookUrl)}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
          >
            <span>📖</span>
            <span>Read Complete Book (Official Source) ↗</span>
          </button>
        </div>

        {/* Chapter List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              {isHindi ? 'अध्याय सूची (Chapters)' : 'Individual Chapters'} ({chapters.length})
            </h3>
            <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700' }}>
              ✓ All Chapters Free to Read
            </span>
          </div>

          {chapters.map((ch) => (
            <div
              key={ch.id || ch.chapterNumber}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D97706';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '900',
                    flexShrink: 0,
                  }}
                >
                  {ch.chapterNumber}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                    {isHindi ? `अध्याय ${ch.chapterNumber}` : `Chapter ${ch.chapterNumber}`}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={ch.title}
                  >
                    {ch.title}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenLink(ch.officialUrl)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #D97706',
                  color: '#D97706',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#D97706';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#D97706';
                }}
              >
                <span>📖</span>
                <span>{isHindi ? 'अध्याय पढ़ें' : 'Read Chapter'} ↗</span>
              </button>
            </div>
          ))}

          {chapters.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Chapter list loading. Use the <strong>Read Complete Book</strong> button above to open the full official resource.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          <span>🤗 For You, For Free • Official Educational Resources</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 14px',
              fontWeight: '700',
              fontSize: '12px',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookChapterDrawerModal;
