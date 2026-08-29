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
    const clientHeight = container.clientHeight || (window.innerHeight - 120);
    const padding = isMobile ? 12 : 32;
    const maxDesktopWidth = 860;
    const availableWidth = Math.max(260, Math.min(clientWidth - padding, maxDesktopWidth));
    const availableHeight = Math.max(300, clientHeight - padding);

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) continue;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleW = availableWidth / unscaledViewport.width;
        const scaleH = availableHeight / unscaledViewport.height;

        // Fit scale checks BOTH available container width AND available container height
        const baseFitScale = (pdfDoc.numPages === 1 || isMobile)
          ? Math.min(scaleW, scaleH)
          : scaleW;

        const targetScale = Math.max(0.4, baseFitScale * (zoomLevel / 100));
        const scaledViewport = page.getViewport({ scale: targetScale });

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
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = dist - touchStartDistRef.current;
      if (Math.abs(delta) > 30) {
        if (delta > 0) handleZoomIn();
        else handleZoomOut();
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
    const el = viewerContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isPpt = Boolean(
    resource?.resourceType === 'PPT' ||
    resource?.type === 'PPT' ||
    resource?.isPpt ||
    propResource?.resourceType === 'PPT' ||
    propResource?.type === 'PPT' ||
    propResource?.isPpt
  );

  const isFormula = !isPpt && Boolean(
    (resource?.resourceType === 'FORMULA_SHEET' ||
     resource?.type === 'FORMULA_SHEET' ||
     resource?.type === 'FORMULA' ||
     resource?.isFormula ||
     resource?.comboType === 'FORMULA_COMBO') &&
    resource?.resourceType !== 'NOTES' &&
    resource?.resourceType !== 'IMPORTANT_QUESTIONS_ANSWERS' &&
    propResource?.resourceType !== 'NOTES' &&
    propResource?.resourceType !== 'IMPORTANT_QUESTIONS_ANSWERS'
  );

  const isUnlocked = Boolean(
    resource?.isUnlocked ||
    resource?.unlocked ||
    resource?.purchased ||
    propResource?.isUnlocked
  );

  const isSenior = ['11', '12'].includes(String(resource?.classLevel || propResource?.classLevel));
  const isCombo = Boolean(propIsCombo || resource?.isCombo || resource?.comboType);

  let downloadPrice = 19;
  if (isPpt) {
    downloadPrice = 19;
  } else if (isCombo) {
    downloadPrice = isFormula ? (isSenior ? 60 : 50) : (isSenior ? 120 : 100);
  } else if (isFormula) {
    downloadPrice = isSenior ? 8 : 7;
  } else {
    downloadPrice = Number(resource?.downloadPrice || propResource?.downloadPrice || (isSenior ? 14 : 12));
  }

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
      <style>{`
        @media print {
          body * { display: none !important; }
          .sr-protected-reader-modal { display: none !important; }
        }
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
        {/* EXPLICIT THEME-ISOLATED TOP HEADER & CONTROLS (ABOVE PDF!)   */}
        {/* ------------------------------------------------------------ */}
        <header
          style={{
            backgroundColor: '#111111',
            borderBottom: '1px solid #262626',
            color: '#FFFFFF',
            paddingTop: 'max(8px, env(safe-area-inset-top))',
            paddingBottom: '10px',
            paddingLeft: 'max(12px, env(safe-area-inset-left))',
            paddingRight: 'max(12px, env(safe-area-inset-right))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
            zIndex: 30,
          }}
        >
          {/* Row 1: Safe Inward Back Button, Title, and Close Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
            {/* Safe Inward Back Button (Upper Left Area) */}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#262626',
                color: '#FFFFFF',
                border: '1px solid #404040',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              }}
              title="Close Reader (ESC)"
            >
              <span>← Back</span>
            </button>

            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textAlign: 'center', margin: '0 8px' }}>
              <h3
                style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={resource?.title || 'Study Resource'}
              >
                {resource?.title ||
                  `${resource?.chapter || 'Chapter'} – ${
                    resource?.chapterTitle || 'Study Resource'
                  }`}
              </h3>
              <div style={{ fontSize: '11px', color: '#A3A3A3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span>{resource?.subject || 'Science'}</span>
                <span>•</span>
                <span>Class {resource?.classLevel || '9'}</span>
                {numPages > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#10B981', fontWeight: '600' }}>
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
              style={{
                backgroundColor: '#262626',
                color: '#FFFFFF',
                border: '1px solid #404040',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Close Reader"
            >
              ✕
            </button>
          </div>

          {/* Row 2: Reader Controls + DOWNLOAD BUTTON (ALL ABOVE THE PDF AREA!) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: isPpt ? '#831843' : isFormula ? '#3B0764' : '#064E3B',
                  color: isPpt ? '#FCE7F3' : isFormula ? '#F3E8FF' : '#D1FAE5',
                  border: isPpt ? '1px solid #9D174D' : isFormula ? '1px solid #6B21A8' : '1px solid #047857',
                }}
              >
                {isPpt ? '📊 Course PPT' : isFormula ? '📐 Formula Sheet' : '📚 Notes PDF'}
              </span>
            </div>

            {/* Center: Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', padding: '2px 4px' }}>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                style={{ color: '#E5E5E5', background: 'none', border: 'none', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                title="Zoom Out"
              >
                −
              </button>
              <span
                onClick={handleZoomReset}
                style={{ color: '#F5F5F5', fontSize: '12px', fontWeight: '600', padding: '0 8px', cursor: 'pointer', userSelect: 'none' }}
                title="Reset Zoom (100%)"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                style={{ color: '#E5E5E5', background: 'none', border: 'none', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                +
              </button>
            </div>

            {/* Right: Fullscreen Toggle & DOWNLOAD BUTTON (ABOVE PDF AREA!) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={toggleFullscreen}
                style={{ backgroundColor: '#262626', color: '#FFFFFF', border: '1px solid #404040', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Toggle Fullscreen"
              >
                <span>{isFullscreen ? '↘' : '⛶'}</span>
                <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>

              {/* Download PDF Button — Subscription-gated watermarked download */}
              {(() => {
                const currentUser = user;
                const userIsSubscribed =
                  currentUser?.isSubscribed &&
                  currentUser?.subscriptionExpiry &&
                  new Date(currentUser.subscriptionExpiry) > new Date();
                const rId = resource?._id || resource?.id || propResource?._id || propResource?.id;

                const handleSubscribedDownload = async () => {
                  if (!rId) return;
                  setDownloading(true);
                  try {
                    const { downloadWatermarkedNote } = await import('../../api/notes');
                    const res = await downloadWatermarkedNote(rId);
                    const blob = new Blob([res.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `MentorNearby_${resource?.title || 'notes'}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    if (err.response?.status === 403) {
                      if (handleOpenPayment) handleOpenPayment(resource || propResource);
                    } else {
                      console.error('Download error:', err);
                    }
                  } finally {
                    setDownloading(false);
                  }
                };

                if (userIsSubscribed) {
                  return (
                    <button
                      type="button"
                      onClick={handleSubscribedDownload}
                      disabled={downloading}
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: '1px solid #10B981',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
                        opacity: downloading ? 0.6 : 1,
                      }}
                      title="Download Watermarked PDF"
                    >
                      <span>{downloading ? '⏳' : '📥'}</span>
                      <span>{downloading ? 'Preparing...' : 'Download PDF'}</span>
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => { if (handleOpenPayment) handleOpenPayment(resource || propResource); }}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: '1px solid #3B82F6',
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                    title="Subscribe to Download"
                  >
                    <span>🔒</span>
                    <span>Subscribe to Download</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* MAIN CENTERED DOCUMENT VIEWPORT (PURE BLACK #000000 AREA)    */}
        {/* ------------------------------------------------------------ */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#000000',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          }}
        >
          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '32px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #262626',
                  borderTopColor: '#10B981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px auto',
                }}
              ></div>
              <p style={{ color: '#A3A3A3', fontSize: '13px', fontWeight: '600' }}>
                Loading original PDF study material...
              </p>
            </div>
          )}

          {/* Error Message */}
          {!loading && errorMsg && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '24px', backgroundColor: 'rgba(127, 29, 29, 0.3)', border: '1px solid #991B1B', borderRadius: '12px', maxWidth: '400px' }}>
              <p style={{ color: '#FCA5A5', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>⚠️ {errorMsg}</p>
              <button
                type="button"
                onClick={loadResourceForReading}
                style={{ backgroundColor: '#059669', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* Original Image Document View (Centered, Preserved Aspect Ratio) */}
          {!loading && !errorMsg && isImageDoc && docImageSrc && (
            <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
              <div style={{ position: 'relative', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                <img
                  src={docImageSrc}
                  alt={resource?.title || 'Study Resource Document'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: zoomLevel <= 100 ? 'calc(100vh - 120px)' : 'none',
                    height: 'auto',
                    display: 'block',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    objectFit: 'contain',
                    margin: 'auto',
                  }}
                />
                {/* Subtle Single Watermark */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 10,
                    opacity: 0.08,
                  }}
                >
                  <div style={{ transform: 'rotate(-30deg)', textAlign: 'center', userSelect: 'none' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '3px', color: '#0F172A', textTransform: 'uppercase' }}>
                      MENTORNEARBY
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginTop: '4px' }}>
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
              style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                margin: 'auto',
              }}
            >
              {Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    style={{ position: 'relative', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[pageNum] = el;
                      }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: (numPages === 1 && zoomLevel <= 100) ? 'calc(100vh - 120px)' : 'none',
                        height: 'auto',
                        display: 'block',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                        objectFit: 'contain',
                      }}
                    />

                    {/* Subtle, Non-Intrusive Watermark (Single diagonal per page) */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        zIndex: 10,
                        opacity: 0.08,
                      }}
                    >
                      <div style={{ transform: 'rotate(-30deg)', textAlign: 'center', userSelect: 'none' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '3px', color: '#0F172A', textTransform: 'uppercase' }}>
                          MENTORNEARBY
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', marginTop: '4px' }}>
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
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', borderRadius: '8px', overflow: 'hidden', margin: 'auto' }}>
              <object
                data={`${pdfBlobUrl || streamFileUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 120px)', border: 'none', display: 'block', minHeight: '450px' }}
              >
                <iframe
                  src={`${pdfBlobUrl || streamFileUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
                  title={resource?.title || 'Study Resource PDF'}
                  style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 120px)', border: 'none', display: 'block', minHeight: '450px' }}
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
