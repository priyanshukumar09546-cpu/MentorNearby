// ============================================================
// pages/Admin/AdminContentPage.jsx
// Admin NCERT Synchronization & Educational Resources Control Center
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  fetchContentHealth,
  syncNcertContent,
  validateLinks,
  fetchAdminResources,
  createAdminResource,
  updateAdminResource,
  deleteAdminResource,
  restoreAdminResource,
} from '../../api/adminContent';
import { useToast } from '../../context/ToastContext';
import './admin.css';

const AdminContentPage = () => {
  const { showToast } = useToast();

  const [health, setHealth] = useState(null);
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMedium, setFilterMedium] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [validating, setValidating] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'NCERT_BOOK',
    medium: 'English',
    classLevel: 'Class 12',
    subject: 'Mathematics',
    resourceType: 'BOOK',
    publisher: 'NCERT',
    officialUrl: '',
    downloadUrl: '',
    description: '',
    isActive: true,
    chapters: [{ unitNumber: 1, title: '', openUrl: '', contentType: 'PDF', isAvailable: true }],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [hRes, rRes] = await Promise.all([
        fetchContentHealth(),
        fetchAdminResources({
          page,
          limit: 15,
          search: search.trim() || undefined,
          category: filterCategory !== 'All' ? filterCategory : undefined,
          medium: filterMedium !== 'All' ? filterMedium : undefined,
          classLevel: filterClass !== 'All' ? filterClass : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        }),
      ]);

      setHealth(hRes.data);
      setResources(rRes.data?.resources || []);
      setTotal(rRes.data?.total || 0);
    } catch (err) {
      showToast('Failed to load content management data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, filterCategory, filterMedium, filterClass, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSyncNcert = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await syncNcertContent();
      setSyncResult(res.data?.summary || res.data);
      showToast('NCERT Sync Completed Successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleValidateLinks = async () => {
    try {
      setValidating(true);
      const res = await validateLinks();
      showToast(`Link check completed: ${res.data?.validCount} valid, ${res.data?.invalidCount} invalid`, 'info');
      loadData();
    } catch (err) {
      showToast('Link validation failed', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      category: 'NCERT_BOOK',
      medium: 'English',
      classLevel: 'Class 12',
      subject: 'Mathematics',
      resourceType: 'BOOK',
      publisher: 'NCERT',
      officialUrl: '',
      downloadUrl: '',
      description: '',
      isActive: true,
      chapters: [{ unitNumber: 1, title: '', openUrl: '', contentType: 'PDF', isAvailable: true }],
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title || '',
      category: res.category || 'NCERT_BOOK',
      medium: res.medium || 'English',
      classLevel: res.classLevel || 'Class 12',
      subject: res.subject || 'Mathematics',
      resourceType: res.resourceType || 'BOOK',
      publisher: res.publisher || 'NCERT',
      officialUrl: res.officialUrl || '',
      downloadUrl: res.downloadUrl || '',
      description: res.description || '',
      isActive: res.isActive !== undefined ? res.isActive : true,
      chapters: res.chapters && res.chapters.length > 0 ? res.chapters : [{ unitNumber: 1, title: '', openUrl: '', contentType: 'PDF', isAvailable: true }],
    });
    setShowAddModal(true);
  };

  const handleAddChapterRow = () => {
    setFormData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { unitNumber: prev.chapters.length + 1, title: '', openUrl: '', contentType: 'PDF', isAvailable: true },
      ],
    }));
  };

  const handleRemoveChapterRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== idx),
    }));
  };

  const handleChapterChange = (idx, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.chapters];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, chapters: updated };
    });
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await updateAdminResource(editingResource._id, formData);
        showToast('Educational resource updated successfully', 'success');
      } else {
        await createAdminResource(formData);
        showToast('Educational resource created successfully', 'success');
      }
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleToggleActive = async (res) => {
    try {
      if (res.isActive) {
        await deleteAdminResource(res._id, false);
        showToast(`Deactivated ${res.title}`, 'info');
      } else {
        await restoreAdminResource(res._id);
        showToast(`Restored ${res.title}`, 'success');
      }
      loadData();
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="admin-page-title flex items-center gap-2">
            <span>📚</span> NCERT & Study Content Control Center
          </h1>
          <p className="admin-page-desc">
            Manage dynamic educational resources, official NCERT chapter links, and perform automated synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSyncNcert}
            disabled={syncing}
            className="admin-btn-primary flex items-center gap-2"
          >
            <span>{syncing ? '⏳' : '🔄'}</span>
            <span>{syncing ? 'Syncing NCERT...' : 'Sync NCERT Content'}</span>
          </button>

          <button
            onClick={handleValidateLinks}
            disabled={validating}
            className="admin-btn-secondary text-xs"
          >
            {validating ? 'Checking...' : '🔗 Validate Links'}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="admin-btn-success flex items-center gap-1.5"
          >
            <span>+</span> Add Resource (Manual)
          </button>
        </div>
      </div>

      {/* Sync Result Banner if recently run */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 flex justify-between items-center animate-fade-in">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <span>✅</span> NCERT Sync Completed
            </h3>
            <div className="text-xs mt-1 space-x-3 text-emerald-700 font-medium">
              <span>New Resources: <strong>{syncResult.newResources || 0}</strong></span>
              <span>•</span>
              <span>Updated: <strong>{syncResult.updated || 0}</strong></span>
              <span>•</span>
              <span>Total in DB: <strong>{syncResult.total || 0}</strong></span>
              <span>•</span>
              <span>Last Run: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-emerald-600 hover:text-emerald-900 text-sm font-bold"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Content Health Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="admin-metric-card">
          <div className="admin-metric-label">Total Resources</div>
          <div className="admin-metric-value">{health?.total || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Across 12 classes</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-label">Active & Live</div>
          <div className="admin-metric-value text-emerald-600">{health?.active || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Available to users</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-label">Unavailable</div>
          <div className="admin-metric-value text-amber-600">{health?.unavailable || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Safe non-deleted</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-label">Missing URLs</div>
          <div className="admin-metric-value text-blue-600">{health?.missingUrls || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Requires official link</div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-label">Last NCERT Sync</div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            {health?.lastSyncAt ? new Date(health.lastSyncAt).toLocaleDateString('en-GB') : 'Never'}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Status: {health?.lastSyncStatus || 'IDLE'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search by title, subject, chapter, or sourceId..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input text-sm"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="admin-select text-sm w-auto"
          >
            <option value="All">All Categories</option>
            <option value="NCERT_BOOK">NCERT Books</option>
            <option value="NCERT_SOLUTION">NCERT Solutions</option>
            <option value="NCERT_NOTE">NCERT Notes</option>
            <option value="CBSE_PAPER">CBSE Papers</option>
            <option value="OTHER_SOLUTION">Other Solutions</option>
          </select>

          <select
            value={filterMedium}
            onChange={(e) => { setFilterMedium(e.target.value); setPage(1); }}
            className="admin-select text-sm w-auto"
          >
            <option value="All">All Mediums</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>

          <select
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
            className="admin-select text-sm w-auto"
          >
            <option value="All">All Classes</option>
            {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((c) => (
              <option key={c} value={`Class ${c}`}>Class {c}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="admin-select text-sm w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>

          <button type="submit" className="admin-btn-primary text-sm px-4">
            Search
          </button>
        </form>
      </div>

      {/* Educational Resources Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800">
            Educational Catalog Records ({total})
          </h2>
          <span className="text-xs text-slate-500">Page {page}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading catalog records...</div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No educational resources found. Try running NCERT Sync.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title & Subject</th>
                  <th>Class / Medium</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Official Link</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => (
                  <tr key={res._id}>
                    <td>
                      <div className="font-bold text-slate-900">{res.title}</div>
                      <div className="text-xs text-slate-500">{res.subject} • {res.publisher || 'NCERT'}</div>
                    </td>
                    <td>
                      <span className="font-semibold">{res.classLevel}</span>
                      <div className="text-xs text-slate-500">{res.medium}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-blue text-xs">
                        {res.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-blue-700">
                        {res.chapters?.length || 0}
                      </span>
                    </td>
                    <td>
                      {res.officialUrl ? (
                        <a
                          href={res.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>🔗</span> View Link
                        </a>
                      ) : (
                        <span className="text-xs text-red-500 font-bold">Missing</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          res.isActive && res.availabilityStatus === 'AVAILABLE'
                            ? 'admin-badge-emerald'
                            : 'admin-badge-amber'
                        }`}
                      >
                        {res.isActive ? res.availabilityStatus : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(res)}
                        className="admin-btn-square view"
                        title="Edit Resource & Chapters"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleActive(res)}
                        className="admin-btn-square delete"
                        title={res.isActive ? 'Deactivate' : 'Restore'}
                      >
                        {res.isActive ? '🚫' : '✓'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="admin-btn-secondary text-xs px-3 py-1.5"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-600 font-medium">
            Page {page} of {Math.ceil(total / 15) || 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 15 >= total}
            className="admin-btn-secondary text-xs px-3 py-1.5"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Add / Edit Resource Modal (Manual Fallback) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingResource ? 'Edit Educational Resource' : 'Add Educational Resource (Manual Fallback)'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Mathematics Part-I"
                  />
                </div>

                <div>
                  <label className="admin-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="admin-select"
                  >
                    <option value="NCERT_BOOK">NCERT Book</option>
                    <option value="NCERT_SOLUTION">NCERT Solution</option>
                    <option value="NCERT_NOTE">NCERT Note</option>
                    <option value="CBSE_PAPER">CBSE Paper</option>
                    <option value="OTHER_SOLUTION">Other Solution</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Class Level *</label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="admin-select"
                  >
                    {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((c) => (
                      <option key={c} value={`Class ${c}`}>Class {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">Medium *</label>
                  <select
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    className="admin-select"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Urdu">Urdu</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Mathematics, Physics, Science"
                  />
                </div>

                <div>
                  <label className="admin-label">Publisher / Source</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="admin-input"
                    placeholder="NCERT"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">Official Portal URL</label>
                <input
                  type="url"
                  value={formData.officialUrl}
                  onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                  className="admin-input"
                  placeholder="https://ncert.nic.in/textbook.php"
                />
              </div>

              <div>
                <label className="admin-label">Download URL (Full Book ZIP / PDF)</label>
                <input
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className="admin-input"
                  placeholder="https://ncert.nic.in/textbook/pdf/lemh1dd.zip"
                />
              </div>

              <div>
                <label className="admin-label">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-input"
                  placeholder="Official curriculum description..."
                ></textarea>
              </div>

              {/* Chapters / Units Management */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Chapters / Units ({formData.chapters.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddChapterRow}
                    className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100"
                  >
                    + Add Chapter
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {formData.chapters.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 w-6 text-center">
                        {ch.unitNumber || idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Chapter Title (e.g. Real Numbers)"
                        value={ch.title}
                        onChange={(e) => handleChapterChange(idx, 'title', e.target.value)}
                        className="admin-input text-xs flex-1"
                        required
                      />
                      <input
                        type="url"
                        placeholder="PDF Open URL"
                        value={ch.openUrl}
                        onChange={(e) => handleChapterChange(idx, 'openUrl', e.target.value)}
                        className="admin-input text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveChapterRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 font-bold text-sm"
                        title="Delete Chapter"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingResource ? 'Update Resource' : 'Create Resource'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminContentPage;
