// ============================================================
// components/studyResources/StudyResourceViewerModal.jsx
// MentorNearby Protected Study Resource PDF Reader
// Pure Distraction-Free PDF Document Viewer with Zoom & Watermarks
// 100% Free Online Reading • Protected Paid Downloads • Dynamic Watermarking
// ============================================================

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import ReactDOM from 'react-dom';
import {
  readStudyResourceOnline,
  downloadStudyResourceFile,
  readStudyResourceComboOnline,
  downloadStudyResourceComboFile,
} from '../../api/studyResources';
import { useAuth } from '../../context/AuthContext';
import { detectStudyFileType } from '../../utils/studyResourceAccess';

// ============================================================
// React Error Boundary for Reader Modal
// ============================================================
class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudyResourceViewerModal error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="sr-modal-overlay sr-protected-reader-overlay"
          onClick={this.props.onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 16,
              padding: 32,
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              color: '#F8FAFC',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 44 }}>📖</span>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '14px 0 8px' }}>
              Study Document Viewer
            </h3>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              {this.state.error?.message || 'Unable to open study document. Please retry.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  background: '#4F46E5',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🔄 Retry
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                style={{
                  background: '#334155',
                  color: '#CBD5E1',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper: Mask sensitive student identifier for watermark traceability
const maskIdentifier = (idStr) => {
  if (!idStr) return 'student@mentornearby.in';
  const str = String(idStr);
  if (str.includes('@')) {
    const parts = str.split('@');
    const name = parts[0] || '';
    const domain = parts[1] || 'mentornearby.in';
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (str.length <= 3) return str;
  return `${str.slice(0, 2)}***${str.slice(-1)}`;
};

const StudyResourceViewerModalInner = ({
  isOpen,
  onClose,
  resourceId,
  resource: propResource,
  isCombo: propIsCombo,
  onOpenPaymentModal,
  onBuyDownload,
}) => {
  const authContext = useAuth();
  const user = authContext?.user || null;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resource, setResource] = useState(propResource || null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // Zoom and Dimension state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Moving Watermark Drift & Session ID
  const [watermarkDrift, setWatermarkDrift] = useState({ x: 0, y: 0 });
  const [sessionCode, setSessionCode] = useState('TN-SEC8A1');

  // Screen Visibility, Blur, & Capture Deterrence state
  const [isContentObscured, setIsContentObscured] = useState(false);
  const [protectionToast, setProtectionToast] = useState(null);

  const viewerContainerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const handleOpenPayment = onBuyDownload || onOpenPaymentModal;

  const showSecurityNotice = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setProtectionToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setProtectionToast(null);
    }, 2800);
  }, []);

  // Sync propResource if provided
  useEffect(() => {
    if (propResource) {
      setResource(propResource);
    }
  }, [propResource]);

  // 1. Fetch Protected Resource Metadata & Real File URL
  const loadResourceForReading = useCallback(async () => {
    const idToFetch = resourceId || propResource?._id || propResource?.id;
    if (!idToFetch && !propResource) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);

      const isComboDoc = Boolean(propIsCombo || propResource?.isCombo || propResource?.comboType);

      if (idToFetch) {
        let resData;
        if (isComboDoc) {
          const res = await readStudyResourceComboOnline(idToFetch);
          resData = res.data?.resource || res.data || res;
          resData.isCombo = true;
        } else {
          const res = await readStudyResourceOnline(idToFetch);
          resData = res.data?.resource || res.data || res;
        }

        setResource(resData);

        if (resData?.sessionCode) {
          setSessionCode(resData.sessionCode);
        }
      } else if (propResource) {
        setResource(propResource);
      }
    } catch (err) {
      if (propResource) {
        setResource(propResource);
      } else {
        setErrorMsg(err.response?.data?.message || 'Unable to open study document. Please try again.');
      }
    }
  }, [resourceId, propResource, propIsCombo]);

  useEffect(() => {
    if (isOpen && (resourceId || propResource)) {
      loadResourceForReading();
      setZoomLevel(100);
      setIsContentObscured(false);
    }
  }, [isOpen, resourceId, propResource, loadResourceForReading]);

  // Body Scroll Lock & ESC key handling
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

  // 2. Periodic Moving Watermark Drift (Changes subtly every 4 seconds)
  useEffect(() => {
    if (!isOpen) return;

    const driftInterval = setInterval(() => {
      setWatermarkDrift((prev) => ({
        x: (prev.x + 12) % 60,
        y: (prev.y + 8) % 40,
      }));
    }, 4000);

    return () => clearInterval(driftInterval);
  }, [isOpen]);

  // 3. Resolve target PDF URL and Fetch as Same-Origin Blob
  const rawFileUrl = (resource?.fileReference?.url?.includes('res.cloudinary.com') ? resource.fileReference.url : resource?.fileUrl) || resource?.fileUrl || resource?.fileReference?.url || '';

  const getFullDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
        ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
      return `${backendBase}${url}`;
    }
    return url;
  };

  const streamFileUrl = getFullDocUrl(rawFileUrl) || `/api/study-resources/stream/${resource?._id || resourceId || 'c9-sci-ch1-notes'}`;

  useEffect(() => {
    if (!isOpen) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    let localBlobUrl = null;

    const fetchPdfStream = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const targetUrl = streamFileUrl.startsWith('http') ? streamFileUrl : getFullDocUrl(streamFileUrl);
        const response = await fetch(targetUrl, { credentials: 'include' });

        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status})`);
        }

        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        localBlobUrl = URL.createObjectURL(pdfBlob);

        if (isMounted) {
          setPdfBlobUrl(localBlobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PDF Reader] Fetch as blob failed, using direct stream URL:', err);
        if (isMounted) {
          setPdfBlobUrl(streamFileUrl);
          setLoading(false);
        }
      }
    };

    if (streamFileUrl) {
      fetchPdfStream();
    }

    return () => {
      isMounted = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [isOpen, streamFileUrl]);

  // 4. Download Original Document Handler
  const handleDownload = async () => {
    const resId = resourceId || resource?._id || resource?.id;
    if (!resId) return;

    try {
      setDownloading(true);
      const isComboDoc = Boolean(propIsCombo || resource?.isCombo || resource?.comboType);
      let res;
      if (isComboDoc) {
        res = await downloadStudyResourceComboFile(resId);
      } else {
        res = await downloadStudyResourceFile(resId);
      }

      const downloadUrl = res?.data?.downloadUrl || res?.downloadUrl || res?.fileUrl || `/api/study-resources/stream/${resId}?download=true`;
      const cleanFileName = res?.data?.fileName || res?.fileName || `${(resource?.title || 'MentorNearby_Study_Material').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
        ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
      const streamUrl = downloadUrl.startsWith('http') ? downloadUrl : `${backendBase}${downloadUrl}`;

      const response = await fetch(streamUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to retrieve original PDF file. Please ensure purchase is complete.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Download failed. Please check purchase entitlement.');
    } finally {
      setDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewerContainerRef.current?.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 60));
  const handleZoomReset = () => setZoomLevel(100);

  if (!isOpen) return null;

  // Safe calculated state
  const isUnlocked = Boolean(resource?.isDownloadUnlocked);
  const isFormula = resource?.resourceType === 'FORMULA_SHEET' || resource?.comboType === 'FORMULA_COMBO';
  const isSenior = ['11', '12'].includes(String(resource?.classLevel));
  const isCombo = Boolean(propIsCombo || resource?.isCombo || resource?.comboType);
  const expectedSinglePrice = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
  const expectedComboPrice = isFormula ? (isSenior ? 60 : 50) : (isSenior ? 120 : 100);
  const downloadPrice = isCombo ? expectedComboPrice : expectedSinglePrice;

  const userIdentifier = maskIdentifier(user?.email || user?.name || 'student@mentornearby.in');

  const modalContent = (
    <div
      className="sr-modal-overlay sr-protected-reader-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        margin: 0,
      }}
    >
      {/* Print Restriction CSS */}
      <style>{`
        @media print {
          body * { display: none !important; }
          .sr-protected-reader-modal { display: none !important; }
        }
      `}</style>

      <div
        ref={viewerContainerRef}
        className="sr-modal-content sr-protected-reader-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '92vh',
          background: '#0F172A',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          border: '1px solid #334155',
          position: 'relative',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Security Notification Banner Toast */}
        {protectionToast && (
          <div
            style={{
              position: 'absolute',
              top: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#DC2626',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: 30,
              fontSize: 12.5,
              fontWeight: 700,
              zIndex: 9999,
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'slideDown 0.3s ease',
            }}
          >
            <span>⚠️</span>
            <span>{protectionToast}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MODAL TOP BAR: TITLE, ZOOM, FULLSCREEN & ACTIONS             */}
        {/* ------------------------------------------------------------ */}
        <div
          style={{
            height: 60,
            background: '#1E293B',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            color: '#F8FAFC',
            flexShrink: 0,
            zIndex: 30,
          }}
        >
          {/* Document Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 6,
                background: isFormula ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isFormula ? '#C084FC' : '#34D399',
                border: `1px solid ${isFormula ? 'rgba(124, 58, 237, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                flexShrink: 0,
              }}
            >
              {isFormula ? '📐 Formula Sheet' : '📚 Notes'}
            </span>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  margin: 0,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={resource?.title || 'Study Resource'}
              >
                {resource?.title || `${resource?.chapter || 'Chapter'} – ${resource?.chapterTitle || 'Study Resource'}`}
              </h3>
              <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{resource?.subject || 'Science'}</span>
                <span>•</span>
                <span>Class {resource?.classLevel || '9'}</span>
                <span>•</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Free Online Reading</span>
              </div>
            </div>
          </div>

          {/* Reader Controls Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Zoom Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#0F172A',
                borderRadius: 8,
                border: '1px solid #334155',
                padding: '2px 4px',
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#CBD5E1',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
                title="Zoom Out"
              >
                −
              </button>
              <span
                onClick={handleZoomReset}
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#38BDF8',
                  minWidth: 44,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                title="Reset Zoom"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#CBD5E1',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Toggle Fullscreen"
            >
              <span>{isFullscreen ? '🗗' : '⛶'}</span>
              <span>{isFullscreen ? 'Exit' : 'Full Screen'}</span>
            </button>

            {/* Paid Download / Entitlement Unlock Button in Header */}
            {isUnlocked ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⬇️</span>
                <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (handleOpenPayment) {
                    handleOpenPayment(resource);
                  }
                }}
                style={{
                  background: '#EA580C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.4)',
                }}
              >
                <span>🔒</span>
                <span>Download PDF • ₹{downloadPrice}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                color: '#CBD5E1',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
              }}
              title="Close Reader (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* MAIN DOCUMENT VIEWPORT                                       */}
        {/* ------------------------------------------------------------ */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#0B0F19',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Blur / Protection Mask Overlay */}
          {isContentObscured && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                zIndex: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 30,
                color: '#FFFFFF',
              }}
            >
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 16 }}>
                🔒
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', margin: '0 0 8px' }}>
                MENTORNEARBY CONTENT PROTECTED
              </h3>
              <p style={{ fontSize: 14, color: '#CBD5E1', maxWidth: 440, lineHeight: 1.5, margin: '0 0 12px' }}>
                Return to MentorNearby to continue reading your study material.
              </p>
              <button
                type="button"
                onClick={() => setIsContentObscured(false)}
                style={{
                  background: '#4F46E5',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 22px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 12,
                }}
              >
                📖 Continue Reading
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: 60 }}>
              <div style={{ width: 44, height: 44, border: '4px solid #334155', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600 }}>Loading PDF document...</p>
            </div>
          )}

          {!loading && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                flex: 1,
                overflow: 'auto',
                background: '#0F172A',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: `${Math.min(Math.round(1000 * (zoomLevel / 100)), 1400)}px`,
                  maxWidth: '100%',
                  height: '100%',
                  minHeight: '100%',
                  background: '#FFFFFF',
                  boxShadow: '0 10px 35px rgba(0, 0, 0, 0.5)',
                }}
              >
                <iframe
                  src={`${pdfBlobUrl || streamFileUrl}#toolbar=0&navpanes=0`}
                  title={resource?.title || 'Study Resource PDF'}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                  }}
                />

                {/* Dynamic Moving Watermark Overlay Matrix over PDF */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 40,
                    padding: 20,
                    transform: `translate(${watermarkDrift.x}px, ${watermarkDrift.y}px)`,
                    transition: 'transform 0.5s ease',
                    opacity: 0.45,
                    zIndex: 15,
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        transform: 'rotate(-24deg)',
                        textAlign: 'center',
                        userSelect: 'none',
                        color: 'rgba(15, 23, 42, 0.18)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>
                        MENTORNEARBY • PROTECTED
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: 700 }}>
                        {userIdentifier} • {sessionCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

// Export wrapped in Error Boundary
const StudyResourceViewerModal = (props) => {
  return (
    <ViewerErrorBoundary onClose={props.onClose}>
      <StudyResourceViewerModalInner {...props} />
    </ViewerErrorBoundary>
  );
};

export default StudyResourceViewerModal;
