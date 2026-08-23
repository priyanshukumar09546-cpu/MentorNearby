// ============================================================
// pages/Admin/AdminFooterCmsPage.jsx
// Complete Admin Control Center for Footer, Social Media, Trust Banner,
// CMS Pages (Legal/Support), and FAQs
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  fetchFooterConfig,
  updateFooterConfig,
  fetchAllCmsPages,
  saveCmsPage,
  deleteCmsPage,
  fetchFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import './admin.css';

const AdminFooterCmsPage = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('FOOTER_NAV'); // 'FOOTER_NAV', 'SOCIALS', 'TRUST_BOTTOM', 'CMS_PAGES', 'FAQS'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Footer State
  const [footerConfig, setFooterConfig] = useState(null);

  // CMS Pages State
  const [cmsPages, setCmsPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageForm, setPageForm] = useState({
    slug: '',
    title: '',
    category: 'LEGAL',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: true,
  });

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'GENERAL',
    order: 0,
    published: true,
  });

  // Load all initial data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [footerRes, pagesRes, faqsRes] = await Promise.all([
        fetchFooterConfig(),
        fetchAllCmsPages(),
        fetchFaqs('ALL'),
      ]);

      if (footerRes.data?.footer) {
        setFooterConfig(footerRes.data.footer);
      }
      if (pagesRes.data?.pages) {
        setCmsPages(pagesRes.data.pages);
        if (pagesRes.data.pages.length > 0 && !selectedPage) {
          handleSelectPage(pagesRes.data.pages[0]);
        }
      }
      if (faqsRes.data?.faqs) {
        setFaqs(faqsRes.data.faqs);
      }
    } catch (err) {
      showToast('Failed to load CMS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save Footer Config
  const handleSaveFooter = async () => {
    try {
      setSaving(true);
      await updateFooterConfig(footerConfig);
      showToast('Footer configuration saved successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save footer', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Column Link Handlers ---
  const handleAddLinkToColumn = (colIdx) => {
    const newConfig = { ...footerConfig };
    const targetCol = newConfig.columns[colIdx];
    if (!targetCol.links) targetCol.links = [];
    targetCol.links.push({
      label: 'New Link',
      path: '/tutors',
      enabled: true,
    });
    setFooterConfig(newConfig);
  };

  const handleUpdateLink = (colIdx, linkIdx, field, value) => {
    const newConfig = { ...footerConfig };
    newConfig.columns[colIdx].links[linkIdx][field] = value;
    setFooterConfig(newConfig);
  };

  const handleDeleteLink = (colIdx, linkIdx) => {
    const newConfig = { ...footerConfig };
    newConfig.columns[colIdx].links.splice(linkIdx, 1);
    setFooterConfig(newConfig);
  };

  const handleMoveLink = (colIdx, linkIdx, direction) => {
    const newConfig = { ...footerConfig };
    const links = newConfig.columns[colIdx].links;
    const targetIdx = linkIdx + direction;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const temp = links[linkIdx];
    links[linkIdx] = links[targetIdx];
    links[targetIdx] = temp;
    setFooterConfig(newConfig);
  };

  // --- Social Media Handlers ---
  const handleAddSocial = () => {
    const newConfig = { ...footerConfig };
    if (!newConfig.socials) newConfig.socials = [];
    newConfig.socials.push({
      id: `social-${Date.now()}`,
      platform: 'New Platform',
      handle: '@MentorNearby',
      url: 'https://mentornearby.in',
      icon: 'youtube',
      enabled: true,
    });
    setFooterConfig(newConfig);
  };

  const handleUpdateSocial = (idx, field, value) => {
    const newConfig = { ...footerConfig };
    newConfig.socials[idx][field] = value;
    setFooterConfig(newConfig);
  };

  const handleDeleteSocial = (idx) => {
    const newConfig = { ...footerConfig };
    newConfig.socials.splice(idx, 1);
    setFooterConfig(newConfig);
  };

  // --- Trust Item Handlers ---
  const handleUpdateTrustItem = (idx, field, value) => {
    const newConfig = { ...footerConfig };
    newConfig.trustSection.items[idx][field] = value;
    setFooterConfig(newConfig);
  };

  // --- CMS Page Handlers ---
  const handleSelectPage = (page) => {
    setSelectedPage(page);
    setPageForm({
      slug: page.slug || '',
      title: page.title || '',
      category: page.category || 'LEGAL',
      excerpt: page.excerpt || '',
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      published: page.published !== false,
    });
  };

  const handleCreateNewPage = () => {
    setSelectedPage(null);
    setPageForm({
      slug: 'new-page-slug',
      title: 'New Page Title',
      category: 'LEGAL',
      excerpt: '',
      content: '## Page Heading\n\nEnter official policy or support guidelines here...',
      metaTitle: '',
      metaDescription: '',
      published: true,
    });
  };

  const handleSaveCmsPage = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await saveCmsPage(pageForm);
      showToast('CMS page saved & published successfully!', 'success');
      // Reload pages
      const pagesRes = await fetchAllCmsPages();
      if (pagesRes.data?.pages) {
        setCmsPages(pagesRes.data.pages);
        const updated = pagesRes.data.pages.find((p) => p.slug === pageForm.slug);
        if (updated) setSelectedPage(updated);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- FAQ Handlers ---
  const handleOpenFaqModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || 'GENERAL',
        order: faq.order || 0,
        published: faq.published !== false,
      });
    } else {
      setEditingFaq(null);
      setFaqForm({
        question: '',
        answer: '',
        category: 'GENERAL',
        order: faqs.length + 1,
        published: true,
      });
    }
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingFaq) {
        await updateFaq(editingFaq._id, faqForm);
        showToast('FAQ updated successfully!', 'success');
      } else {
        await createFaq(faqForm);
        showToast('FAQ created successfully!', 'success');
      }
      setShowFaqModal(false);
      const faqsRes = await fetchFaqs('ALL');
      if (faqsRes.data?.faqs) setFaqs(faqsRes.data.faqs);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save FAQ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFaq(id);
      showToast('FAQ deleted successfully', 'info');
      setFaqs((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      showToast('Failed to delete FAQ', 'error');
    }
  };

  if (loading || !footerConfig) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        Loading Content Management Control Center...
      </div>
    );
  }

  return (
    <div className="admin-page-container" style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF1F2', color: '#E11D48', padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 900, marginBottom: 8 }}>
            <span>📄</span>
            <span>CONTENT MANAGEMENT SYSTEM</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
            Footer &amp; Content Management Control Center
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
            Manage the public footer, brand descriptions, social channels, trust badges, legal policies, and FAQ knowledge base.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleSaveFooter}
            disabled={saving}
            style={{
              background: '#E11D48',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '10px 22px',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
            }}
          >
            <span>💾</span> {saving ? 'Saving Changes...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { id: 'FOOTER_NAV', label: '🏷️ Footer Navigation & Brand' },
          { id: 'SOCIALS', label: '🌐 Social Media Links' },
          { id: 'TRUST_BOTTOM', label: '🛡️ Trust Banner & Bottom Bar' },
          { id: 'CMS_PAGES', label: '📜 Legal & Support CMS Pages' },
          { id: 'FAQS', label: '❓ FAQ Management' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#0F172A' : '#F8FAFC',
              color: activeTab === tab.id ? '#FFFFFF' : '#475569',
              border: '1px solid',
              borderColor: activeTab === tab.id ? '#0F172A' : '#E2E8F0',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: FOOTER NAVIGATION & BRAND                             */}
      {/* ============================================================ */}
      {activeTab === 'FOOTER_NAV' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Brand Info Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px' }}>
              MentorNearby Brand Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Brand Name</label>
                <input
                  type="text"
                  value={footerConfig.brand?.name || 'MentorNearby'}
                  onChange={(e) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, name: e.target.value } })}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Tagline</label>
                <input
                  type="text"
                  value={footerConfig.brand?.tagline || 'Find. Learn. Grow.'}
                  onChange={(e) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, tagline: e.target.value } })}
                  style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
              <textarea
                rows="2"
                value={footerConfig.brand?.description || ''}
                onChange={(e) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, description: e.target.value } })}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
              ></textarea>
            </div>
          </div>

          {/* 4 Navigation Columns Grid */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>
              Footer Navigation Columns (Find Tutors, Study Resources, Help &amp; Support, Legal)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {footerConfig.columns?.map((col, colIdx) => (
                <div key={colIdx} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#E11D48', textTransform: 'uppercase' }}>Column {colIdx + 1}</span>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{col.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddLinkToColumn(colIdx)}
                      style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                    >
                      + Add Link
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {col.links?.map((link, linkIdx) => (
                      <div key={linkIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleUpdateLink(colIdx, linkIdx, 'label', e.target.value)}
                            placeholder="Label"
                            style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 700 }}
                          />
                          <input
                            type="checkbox"
                            checked={link.enabled !== false}
                            onChange={(e) => handleUpdateLink(colIdx, linkIdx, 'enabled', e.target.checked)}
                            title="Enable / Disable link"
                          />
                          <button
                            type="button"
                            onClick={() => handleMoveLink(colIdx, linkIdx, -1)}
                            disabled={linkIdx === 0}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: linkIdx === 0 ? 0.3 : 1 }}
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLink(colIdx, linkIdx, 1)}
                            disabled={linkIdx === col.links.length - 1}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: linkIdx === col.links.length - 1 ? 0.3 : 1 }}
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(colIdx, linkIdx)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, fontWeight: 900 }}
                            title="Delete Link"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={link.path}
                          onChange={(e) => handleUpdateLink(colIdx, linkIdx, 'path', e.target.value)}
                          placeholder="/path"
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11.5, color: '#64748B' }}
                        />
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SOCIAL MEDIA LINKS                                    */}
      {/* ============================================================ */}
      {activeTab === 'SOCIALS' && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                Social Media Platforms &amp; Channel Links
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Configure official URLs, handles, and display states for YouTube, LinkedIn, Instagram, X, Telegram, and WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSocial}
              style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              + Add Social Platform
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {footerConfig.socials?.map((social, idx) => (
              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <strong style={{ fontSize: 14, color: '#0F172A' }}>{social.platform}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={social.enabled !== false}
                        onChange={(e) => handleUpdateSocial(idx, 'enabled', e.target.checked)}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSocial(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}
                      title="Delete Social Platform"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Platform Name</label>
                  <input
                    type="text"
                    value={social.platform}
                    onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Handle / Subtitle Text</label>
                  <input
                    type="text"
                    value={social.handle}
                    onChange={(e) => handleUpdateSocial(idx, 'handle', e.target.value)}
                    placeholder="@MentorNearby"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Official URL *</label>
                  <input
                    type="url"
                    value={social.url}
                    onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: TRUST BANNER & BOTTOM BAR                             */}
      {/* ============================================================ */}
      {activeTab === 'TRUST_BOTTOM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Trust Banner Card */}
          <div style={{ background: '#FFF1F2', borderRadius: 16, border: '1px solid #FFE4E6', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#9F1239', margin: '0 0 14px' }}>
              🛡️ Trusted &amp; Verified Platform Banner
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9F1239', display: 'block', marginBottom: 4 }}>Banner Heading</label>
                <input
                  type="text"
                  value={footerConfig.trustSection?.heading || 'Trusted & Verified Platform'}
                  onChange={(e) => setFooterConfig({ ...footerConfig, trustSection: { ...footerConfig.trustSection, heading: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #FDA4AF', fontSize: 13, background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9F1239', display: 'block', marginBottom: 4 }}>Banner Description</label>
                <input
                  type="text"
                  value={footerConfig.trustSection?.description || ''}
                  onChange={(e) => setFooterConfig({ ...footerConfig, trustSection: { ...footerConfig.trustSection, description: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #FDA4AF', fontSize: 13, background: '#FFF' }}
                />
              </div>
            </div>

            <label style={{ fontSize: 12.5, fontWeight: 800, color: '#9F1239', display: 'block', marginBottom: 8 }}>
              4 Trust Badges
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {footerConfig.trustSection?.items?.map((item, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #FDA4AF', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateTrustItem(idx, 'label', e.target.value)}
                    style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 700 }}
                  />
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => handleUpdateTrustItem(idx, 'enabled', e.target.checked)}
                    title="Toggle active"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar Card */}
          <div style={{ background: '#0B132B', borderRadius: 16, border: '1px solid #1E293B', padding: 24, color: '#FFF' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8', margin: '0 0 16px' }}>
              ⚓ Bottom Navigation Bar (Dark Navy)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Copyright Line</label>
                <input
                  type="text"
                  value={footerConfig.bottomBar?.copyright || ''}
                  onChange={(e) => setFooterConfig({ ...footerConfig, bottomBar: { ...footerConfig.bottomBar, copyright: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#070E1E', color: '#FFF', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Subtext Line</label>
                <input
                  type="text"
                  value={footerConfig.bottomBar?.subtext || ''}
                  onChange={(e) => setFooterConfig({ ...footerConfig, bottomBar: { ...footerConfig.bottomBar, subtext: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#070E1E', color: '#FFF', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Center Slogan</label>
                <input
                  type="text"
                  value={footerConfig.bottomBar?.centerMessage || ''}
                  onChange={(e) => setFooterConfig({ ...footerConfig, bottomBar: { ...footerConfig.bottomBar, centerMessage: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#070E1E', color: '#FFF', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Button Text</label>
                <input
                  type="text"
                  value={footerConfig.bottomBar?.contactButtonText || 'Need Help? Contact Us'}
                  onChange={(e) => setFooterConfig({ ...footerConfig, bottomBar: { ...footerConfig.bottomBar, contactButtonText: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#070E1E', color: '#FFF', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Button Target URL</label>
                <input
                  type="text"
                  value={footerConfig.bottomBar?.contactButtonUrl || '/contact'}
                  onChange={(e) => setFooterConfig({ ...footerConfig, bottomBar: { ...footerConfig.bottomBar, contactButtonUrl: e.target.value } })}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: '#070E1E', color: '#FFF', fontSize: 13 }}
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: LEGAL & SUPPORT CMS PAGES                             */}
      {/* ============================================================ */}
      {activeTab === 'CMS_PAGES' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'flex-start' }}>
          
          {/* Left: Pages List */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Editable CMS Pages</h4>
              <button
                type="button"
                onClick={handleCreateNewPage}
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                + New Page
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cmsPages.map((p) => {
                const isSelected = selectedPage?.slug === p.slug;
                return (
                  <button
                    key={p._id || p.slug}
                    type="button"
                    onClick={() => handleSelectPage(p)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? '#FFF1F2' : 'transparent',
                      color: isSelected ? '#E11D48' : '#334155',
                      border: isSelected ? '1px solid #FDA4AF' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{p.title}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>/{p.slug}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Page Content Form Editor */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <form onSubmit={handleSaveCmsPage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Editing: {pageForm.title || 'Page'}
                </h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={pageForm.published}
                      onChange={(e) => setPageForm({ ...pageForm, published: e.target.checked })}
                    />
                    Published Live
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ background: '#E11D48', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {saving ? 'Publishing...' : 'Save & Publish Page'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Page Title *</label>
                  <input
                    type="text"
                    required
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={pageForm.category}
                    onChange={(e) => setPageForm({ ...pageForm, category: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
                  >
                    <option value="LEGAL">LEGAL</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="COMPANY">COMPANY</option>
                    <option value="HELP">HELP</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Page Body Content (Markdown / Text) *</label>
                <textarea
                  rows="14"
                  required
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5, fontFamily: 'monospace', lineHeight: 1.6 }}
                ></textarea>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: FAQ MANAGEMENT                                        */}
      {/* ============================================================ */}
      {activeTab === 'FAQS' && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                Frequently Asked Questions (FAQ) Knowledge Base
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Manage questions and answers displayed on the public FAQs page and help center.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenFaqModal()}
              style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
            >
              + Add New FAQ
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq) => (
              <div key={faq._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: 4 }}>
                      {faq.category}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Order: #{faq.order || 0}</span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '4px 0 6px' }}>{faq.question}</h4>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{faq.answer}</p>
                </div>
                
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenFaqModal(faq)}
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq._id)}
                    style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', color: '#E11D48', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit FAQ Modal */}
          {showFaqModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
              <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 560, width: '100%', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                  <button type="button" onClick={() => setShowFaqModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Question *</label>
                    <input
                      type="text"
                      required
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Category</label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
                    >
                      <option value="GENERAL">GENERAL</option>
                      <option value="STUDENTS">STUDENTS &amp; PARENTS</option>
                      <option value="TUTORS">TUTORS &amp; KYC</option>
                      <option value="STUDY_RESOURCES">STUDY RESOURCES</option>
                      <option value="PAYMENTS">PAYMENTS &amp; DOWNLOADS</option>
                      <option value="COURSES">COURSES &amp; PYQS</option>
                      <option value="SAFETY">SAFETY</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Answer *</label>
                    <textarea
                      rows="4"
                      required
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                    <button type="button" onClick={() => setShowFaqModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={saving} style={{ background: '#0F172A', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save FAQ'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AdminFooterCmsPage;
