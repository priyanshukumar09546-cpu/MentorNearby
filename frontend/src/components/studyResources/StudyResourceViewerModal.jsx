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

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Scroll reset to top of Page 1 whenever document changes or loads
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, pdfDoc, pdfBlobUrl]);

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

  const [isImageDoc, setIsImageDoc] = useState(false);
  const [docImageSrc, setDocImageSrc] = useState(null);

  // 3. Resolve target PDF/Image URL and Fetch as Same-Origin Blob
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
          : 'https://mentornearby-2.onrender.com';
      return `${backendBase}${url}`;
    }
    return url;
  };

  const streamFileUrl =
    getFullDocUrl(rawFileUrl) ||
    `/api/study-resources/stream/${resource?._id || resourceId || 'c9-sci-ch1-notes'}`;

  // Fetch Blob (PDF or High-Res Image Scan)
  useEffect(() => {
    if (!isOpen) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setPdfDoc(null);
      setIsImageDoc(false);
      setDocImageSrc(null);
      return;
    }

    let isMounted = true;
    let localBlobUrl = null;

    const fetchPdfStream = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setIsImageDoc(false);
        setDocImageSrc(null);

        const targetUrl = streamFileUrl.startsWith('http')
          ? streamFileUrl
          : getFullDocUrl(streamFileUrl);

        const lowerUrl = targetUrl.toLowerCase();
        if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp')) {
          if (isMounted) {
            setIsImageDoc(true);
            setDocImageSrc(targetUrl);
            setNumPages(1);
            setLoading(false);
          }
          return;
        }

        const response = await fetch(targetUrl);
        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status})`);
        }

        const contentType = response.headers.get('content-type') || '';
        const blob = await response.blob();

        if (contentType.includes('image/') || blob.type.startsWith('image/')) {
          localBlobUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setIsImageDoc(true);
            setDocImageSrc(localBlobUrl);
            setNumPages(1);
            setLoading(false);
          }
          return;
        }

        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        localBlobUrl = URL.createObjectURL(pdfBlob);

        if (isMounted) {
          setIsImageDoc(false);
          setPdfBlobUrl(localBlobUrl);
        }
      } catch (err) {
        console.warn('[Reader] Fetch blob failed, using fallback direct URL:', err);
        const resolvedUrl = getFullDocUrl(streamFileUrl);
        const lowerRes = resolvedUrl.toLowerCase();
        if (lowerRes.includes('.jpg') || lowerRes.includes('.jpeg') || lowerRes.includes('.png') || lowerRes.includes('.webp')) {
          if (isMounted) {
            setIsImageDoc(true);
            setDocImageSrc(resolvedUrl);
            setNumPages(1);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setIsImageDoc(false);
            setPdfBlobUrl(resolvedUrl);
          }
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
    const padding = isMobile ? 12 : 48;
    const maxDesktopWidth = 880;
    const availableWidth = Math.max(260, Math.min(clientWidth - padding, maxDesktopWidth));
    const targetWidth = Math.max(260, Math.round(availableWidth * (zoomLevel / 100)));

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
      className="sr-modal-overlay sr-protected-reader-overlay fixed inset-0 z-[999999] flex items-center justify-center bg-black w-screen h-screen overflow-hidden"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        backgroundColor: '#000000',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
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
        .sr-protected-reader-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          background-color: #000000 !important;
          z-index: 999999 !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .sr-protected-reader-modal {
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          background-color: #000000 !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
        }
      `}</style>

      <div
        ref={viewerContainerRef}
        className="sr-modal-content sr-protected-reader-modal w-full h-full bg-black flex flex-col overflow-hidden relative select-none"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: 0, backgroundColor: '#000000' }}
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
        {/* RESPONSIVE TOP BAR: TITLE & ZOOM CONTROLS WITH SAFE INSET    */}
        {/* ------------------------------------------------------------ */}
        <header
          className="bg-black/90 border-b border-neutral-800 p-2 sm:px-4 sm:py-3 flex flex-col gap-2 flex-shrink-0 z-30"
          style={{
            paddingTop: 'max(8px, env(safe-area-inset-top))',
            paddingLeft: 'max(12px, env(safe-area-inset-left))',
            paddingRight: 'max(12px, env(safe-area-inset-right))',
          }}
        >
          {/* Row 1: Document Badge, Title & Inward Back/Close Button */}
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            {/* Safe Inward Back/Close Button (Upper Left Area) */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 flex-shrink-0 transition-all border border-neutral-700 shadow-md active:scale-95"
              style={{
                marginLeft: 'max(4px, env(safe-area-inset-left))',
              }}
              title="Close Reader (ESC)"
            >
              <span>← Back</span>
            </button>

            <div className="min-w-0 flex-1 overflow-hidden text-center sm:text-left mx-2">
              <h3
                className="text-xs sm:text-sm md:text-base font-bold text-white truncate"
                title={resource?.title || 'Study Resource'}
              >
                {resource?.title ||
                  `${resource?.chapter || 'Chapter'} – ${
                    resource?.chapterTitle || 'Study Resource'
                  }`}
              </h3>
              <div className="text-[10px] sm:text-xs text-neutral-400 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <span>{resource?.subject || 'Science'}</span>
                <span>•</span>
                <span>Class {resource?.classLevel || '9'}</span>
                {numPages > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">
                      {numPages} {numPages === 1 ? 'Page' : 'Pages'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Close Cross Icon Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors border border-neutral-700"
              style={{
                marginRight: 'max(4px, env(safe-area-inset-right))',
              }}
              title="Close Reader"
            >
              ✕
            </button>
          </div>

          {/* Row 2: Reader Controls Toolbar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto py-0.5 no-scrollbar text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded flex-shrink-0 ${
                  isFormula
                    ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isFormula ? '📐 Formula Sheet' : '📚 Notes PDF'}
              </span>
            </div>

            {/* Center: Zoom Controls */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="text-neutral-300 hover:text-white px-2 py-0.5 text-sm font-bold disabled:opacity-30"
                title="Zoom Out"
              >
                −
              </button>
              <span
                onClick={handleZoomReset}
                className="text-neutral-200 text-[11px] sm:text-xs font-semibold px-2 cursor-pointer hover:text-emerald-400 min-w-[42px] text-center select-none"
                title="Reset Zoom (100%)"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="text-neutral-300 hover:text-white px-2 py-0.5 text-sm font-bold disabled:opacity-30"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700"
                title="Toggle Fullscreen"
              >
                <span>{isFullscreen ? '↘' : '⛶'}</span>
                <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* MAIN CENTERED DOCUMENT VIEWPORT (SOLID BLACK BACKGROUND)     */}
        {/* ------------------------------------------------------------ */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 w-full max-w-full bg-black overflow-y-auto overflow-x-hidden relative flex flex-col items-center justify-center p-2 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch', minHeight: 0, backgroundColor: '#000000' }}
        >
          {/* Loading Indicator */}
          {loading && (
            <div className="text-center my-auto p-8">
              <div className="w-10 h-10 border-4 border-neutral-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-400 text-xs sm:text-sm font-semibold">
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Original Image Document View (Centered, Preserved Aspect Ratio) */}
          {!loading && !errorMsg && isImageDoc && docImageSrc && (
            <div className="relative w-full max-w-full flex-1 flex flex-col items-center justify-center py-2 my-auto">
              <div className="relative max-w-full flex flex-col items-center justify-center my-auto">
                <img
                  src={docImageSrc}
                  alt={resource?.title || 'Study Resource Document'}
                  className="max-w-full max-h-[85vh] h-auto block bg-white rounded-md shadow-2xl transition-all duration-200 object-contain mx-auto"
                  style={{
                    width: `${Math.min(zoomLevel, 180)}%`,
                    maxWidth: zoomLevel <= 100 ? '100%' : 'none',
                    maxHeight: zoomLevel <= 100 ? '85vh' : 'none',
                    objectFit: 'contain',
                  }}
                />
                {/* Subtle Single Watermark */}
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10"
                  style={{ opacity: 0.08 }}
                >
                  <div className="rotate-[-30deg] text-center select-none">
                    <div className="text-xl sm:text-3xl font-black tracking-widest text-slate-900 uppercase">
                      MENTORNEARBY
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-800 mt-1">
                      {userIdentifier} • {sessionCode}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Pages List (Centered, Responsive Height/Width PDF Pages) */}
          {!loading && !errorMsg && !isImageDoc && !useFallbackIframe && pdfDoc && (
            <div
              ref={canvasContainerRef}
              className="relative w-full max-w-full flex-1 flex flex-col items-center justify-center gap-4 py-2 my-auto"
            >
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    className="relative max-w-full flex flex-col items-center justify-center my-auto"
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[pageNum] = el;
                      }}
                      className="max-w-full h-auto block bg-white rounded-md shadow-2xl transition-all duration-200"
                      style={{
                        maxWidth: '100%',
                        maxHeight: numPages === 1 ? '85vh' : 'none',
                        objectFit: 'contain',
                      }}
                    />

                    {/* Subtle, Non-Intrusive Watermark (Single diagonal per page) */}
                    <div
                      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10"
                      style={{ opacity: 0.08 }}
                    >
                      <div className="rotate-[-30deg] text-center select-none">
                        <div className="text-xl sm:text-3xl font-black tracking-widest text-slate-900 uppercase">
                          MENTORNEARBY
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-slate-800 mt-1">
                          {userIdentifier} • {sessionCode}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback Object & Iframe for browsers where PDF.js script couldn't run */}
          {!loading && !errorMsg && !isImageDoc && (useFallbackIframe || !pdfDoc) && (
            <div className="relative w-full h-full min-h-[400px] flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden my-auto">
              <object
                data={`${pdfBlobUrl || streamFileUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                type="application/pdf"
                className="w-full h-full max-h-[85vh] border-none block min-h-[450px]"
              >
                <iframe
                  src={`${pdfBlobUrl || streamFileUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                  title={resource?.title || 'Study Resource PDF'}
                  className="w-full h-full max-h-[85vh] border-none block min-h-[450px]"
                />
              </object>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SAFE-AREA FLOATING DOWNLOAD BUTTON (BOTTOM RIGHT AREA)       */}
        {/* ------------------------------------------------------------ */}
        <div
          className="fixed z-50 flex items-center pointer-events-auto"
          style={{
            bottom: 'max(20px, env(safe-area-inset-bottom))',
            right: 'max(20px, env(safe-area-inset-right))',
          }}
        >
          {isUnlocked ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-2xl border border-emerald-400/30 disabled:opacity-50"
              title="Download Original PDF File"
            >
              <span className="text-base sm:text-lg">{downloading ? '⏳' : '📥'}</span>
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
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-2xl border border-emerald-400/30"
              title="Download Original PDF"
            >
              <span className="text-base sm:text-lg">🔒</span>
              <span>Download PDF • ₹{downloadPrice}</span>
            </button>
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
