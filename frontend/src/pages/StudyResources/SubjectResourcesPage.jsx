// ============================================================
// pages/StudyResources/SubjectResourcesPage.jsx
// Dedicated Subject Catalog with 100% Free Online Reading,
// Unit Paid Downloads (Formula: ₹7/₹8, Notes: ₹12/₹14),
// Visible Combo Packs & Print Integration
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  fetchSubjectStudyResources, 
  downloadStudyResourceFile, 
  downloadStudyResourceComboFile 
} from '../../api/studyResources';
import { useAuth } from '../../context/AuthContext';
import { getResourceAccess } from '../../utils/studyResourceAccess';
import StudyPaymentModal from '../../components/studyResources/StudyPaymentModal';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import PrintModal from '../../components/studyResources/PrintModal';
import StudyAdBanner from '../../components/studyResources/StudyAdBanner';
import './StudyResources.css';

const SubjectResourcesPage = () => {
  const { classLevel, subject } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals state
  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    purchaseType: 'INDIVIDUAL', // 'INDIVIDUAL' | 'FORMULA_COMBO' | 'QA_COMBO'
    comboType: null,
    resource: null,
    bundle: null,
  });

  const [viewerModalState, setViewerModalState] = useState({
    isOpen: false,
    resourceId: null,
    resource: null,
    isCombo: false,
  });

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintTitle, setSelectedPrintTitle] = useState('');

  useEffect(() => {
    loadSubjectData();
  }, [classLevel, subject]);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetchSubjectStudyResources(classLevel, subject);
      setData(res?.data || res);
    } catch (err) {
      console.error('Failed to fetch subject study resources', err);
      setErrorMsg(err.response?.data?.message || 'Unable to load resources for this subject.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyFormulaCombo = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/study-resources/class/${classLevel}/${subject}` } });
      return;
    }
    const b = data?.combos?.formulaBundle || data?.bundle || formulaBundle;
    setPaymentModalState({
      isOpen: true,
      purchaseType: 'FORMULA_COMBO',
      comboType: 'FORMULA_COMBO',
      resource: null,
      bundle: b,
    });
  };

  const handleBuyQaCombo = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/study-resources/class/${classLevel}/${subject}` } });
      return;
    }
    const b = data?.combos?.qaBundle || qaBundle;
    setPaymentModalState({
      isOpen: true,
      purchaseType: 'QA_COMBO',
      comboType: 'QA_COMBO',
      resource: null,
      bundle: b,
    });
  };

  const handleBuySingleResource = (resource) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/study-resources/class/${classLevel}/${subject}` } });
      return;
    }
    setPaymentModalState({
      isOpen: true,
      purchaseType: 'INDIVIDUAL',
      comboType: null,
      resource: resource,
      bundle: null,
    });
  };

  const handleReadDoc = (resource, isCombo = false) => {
    const rId = typeof resource === 'string' ? resource : resource?._id || resource?.id;
    const rObj = typeof resource === 'object' ? resource : null;
    const isFormula =
      rObj?.resourceType === 'FORMULA_SHEET' ||
      rObj?.type === 'FORMULA' ||
      (rId && String(rId).includes('formula')) ||
      (rObj?.title && String(rObj.title).toLowerCase().includes('formula'));

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

    const targetUrl = getFullDocUrl(rObj?.fileUrl || rObj?.fileReference?.url || `/api/study-resources/stream/${rId}`);

    if (!isFormula) {
      // Notes PDF: Open original Notes PDF in a NEW BROWSER TAB directly
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Formula Sheet: Open in-browser centered viewer modal
    setViewerModalState({
      isOpen: true,
      resourceId: rId,
      resource: rObj,
      isCombo: Boolean(isCombo || rObj?.isCombo || rObj?.comboType),
    });
  };

  const handleDirectDownload = async (resource) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/study-resources/class/${classLevel}/${subject}` } });
      return;
    }
    try {
      const res = await downloadStudyResourceFile(resource._id || resource.id);
      const url = res?.downloadUrl || res?.data?.downloadUrl;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${resource.title || 'study_notes'}.pdf`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        handleBuySingleResource(resource);
      } else {
        alert('Failed to download document. Please try again.');
      }
    }
  };

  const handleDirectComboDownload = async (bundle) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/study-resources/class/${classLevel}/${subject}` } });
      return;
    }
    try {
      const res = await downloadStudyResourceComboFile(bundle._id || bundle.id);
      const url = res?.downloadUrl || res?.data?.downloadUrl;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${bundle.title || 'study_combo'}.pdf`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        handleBuyFormulaCombo();
      } else {
        alert('Failed to download combo file. Please try again.');
      }
    }
  };

  const handlePaymentSuccess = () => {
    loadSubjectData();
  };

  const handleOpenPrintModal = (title) => {
    setSelectedPrintTitle(title || `Class ${classLevel} ${subject} Study Notes`);
    setPrintModalOpen(true);
  };

  const scrollToChapters = () => {
    const el = document.getElementById('chapters-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="sr-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading Class {classLevel} {subject} Resources...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="sr-root" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', background: '#FFFFFF', padding: 32, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <h2 style={{ fontSize: 20, color: '#0F172A', margin: '14px 0 8px' }}>Unable to Load Material</h2>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>{errorMsg || 'Could not fetch material for this subject.'}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={loadSubjectData}
              style={{ background: '#2563EB', color: '#FFF', padding: '10px 20px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              🔄 Retry
            </button>
            <Link to="/study-resources" style={{ display: 'inline-block', background: '#F1F5F9', color: '#334155', padding: '10px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', border: '1px solid #CBD5E1' }}>
              Back to Study Resources
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const chapters = Array.isArray(data.chapters) ? data.chapters : [];
  const combos = data.combos || {};
  const totalResourcesCount = data.totalResourcesCount || chapters.reduce((acc, c) => acc + (c.resources?.length || 0), 0);

  const isSenior = (classLevel === '11' || classLevel === '12');
  const formulaComboPrice = isSenior ? 60 : 50;
  const qaComboPrice = isSenior ? 120 : 100;
  const singleFormulaPrice = isSenior ? 8 : 7;
  const singleNotesPrice = isSenior ? 14 : 12;

  const formulaBundle = combos.formulaBundle || data.bundle || {
    title: `Class ${classLevel} ${subject} Formula Sheets Combo`,
    description: `All Chapter Formula Sheets with definitions, equations, SI units, and key derivations.`,
    price: formulaComboPrice,
    normalTotal: chapters.length * singleFormulaPrice,
    savings: Math.max(0, chapters.length * singleFormulaPrice - formulaComboPrice),
    resourceCount: chapters.length,
    discountPercentage: 45,
  };

  const qaBundle = combos.qaBundle || {
    title: `Class ${classLevel} ${subject} Complete Notes & PPT Combo`,
    description: `All Chapter Revision Notes & Presentation Decks with step-by-step marking-scheme solutions.`,
    price: qaComboPrice,
    normalTotal: chapters.length * singleNotesPrice,
    savings: Math.max(0, chapters.length * singleNotesPrice - qaComboPrice),
    resourceCount: chapters.length,
    discountPercentage: 48,
  };

  return (
    <div className="sr-root">
      <div className="sr-container">
        
        {/* Breadcrumb */}
        <div className="sr-breadcrumb">
          <Link to="/">Home</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <Link to="/study-resources">Study Resources</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <span className="sr-breadcrumb-active">Class {classLevel} {subject}</span>
        </div>

        {/* 🎁 2 UNITS FREE DEMO HERO BANNER */}
        <div className="sr-hero" style={{ marginBottom: 28 }}>
          <div className="sr-hero-glow"></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 900, marginBottom: 12 }}>
              <span>🎁</span>
              <span>2 UNITS FREE DEMO</span>
            </div>

            <h1 className="sr-hero-title">
              Class {classLevel} {subject} Study Material
            </h1>
            <p className="sr-hero-subtitle" style={{ maxWidth: 640 }}>
              Start preparing with our first two units completely free. Formula Sheets + Important Questions &amp; Answers are open for free reading. Unit 3 onwards are premium.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
              <button
                type="button"
                onClick={scrollToChapters}
                style={{
                  background: '#FDE047',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 800,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(253, 224, 71, 0.35)',
                }}
              >
                🎁 Explore Free Units →
              </button>

              <button
                type="button"
                onClick={() => handleOpenPrintModal(`Class ${classLevel} ${subject} Complete Decks`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🖨️</span>
                <span>Print My Notes (Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. DUAL COMBO STORE CARDS                                   */}
        {/* ============================================================ */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 className="sr-section-title">
              <span>⚡</span>
              <span>All-Chapter Combo Packs</span>
            </h2>
            <p className="sr-section-subtitle">
              Get all chapters together and save more with full download access.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            
            {/* Combo 1: Formula Sheets Combo */}
            <div className={`sr-combo-card sr-combo-card-formula ${formulaBundle.isPurchased ? 'purchased' : ''}`}>
              <div className="sr-combo-card-top">
                <div className="sr-combo-card-badge sr-combo-card-badge-formula">⚡ ALL-CHAPTER FORMULA DECK</div>
                <h3 className="sr-combo-card-title">{formulaBundle.title}</h3>
                <p className="sr-combo-card-desc">{formulaBundle.description}</p>
                
                <div className="sr-combo-card-features">
                  <div className="sr-combo-card-feature">✓ All Chapter Formula Sheets ({formulaBundle.resourceCount || chapters.length} Chapters)</div>
                  <div className="sr-combo-card-feature">✓ Lifetime Access &amp; PDF Download</div>
                  <div className="sr-combo-card-feature">✓ Instant Digital Delivery</div>
                </div>
              </div>

              <div className="sr-combo-card-bottom">
                <div className="sr-combo-card-pricing">
                  {formulaBundle.normalTotal > formulaBundle.price && (
                    <span className="sr-combo-card-orig">Individual: ₹{formulaBundle.normalTotal}</span>
                  )}
                  <span className="sr-combo-card-price">₹{formulaBundle.price}</span>
                  {formulaBundle.savings > 0 && (
                    <span className="sr-combo-card-savings">Save ₹{formulaBundle.savings} ({formulaBundle.discountPercentage}% OFF)</span>
                  )}
                </div>

                {formulaBundle.isPurchased ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleReadDoc(formulaBundle, true)}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#059669',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13.5,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>📖</span>
                      <span>Read Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectComboDownload(formulaBundle)}
                      className="sr-combo-card-btn-unlocked"
                      style={{ flex: 1, minWidth: 120 }}
                    >
                      <span>✓</span>
                      <span>Download PDF</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleReadDoc(formulaBundle, true)}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#059669',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13.5,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>📖</span>
                      <span>Read Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyFormulaCombo}
                      className="sr-combo-card-btn"
                      style={{ flex: 1, minWidth: 120 }}
                    >
                      <span>⬇️</span>
                      <span>Download (₹{formulaBundle.price})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Combo 2: Important Questions + Answers Combo */}
            <div className={`sr-combo-card sr-combo-card-qa ${qaBundle.isPurchased ? 'purchased' : ''}`}>
              <div className="sr-combo-card-top">
                <div className="sr-combo-card-badge sr-combo-card-badge-qa">📚 ALL-CHAPTER Q&amp;A BANK</div>
                <h3 className="sr-combo-card-title">{qaBundle.title}</h3>
                <p className="sr-combo-card-desc">{qaBundle.description}</p>
                
                <div className="sr-combo-card-features">
                  <div className="sr-combo-card-feature">✓ All Chapter Important Q&amp;A ({qaBundle.resourceCount || chapters.length} Chapters)</div>
                  <div className="sr-combo-card-feature">✓ Exam-Focused Questions &amp; Detailed Solutions</div>
                  <div className="sr-combo-card-feature">✓ Lifetime Access &amp; PDF Download</div>
                </div>
              </div>

              <div className="sr-combo-card-bottom">
                <div className="sr-combo-card-pricing">
                  {qaBundle.normalTotal > qaBundle.price && (
                    <span className="sr-combo-card-orig">Individual: ₹{qaBundle.normalTotal}</span>
                  )}
                  <span className="sr-combo-card-price">₹{qaBundle.price}</span>
                  {qaBundle.savings > 0 && (
                    <span className="sr-combo-card-savings">Save ₹{qaBundle.savings} ({qaBundle.discountPercentage}% OFF)</span>
                  )}
                </div>

                {qaBundle.isPurchased ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleReadDoc(qaBundle, true)}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#7C3AED',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13.5,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>📖</span>
                      <span>Read Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectComboDownload(qaBundle)}
                      className="sr-combo-card-btn-unlocked"
                      style={{ flex: 1, minWidth: 120 }}
                    >
                      <span>✓</span>
                      <span>Download PDF</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleReadDoc(qaBundle, true)}
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#7C3AED',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13.5,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>📖</span>
                      <span>Read Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyQaCombo}
                      className="sr-combo-card-btn"
                      style={{ flex: 1, minWidth: 120 }}
                    >
                      <span>⬇️</span>
                      <span>Download (₹{qaBundle.price})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sponsor Banner */}
        <StudyAdBanner format="horizontal" />

        {/* Section Header */}
        <div id="chapters-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="sr-section-title">
              <span>📖</span>
              <span>Chapter-Wise Study Material ({totalResourcesCount} Docs)</span>
            </h2>
            <p className="sr-section-subtitle">
              📖 100% Free Online Reading for all Formula Sheets &amp; Q&amp;A Notes. ⬇️ Purchase unlock to download original printable PDFs.
            </p>
          </div>
          <button
            onClick={() => handleOpenPrintModal(`Class ${classLevel} ${subject} Notes`)}
            style={{
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🖨️</span> Print My Notes
          </button>
        </div>

        {/* ============================================================ */}
        {/* 2. CHAPTER-WISE RESOURCE GROUPS                              */}
        {/* ============================================================ */}
        <div className="sr-chapters-list">
          {chapters.map((ch) => {
            const chNum = Number(ch.chapterNumber) || 1;
            const isFreeDemoChapter = chNum <= 2;

            return (
              <div key={chNum} className="sr-chapter-group">
                
                {/* Chapter Header */}
                <div className="sr-chapter-group-header">
                  <div className="sr-chapter-badge-title">
                    <span className="sr-chapter-num-badge">
                      Ch {chNum}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 className="sr-chapter-title">{ch.chapterTitle || `Chapter ${chNum}`}</h3>
                        {isFreeDemoChapter ? (
                          <span style={{ fontSize: 11, fontWeight: 900, background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 8px', borderRadius: 6 }}>
                            🎁 FREE DEMO UNIT
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 900, background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', padding: '1px 8px', borderRadius: 6 }}>
                            🔒 PREMIUM UNIT
                          </span>
                        )}
                      </div>
                      {ch.unit && <span className="sr-unit-name">{ch.unit}</span>}
                    </div>
                  </div>

                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                    {(ch.resources || []).length} Materials
                  </span>
                </div>

                {/* Chapter Resources Grid (Formula Sheet + Important Q&A) */}
                <div className="sr-resources-grid">
                  {(ch.resources || []).map((res) => {
                    const isFormula = res.resourceType === 'FORMULA_SHEET';
                    const isFreeDemo = isFreeDemoChapter || Boolean(res.isFreeDemo);
                    
                    // Exact Pricing:
                    // Class 9/10: Formula Sheet = ₹7, Notes/PPT = ₹12
                    // Class 11/12: Formula Sheet = ₹8, Notes/PPT = ₹14
                    const displayOrigPrice = res.originalPrice || (isFormula ? 49 : 79);
                    const defaultSalePrice = isFormula ? singleFormulaPrice : singleNotesPrice;
                    const salePrice = Number(res.downloadPrice || res.salePrice) || defaultSalePrice;

                    return (
                      <div
                        key={res._id}
                        className={`sr-resource-card ${res.isDownloadUnlocked ? 'unlocked' : ''}`}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className={`sr-res-type-badge ${isFormula ? 'formula' : 'qa'}`}>
                              {isFormula ? '📘 FORMULA SHEET' : '📝 NOTES / PPT'}
                            </span>
                            
                            {res.isDownloadUnlocked ? (
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12 }}>
                                ✓ UNLOCKED
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 900, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                                📖 FREE READING
                              </span>
                            )}
                          </div>

                          <h4 className="sr-res-title">{res.title}</h4>
                          <p className="sr-res-desc">
                            {res.description || 'Master formulas, definitions, key derivations and exam questions.'}
                          </p>
                        </div>

                        <div className="sr-res-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                          
                          {/* Pricing Display */}
                          <div className="sr-res-pricing">
                            {res.isDownloadUnlocked ? (
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span>✓</span> {res.unlockedVia === 'FORMULA_COMBO' ? 'In Formula Combo' : res.unlockedVia === 'QA_COMBO' ? 'In Q&A Combo' : 'Purchased'}
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>
                                  📖 Free Online Reading
                                </span>
                                <span style={{ fontSize: 11, color: '#64748B' }}>
                                  Download PDF: ₹{salePrice}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: 📖 Read Free Online + ⬇️ Download / Unlock */}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleReadDoc(res)}
                              className="sr-btn-open-single"
                              style={{
                                background: '#059669',
                                borderColor: '#059669',
                                color: '#FFF',
                                fontWeight: 800,
                              }}
                              title="Read this document online for free"
                            >
                              <span>📖</span> Read Free
                            </button>

                            {res.isDownloadUnlocked ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDirectDownload(res)}
                                  className="sr-btn-open-single"
                                  style={{ background: '#1E293B', borderColor: '#1E293B', color: '#FFF' }}
                                  title="Download purchased original document"
                                >
                                  <span>⬇️</span> Download PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintModal(res.title)}
                                  style={{
                                    background: '#F1F5F9',
                                    borderColor: '#CBD5E1',
                                    color: '#334155',
                                    padding: '7px 10px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: '1px solid #CBD5E1',
                                  }}
                                >
                                  🖨️ Print
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBuySingleResource({ ...res, salePrice, downloadPrice: salePrice, originalPrice: displayOrigPrice })}
                                className="sr-btn-unlock-single"
                                style={{ padding: '7px 12px', fontSize: 12 }}
                                title={`Unlock original PDF download for ₹${salePrice}`}
                              >
                                <span>⬇️</span> ₹{salePrice}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* 3. PRINTING & DELIVERY CALLOUT BANNER                        */}
        {/* ============================================================ */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: 18,
            padding: '24px 28px',
            color: '#FFFFFF',
            marginTop: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(253, 230, 138, 0.15)', color: '#FDE68A', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
              <span>🖨️</span>
              <span>PRINT MY NOTES</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0', color: '#FFFFFF' }}>
              Want a physical copy of your notes?
            </h3>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, maxWidth: 550, lineHeight: 1.45 }}>
              Get your notes printed and delivered to your doorstep. Printing partnerships are coming soon!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleOpenPrintModal(`Class ${classLevel} ${subject} Notes`)}
              style={{
                background: '#EAB308',
                color: '#0F172A',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🖨️ Print My Notes</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <StudyPaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, purchaseType: 'INDIVIDUAL', comboType: null, resource: null, bundle: null })}
        purchaseType={paymentModalState.purchaseType}
        comboType={paymentModalState.comboType}
        resource={paymentModalState.resource}
        bundle={paymentModalState.bundle}
        classLevel={classLevel}
        subject={subject}
        onSuccess={handlePaymentSuccess}
      />

      <StudyResourceViewerModal
        isOpen={viewerModalState.isOpen}
        onClose={() => setViewerModalState({ isOpen: false, resourceId: null, resource: null, isCombo: false })}
        resourceId={viewerModalState.resourceId}
        resource={viewerModalState.resource}
        isCombo={viewerModalState.isCombo}
        onBuyDownload={(res) => {
          setViewerModalState({ isOpen: false, resourceId: null, resource: null, isCombo: false });
          if (res?.isCombo || res?.comboType) {
            const isQa = res.comboType === 'QA_COMBO' || res.resourceType === 'IMPORTANT_QUESTIONS_ANSWERS';
            if (isQa) {
              handleBuyQaCombo();
            } else {
              handleBuyFormulaCombo();
            }
          } else {
            handleBuySingleResource(res);
          }
        }}
      />

      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        resourceTitle={selectedPrintTitle}
      />
    </div>
  );
};

export default SubjectResourcesPage;
