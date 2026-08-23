// ============================================================
// pages/Admin/AdminStudyResourcesPage.jsx
// Comprehensive Admin Control Center for Study Resources & Store
// Catalog Management, Combo Pricing, Print Partners & Analytics
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  adminFetchStudyResources,
  adminCreateStudyResource,
  adminUpdateStudyResource,
  adminDeleteStudyResource,
  adminFetchBundles,
  adminSaveBundle,
  adminDeleteBundleFile,
  adminFetchStudyRevenueAnalytics,
  adminFetchPrintProviders,
  adminSavePrintProvider,
  adminFetchPricingMatrix,
  adminUpdatePricingMatrix,
} from '../../api/studyResources';
import { useToast } from '../../context/ToastContext';
import { getResourceAccess, detectStudyFileType } from '../../utils/studyResourceAccess';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './admin.css';
import '../../styles/AdminDesign.css';

const AdminStudyResourcesPage = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'bundles', 'providers', 'analytics'

  // Viewer Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewResourceId, setPreviewResourceId] = useState(null);
  const [previewResourceData, setPreviewResourceData] = useState(null);

  // Resources state
  const [resources, setResources] = useState([]);
  const [totalResources, setTotalResources] = useState(0);
  const [loadingResources, setLoadingResources] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Bundles state
  const [bundles, setBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');
  const [bundleClassFilter, setBundleClassFilter] = useState('');
  const [bundleSubjectFilter, setBundleSubjectFilter] = useState('');
  const [bundleTypeFilter, setBundleTypeFilter] = useState('');
  const [bundleStatusFilter, setBundleStatusFilter] = useState('');
  const [bundleSortBy, setBundleSortBy] = useState('class_asc');
  const [selectedBundleFile, setSelectedBundleFile] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);

  // Providers state
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Modal State
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    chapterNumber: 1,
    chapterTitle: '',
    unit: 'Unit 1',
    resourceType: 'FORMULA_SHEET',
    readingEnabled: true,
    downloadEnabled: true,
    originalPrice: 49,
    downloadPrice: 7,
    salePrice: 7,
    isFreeDemo: false,
    fileUrl: '',
    published: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Bundle Edit Modal
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleFormData, setBundleFormData] = useState({
    id: '',
    classLevel: '9',
    subject: 'Mathematics',
    comboType: 'FORMULA_COMBO',
    title: '',
    description: '',
    price: 50,
    published: true,
    fileName: '',
    fileUrl: '',
    fileSize: 0,
    fileType: 'pdf',
  });

  // Provider Edit Modal
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerFormData, setProviderFormData] = useState({
    code: 'BLINKIT',
    name: 'Blinkit Print',
    tagline: '⚡ Delivered in 10-15 minutes',
    description: '',
    externalUrl: 'https://blinkit.com/prn',
    enabled: true,
    priority: 1,
  });

  // Central Formula Sheet & Notes/PPT Pricing Matrix State
  const [pricingMatrix, setPricingMatrix] = useState({
    '9': { mathsFormulaIndividual: 7, scienceFormulaIndividual: 7, formulaCombo: 50, notesIndividual: 12, notesCombo: 100 },
    '10': { mathsFormulaIndividual: 7, scienceFormulaIndividual: 7, formulaCombo: 50, notesIndividual: 12, notesCombo: 100 },
    '11': { mathsFormulaIndividual: 8, scienceFormulaIndividual: 8, formulaCombo: 60, notesIndividual: 14, notesCombo: 120 },
    '12': { mathsFormulaIndividual: 8, scienceFormulaIndividual: 8, formulaCombo: 60, notesIndividual: 14, notesCombo: 120 },
  });
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  useEffect(() => {
    if (activeTab === 'resources') loadResources();
    if (activeTab === 'bundles') {
      loadBundles();
      loadPricingMatrix();
    }
    if (activeTab === 'providers') loadProviders();
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, filterClass, filterSubject, filterType, page]);

  const loadPricingMatrix = async () => {
    try {
      setLoadingMatrix(true);
      const res = await adminFetchPricingMatrix();
      if (res.data?.matrix) {
        setPricingMatrix(res.data.matrix);
      }
    } catch (err) {
      console.error('Failed to load pricing matrix', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleMatrixChange = (classLevel, field, value) => {
    setPricingMatrix((prev) => ({
      ...prev,
      [classLevel]: {
        ...prev[classLevel],
        [field]: value === '' ? '' : Math.max(1, Number(value) || 0),
      },
    }));
  };

  const handleSavePricingMatrix = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingMatrix(true);
      const res = await adminUpdatePricingMatrix(pricingMatrix);
      if (res.data?.matrix) {
        setPricingMatrix(res.data.matrix);
      }
      showToast('Formula Sheet & Notes/PPT Pricing Matrix synchronized and saved to database!', 'success');
      loadBundles();
      loadResources();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update pricing matrix', 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleResetDefaultMatrix = () => {
    setPricingMatrix({
      '9': { mathsFormulaIndividual: 7, scienceFormulaIndividual: 7, formulaCombo: 50, notesIndividual: 12, notesCombo: 100 },
      '10': { mathsFormulaIndividual: 7, scienceFormulaIndividual: 7, formulaCombo: 50, notesIndividual: 12, notesCombo: 100 },
      '11': { mathsFormulaIndividual: 8, scienceFormulaIndividual: 8, formulaCombo: 60, notesIndividual: 14, notesCombo: 120 },
      '12': { mathsFormulaIndividual: 8, scienceFormulaIndividual: 8, formulaCombo: 60, notesIndividual: 14, notesCombo: 120 },
    });
  };

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const res = await adminFetchStudyResources({
        classLevel: filterClass || undefined,
        subject: filterSubject || undefined,
        resourceType: filterType || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      setResources(res.data.resources || []);
      setTotalResources(res.data.total || 0);
    } catch (err) {
      showToast('Failed to load study resources', 'error');
    } finally {
      setLoadingResources(false);
    }
  };

  const loadBundles = async () => {
    try {
      setLoadingBundles(true);
      const res = await adminFetchBundles();
      setBundles(res.data.bundles || []);
    } catch (err) {
      showToast('Failed to load combo bundles', 'error');
    } finally {
      setLoadingBundles(false);
    }
  };

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const res = await adminFetchPrintProviders();
      setProviders(res.data.providers || []);
    } catch (err) {
      showToast('Failed to load print providers', 'error');
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await adminFetchStudyRevenueAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      classLevel: '9',
      subject: 'Science',
      chapterNumber: 1,
      chapterTitle: '',
      unit: 'Unit 1',
      resourceType: 'FORMULA_SHEET',
      readingEnabled: true,
      downloadEnabled: true,
      originalPrice: 49,
      downloadPrice: 19,
      salePrice: 19,
      isFreeDemo: true,
      fileUrl: '',
      published: true,
    });
    setSelectedFile(null);
    setResourceModalOpen(true);
  };

  const handleOpenEditModal = (r) => {
    const access = getResourceAccess(r);
    setEditingResource(r);
    const rawFileUrl = (r.fileReference?.url?.includes('res.cloudinary.com') ? r.fileReference.url : r.fileUrl) || r.fileUrl || r.fileReference?.url || '';
    const cleanFileUrl = (rawFileUrl.includes('dummy.pdf') || rawFileUrl.includes('w3.org'))
      ? (r.fileReference?.url?.includes('res.cloudinary.com') ? r.fileReference.url : '')
      : rawFileUrl;

    setFormData({
      title: r.title,
      description: r.description || '',
      classLevel: r.classLevel,
      subject: r.subject,
      chapterNumber: access.chapterNumber,
      chapterTitle: r.chapterTitle || '',
      unit: r.unit || `Unit ${access.chapterNumber}`,
      resourceType: r.resourceType || 'FORMULA_SHEET',
      readingEnabled: access.isFreeDemo,
      downloadEnabled: r.downloadEnabled !== false,
      originalPrice: access.originalPrice,
      downloadPrice: access.salePrice,
      salePrice: access.salePrice,
      isFreeDemo: access.isFreeDemo,
      fileName: r.fileName || r.fileReference?.filename || '',
      fileUrl: cleanFileUrl,
      fileType: r.fileType || '',
      mimeType: r.mimeType || r.fileReference?.mimeType || '',
      published: r.published !== false,
    });
    setSelectedFile(null);
    setResourceModalOpen(true);
  };

  const handleSubmitResource = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });
      if (selectedFile) {
        payload.append('document', selectedFile);
      }

      if (editingResource) {
        const updateRes = await adminUpdateStudyResource(editingResource._id, payload);
        const updatedResource = updateRes.data?.resource || updateRes.resource || updateRes;
        if (updatedResource) {
          setEditingResource(updatedResource);
          setFormData((prev) => ({
            ...prev,
            fileName: updatedResource.fileName || prev.fileName,
            fileUrl: updatedResource.fileUrl || prev.fileUrl,
            fileType: updatedResource.fileType || prev.fileType,
            mimeType: updatedResource.mimeType || prev.mimeType,
          }));
        }
        showToast('Study resource updated successfully', 'success');
      } else {
        await adminCreateStudyResource(payload);
        showToast('Study resource created successfully', 'success');
      }

      setResourceModalOpen(false);
      setSelectedFile(null);
      await loadResources();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study resource?')) return;
    try {
      await adminDeleteStudyResource(id);
      showToast('Study resource deleted', 'success');
      loadResources();
    } catch (err) {
      showToast('Failed to delete resource', 'error');
    }
  };

  const handleTogglePublish = async (r) => {
    try {
      await adminUpdateStudyResource(r._id, { published: !r.published });
      showToast(`Resource ${r.published ? 'unpublished' : 'published'}`, 'success');
      loadResources();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleOpenBundleModal = (b) => {
    setEditingBundle(b);
    setBundleFormData({
      id: b._id,
      classLevel: b.classLevel,
      subject: b.subject,
      comboType: b.comboType || 'FORMULA_COMBO',
      title: b.title,
      description: b.description || '',
      price: b.price || (b.comboType === 'QA_COMBO' ? (['11', '12'].includes(String(b.classLevel)) ? 120 : 100) : (['11', '12'].includes(String(b.classLevel)) ? 60 : 50)),
      published: b.published !== false,
      fileName: b.fileName || b.fileReference?.filename || '',
      fileUrl: b.fileUrl || b.fileReference?.url || '',
      fileSize: b.fileSize || 0,
      fileType: b.fileType || 'pdf',
      mimeType: b.mimeType || 'application/pdf',
    });
    setSelectedBundleFile(null);
    setBundleModalOpen(true);
  };

  const handleSubmitBundle = async (e) => {
    e.preventDefault();
    try {
      if (selectedBundleFile && selectedBundleFile.size > 100 * 1024 * 1024) {
        showToast(`File size (${(selectedBundleFile.size / 1024 / 1024).toFixed(2)} MB) exceeds the 100 MB limit. Please select a file under 100 MB.`, 'error');
        return;
      }

      setSubmitting(true);
      const payload = new FormData();
      Object.keys(bundleFormData).forEach((key) => {
        if (bundleFormData[key] !== undefined && bundleFormData[key] !== null) {
          payload.append(key, bundleFormData[key]);
        }
      });
      if (selectedBundleFile) {
        payload.append('document', selectedBundleFile);
      }

      await adminSaveBundle(payload, bundleFormData.id);
      showToast('Subject combo updated successfully!', 'success');
      setBundleModalOpen(false);
      setSelectedBundleFile(null);
      setEditingBundle(null);
      await loadBundles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save bundle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBundleFile = async (bundleId) => {
    if (!window.confirm('Are you sure you want to remove the uploaded master file from this combo?')) return;
    try {
      setSubmitting(true);
      await adminDeleteBundleFile(bundleId);
      showToast('Master file removed from combo', 'success');
      if (bundleModalOpen) {
        setBundleFormData((prev) => ({ ...prev, fileUrl: '', fileName: '', fileSize: 0 }));
      }
      await loadBundles();
    } catch (err) {
      showToast('Failed to remove combo file', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewBundle = (bundle) => {
    const fileUrl = bundle.fileUrl || bundle.fileReference?.url;
    if (!fileUrl) {
      showToast('No master file uploaded to this combo yet. Click Edit to upload a PDF.', 'warning');
      return;
    }
    setPreviewResourceId(bundle._id);
    setPreviewResourceData({
      ...bundle,
      id: bundle._id,
      isCombo: true,
    });
    setPreviewModalOpen(true);
  };

  const handleTogglePublishBundle = async (b) => {
    try {
      await adminSaveBundle({ published: !b.published, classLevel: b.classLevel, subject: b.subject, comboType: b.comboType }, b._id);
      showToast(`Combo ${b.published ? 'hidden' : 'published'}`, 'success');
      await loadBundles();
    } catch (err) {
      showToast('Failed to update combo status', 'error');
    }
  };

  const handleOpenProviderModal = (p) => {
    setProviderFormData({
      code: p.code,
      name: p.name,
      tagline: p.tagline || '',
      description: p.description || '',
      externalUrl: p.externalUrl || '',
      enabled: p.enabled !== false,
      priority: p.priority || 1,
    });
    setProviderModalOpen(true);
  };

  const handleSubmitProvider = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminSavePrintProvider(providerFormData);
      showToast('Print provider updated successfully!', 'success');
      setProviderModalOpen(false);
      loadProviders();
    } catch (err) {
      showToast('Failed to save print provider', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📚 Study Resources &amp; Store Management</h1>
          <p className="admin-page-sub">
            Manage Free Online Reading, Paid PDF Downloads, Dual Combos, Print Providers, and Real Sales Analytics.
          </p>
        </div>

        {activeTab === 'resources' && (
          <button onClick={handleOpenCreateModal} className="admin-btn admin-btn-primary">
            <span>➕</span> Add New Resource
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="admin-tabs-bar" style={{ display: 'flex', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('resources')}
          className={`admin-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'resources' ? '#4F46E5' : '#F1F5F9',
            color: activeTab === 'resources' ? '#FFF' : '#475569',
          }}
        >
          📄 Resources Catalog ({totalResources})
        </button>

        <button
          onClick={() => setActiveTab('bundles')}
          className={`admin-tab-btn ${activeTab === 'bundles' ? 'active' : ''}`}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'bundles' ? '#4F46E5' : '#F1F5F9',
            color: activeTab === 'bundles' ? '#FFF' : '#475569',
          }}
        >
          🔥 Subject Combos &amp; Pricing ({bundles.length})
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`admin-tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'providers' ? '#4F46E5' : '#F1F5F9',
            color: activeTab === 'providers' ? '#FFF' : '#475569',
          }}
        >
          🖨️ Print Partners ({providers.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'analytics' ? '#4F46E5' : '#F1F5F9',
            color: activeTab === 'analytics' ? '#FFF' : '#475569',
          }}
        >
          📊 Revenue &amp; Sales Analytics
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: RESOURCES CATALOG                                     */}
      {/* ============================================================ */}
      {activeTab === 'resources' && (
        <div>
          {/* Filters Bar */}
          <div className="admin-filter-card" style={{ background: '#FFF', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search resource title or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
            />

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
            >
              <option value="">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
            >
              <option value="">All Subjects</option>
              <option value="Science">Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
            >
              <option value="">All Types</option>
              <option value="FORMULA_SHEET">Formula Sheet</option>
              <option value="IMPORTANT_QUESTIONS_ANSWERS">Notes / Important Q&amp;A</option>
            </select>

            <button onClick={loadResources} className="admin-btn admin-btn-secondary">
              Filter
            </button>
          </div>

          {/* Resources Table */}
          <div style={{ background: '#FFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px' }}>Resource Title</th>
                  <th style={{ padding: '12px 16px' }}>Class / Subject</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Price</th>
                  <th style={{ padding: '12px 16px' }}>Reading</th>
                  <th style={{ padding: '12px 16px' }}>Downloads</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingResources ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
                      Loading resources...
                    </td>
                  </tr>
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
                      No study resources found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  resources.map((r) => {
                    const access = getResourceAccess(r);
                    const isFormula = access.isFormula;

                    return (
                      <tr key={r._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                          <div>{r.title}</div>
                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{r.chapterTitle || r.chapter}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#334155' }}>
                          <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11.5 }}>
                            Class {r.classLevel}
                          </span>{' '}
                          {r.subject}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isFormula ? '#1D4ED8' : '#6D28D9', background: isFormula ? '#EFF6FF' : '#F5F3FF', padding: '3px 8px', borderRadius: 6, marginRight: 6 }}>
                            {isFormula ? '📘 Formula' : '📚 Q&A'}
                          </span>
                          {access.isFreeDemo && (
                            <span style={{ fontSize: 10, fontWeight: 900, color: '#166534', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>
                              🎁 Demo
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                          ₹{access.salePrice}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {access.isFreeDemo ? (
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#065F46', background: '#D1FAE5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span>🎁</span> FREE DEMO
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#9A3412', background: '#FFEDD5', border: '1px solid #FED7AA', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span>🔒</span> PAID / LOCKED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>
                          {r.downloadsCount || 0}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => handleTogglePublish(r)}
                            style={{
                              border: 'none',
                              background: r.published ? '#DCFCE7' : '#F1F5F9',
                              color: r.published ? '#15803D' : '#64748B',
                              padding: '3px 10px',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {r.published ? '● Published' : '○ Draft'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11.5 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteResource(r._id)}
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '4px 10px', fontSize: 11.5 }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SUBJECT COMBOS & PRICING                              */}
      {/* ============================================================ */}
      {activeTab === 'bundles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* ============================================================ */}
          {/* 1. CENTRAL FORMULA SHEET & COMBO PRICING MATRIX              */}
          {/* ============================================================ */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid #E0E7FF',
              padding: 24,
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>⚡</span>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1E1B4B' }}>
                    Formula Sheet &amp; Subject Combo Pricing Matrix
                  </h3>
                  <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999 }}>
                    DATABASE BACKED
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', maxWidth: 780, lineHeight: 1.5 }}>
                  Configure authoritative prices stored in MongoDB. Updating these prices synchronizes all individual formula sheet downloads and separate subject combo packages in real-time. <strong>Maths Combo and Science Combo are separate products.</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResetDefaultMatrix}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ↺ Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSavePricingMatrix}
                  disabled={savingMatrix || loadingMatrix}
                  style={{
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: savingMatrix ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  {savingMatrix ? '💾 Saving to Database...' : '💾 Save & Sync Pricing Matrix'}
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Class / Grade</th>
                    <th style={{ padding: '12px 16px', color: '#2563EB' }}>📐 Maths Formula</th>
                    <th style={{ padding: '12px 16px', color: '#059669' }}>🧪 Science Formula</th>
                    <th style={{ padding: '12px 16px', color: '#1D4ED8' }}>⚡ Formula Combo</th>
                    <th style={{ padding: '12px 16px', color: '#D97706' }}>📝 Notes/PPT Single</th>
                    <th style={{ padding: '12px 16px', color: '#7C3AED' }}>📚 Notes/PPT Combo</th>
                    <th style={{ padding: '12px 16px' }}>Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {['9', '10', '11', '12'].map((cls) => {
                    const isSenior = cls === '11' || cls === '12';
                    const row = pricingMatrix[cls] || {
                      mathsFormulaIndividual: isSenior ? 8 : 7,
                      scienceFormulaIndividual: isSenior ? 8 : 7,
                      formulaCombo: isSenior ? 60 : 50,
                      notesIndividual: isSenior ? 14 : 12,
                      notesCombo: isSenior ? 120 : 100,
                    };

                    return (
                      <tr key={cls} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 900, color: '#0F172A' }}>
                          Class {cls}
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                            {isSenior ? 'Senior Secondary' : 'Secondary'}
                          </span>
                        </td>

                        {/* Maths Formula Individual */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#2563EB' }}>₹</span>
                            <input
                              type="number"
                              min="1"
                              value={row.mathsFormulaIndividual}
                              onChange={(e) => handleMatrixChange(cls, 'mathsFormulaIndividual', e.target.value)}
                              style={{
                                width: 70,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #BFDBFE',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1E293B',
                                background: '#EFF6FF',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#64748B' }}>/sheet</span>
                          </div>
                        </td>

                        {/* Science Formula Individual */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#059669' }}>₹</span>
                            <input
                              type="number"
                              min="1"
                              value={row.scienceFormulaIndividual}
                              onChange={(e) => handleMatrixChange(cls, 'scienceFormulaIndividual', e.target.value)}
                              style={{
                                width: 70,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #A7F3D0',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1E293B',
                                background: '#ECFDF5',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#64748B' }}>/sheet</span>
                          </div>
                        </td>

                        {/* Maths + Science Formula Sheet Combo */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#1D4ED8' }}>₹</span>
                            <input
                              type="number"
                              min="1"
                              value={row.formulaCombo}
                              onChange={(e) => handleMatrixChange(cls, 'formulaCombo', e.target.value)}
                              style={{
                                width: 70,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #93C5FD',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1E293B',
                                background: '#DBEAFE',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#64748B' }}>/combo</span>
                          </div>
                        </td>

                        {/* Notes / PPT Single Subject */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#D97706' }}>₹</span>
                            <input
                              type="number"
                              min="1"
                              value={row.notesIndividual}
                              onChange={(e) => handleMatrixChange(cls, 'notesIndividual', e.target.value)}
                              style={{
                                width: 70,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #FDE68A',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1E293B',
                                background: '#FEF3C7',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#64748B' }}>/subject</span>
                          </div>
                        </td>

                        {/* Complete Notes/PPT Combo */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#7C3AED' }}>₹</span>
                            <input
                              type="number"
                              min="1"
                              value={row.notesCombo}
                              onChange={(e) => handleMatrixChange(cls, 'notesCombo', e.target.value)}
                              style={{
                                width: 75,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1.5px solid #DDD6FE',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1E293B',
                                background: '#F5F3FF',
                              }}
                            />
                            <span style={{ fontSize: 11, color: '#64748B' }}>/combo</span>
                          </div>
                        </td>

                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: 6, fontSize: 11.5, color: '#334155', fontWeight: 600, display: 'inline-block' }}>
                            📖 Free Read • ⬇️ Paid Download
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                💡 <strong>Rules:</strong> Class 9/10 (Formula Sheet = ₹7, Formula Combo = ₹50, Notes/PPT = ₹12, Notes Combo = ₹100) • Class 11/12 (Formula Sheet = ₹8, Formula Combo = ₹60, Notes/PPT = ₹14, Notes Combo = ₹120).
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>
                ✔ 100% Free Online Reading • Database-Enforced Download Pricing
              </span>
            </div>
          </div>

          {/* Bundle Filter & Search Toolbar */}
          <div className="admin-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ flex: '1 1 200px', minWidth: 180 }}>
              <input
                type="text"
                placeholder="🔍 Search combos (Class, Subject, Title)..."
                value={bundleSearchQuery}
                onChange={(e) => setBundleSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <select
              value={bundleClassFilter}
              onChange={(e) => setBundleClassFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
            >
              <option value="">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>

            <select
              value={bundleSubjectFilter}
              onChange={(e) => setBundleSubjectFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
            >
              <option value="">All Subjects</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>

            <select
              value={bundleTypeFilter}
              onChange={(e) => setBundleTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
            >
              <option value="">All Types</option>
              <option value="FORMULA_COMBO">📘 Formula Combos</option>
              <option value="QA_COMBO">📚 Q&A Combos</option>
            </select>

            <select
              value={bundleStatusFilter}
              onChange={(e) => setBundleStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
            >
              <option value="">All Statuses</option>
              <option value="live">● Live Only</option>
              <option value="hidden">○ Hidden Only</option>
              <option value="has_file">📄 Has Master PDF</option>
              <option value="no_file">⚠️ Missing File</option>
            </select>

            <select
              value={bundleSortBy}
              onChange={(e) => setBundleSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
            >
              <option value="class_asc">Class: 9 → 12</option>
              <option value="class_desc">Class: 12 → 9</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Recently Created</option>
            </select>

            {(bundleSearchQuery || bundleClassFilter || bundleSubjectFilter || bundleTypeFilter || bundleStatusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setBundleSearchQuery('');
                  setBundleClassFilter('');
                  setBundleSubjectFilter('');
                  setBundleTypeFilter('');
                  setBundleStatusFilter('');
                  setBundleSortBy('class_asc');
                }}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F1F5F9', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Results Summary Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              Showing <strong>{
                bundles.filter((b) => {
                  if (bundleSearchQuery) {
                    const q = bundleSearchQuery.toLowerCase();
                    const matchTitle = (b.title || '').toLowerCase().includes(q);
                    const matchSubject = (b.subject || '').toLowerCase().includes(q);
                    const matchClass = `class ${b.classLevel}`.toLowerCase().includes(q);
                    if (!matchTitle && !matchSubject && !matchClass) return false;
                  }
                  if (bundleClassFilter && String(b.classLevel) !== String(bundleClassFilter)) return false;
                  if (bundleSubjectFilter && b.subject?.toLowerCase() !== bundleSubjectFilter.toLowerCase()) return false;
                  if (bundleTypeFilter && b.comboType !== bundleTypeFilter) return false;
                  if (bundleStatusFilter) {
                    if (bundleStatusFilter === 'live' && !b.published) return false;
                    if (bundleStatusFilter === 'hidden' && b.published) return false;
                    if (bundleStatusFilter === 'has_file' && !b.fileUrl && !b.fileReference?.url) return false;
                    if (bundleStatusFilter === 'no_file' && (b.fileUrl || b.fileReference?.url)) return false;
                  }
                  return true;
                }).length
              }</strong> of <strong>{bundles.length}</strong> subject combos
            </span>
          </div>

          {/* Combo Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {loadingBundles ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748B' }}>
                Loading subject combo bundles...
              </div>
            ) : bundles.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748B' }}>
                No subject combos found.
              </div>
            ) : (
              bundles
                .filter((b) => {
                  if (bundleSearchQuery) {
                    const q = bundleSearchQuery.toLowerCase();
                    const matchTitle = (b.title || '').toLowerCase().includes(q);
                    const matchSubject = (b.subject || '').toLowerCase().includes(q);
                    const matchClass = `class ${b.classLevel}`.toLowerCase().includes(q);
                    if (!matchTitle && !matchSubject && !matchClass) return false;
                  }
                  if (bundleClassFilter && String(b.classLevel) !== String(bundleClassFilter)) return false;
                  if (bundleSubjectFilter && b.subject?.toLowerCase() !== bundleSubjectFilter.toLowerCase()) return false;
                  if (bundleTypeFilter && b.comboType !== bundleTypeFilter) return false;
                  if (bundleStatusFilter) {
                    if (bundleStatusFilter === 'live' && !b.published) return false;
                    if (bundleStatusFilter === 'hidden' && b.published) return false;
                    if (bundleStatusFilter === 'has_file' && !b.fileUrl && !b.fileReference?.url) return false;
                    if (bundleStatusFilter === 'no_file' && (b.fileUrl || b.fileReference?.url)) return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (bundleSortBy === 'class_asc') return Number(a.classLevel) - Number(b.classLevel);
                  if (bundleSortBy === 'class_desc') return Number(b.classLevel) - Number(a.classLevel);
                  if (bundleSortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
                  if (bundleSortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
                  if (bundleSortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                  return 0;
                })
                .map((b) => {
                  const isQA = b.comboType === 'QA_COMBO';
                  const hasFile = Boolean(b.fileUrl || b.fileReference?.url);
                  const isFormula = b.comboType === 'FORMULA_COMBO';

                  return (
                    <div
                      key={b._id}
                      style={{
                        background: '#FFF',
                        border: `1.5px solid ${isQA ? '#DDD6FE' : '#BFDBFE'}`,
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Top Meta Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                              Class {b.classLevel} • {b.subject}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: isQA ? '#7C3AED' : '#2563EB', background: isQA ? '#F5F3FF' : '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                              {isQA ? '📚 Q&A Combo' : '📘 Formula Combo'}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleTogglePublishBundle(b)}
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: b.published ? '#15803D' : '#64748B',
                              background: b.published ? '#DCFCE7' : '#F1F5F9',
                              border: `1px solid ${b.published ? '#BBF7D0' : '#E2E8F0'}`,
                              borderRadius: 12,
                              padding: '2px 8px',
                              cursor: 'pointer',
                            }}
                            title="Click to toggle Live/Hidden status"
                          >
                            {b.published ? '● Live' : '○ Hidden'}
                          </button>
                        </div>

                        {/* Title and Description */}
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '4px 0 6px' }}>{b.title}</h3>
                        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{b.description}</p>

                        {/* Pricing & Structure Info Box */}
                        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Included Docs</span>
                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>{b.resourceCount || 0} Chapters</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Online Reading</span>
                            <span style={{ fontWeight: 800, color: isFormula ? '#059669' : '#4338CA', fontSize: 12.5 }}>
                              {isFormula ? '🎁 100% Free' : '🔒 Paid'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Download Price</span>
                            <span style={{ fontWeight: 900, color: isQA ? '#7C3AED' : '#2563EB', fontSize: 15 }}>₹{b.price}</span>
                          </div>
                        </div>

                        {/* Master File Status Box */}
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: hasFile ? '#F0FDF4' : '#FFFBEB',
                            border: `1px solid ${hasFile ? '#BBF7D0' : '#FEF3C7'}`,
                            marginBottom: 14,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                            <span style={{ fontSize: 14 }}>{hasFile ? '📄' : '⚠️'}</span>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: hasFile ? '#166534' : '#B45309', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {hasFile ? (b.fileName || 'Master Combo PDF') : 'No master PDF attached'}
                              </span>
                              {hasFile && b.fileSize ? (
                                <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                  {(b.fileSize / 1024 / 1024).toFixed(2)} MB • Cloudinary Raw
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => handlePreviewBundle(b)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #86EFAC',
                                color: '#166534',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              👁️ View
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          Sales: <strong>{b.totalPurchases || 0}</strong>
                        </span>
                        
                        <div style={{ display: 'flex', gap: 6 }}>
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => handlePreviewBundle(b)}
                              className="admin-btn"
                              style={{ padding: '6px 10px', fontSize: 12, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155' }}
                              title="Preview uploaded combo master PDF"
                            >
                              👁️ Preview
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenBundleModal(b)}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                          >
                            ✏️ Edit &amp; Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: PRINT PROVIDERS                                       */}
      {/* ============================================================ */}
      {activeTab === 'providers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loadingProviders ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#64748B' }}>
              Loading print providers...
            </div>
          ) : (
            providers.map((p) => (
              <div key={p.code} style={{ background: '#FFF', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{p.code === 'BLINKIT' ? '⚡' : '🛵'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: p.enabled ? '#15803D' : '#64748B', background: p.enabled ? '#DCFCE7' : '#F1F5F9', padding: '2px 8px', borderRadius: 12 }}>
                    {p.enabled ? '● Active Partner' : '○ Disabled'}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>{p.name}</h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>{p.tagline}</p>
                <div style={{ fontSize: 11.5, color: '#475569', background: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 14 }}>
                  <strong>Link:</strong> {p.externalUrl}
                </div>
                <button
                  onClick={() => handleOpenProviderModal(p)}
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%', padding: '6px 12px', fontSize: 12 }}
                >
                  Edit Provider Settings
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: REVENUE & SALES ANALYTICS                             */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFF', padding: 20, borderRadius: 16, border: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Downloads Revenue</span>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '4px 0 0' }}>₹{analytics.metrics.totalRevenue}</h2>
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>{analytics.metrics.totalSales} total purchases</span>
            </div>

            <div style={{ background: '#FFF', padding: 20, borderRadius: 16, border: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Today's Revenue</span>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#4F46E5', margin: '4px 0 0' }}>₹{analytics.metrics.todayRevenue}</h2>
              <span style={{ fontSize: 12, color: '#64748B' }}>{analytics.metrics.todaySales} sales today</span>
            </div>

            <div style={{ background: '#FFF', padding: 20, borderRadius: 16, border: '1px solid #EEF2F6' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>This Month</span>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '4px 0 0' }}>₹{analytics.metrics.thisMonthRevenue}</h2>
              <span style={{ fontSize: 12, color: '#64748B' }}>{analytics.metrics.thisMonthSales} monthly sales</span>
            </div>
          </div>

          {/* Recent Purchases */}
          <div style={{ background: '#FFF', borderRadius: 16, border: '1px solid #EEF2F6', padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 14px' }}>Recent Download Orders</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Student</th>
                  <th style={{ padding: '8px 12px' }}>Item / Bundle</th>
                  <th style={{ padding: '8px 12px' }}>Class / Subject</th>
                  <th style={{ padding: '8px 12px' }}>Amount</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentPurchases?.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{p.user?.name || 'Student'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {p.purchaseType === 'FORMULA_COMBO' ? '📘 Formula Sheets Combo' : p.purchaseType === 'QA_COMBO' ? '📚 Q&A Combo' : p.resource?.title || 'Formula Sheet / Q&A'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>Class {p.classLevel} • {p.subject}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#15803D' }}>₹{p.amount}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{new Date(p.purchasedAt || p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resource Create / Edit Modal */}
      {resourceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setResourceModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
              {editingResource ? 'Edit Study Resource' : 'Add New Study Resource'}
            </h3>

            <form onSubmit={handleSubmitResource} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1 Formula Sheet — Chemical Reactions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Class *</label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science, Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Chapter No. *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.chapterNumber}
                    onChange={(e) => {
                      const ch = Number(e.target.value) || 1;
                      const isFree = ch <= 2;
                      const isForm = formData.resourceType === 'FORMULA_SHEET';
                      setFormData({
                        ...formData,
                        chapterNumber: ch,
                        isFreeDemo: isFree,
                        originalPrice: isForm ? 49 : 79,
                        downloadPrice: isForm ? 19 : 39,
                        salePrice: isForm ? 19 : 39,
                      });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Chapter / Unit Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Chemical Reactions and Equations"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Resource Type</label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => {
                      const type = e.target.value;
                      const orig = type === 'FORMULA_SHEET' ? 49 : 79;
                      const isSenior = ['11', '12'].includes(String(formData.classLevel || ''));
                      const dl = type === 'FORMULA_SHEET' ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
                      setFormData({ ...formData, resourceType: type, originalPrice: orig, downloadPrice: dl, salePrice: dl });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  >
                    <option value="FORMULA_SHEET">Formula Sheet</option>
                    <option value="IMPORTANT_QUESTIONS_ANSWERS">Important Questions + Answers</option>
                    <option value="REVISION_NOTES">Revision Notes &amp; PPT</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Original Price (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.resourceType === 'FORMULA_SHEET' ? 49 : 79}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#F8FAFC', color: '#64748B' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.resourceType === 'FORMULA_SHEET' ? 19 : 39}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#F8FAFC', color: '#0F172A', fontWeight: 800 }}
                  />
                </div>
              </div>

              {/* Standard Access Type Indicator */}
              <div
                style={{
                  background: Number(formData.chapterNumber) <= 2 ? '#ECFDF5' : '#FFF7ED',
                  border: `1px solid ${Number(formData.chapterNumber) <= 2 ? '#A7F3D0' : '#FED7AA'}`,
                  padding: '12px 16px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: Number(formData.chapterNumber) <= 2 ? '#065F46' : '#9A3412' }}>
                    Access Type: {Number(formData.chapterNumber) <= 2 ? '🎁 FREE DEMO' : '🔒 PAID / LOCKED'}
                  </div>
                  <div style={{ fontSize: 11.5, color: Number(formData.chapterNumber) <= 2 ? '#047857' : '#C2410C', marginTop: 2 }}>
                    {Number(formData.chapterNumber) <= 2
                      ? 'Unit 01 & 02: 100% Free Online Reading for all students.'
                      : `Unit 03+: Premium resource requiring purchase (Selling Price: ₹${formData.resourceType === 'FORMULA_SHEET' ? 19 : 39}, MRP: ~~₹${formData.resourceType === 'FORMULA_SHEET' ? 49 : 79}~~).`}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: Number(formData.chapterNumber) <= 2 ? '#059669' : '#EA580C',
                    color: '#FFF',
                  }}
                >
                  {Number(formData.chapterNumber) <= 2 ? 'FREE' : 'PAID'}
                </span>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 2 }}>
                  Study Resource File
                </label>
                <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
                  Supported: PDF, PNG, JPG, JPEG, WEBP
                </div>

                {/* Current Attached File Status (When Editing) */}
                {editingResource && (formData.fileUrl || editingResource.fileUrl || editingResource.fileReference?.url) ? (() => {
                  const rawUrl = (editingResource.fileReference?.url?.includes('res.cloudinary.com') ? editingResource.fileReference.url : (formData.fileUrl || editingResource.fileUrl)) || '';
                  const cleanUrl = (rawUrl.includes('dummy.pdf') || rawUrl.includes('w3.org')) ? '' : rawUrl;
                  const displayFilename = formData.fileName || editingResource.fileName || editingResource.fileReference?.filename || (cleanUrl ? cleanUrl.split('/').pop() : 'Study Resource Document');

                  const fileInfo = detectStudyFileType({
                    ...editingResource,
                    ...formData,
                    fileName: displayFilename,
                    fileUrl: cleanUrl,
                  });

                  if (!cleanUrl && !formData.fileName && !editingResource.fileName) return null;

                  return (
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Current File
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                          <span style={{ fontSize: 22 }}>
                            {fileInfo.isImage ? '🖼️' : '📄'}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                              {displayFilename}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                              Type: <strong style={{ color: fileInfo.isImage ? '#059669' : '#2563EB' }}>{fileInfo.label}</strong>
                            </div>
                          </div>
                        </div>

                        {cleanUrl ? (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingResource?._id) {
                                  setPreviewResourceId(editingResource._id);
                                  setPreviewResourceData(editingResource);
                                  setPreviewModalOpen(true);
                                } else if (cleanUrl) {
                                  window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                              👁️ Preview File
                            </button>
                            <a
                              href={cleanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: '6px 10px', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}
                              title="Open raw file in new browser tab"
                            >
                              ↗
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })() : editingResource ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                    ⚠️ No file currently attached. Please choose a file to upload.
                  </div>
                ) : null}

                {/* Primary Choose File Input */}
                <div
                  style={{
                    background: '#F1F5F9',
                    padding: 16,
                    borderRadius: 10,
                    border: selectedFile ? '2px solid #10B981' : '2px dashed #94A3B8',
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#1E293B', display: 'block', marginBottom: 6 }}>
                    {editingResource ? '📤 Upload New File (Replaces Current File)' : '📤 Select File to Upload'}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    style={{ fontSize: 12.5, width: '100%', cursor: 'pointer' }}
                  />

                  {selectedFile ? (() => {
                    const newFileInfo = detectStudyFileType({
                      fileName: selectedFile.name,
                      mimeType: selectedFile.type,
                    });
                    return (
                      <div style={{ marginTop: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#065F46', fontWeight: 700 }}>
                        ✓ File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#047857', marginTop: 2 }}>
                          Type: <strong style={{ color: '#065F46' }}>{newFileInfo.label}</strong> ({newFileInfo.mimeType})
                        </div>
                      </div>
                    );
                  })() : (
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>
                      Click "Choose File" above to select a file from your computer.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setResourceModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn-primary"
                >
                  {submitting ? 'Uploading & Saving...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bundle Edit Modal with File Upload & Replacement */}
      {bundleModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setBundleModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  Edit Subject Combo &amp; Master File
                </h3>
                <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                  Class {bundleFormData.classLevel} • {bundleFormData.subject} • {bundleFormData.comboType === 'QA_COMBO' ? 'Q&A Combo' : 'Formula Combo'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBundleModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBundle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bundle Title</label>
                <input
                  type="text"
                  required
                  value={bundleFormData.title}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={bundleFormData.price}
                    onChange={(e) => setBundleFormData({ ...bundleFormData, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Store Status</label>
                  <select
                    value={bundleFormData.published ? 'true' : 'false'}
                    onChange={(e) => setBundleFormData({ ...bundleFormData, published: e.target.value === 'true' })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF' }}
                  >
                    <option value="true">● Live in Store</option>
                    <option value="false">○ Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows="3"
                  value={bundleFormData.description}
                  onChange={(e) => setBundleFormData({ ...bundleFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>

              {/* Master File Upload Section */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: 12.5, fontWeight: 800, display: 'block', marginBottom: 6, color: '#0F172A' }}>
                  📁 Master Combo Document (Multi-Page PDF / Image)
                </label>
                <p style={{ fontSize: 11.5, color: '#64748B', margin: '0 0 10px', lineHeight: 1.4 }}>
                  Upload a single comprehensive multi-page PDF covering all chapters. Students can read it online for free and purchase to download.
                </p>

                {/* Current File Info */}
                {(bundleFormData.fileUrl || bundleFormData.fileName) ? (
                  <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>
                          CURRENT FILE
                        </span>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>{bundleFormData.fileName || 'Master Combo PDF'}</strong>
                        {bundleFormData.fileSize ? (
                          <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>
                            ({(bundleFormData.fileSize / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handlePreviewBundle({ ...editingBundle, ...bundleFormData, _id: bundleFormData.id })}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          👁️ Preview Current
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBundleFile(bundleFormData.id)}
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#B45309', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8, border: '1px solid #FEF3C7', marginBottom: 10 }}>
                    ⚠️ No master PDF currently attached to this combo.
                  </div>
                )}

                {/* Upload or Replace Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                      {(bundleFormData.fileUrl || bundleFormData.fileName) ? 'Replace with New File:' : 'Choose Master File to Upload:'}
                    </label>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Max size: 100 MB</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedBundleFile(e.target.files[0]);
                      }
                    }}
                    style={{ fontSize: 12, width: '100%' }}
                  />
                  {selectedBundleFile && (
                    <div style={{ marginTop: 6, fontSize: 11.5, color: '#059669', fontWeight: 700 }}>
                      ✓ Selected for upload: {selectedBundleFile.name} ({(selectedBundleFile.size / 1024 / 1024).toFixed(2)} MB)
                      {selectedBundleFile.size > 10 * 1024 * 1024 && (
                        <span style={{ color: '#2563EB', marginLeft: 6, fontWeight: 600 }}>(Large multi-page PDF will be uploaded using chunked stream)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setBundleModalOpen(false);
                    setSelectedBundleFile(null);
                  }}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '8px 18px' }}
                >
                  {submitting
                    ? (selectedBundleFile && selectedBundleFile.size > 10 * 1024 * 1024
                        ? `Uploading ${(selectedBundleFile.size / 1024 / 1024).toFixed(1)} MB PDF...`
                        : 'Uploading & Saving...')
                    : '💾 Save Combo & Master PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Edit Modal */}
      {providerModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setProviderModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>
              Edit Print Provider
            </h3>

            <form onSubmit={handleSubmitProvider} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Provider Name</label>
                <input
                  type="text"
                  required
                  value={providerFormData.name}
                  onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Tagline</label>
                <input
                  type="text"
                  value={providerFormData.tagline}
                  onChange={(e) => setProviderFormData({ ...providerFormData, tagline: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Service / Web Link</label>
                <input
                  type="text"
                  value={providerFormData.externalUrl}
                  onChange={(e) => setProviderFormData({ ...providerFormData, externalUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setProviderModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn-primary"
                >
                  {submitting ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study Resource Viewer Modal for Admin Preview */}
      {previewModalOpen && (
        <StudyResourceViewerModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setPreviewResourceId(null);
            setPreviewResourceData(null);
          }}
          resourceId={previewResourceId}
          resource={previewResourceData}
          isCombo={Boolean(previewResourceData?.isCombo || previewResourceData?.comboType)}
        />
      )}

    </div>
  );
};

export default AdminStudyResourcesPage;
