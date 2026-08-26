// ============================================================
// pages/Courses/CourseDetailPage.jsx
// Course Details & Learning Page
// 10-Year Video Lessons (YouTube Redirect/Watch) & Individual PPT Study Materials (Free Online Reading & ₹19 Paid Download)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getCourseDetails,
  createPptPaymentOrder,
  verifyPptPayment,
} from '../../api/courses';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './Courses.css';

// Helper to dynamically load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CourseDetailPage = () => {
  const { slugOrId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active Tab: 'VIDEOS' or 'PPTS'
  const [activeTab, setActiveTab] = useState('VIDEOS');

  // PPT Viewer Modal state (Free Online Reading)
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    resource: null,
    resourceId: null,
  });

  // PPT Download Payment Modal state (₹19 per PPT)
  const [pptPaymentModal, setPptPaymentModal] = useState({
    isOpen: false,
    paper: null,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [slugOrId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getCourseDetails(slugOrId);
      setCourse(res.data?.course);
      setPapers(res.data?.papers || []);
    } catch (err) {
      console.error('Failed to load course details:', err);
      setErrorMsg(err.response?.data?.message || 'Unable to load course details.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Video Watch Handler: Open actual YouTube URL directly
  const handleWatchVideo = (paper) => {
    const youtubeUrl = paper.youtubeUrl || (paper.video?.url && paper.video.url.includes('youtu') ? paper.video.url : null) || (paper.youtubeVideoId ? `https://www.youtube.com/watch?v=${paper.youtubeVideoId}` : null);
    
    if (youtubeUrl) {
      window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    } else if (paper.video?.url) {
      window.open(paper.video.url, '_blank', 'noopener,noreferrer');
    } else {
      showToast('Video unavailable for this session', 'info');
    }
  };

  // 2. Free Online Reading Handler for PPT
  const handleReadPptOnline = (paper) => {
    const formattedResource = {
      _id: paper._id,
      id: paper._id,
      title: paper.title || `${paper.year} Board Paper Solution PPT`,
      classLevel: course?.classLevel || '10',
      subject: course?.subject || 'Science',
      chapter: `Year ${paper.year}`,
      chapterTitle: paper.title || `${paper.year} Solution PPT`,
      resourceType: 'PPT',
      type: 'PPT',
      isPpt: true,
      fileUrl: paper.ppt?.url || `/api/courses/paper/stream/${paper._id}`,
      fileReference: {
        filename: paper.ppt?.filename || `CBSE_${paper.year}_Solution_PPT.pdf`,
        fileSize: 524288,
      },
      downloadPrice: 19,
      isDownloadUnlocked: Boolean(paper.isPptUnlocked),
    };

    setViewerData({
      isOpen: true,
      resource: formattedResource,
      resourceId: paper._id,
    });
  };

  // 3. Trigger PPT Download (₹19 Paid Flow)
  const handleOpenPptPayment = (paper) => {
    setPptPaymentModal({
      isOpen: true,
      paper,
    });
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  // Helper: Trigger Real Automatic PDF Download after payment
  const triggerDownloadedPdf = async (paper) => {
    try {
      const cleanFileName = paper.ppt?.filename || `MentorNearby_Class_${course?.classLevel}_${course?.subject}_${paper.year}_Solution_Notes.pdf`;
      const fileUrl = paper.ppt?.url || `/api/study-resources/stream/${paper._id}?download=true`;

      const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
        ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
        : (typeof window !== 'undefined' ? window.location.origin : 'https://mentornearby-2.onrender.com');
      const streamUrl = fileUrl.startsWith('http') ? fileUrl : `${backendBase}${fileUrl}`;

      const response = await fetch(streamUrl, { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }
    } catch (dErr) {
      console.error('Post-payment auto download failed:', dErr);
    }
  };

  // Execute Razorpay PPT Checkout
  const handlePptCheckout = async () => {
    const paper = pptPaymentModal.paper;
    if (!paper) return;

    if (!isAuthenticated) {
      showToast('Please login to download PPT study materials', 'info');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentError(null);

      // 1. Create order on backend (Server-side price ₹19)
      const orderRes = await createPptPaymentOrder(paper._id);
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded && !orderId.startsWith('stub_')) {
        setPaymentError('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setPaymentLoading(false);
        return;
      }

      // 3. Dev stub handler if running in local test mode
      if (orderId.startsWith('stub_order_') || !window.Razorpay) {
        console.log('💳 [DEV STUB] Simulating PPT payment success for order:', orderId);
        const stubVerifyRes = await verifyPptPayment({
          razorpayOrderId: orderId,
          razorpayPaymentId: `stub_payment_${Date.now()}`,
          razorpaySignature: 'stub_signature',
        });

        setPaymentSuccess(true);
        showToast(stubVerifyRes.message || 'Payment verified! PPT download starting...', 'success');
        await triggerDownloadedPdf(paper);
        setPaymentLoading(false);
        setTimeout(() => {
          setPptPaymentModal({ isOpen: false, paper: null });
          fetchCourseDetails();
        }, 1200);
        return;
      }

      // 4. Live Razorpay Options
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(Number(amount) * 100).toString(),
        currency: currency || 'INR',
        name: 'MentorNearby',
        description: `${paper.year} Board Paper Solution PPT`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#D97706',
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await verifyPptPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPaymentSuccess(true);
            showToast(verifyRes.message || 'Payment verified! PPT download starting...', 'success');
            await triggerDownloadedPdf(paper);
            setTimeout(() => {
              setPptPaymentModal({ isOpen: false, paper: null });
              fetchCourseDetails();
            }, 1200);
          } catch (vErr) {
            setPaymentError(vErr.response?.data?.message || 'Payment verification failed on server');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentError(resp.error?.description || 'Payment was cancelled or failed.');
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to initiate PPT download payment');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mn-courses-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading course syllabus & resources...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="mn-courses-page" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 44 }}>⚠️</span>
        <h2 style={{ color: '#0F172A', margin: '14px 0 8px' }}>Course Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>{errorMsg || 'This course is currently unavailable.'}</p>
        <Link to="/courses" className="mn-course-start-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 24px', height: 40, background: '#D97706', color: '#FFF' }}>
          ← Back to All Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mn-courses-page">
      <div className="mn-courses-container" style={{ paddingTop: 24 }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          <Link to="/courses" style={{ color: '#D97706', textDecoration: 'none', fontWeight: 700 }}>
            Courses
          </Link>
          <span>›</span>
          <span>Class {course.classLevel}</span>
          <span>›</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>{course.subject}</span>
        </div>

        {/* Course Header Banner */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '28px 32px', marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: '#D97706', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
              {course.category === 'PYQ_MASTERY' ? 'PYQ Mastery' : course.category}
            </span>
            <span style={{ background: '#2563EB', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
              Class {course.classLevel}
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              • {course.subject}
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.3 }}>
            {course.title}
          </h1>

          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 900 }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 12.5, color: '#64748B', fontWeight: 700, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
            <span>🎥 {papers.length || course.totalVideosCount || 10} Video Lessons</span>
            <span>📄 {papers.length || course.totalPptCount || 10} Solution PPTs</span>
            <span>👨‍🏫 By {course.instructor?.name || 'MentorNearby'}</span>
            <span style={{ color: '#059669' }}>✓ 100% Free Online Reading for All PPTs</span>
          </div>
        </div>

        {/* Tab Switcher: VIDEO LESSONS vs PPT / STUDY MATERIAL */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '2px solid #E2E8F0', paddingBottom: 10 }}>
          <button
            type="button"
            onClick={() => setActiveTab('VIDEOS')}
            style={{
              background: activeTab === 'VIDEOS' ? '#FFFBEB' : '#FFFFFF',
              border: `1.5px solid ${activeTab === 'VIDEOS' ? '#D97706' : '#E2E8F0'}`,
              color: activeTab === 'VIDEOS' ? '#D97706' : '#475569',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🎥</span>
            <span>VIDEO LESSONS ({papers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PPTS')}
            style={{
              background: activeTab === 'PPTS' ? '#FFFBEB' : '#FFFFFF',
              border: `1.5px solid ${activeTab === 'PPTS' ? '#D97706' : '#E2E8F0'}`,
              color: activeTab === 'PPTS' ? '#D97706' : '#475569',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>📄</span>
            <span>PPT / STUDY MATERIAL ({papers.length})</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: VIDEO LESSONS                                         */}
        {/* ============================================================ */}
        {activeTab === 'VIDEOS' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
                Video Lessons
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Step-by-step video analysis for 10 years of CBSE board examination papers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {papers.map((paper) => {
                const youtubeUrl = paper.youtubeUrl || (paper.video?.url && paper.video.url.includes('youtu') ? paper.video.url : null) || (paper.youtubeVideoId ? `https://www.youtube.com/watch?v=${paper.youtubeVideoId}` : null);

                return (
                  <div
                    key={paper._id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                          {paper.year} Board Paper
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                          ⏱️ {paper.durationMinutes || 48} mins
                        </span>
                      </div>

                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {paper.title}
                      </h4>

                      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4, margin: '0 0 14px' }}>
                        {paper.solutionNotes?.summary || 'Complete step-by-step model answers with marking scheme breakdown.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleWatchVideo(paper)}
                      style={{
                        width: '100%',
                        height: 36,
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)',
                      }}
                    >
                      <span>▶</span>
                      <span>Watch on YouTube</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PPT / STUDY MATERIAL (FREE READING + ₹19 DOWNLOAD)     */}
        {/* ============================================================ */}
        {activeTab === 'PPTS' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
                PPT / Study Material
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                High-yield downloadable solution slides & formula summaries for each board paper.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {papers.map((paper) => {
                const pptFilename = paper.ppt?.filename || `CBSE_Class${course.classLevel}_${course.subject}_${paper.year}_Solution_Notes.pdf`;
                const pagesCount = paper.ppt?.pagesCount || 22;
                const isPptUnlocked = Boolean(paper.isPptUnlocked);

                return (
                  <div
                    key={paper._id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                          {paper.year} Solution PPT
                        </span>
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>
                          ✓ Free Online
                        </span>
                      </div>

                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.4 }}>
                        {paper.year} Solution PPT &amp; Notes
                      </h4>

                      <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14 }}>
                        <span>📄 {pptFilename}</span>
                        <span>•</span>
                        <span>{pagesCount} Pages</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleReadPptOnline(paper)}
                        style={{
                          height: 34,
                          background: '#FFFFFF',
                          border: '1.5px solid #059669',
                          color: '#059669',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <span>📖</span>
                        <span>Read Online</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isPptUnlocked) {
                            triggerDownloadedPdf(paper);
                          } else {
                            handleOpenPptPayment(paper);
                          }
                        }}
                        style={{
                          height: 34,
                          background: isPptUnlocked ? '#15803D' : '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.2)',
                        }}
                      >
                        <span>{isPptUnlocked ? '✓' : '⬇️'}</span>
                        <span>{isPptUnlocked ? 'Download' : 'Download (₹19)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. PPT VIEWER MODAL (100% FREE ONLINE READING)               */}
        {/* ============================================================ */}
        {viewerData.isOpen && (
          <StudyResourceViewerModal
            isOpen={viewerData.isOpen}
            onClose={() => setViewerData({ isOpen: false, resource: null, resourceId: null })}
            resourceId={viewerData.resourceId}
            resource={viewerData.resource}
            initialResource={viewerData.resource}
            onOpenPaymentModal={() => {
              const matchingPaper = papers.find((p) => p._id === viewerData.resourceId);
              if (matchingPaper) {
                setViewerData({ isOpen: false, resource: null, resourceId: null });
                handleOpenPptPayment(matchingPaper);
              }
            }}
          />
        )}

        {/* ============================================================ */}
        {/* 5. PPT DOWNLOAD PAYMENT MODAL (₹19 PER PPT)                  */}
        {/* ============================================================ */}
        {pptPaymentModal.isOpen && pptPaymentModal.paper && (
          <div className="sr-modal-overlay" onClick={() => setPptPaymentModal({ isOpen: false, paper: null })}>
            <div className="sr-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Download PPT
                </h3>
                <button
                  onClick={() => setPptPaymentModal({ isOpen: false, paper: null })}
                  style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Resource Preview */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                  {pptPaymentModal.paper.year} Board Paper Solution PPT
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  {course.title}
                </div>
              </div>

              {/* Free Reading Note */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#D1FAE5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, marginBottom: 12 }}>
                <span>⚡</span>
                <span>Reading Online is FREE</span>
              </div>

              {/* Error Box */}
              {paymentError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, marginBottom: 12 }}>
                  ⚠️ {paymentError}
                </div>
              )}

              {/* Success Box */}
              {paymentSuccess && (
                <div style={{ background: '#F0FDF4', border: '1px solid #4ADE80', color: '#15803D', borderRadius: 8, padding: '12px', textAlign: 'center', fontSize: 12.5, fontWeight: 800, marginBottom: 12 }}>
                  <div>✓ Payment Successful</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#16A34A', marginTop: 2 }}>
                    ✓ Download Starting Automatically...
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div style={{ border: '1.5px solid #D97706', borderRadius: 10, padding: '10px 12px', background: 'rgba(217, 119, 6, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                    Single PPT Download
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>
                    Original solution notes with marking scheme
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                  ₹19
                </div>
              </div>

              {/* Pay CTA */}
              <button
                type="button"
                onClick={handlePptCheckout}
                disabled={paymentLoading || paymentSuccess}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  border: 'none',
                  cursor: paymentLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                  opacity: paymentLoading || paymentSuccess ? 0.7 : 1,
                }}
              >
                {paymentLoading ? 'Processing Order...' : paymentSuccess ? '✓ Download Starting...' : '🔒 Pay ₹19 & Download'}
              </button>

              <div style={{ fontSize: 9.5, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>
                🛡️ Secure Encrypted Payment by Razorpay
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CourseDetailPage;
