// ============================================================
// components/studyResources/StudyResourceViewerModal.jsx
// MentorNearby Protected Study Resource PDF Reader
// Pure Distraction-Free PDF Document Viewer with Zoom & Watermarks
// 100% Free Online Reading • Protected Paid Downloads • Dynamic Watermarking
// Mobile-Responsive: 100% width on 320px - 1440px screens without overflow
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
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              color: '#F8FAFC',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 40 }}>📖</span>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '12px 0 8px' }}>
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

// Global PDF.js loader script promise
let pdfjsPromise = null;
const loadPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js not loaded'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF engine'));
    document.head.appendChild(script);
  });

  return pdfjsPromise;
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

  // Zoom, Pagination, and Dimension state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);

  // Moving Watermark Drift & Session ID
  const [watermarkDrift, setWatermarkDrift] = useState({ x: 0, y: 0 });
  const [sessionCode, setSessionCode] = useState('TN-SEC8A1');

  // Screen Visibility, Blur, & Capture Deterrence state
  const [isContentObscured, setIsContentObscured] = useState(false);
  const [protectionToast, setProtectionToast] = useState(null);

  const viewerContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasRefs = useRef({});
  const touchStartDistRef = useRef(null);
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
  const rawFileUrl =
    (resource?.fileReference?.url?.includes('res.cloudinary.com')
      ? resource.fileReference.url
      : resource?.fileUrl) ||
    resource?.fileUrl ||
    resource?.fileReference?.url ||
    '';

  const getFullDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      const backendBase =
        import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()
          ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
          : typeof window !== 'undefined'
          ? window.location.origin
          : 'https://mentornearby-2.onrender.com';
      return `${backendBase}${url}`;
    }
    return url;
  };

  const streamFileUrl =
    getFullDocUrl(rawFileUrl) ||
    `/api/study-resources/stream/${resource?._id || resourceId || 'c9-sci-ch1-notes'}`;

  // Fetch PDF Blob
  useEffect(() => {
    if (!isOpen) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setPdfDoc(null);
      return;
    }

    let isMounted = true;
    let localBlobUrl = null;

    const fetchPdfStream = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const targetUrl = streamFileUrl.startsWith('http')
          ? streamFileUrl
          : getFullDocUrl(streamFileUrl);
        const response = await fetch(targetUrl, { credentials: 'include' });

        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status})`);
        }

        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        localBlobUrl = URL.createObjectURL(pdfBlob);

        if (isMounted) {
          setPdfBlobUrl(localBlobUrl);
        }
      } catch (err) {
        console.warn('[PDF Reader] Fetch as blob failed, using direct stream URL:', err);
        if (isMounted) {
          setPdfBlobUrl(streamFileUrl);
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

  // Load PDF with PDF.js for crisp, responsive Canvas rendering
  useEffect(() => {
    if (!isOpen || !pdfBlobUrl) return;

    let isCancelled = false;

    const initPdfJs = async () => {
      try {
        const pdfjs = await loadPdfJs();
        const loadingTask = pdfjs.getDocument({
          url: pdfBlobUrl,
          withCredentials: true,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PDF.js] Canvas render init failed, using responsive iframe fallback:', err);
        if (!isCancelled) {
          setUseFallbackIframe(true);
          setLoading(false);
        }
      }
    };

    initPdfJs();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, pdfBlobUrl]);

  // Render PDF pages on canvas whenever pdfDoc, zoomLevel, or container size updates
  const renderAllPages = useCallback(async () => {
    if (!pdfDoc || useFallbackIframe) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const clientWidth = container.clientWidth || window.innerWidth;
    const availableWidth = isMobile ? clientWidth - 24 : Math.min(clientWidth - 48, 880);
    const targetWidth = Math.max(Math.round(availableWidth * (zoomLevel / 100)), 280);

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) continue;

        const viewport = page.getViewport({ scale: 1 });
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(scaledViewport.width * dpr);
        canvas.height = Math.floor(scaledViewport.height * dpr);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
      } catch (e) {
        console.error(`Page ${pageNum} render error:`, e);
      }
    }
  }, [pdfDoc, zoomLevel, useFallbackIframe]);

  useEffect(() => {
    renderAllPages();
  }, [renderAllPages]);

  // Re-render on window resize with debounce
  useEffect(() => {
    if (!isOpen || useFallbackIframe) return;

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderAllPages();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, useFallbackIframe, renderAllPages]);

  // Touch Pinch-to-zoom support
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchStartDistRef.current;
      if (Math.abs(diff) > 20) {
        if (diff > 0) {
          setZoomLevel((prev) => Math.min(prev + 10, 200));
        } else {
          setZoomLevel((prev) => Math.max(prev - 10, 60));
        }
        touchStartDistRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 60));
  const handleZoomReset = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isFormula = Boolean(
    resource?.resourceType === 'FORMULA_SHEET' ||
    resource?.type === 'FORMULA' ||
    resource?.isFormula ||
    resource?.comboType === 'FORMULA_COMBO'
  );

  const isUnlocked = Boolean(
    resource?.isUnlocked ||
    resource?.unlocked ||
    resource?.purchased ||
    propResource?.isUnlocked
  );

  const isSenior = ['11', '12'].includes(String(resource?.classLevel));
  const isCombo = Boolean(propIsCombo || resource?.isCombo || resource?.comboType);
  const expectedSinglePrice = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
  const expectedComboPrice = isFormula ? (isSenior ? 60 : 50) : (isSenior ? 120 : 100);
  const downloadPrice = isCombo ? expectedComboPrice : expectedSinglePrice;

  const handleDownload = async () => {
    if (!streamFileUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(streamFileUrl, { credentials: 'include' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = resource?.title ? `${resource.title}.pdf` : 'MentorNearby_StudyResource.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      if (streamFileUrl) window.open(streamFileUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const userIdentifier = maskIdentifier(user?.email || user?.name || 'student@mentornearby.in');

  const modalContent = (
    <div
      className="sr-modal-overlay sr-protected-reader-overlay fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-0 sm:p-4 w-screen h-screen overflow-hidden"
      onClick={onClose}
    >
      {/* Print Restriction & Mobile Responsive Viewer CSS */}
      <style>{`
        @media print {
          body * { display: none !important; }
          .sr-protected-reader-modal { display: none !important; }
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .sr-protected-reader-overlay {
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            position: fixed !important;
            inset: 0 !important;
          }
          .sr-protected-reader-modal {
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
          }
        }
      `}</style>

      <div
        ref={viewerContainerRef}
        className="sr-modal-content sr-protected-reader-modal w-full sm:w-[96vw] max-w-[1240px] h-full sm:h-[94vh] bg-slate-900 sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl border-0 sm:border border-slate-700 relative select-none"
        onClick={(e) => e.stopPropagation()}
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
              padding: '8px 16px',
              borderRadius: 30,
              fontSize: 12,
              fontWeight: 700,
              zIndex: 9999,
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'slideDown 0.3s ease',
              maxWidth: '90vw',
              textAlign: 'center',
            }}
          >
            <span>⚠️</span>
            <span>{protectionToast}</span>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* RESPONSIVE TOP BAR: TITLE, ZOOM, FULLSCREEN & ACTIONS         */}
        {/* ------------------------------------------------------------ */}
        <header className="bg-slate-800 border-b border-slate-700 p-2 sm:px-4 sm:py-3 flex flex-col gap-2 flex-shrink-0 z-30">
          {/* Row 1: Document Badge, Title & Close Button */}
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded flex-shrink-0 ${
                  isFormula
                    ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isFormula ? '📐 Formula' : '📚 Notes'}
              </span>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h3
                  className="text-xs sm:text-sm md:text-base font-bold text-white truncate"
                  title={resource?.title || 'Study Resource'}
                >
                  {resource?.title ||
                    `${resource?.chapter || 'Chapter'} – ${
                      resource?.chapterTitle || 'Study Resource'
                    }`}
                </h3>
                <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate">
                  <span>{resource?.subject || 'Science'}</span>
                  <span>•</span>
                  <span>Class {resource?.classLevel || '9'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold hidden sm:inline">
                    ✓ Free Online Reading
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-base flex-shrink-0 transition-colors"
              title="Close Reader (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Row 2: Reader Controls Toolbar (Full responsive wrap / scroll) */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-0.5 no-scrollbar text-xs">
            {/* Left: Page count indicator */}
            {numPages > 0 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 font-medium text-[11px] sm:text-xs flex-shrink-0">
                <span>📄 {numPages} {numPages === 1 ? 'Page' : 'Pages'}</span>
              </div>
            )}

            {/* Center: Zoom Controls */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="text-slate-300 hover:text-white px-2 py-0.5 text-sm font-bold disabled:opacity-30"
                title="Zoom Out"
              >
                −
              </button>
              <span
                onClick={handleZoomReset}
                className="text-sky-400 font-bold text-[11px] sm:text-xs min-w-[42px] text-center cursor-pointer select-none"
                title="Reset Zoom (100%)"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="text-slate-300 hover:text-white px-2 py-0.5 text-sm font-bold disabled:opacity-30"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Right: Fullscreen & Download Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg px-2.5 py-1 text-xs font-semibold"
                title="Toggle Fullscreen"
              >
                <span>{isFullscreen ? '🗗' : '⛶'}</span>
                <span>{isFullscreen ? 'Exit' : 'Full Screen'}</span>
              </button>

              {isUnlocked ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md"
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
                  className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md"
                >
                  <span>🔒</span>
                  <span>Download • ₹{downloadPrice}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* MAIN DOCUMENT VIEWPORT                                       */}
        {/* ------------------------------------------------------------ */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 w-full max-w-full bg-slate-950 overflow-y-auto overflow-x-auto relative flex flex-col items-center p-2 sm:p-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Loading Indicator */}
          {loading && (
            <div className="text-center my-auto p-8">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold">
                Loading PDF study material...
              </p>
            </div>
          )}

          {/* Error Message */}
          {!loading && errorMsg && (
            <div className="text-center my-auto p-6 bg-red-950/40 border border-red-800 rounded-xl max-w-md">
              <p className="text-red-400 text-sm font-bold mb-3">⚠️ {errorMsg}</p>
              <button
                type="button"
                onClick={loadResourceForReading}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Canvas Pages List (Crisp, High-DPI, 100% Mobile Responsive) */}
          {!loading && !errorMsg && !useFallbackIframe && pdfDoc && (
            <div
              ref={canvasContainerRef}
              className="relative w-full flex flex-col items-center gap-4 py-2"
            >
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    className="relative max-w-full flex flex-col items-center"
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[pageNum] = el;
                      }}
                      className="max-w-full h-auto block bg-white rounded-md shadow-2xl"
                    />

                    {/* Dynamic Moving Watermark Overlay per Page */}
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-6 p-4 opacity-30 z-10"
                      style={{
                        transform: `translate(${watermarkDrift.x}px, ${watermarkDrift.y}px)`,
                        transition: 'transform 0.5s ease',
                      }}
                    >
                      {Array.from({ length: 6 }).map((_, wIdx) => (
                        <div
                          key={wIdx}
                          className="rotate-[-22deg] text-center select-none text-slate-800"
                        >
                          <div className="text-[10px] sm:text-xs font-black tracking-wider text-slate-900/30">
                            MENTORNEARBY
                          </div>
                          <div className="text-[8px] sm:text-[9px] font-bold text-slate-900/20">
                            {userIdentifier} • {sessionCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback Object & Iframe for browsers where PDF.js script couldn't run */}
          {!loading && !errorMsg && (useFallbackIframe || !pdfDoc) && (
            <div className="relative w-full h-full min-h-[400px] flex-1 flex justify-center bg-slate-900 rounded-lg overflow-hidden">
              <object
                data={`${pdfBlobUrl || streamFileUrl}#view=FitH&toolbar=0&navpanes=0`}
                type="application/pdf"
                className="w-full h-full border-none block min-h-[450px]"
              >
                <iframe
                  src={`${pdfBlobUrl || streamFileUrl}#view=FitH&toolbar=0&navpanes=0`}
                  title={resource?.title || 'Study Resource PDF'}
                  className="w-full h-full border-none block min-h-[450px]"
                />
              </object>
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
