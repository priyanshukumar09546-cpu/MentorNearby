// ============================================================
// pages/StudentDashboard/StudentPurchasesPage.jsx
// My Purchased Study Resources & Downloads
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyPurchases, downloadStudyResourceFile } from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import PrintModal from '../../components/studyResources/PrintModal';
import '../StudyResources/StudyResources.css';

const StudentPurchasesPage = () => {
  const [loading, setLoading] = useState(true);
  const [purchasesData, setPurchasesData] = useState({ individualDownloads: [], comboPacks: [] });
  const [viewerModalData, setViewerModalData] = useState({ isOpen: false, resourceId: null });
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintTitle, setSelectedPrintTitle] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetchMyPurchases();
      setPurchasesData({
        individualDownloads: res.data.individualDownloads || [],
        comboPacks: res.data.comboPacks || [],
      });
    } catch (err) {
      console.error('Failed to load user purchases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (item) => {
    try {
      const res = await downloadStudyResourceFile(item.resourceId || item._id);
      if (res.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.data.downloadUrl;
        link.download = res.data.filename || `${item.title}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed. Please check authorization.');
    }
  };

  const handleOpenPrintModal = (title) => {
    setSelectedPrintTitle(title);
    setPrintModalOpen(true);
  };

  const { individualDownloads, comboPacks } = purchasesData;
  const totalCount = individualDownloads.length + comboPacks.length;

  return (
    <div className="sr-root">
      <div className="sr-container">
        
        {/* Breadcrumb Navigation */}
        <div className="sr-breadcrumb">
          <Link to="/">Home</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <Link to="/dashboard">Student Portal</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <span className="sr-breadcrumb-active">My Downloads &amp; Combos</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
              📥 My Downloads &amp; Purchases
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Re-download your purchased PDF materials and view active subject combo packs.
            </p>
          </div>

          <Link
            to="/study-resources"
            style={{
              background: '#4F46E5',
              color: '#FFF',
              padding: '10px 20px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🔍</span> Browse Catalog →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E0E7FF', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Loading your downloads...</p>
          </div>
        ) : totalCount === 0 ? (
          <div style={{ background: '#FFF', padding: '60px 24px', textAlign: 'center', borderRadius: 20, border: '1px solid #EEF2F6', marginTop: 10 }}>
            <span style={{ fontSize: 48 }}>🎒</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '16px 0 8px' }}>No Purchased Downloads Yet</h3>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 24px' }}>
              All study materials are 100% free to read online. You can purchase offline PDF downloads starting from ₹7 whenever you need a printable copy!
            </p>
            <Link
              to="/study-resources"
              className="sr-btn-combo-buy"
              style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}
            >
              Explore Study Resources Catalog →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            
            {/* 1. Purchased Subject Combos */}
            {comboPacks.length > 0 && (
              <div>
                <h2 className="sr-section-title" style={{ marginBottom: 14 }}>
                  <span>🔥</span> Active Subject Combos ({comboPacks.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {comboPacks.map((b) => (
                    <div key={b.purchaseId} style={{ background: '#FFF', border: '1.5px solid #86EFAC', borderRadius: 16, padding: 22, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '3px 10px', borderRadius: 20 }}>
                          ✓ {b.comboType === 'QA_COMBO' ? 'Q&A COMBO UNLOCKED' : 'FORMULA COMBO UNLOCKED'}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                          Paid ₹{b.amount}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                        {b.title}
                      </h3>

                      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
                        Class {b.classLevel} • {b.subject} — All downloads unlocked for this combo.
                      </p>

                      <Link
                        to={`/study-resources/class/${b.classLevel}/${b.subject.toLowerCase()}`}
                        style={{
                          background: '#10B981',
                          color: '#FFF',
                          padding: '10px 18px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span>📂</span> Open Subject Resources &amp; PDFs
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Individual Purchased Documents */}
            {individualDownloads.length > 0 && (
              <div>
                <h2 className="sr-section-title" style={{ marginBottom: 14 }}>
                  <span>📄</span> Individual PDF Downloads ({individualDownloads.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {individualDownloads.map((item) => (
                    <div key={item.purchaseId} className="sr-resource-card unlocked" style={{ background: '#FFF' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span className={`sr-res-type-badge ${item.resourceType === 'FORMULA_SHEET' ? 'formula' : 'qa'}`}>
                            {item.resourceType === 'FORMULA_SHEET' ? '📄 Formula Sheet' : '✍️ Important Q&A'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                            Class {item.classLevel} • {item.subject}
                          </span>
                        </div>

                        <h4 className="sr-res-title">{item.title}</h4>
                        <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 12 }}>
                          Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="sr-res-footer">
                        <button
                          onClick={() => setViewerModalData({ isOpen: true, resourceId: item.resourceId })}
                          className="sr-btn-open-single"
                          style={{ background: '#059669', borderColor: '#059669', color: '#FFF' }}
                        >
                          <span>📖</span> Read Online
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(item)}
                          className="sr-btn-open-single"
                          style={{ background: '#1E293B', borderColor: '#1E293B', color: '#FFF' }}
                        >
                          <span>⬇️</span> Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Resource Viewer Modal */}
      {viewerModalData.isOpen && (
        <StudyResourceViewerModal
          isOpen={viewerModalData.isOpen}
          onClose={() => setViewerModalData({ isOpen: false, resourceId: null })}
          resourceId={viewerModalData.resourceId}
        />
      )}

      {/* Print Modal */}
      {printModalOpen && (
        <PrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          resourceTitle={selectedPrintTitle}
        />
      )}

    </div>
  );
};

export default StudentPurchasesPage;
