import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseDetails, getPaperWatchAccess, updateCourseProgress, createPptPaymentOrder, verifyPptPayment } from '../../api/courses';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CourseVideoPlayer from '../../components/courses/CourseVideoPlayer';
import './Courses.css';

const CourseWatchPage = () => {
  const { courseId, paperId } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [papers, setPapers] = useState([]);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [watchAccess, setWatchAccess] = useState(null);
  const [isPptDownloading, setIsPptDownloading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchCourseAndPaper();
  }, [courseId, paperId]);

  const fetchCourseAndPaper = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch Course Structure
      const courseRes = await getCourseDetails(courseId);
      setCourse(courseRes.data.course);
      const allPapers = courseRes.data.papers || [];
      setPapers(allPapers);

      // 2. Determine target paper
      const targetPaper = allPapers.find((p) => p._id === paperId) || allPapers[0];
      setCurrentPaper(targetPaper);

      // 3. Fetch Authorized Video/Stream Access (Free for all)
      if (targetPaper) {
        try {
          const accessRes = await getPaperWatchAccess(targetPaper._id);
          setWatchAccess(accessRes.data);
        } catch (accErr) {
          console.error('Paper watch access error', accErr);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load video classroom.');
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = async ({ positionSeconds, completed }) => {
    if (!course || !currentPaper) return;
    try {
      await updateCourseProgress({
        courseId: course._id,
        paperId: currentPaper._id,
        positionSeconds,
        completed,
      });
    } catch (_) {
      // Background update
    }
  };

  const handlePptDownload = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/courses/watch/${courseId}/${currentPaper?._id}` } });
      return;
    }

    const directUrl = watchAccess?.paper?.ppt?.url || currentPaper?.ppt?.url;
    const isUnlocked = watchAccess?.paper?.isPptUnlocked || currentPaper?.isPptUnlocked;

    if (isUnlocked && directUrl) {
      const link = document.createElement('a');
      link.href = directUrl;
      link.setAttribute('download', currentPaper?.ppt?.filename || 'Board_Paper_Solution_Notes.pdf');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Create ₹19 Razorpay Order
    try {
      setIsPptDownloading(true);
      const orderRes = await createPptPaymentOrder(currentPaper._id);
      
      if (orderRes.data?.alreadyUnlocked && orderRes.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = orderRes.data.downloadUrl;
        link.setAttribute('download', 'Board_Paper_Solution_Notes.pdf');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsPptDownloading(false);
        return;
      }

      const { orderId, amount, keyId } = orderRes.data;

      // Load Razorpay Checkout
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const options = {
        key: keyId || 'rzp_test_placeholder',
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'MentorNearby',
        description: `Solution Notes PPT Download (${currentPaper.year || 'Board Paper'})`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await verifyPptPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            showToast('PPT Download Unlocked Successfully!', 'success');
            
            const dlUrl = verifyRes.data?.downloadUrl;
            if (dlUrl) {
              const link = document.createElement('a');
              link.href = dlUrl;
              link.setAttribute('download', verifyRes.data?.pptFilename || 'Board_Paper_Solution_Notes.pdf');
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            fetchCourseAndPaper();
          } catch (vErr) {
            showToast(vErr.response?.data?.message || 'Payment verification failed', 'error');
          } finally {
            setIsPptDownloading(false);
          }
        },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: function () {
            setIsPptDownloading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initiate PPT download order', 'error');
      setIsPptDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="courses-page-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 600 }}>Opening Free Video Classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page-root" style={{ paddingBottom: 60 }}>
      {/* Top Header Bar */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to={`/courses/${course?.slug || courseId}`}
            style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            ← Back to Course
          </Link>
          <span style={{ color: '#334155' }}>|</span>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            {course?.title}
          </h2>
        </div>

        <div>
          <span style={{ fontSize: 11, fontWeight: 900, background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: 6 }}>
            ✓ 100% FREE CLASSROOM &amp; VIDEO ACCESS
          </span>
        </div>
      </div>

      {/* Classroom Layout */}
      <div className="course-classroom-layout">
        {/* Left: Video Player + Notes */}
        <div>
          <CourseVideoPlayer
            videoUrl={watchAccess?.paper?.video?.url || currentPaper?.video?.url || ''}
            youtubeUrl={watchAccess?.paper?.youtubeUrl || currentPaper?.youtubeUrl || currentPaper?.video?.youtubeUrl || course?.youtubeUrl || ''}
            youtubeVideoId={watchAccess?.paper?.youtubeVideoId || currentPaper?.youtubeVideoId || currentPaper?.video?.youtubeVideoId || ''}
            title={currentPaper?.title || course?.title}
            chapter={currentPaper?.chapter || course?.chapter || ''}
            isFreeSample={true}
            onProgressUpdate={handleProgress}
          />

          {/* Paper Info & Tabs */}
          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 24, marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>
                  {course?.subject} • Year {currentPaper?.year}
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '4px 0 6px' }}>
                  {currentPaper?.title}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  {currentPaper?.paperCode} • ⏱️ {currentPaper?.durationMinutes || 48} mins • 📝 {currentPaper?.questionsCount || 38} Questions
                </span>
              </div>

              {/* PPT Download Button (₹19 or Direct) */}
              <button
                type="button"
                onClick={handlePptDownload}
                disabled={isPptDownloading}
                style={{
                  background: (watchAccess?.paper?.isPptUnlocked || currentPaper?.isPptUnlocked) ? '#ECFDF5' : '#4F46E5',
                  color: (watchAccess?.paper?.isPptUnlocked || currentPaper?.isPptUnlocked) ? '#059669' : '#FFFFFF',
                  border: (watchAccess?.paper?.isPptUnlocked || currentPaper?.isPptUnlocked) ? '1px solid #A7F3D0' : 'none',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>📊</span>
                <span>
                  {isPptDownloading
                    ? 'Processing...'
                    : (watchAccess?.paper?.isPptUnlocked || currentPaper?.isPptUnlocked)
                    ? 'Download Solution PPT (Unlocked)'
                    : 'Download Solution PPT • ₹19'}
                </span>
              </button>
            </div>

            {/* Notes Body (Free for Reading) */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  📌 Model Solution &amp; Marking Scheme Summary (Free to Read)
                </h4>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                  📖 Free Reading
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 14px' }}>
                {currentPaper?.solutionNotes?.summary || 'Official CBSE marking scheme with step-wise marks distribution.'}
              </p>

              {currentPaper?.solutionNotes?.keyFormulas?.length > 0 && (
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'block', marginBottom: 6 }}>
                    ⭐ Key Scoring Criteria:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569' }}>
                    {currentPaper.solutionNotes.keyFormulas.map((f, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Papers Playlist (All Free) */}
        <div>
          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                10-Year Papers Playlist
              </h3>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6 }}>
                100% Free
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto' }}>
              {papers.map((p) => {
                const isActive = p._id === currentPaper?._id;

                return (
                  <div
                    key={p._id}
                    onClick={() => {
                      navigate(`/courses/watch/${course._id}/${p._id}`);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isActive ? '#EEF2FF' : '#F8FAFC',
                      border: `1px solid ${isActive ? '#818CF8' : '#E2E8F0'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: isActive ? '#4F46E5' : '#64748B' }}>
                        {p.year}
                      </span>
                      <div>
                        <h5 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.title}
                        </h5>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          ⏱️ {p.durationMinutes || 48} mins
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 12, color: isActive ? '#4F46E5' : '#059669', fontWeight: 800 }}>
                        {isActive ? '▶ Playing' : '✓ Watch Free'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseWatchPage;
