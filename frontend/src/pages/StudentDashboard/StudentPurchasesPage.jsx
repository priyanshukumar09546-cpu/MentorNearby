// ============================================================
// pages/StudentDashboard/StudentPurchasesPage.jsx
// My Purchased Study Resources, Downloads & Physical Print Orders
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMyPurchases,
  downloadStudyResourceFile,
  fetchMyPrintOrders,
} from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import PrintModal from '../../components/studyResources/PrintModal';
import '../StudyResources/StudyResources.css';

const StudentPurchasesPage = () => {
  const [activeTab, setActiveTab] = useState('downloads'); // 'downloads' | 'print_orders'
  const [loading, setLoading] = useState(true);
  const [purchasesData, setPurchasesData] = useState({ individualDownloads: [], comboPacks: [] });
  const [printOrders, setPrintOrders] = useState([]);
  const [loadingPrintOrders, setLoadingPrintOrders] = useState(false);
  const [viewerModalData, setViewerModalData] = useState({ isOpen: false, resourceId: null });
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintTitle, setSelectedPrintTitle] = useState('');

  useEffect(() => {
    loadPurchases();
    loadPrintOrders();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetchMyPurchases();
      setPurchasesData({
        individualDownloads: res.data?.individualDownloads || [],
        comboPacks: res.data?.comboPacks || [],
      });
    } catch (err) {
      console.error('Failed to load user purchases', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrintOrders = async () => {
    try {
      setLoadingPrintOrders(true);
      const res = await fetchMyPrintOrders();
      setPrintOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Failed to load print orders', err);
    } finally {
      setLoadingPrintOrders(false);
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

  const { individualDownloads, comboPacks } = purchasesData;
  const totalDownloadsCount = individualDownloads.length + comboPacks.length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', bg: '#DCFCE7', text: '#15803D', icon: '✓' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', bg: '#F3E8FF', text: '#7E22CE', icon: '🚚' };
      case 'PRINTING':
        return { label: 'Printing in Progress', bg: '#E0E7FF', text: '#4338CA', icon: '🖨️' };
      case 'CONFIRMED':
        return { label: 'Order Confirmed', bg: '#DCFCE7', text: '#15803D', icon: '✓' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C', icon: '✕' };
      default:
        return { label: 'Order Placed', bg: '#FEF3C7', text: '#B45309', icon: '⏳' };
    }
  };

  return (
    <div className="sr-root">
      <div className="sr-container">
        
        {/* Breadcrumb Navigation */}
        <div className="sr-breadcrumb">
          <Link to="/">Home</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <Link to="/dashboard">Student Portal</Link>
          <span className="sr-breadcrumb-sep">&gt;</span>
          <span className="sr-breadcrumb-active">My Orders &amp; Downloads</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
              📚 My Orders &amp; Downloads
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Track physical print orders, re-download purchased PDFs, and manage subject combos.
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('downloads')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'downloads' ? '#1E293B' : '#F1F5F9',
              color: activeTab === 'downloads' ? '#FFF' : '#475569',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>📥 PDF Downloads &amp; Combos</span>
            <span
              style={{
                background: activeTab === 'downloads' ? '#334155' : '#E2E8F0',
                color: activeTab === 'downloads' ? '#FFF' : '#64748B',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {totalDownloadsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('print_orders')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'print_orders' ? '#1E293B' : '#F1F5F9',
              color: activeTab === 'print_orders' ? '#FFF' : '#475569',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span>🖨️ Physical Print Orders</span>
            <span
              style={{
                background: activeTab === 'print_orders' ? '#334155' : '#E2E8F0',
                color: activeTab === 'print_orders' ? '#FFF' : '#64748B',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {printOrders.length}
            </span>
          </button>
        </div>

        {/* TAB 1: DOWNLOADS & COMBOS */}
        {activeTab === 'downloads' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #E0E7FF', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Loading your downloads...</p>
              </div>
            ) : totalDownloadsCount === 0 ? (
              <div style={{ background: '#FFF', padding: '60px 24px', textAlign: 'center', borderRadius: 20, border: '1px solid #EEF2F6', marginTop: 10 }}>
                <span style={{ fontSize: 48 }}>🎒</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '16px 0 8px' }}>No Purchased Downloads Yet</h3>
                <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 24px' }}>
                  All study materials are 100% free to read online. You can purchase offline PDF downloads starting from ₹7 or order home-delivered spiral printed copies!
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    to="/study-resources"
                    className="sr-btn-combo-buy"
                    style={{ display: 'inline-flex', width: 'auto', padding: '12px 28px' }}
                  >
                    Explore Study Resources Catalog →
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedPrintTitle('Class 10 Mathematics Notes');
                      setPrintModalOpen(true);
                    }}
                    style={{
                      background: '#FFF',
                      border: '1.5px solid #CBD5E1',
                      color: '#0F172A',
                      padding: '12px 24px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🖨️</span> Order Print Copy
                  </button>
                </div>
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
                              ✓ {b.comboType === 'QA_COMBO' ? 'NOTES COMBO UNLOCKED' : 'FORMULA COMBO UNLOCKED'}
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
                                {item.resourceType === 'FORMULA_SHEET' ? '📄 Formula Sheet' : '📝 Notes'}
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
        )}

        {/* TAB 2: PHYSICAL PRINT ORDERS */}
        {activeTab === 'print_orders' && (
          <div>
            {loadingPrintOrders ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 36, height: 36, border: '3px solid #E0E7FF', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Loading your print orders...</p>
              </div>
            ) : printOrders.length === 0 ? (
              <div style={{ background: '#FFF', padding: '60px 24px', textAlign: 'center', borderRadius: 20, border: '1px solid #EEF2F6', marginTop: 10 }}>
                <span style={{ fontSize: 48 }}>🖨️</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '16px 0 8px' }}>No Physical Print Orders Yet</h3>
                <p style={{ fontSize: 13, color: '#64748B', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Order spiral-bound or softcover printed copies of study notes, formula sheets, and PYQ collections delivered directly to your doorstep via nearby print partners, Blinkit, or Zepto!
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedPrintTitle('Class 10 Mathematics Notes');
                      setPrintModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                      color: '#FFF',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    <span>🖨️</span> Place a New Print Order
                  </button>
                  <Link
                    to="/study-resources"
                    style={{
                      background: '#FFF',
                      border: '1.5px solid #CBD5E1',
                      color: '#0F172A',
                      padding: '12px 24px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>📂</span> Browse Study Resources
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                    Showing {printOrders.length} physical print {printOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPrintTitle('');
                      setPrintModalOpen(true);
                    }}
                    style={{
                      background: '#4F46E5',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>+</span> New Print Order
                  </button>
                </div>

                {printOrders.map((order) => {
                  const statusMeta = getStatusBadge(order.status);
                  const isPaid = order.payment?.status === 'PAID' || order.payment?.status === 'COD_VERIFIED';

                  return (
                    <div
                      key={order._id || order.orderId}
                      style={{
                        background: '#FFF',
                        borderRadius: 16,
                        border: '1.5px solid #E2E8F0',
                        padding: 22,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Top Bar: Order ID, Date, Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', letterSpacing: 0.5 }}>
                            📦 {order.orderId}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: statusMeta.bg,
                              color: statusMeta.text,
                              padding: '4px 10px',
                              borderRadius: 20,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>{statusMeta.icon}</span> {statusMeta.label}
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: isPaid ? '#DCFCE7' : '#FEF3C7',
                              color: isPaid ? '#15803D' : '#B45309',
                              padding: '4px 10px',
                              borderRadius: 20,
                            }}
                          >
                            {order.payment?.method === 'COD' ? '💵 COD' : '💳 Paid Online'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Document details & Specifications */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                        {/* Document & Specs */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                            Document &amp; Provider
                          </div>
                          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                            {order.document?.title || 'Study Material Printout'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, color: '#4F46E5' }}>🏪 {order.provider?.name || 'Local Print Partner'}</span>
                            {order.document?.classLevel && <span>• Class {order.document.classLevel}</span>}
                            {order.document?.subject && <span>• {order.document.subject}</span>}
                          </div>

                          {/* Print Specs Chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              📄 {order.specifications?.copies || 1} {order.specifications?.copies === 1 ? 'Copy' : 'Copies'}
                            </span>
                            <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              🎨 {order.specifications?.colorMode === 'COLOR' ? 'Color' : 'Black & White'}
                            </span>
                            <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              📖 {order.specifications?.printSides === 'SINGLE' ? 'Single-Sided' : 'Double-Sided'}
                            </span>
                            <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              📑 {order.specifications?.binding === 'SPIRAL' ? 'Spiral Bound' : order.specifications?.binding === 'SOFTCOVER' ? 'Softcover Book' : 'No Binding / Stapled'}
                            </span>
                            <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                              📄 ~{order.specifications?.pageCount || 10} Pages
                            </span>
                          </div>
                        </div>

                        {/* Delivery Address & Tracking */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                            Delivery Details
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                            {order.customer?.name} ({order.customer?.phone})
                          </div>
                          <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>
                            {order.customer?.address?.street}, {order.customer?.address?.city}, {order.customer?.address?.state} - {order.customer?.address?.pincode}
                          </p>

                          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '8px 12px', border: '1px solid #E2E8F0', fontSize: 11, color: '#475569' }}>
                            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>
                              🚚 Courier / Delivery Partner:
                            </div>
                            <div>{order.tracking?.courierPartner || 'Local Partner Express Delivery'}</div>
                            {order.tracking?.trackingNumber && (
                              <div style={{ marginTop: 2, fontWeight: 700, color: '#4F46E5' }}>
                                AWB / Tracking: {order.tracking.trackingNumber}
                              </div>
                            )}
                            {order.tracking?.estimatedDelivery && (
                              <div style={{ marginTop: 2, color: '#059669', fontWeight: 700 }}>
                                Est. Delivery: {new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                            Payment Summary
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                            <span>Print Cost:</span>
                            <span>₹{order.pricing?.printCost || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                            <span>Binding:</span>
                            <span>₹{order.pricing?.bindingCost || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                            <span>Delivery:</span>
                            <span>{order.pricing?.deliveryCost === 0 ? 'FREE' : `₹${order.pricing?.deliveryCost}`}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0F172A', borderTop: '1px solid #CBD5E1', paddingTop: 8 }}>
                            <span>Total Paid:</span>
                            <span style={{ color: '#4F46E5' }}>₹{order.pricing?.totalAmount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          onClose={() => {
            setPrintModalOpen(false);
            loadPrintOrders();
          }}
          resourceTitle={selectedPrintTitle}
        />
      )}

    </div>
  );
};

export default StudentPurchasesPage;
