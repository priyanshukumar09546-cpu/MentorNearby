import React, { useState, useEffect, useMemo } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminActionModal from '../../components/admin/AdminActionModal';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminKYCPage = () => {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Stats from MongoDB
  const [stats, setStats] = useState({
    pendingCount: 0,
    verifiedToday: 0,
    rejectedToday: 0
  });

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDocType, setFilterDocType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals State
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [detailItem, setDetailItem] = useState(null);
  const [whatsappItem, setWhatsappItem] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);

  // Aadhaar Document Inspection Modal State
  const [aadhaarModal, setAadhaarModal] = useState({
    isOpen: false,
    loading: false,
    record: null,
    data: null,
    error: null,
    activeDocIndex: 0,
    zoom: 1,
    rotation: 0,
    isImageLoading: false,
    imageLoadError: false,
  });

  // Rejection Form State
  const [selectedRejectReason, setSelectedRejectReason] = useState('Incomplete documents');
  const [customRejectComment, setCustomRejectComment] = useState('');

  // WhatsApp Message State
  const [selectedTemplate, setSelectedTemplate] = useState('profile');
  const [customWaMsg, setCustomWaMsg] = useState('');

  const { showToast } = useToast();

  const fetchKycList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/admin/kyc?status=${filterStatus}&search=${encodeURIComponent(searchTerm)}`);
      const payload = response.data.data;
      const records = payload.kycRecords || payload.kycList || payload || [];
      
      setKycList(records);
      setStats({
        pendingCount: payload.pendingCount || records.filter(r => r.status === 'PENDING').length,
        verifiedToday: payload.verifiedToday || 0,
        rejectedToday: payload.rejectedToday || 0
      });
    } catch (err) {
      setError('Unable to load KYC verification queue from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, [filterStatus]);

  // Profile completion calculation & progress tiers
  const calculateProfileCompletion = (profile) => {
    if (!profile) return { percentage: 0, tier: 'Needs Improvement', missing: ['Profile Info', 'Education', 'Location'] };
    if (profile.profileCompletionPercentage !== undefined && profile.profileCompletionPercentage !== null) {
      const pct = profile.profileCompletionPercentage;
      let tier = 'Needs Improvement';
      if (pct === 100) tier = 'Profile Complete';
      else if (pct >= 71) tier = 'Good Progress';
      else if (pct >= 41) tier = 'Moderate Progress';

      const missing = [];
      if (!profile.bio) missing.push('Bio');
      if (!profile.introVideo?.url) missing.push('Intro Video');
      if (!profile.education?.length) missing.push('Education');
      if (!profile.subjects?.length) missing.push('Subjects');
      if (!profile.location?.city) missing.push('Location');
      return { percentage: pct, tier, missing };
    }

    let points = 0;
    const missing = [];
    if (profile.bio) points += 15; else missing.push('Bio');
    if (profile.teachingPhilosophy) points += 10; else missing.push('Philosophy');
    if (profile.profilePhoto?.url) points += 15; else missing.push('Photo');
    if (profile.introVideo?.url) points += 10; else missing.push('Intro Video');
    if (profile.education?.length) points += 15; else missing.push('Education');
    if (profile.subjects?.length) points += 15; else missing.push('Subjects');
    if (profile.location?.city) points += 10; else missing.push('Location');
    if (profile.fees?.amount) points += 10; else missing.push('Fees');

    const pct = Math.min(points, 100);
    let tier = 'Needs Improvement';
    if (pct === 100) tier = 'Profile Complete';
    else if (pct >= 71) tier = 'Good Progress';
    else if (pct >= 41) tier = 'Moderate Progress';

    return { percentage: pct, tier, missing };
  };

  // Priority indicator logic
  const getPriority = (record, completionPct) => {
    const hoursSinceSubmit = (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 3600);
    if (record.status === 'PENDING' && (hoursSinceSubmit > 48 || completionPct >= 80)) {
      return { label: '🔴 High Priority', color: 'text-[#C94B4B] bg-[#FCEAEA] border-[#EABABA]' };
    }
    if (record.status === 'PENDING') {
      return { label: '🟡 Normal', color: 'text-[#A96F13] bg-[#FFF3D6] border-[#F0D28C]' };
    }
    return { label: '🟢 Low', color: 'text-[#575752] bg-[#F3F1EB] border-[#E6E2D9]' };
  };

  // Filter & Sort Logic
  const filteredRecords = useMemo(() => {
    return kycList
      .filter((record) => {
        // Search Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const name = record.user?.name?.toLowerCase() || '';
          const email = record.user?.email?.toLowerCase() || '';
          const phone = record.user?.phone?.toLowerCase() || '';
          if (!name.includes(term) && !email.includes(term) && !phone.includes(term)) {
            return false;
          }
        }

        // Document Type Filter
        if (filterDocType !== 'ALL') {
          const docs = record.documents || [];
          const hasIdentity = docs.some((d) => d.type === 'GOVT_ID' || d.type === 'PHONE' || d.type === 'SELFIE');
          const hasQual = docs.some((d) => d.type === 'COLLEGE_ID' || d.type === 'ADDRESS_PROOF');
          if (filterDocType === 'IDENTITY' && !hasIdentity) return false;
          if (filterDocType === 'QUALIFICATION' && !hasQual) return false;
          if (filterDocType === 'BOTH' && (!hasIdentity || !hasQual)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'completion') {
          const compA = calculateProfileCompletion(a.tutorProfile).percentage;
          const compB = calculateProfileCompletion(b.tutorProfile).percentage;
          return compB - compA;
        }
        if (sortBy === 'priority') {
          const prioA = a.status === 'PENDING' ? 1 : 0;
          const prioB = b.status === 'PENDING' ? 1 : 0;
          return prioB - prioA;
        }
        return 0;
      });
  }, [kycList, searchTerm, filterDocType, sortBy]);

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No records available to export', 'error');
      return;
    }
    const headers = ['ID', 'Tutor Name', 'Email', 'Phone', 'Status', 'Submitted Date', 'Govt ID Type'];
    const rows = filteredRecords.map((r) => [
      r._id,
      `"${r.user?.name || ''}"`,
      r.user?.email || '',
      r.user?.phone || '',
      r.status,
      new Date(r.createdAt).toISOString().split('T')[0],
      r.govtIdType || 'AADHAAR'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tutor_kyc_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('KYC records exported to CSV successfully', 'success');
  };

  // API Action: Approve KYC
  const handleApproveConfirm = (record) => {
    setModalConfig({
      isOpen: true,
      title: 'Approve KYC Verification',
      description: `Approve ${record.user?.name || 'Tutor'}'s verification documents? This will grant them Verified Tutor status across MentorNearby.`,
      type: 'success',
      confirmText: 'Approve & Verify',
      onConfirm: async () => {
        try {
          await client.put(`/admin/kyc/${record._id}`, {
            status: 'VERIFIED',
            adminNotes: 'KYC identity and credentials verified by Admin'
          });
          showToast('✓ Tutor verified successfully', 'success');
          setDetailItem(null);
          fetchKycList();
        } catch (err) {
          showToast(err.response?.data?.message || 'Unable to approve KYC. Please try again.', 'error');
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  // API Action: Submit Rejection Modal
  const handleRejectSubmit = async () => {
    if (!rejectItem) return;
    const finalReason = selectedRejectReason === 'Other'
      ? (customRejectComment.trim() || 'Specified requirements not met')
      : selectedRejectReason + (customRejectComment.trim() ? `: ${customRejectComment.trim()}` : '');

    try {
      await client.put(`/admin/kyc/${rejectItem._id}`, {
        status: 'REJECTED',
        rejectionReason: finalReason,
        adminNotes: `Rejected by Admin: ${finalReason}`
      });
      showToast('✓ KYC application rejected', 'success');
      setRejectItem(null);
      setDetailItem(null);
      setSelectedRejectReason('Incomplete documents');
      setCustomRejectComment('');
      fetchKycList();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to reject KYC. Please try again.', 'error');
    }
  };

  // WhatsApp Action Dispatcher
  const handleSendWhatsApp = () => {
    if (!whatsappItem || !whatsappItem.user?.phone) {
      showToast('Phone number unavailable', 'error');
      return;
    }
    const name = whatsappItem.user.name || 'Tutor';
    let msg = '';
    if (selectedTemplate === 'profile') {
      msg = `Hi ${name}, this is MentorNearby Support.\n\nYour MentorNearby profile is incomplete. Please complete your remaining profile details to improve your chances of getting tuition requests.\n\nMentorNearby Team`;
    } else if (selectedTemplate === 'kyc') {
      msg = `Hi ${name}, this is MentorNearby Support.\n\nYour KYC verification is pending. Please complete the required verification documents.\n\nMentorNearby Team`;
    } else if (selectedTemplate === 'approved') {
      msg = `Hi ${name}, congratulations! Your MentorNearby KYC verification has been approved. Your verified tutor profile is now active.\n\nMentorNearby Team`;
    } else if (selectedTemplate === 'rejected') {
      msg = `Hi ${name}, this is MentorNearby Support.\n\nYour KYC submission needs an update. Please review the rejection reason and resubmit the required documents.\n\nMentorNearby Team`;
    } else {
      msg = customWaMsg.trim() || `Hi ${name}, this is MentorNearby Support.`;
    }

    const cleanPhone = whatsappItem.user.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
    showToast('WhatsApp window opened with prefilled message.', 'success');
    setWhatsappItem(null);
  };

  // Determine if tutor has an uploaded Aadhaar / ID document
  const getHasAadhaarDoc = (record) => {
    if (!record) return false;
    if (record.idPhotoPath && typeof record.idPhotoPath === 'string' && record.idPhotoPath.trim().length > 0) return true;
    if (record.tutorProfile?.idPhotoPath && typeof record.tutorProfile.idPhotoPath === 'string' && record.tutorProfile.idPhotoPath.trim().length > 0) return true;
    if (record.documents && Array.isArray(record.documents)) {
      const hasGovtId = record.documents.some((d) => d && (d.url || d.publicId) && (d.type === 'GOVT_ID' || d.type === 'ADDRESS_PROOF' || d.type === 'ID_PROOF'));
      if (hasGovtId) return true;
    }
    return false;
  };

  // Resolve document URL (handling Cloudinary, local streams, and token authorization)
  const getDocumentViewerUrl = (rawUrl) => {
    if (!rawUrl) return '';
    let finalUrl = rawUrl;
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('data:')) {
      const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.mentornearby.com');
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      finalUrl = `${base}${cleanPath}`;
    }
    // Attach auth token if request is hitting private admin file streaming endpoint
    if (finalUrl.includes('/api/admin/kyc/file/')) {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('mn_token')) : null;
      if (token && !finalUrl.includes('token=')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
      }
    }
    return finalUrl;
  };

  // Open Aadhaar Inspection Modal
  const handleOpenAadhaarViewer = async (record) => {
    const rawLast4 = record.aadhaarLast4 || record.govtIdLast4 || record.tutorProfile?.aadhaarLast4 || '';
    const initialMasked = rawLast4 ? `•••• •••• ${rawLast4}` : 'Not Specified';

    // Prepare client-side fallback documents while fetching fresh backend data
    const fallbackDocs = [];
    if (record.idPhotoPath) {
      fallbackDocs.push({
        label: 'Aadhaar Document (Front Side)',
        url: record.idPhotoPath,
        side: 'front',
      });
    }
    if (record.tutorProfile?.idPhotoPath && record.tutorProfile.idPhotoPath !== record.idPhotoPath) {
      fallbackDocs.push({
        label: fallbackDocs.length === 0 ? 'Aadhaar Document (Front Side)' : 'Aadhaar Document (Back Side)',
        url: record.tutorProfile.idPhotoPath,
        side: fallbackDocs.length === 0 ? 'front' : 'back',
      });
    }
    if (Array.isArray(record.documents)) {
      record.documents.filter(d => d.type === 'GOVT_ID' || d.type === 'ADDRESS_PROOF').forEach((d, idx) => {
        if (d.url && !fallbackDocs.some(f => f.url === d.url)) {
          fallbackDocs.push({
            label: idx === 0 && fallbackDocs.length === 0 ? 'Aadhaar Document (Front Side)' : 'Aadhaar Document (Back Side)',
            url: d.url,
            side: idx === 0 ? 'front' : 'back',
            type: d.type
          });
        }
      });
    }

    setAadhaarModal({
      isOpen: true,
      loading: true,
      record,
      data: {
        tutorName: record.user?.name || 'Tutor',
        tutorEmail: record.user?.email || '',
        tutorPhone: record.user?.phone || '',
        maskedAadhaar: initialMasked,
        kycStatus: record.status || 'PENDING',
        verhoeffPass: record.aadhaarVerhoeffPass ?? record.tutorProfile?.aadhaarVerhoeffPass ?? true,
        documents: fallbackDocs,
        hasDocument: fallbackDocs.length > 0,
        isDigilocker: Boolean(record.digilockerVerified || record.digilockerData?.verifiedAt),
      },
      error: null,
      activeDocIndex: 0,
      zoom: 1,
      rotation: 0,
      isImageLoading: fallbackDocs.length > 0,
      imageLoadError: false,
    });

    try {
      const response = await client.get(`/admin/kyc/${record._id}/document`);
      if (response.data && response.data.data) {
        const docData = response.data.data;
        setAadhaarModal((prev) => ({
          ...prev,
          loading: false,
          data: docData,
          activeDocIndex: 0,
          zoom: 1,
          rotation: 0,
          isImageLoading: (docData.documents || []).length > 0,
          imageLoadError: false,
        }));
      }
    } catch (err) {
      setAadhaarModal((prev) => ({
        ...prev,
        loading: false,
        error: prev.data?.documents?.length ? null : (err.response?.data?.message || 'Unable to load Aadhaar document from server.'),
        isImageLoading: false,
      }));
    }
  };

  const handleZoomIn = () => {
    setAadhaarModal((prev) => ({ ...prev, zoom: Math.min(Number((prev.zoom + 0.25).toFixed(2)), 3.5) }));
  };

  const handleZoomOut = () => {
    setAadhaarModal((prev) => ({ ...prev, zoom: Math.max(Number((prev.zoom - 0.25).toFixed(2)), 0.5) }));
  };

  const handleResetZoom = () => {
    setAadhaarModal((prev) => ({ ...prev, zoom: 1, rotation: 0 }));
  };

  const handleRotate = () => {
    setAadhaarModal((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleCloseAadhaarModal = () => {
    setAadhaarModal({
      isOpen: false,
      loading: false,
      record: null,
      data: null,
      error: null,
      activeDocIndex: 0,
      zoom: 1,
      rotation: 0,
      isImageLoading: false,
      imageLoadError: false,
    });
  };

  // Keyboard shortcut listener for ESC key to close viewer modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && aadhaarModal.isOpen) {
        handleCloseAadhaarModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aadhaarModal.isOpen]);

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      {/* 1. Page Header */}
      <AdminPageHeader
        icon="🛡️"
        eyebrow="KYC VERIFICATION"
        title="KYC Verification Center"
        subtitle="Review, verify and manage tutor identity and qualification documents."
      >
        {/* Top KPI Strip */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#FFF4D8] border border-[#F2C66D] px-4 py-2 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] uppercase font-bold text-[#A96F13]">Pending Reviews</span>
            <span className="text-lg font-black text-[#A96F13]">{stats.pendingCount}</span>
          </div>

          <div className="bg-[#E7F5ED] border border-[#B9DEC9] px-4 py-2 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] uppercase font-bold text-[#238B5A]">Verified Today</span>
            <span className="text-lg font-black text-[#238B5A]">{stats.verifiedToday}</span>
          </div>

          <div className="bg-[#FCEAEA] border border-[#EABABA] px-4 py-2 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] uppercase font-bold text-[#C94B4B]">Rejected Today</span>
            <span className="text-lg font-black text-[#C94B4B]">{stats.rejectedToday}</span>
          </div>

          <button
            onClick={fetchKycList}
            disabled={loading}
            className="admin-btn admin-btn-secondary px-3 py-2 text-xs"
            title="Refresh Queue"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* 2. Filter Panel */}
      <div className="admin-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tutor by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-9"
            />
            <span className="absolute left-3 top-2.5 text-[#85857D] text-xs">🔍</span>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-select w-full font-semibold"
            >
              <option value="ALL">Status: All Records</option>
              <option value="PENDING">🟡 Status: Pending Review</option>
              <option value="VERIFIED">🟢 Status: Verified Only</option>
              <option value="REJECTED">🔴 Status: Rejected Only</option>
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="admin-select w-full font-semibold"
            >
              <option value="ALL">Document: All Types</option>
              <option value="IDENTITY">Govt Identity Uploaded</option>
              <option value="QUALIFICATION">Qualification Document Uploaded</option>
              <option value="BOTH">Both Documents Uploaded</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-select w-full font-semibold"
            >
              <option value="newest">Sort: Newest Submissions</option>
              <option value="oldest">Sort: Oldest Submissions</option>
              <option value="completion">Sort: Profile Completion</option>
              <option value="priority">Sort: Verification Priority</option>
            </select>
          </div>

        </div>

        {/* Secondary Toolbar Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6E2D9] text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#575752]">
              <input
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filteredRecords.length}
                onChange={toggleSelectAll}
                className="rounded border-[#DDD9CF] text-[#D89B2B] focus:ring-0"
              />
              <span>Select All ({selectedIds.length} chosen)</span>
            </label>

            {selectedIds.length > 0 && (
              <span className="admin-badge admin-badge-gold">
                {selectedIds.length} tutors selected for bulk review/export
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="admin-btn admin-btn-secondary px-3 py-1.5 text-xs"
            >
              📥 Export CSV
            </button>
            {(searchTerm || filterStatus !== 'ALL' || filterDocType !== 'ALL' || sortBy !== 'newest') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('ALL');
                  setFilterDocType('ALL');
                  setSortBy('newest');
                }}
                className="text-[#A96F13] hover:underline font-bold px-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Error Banner */}
      {error && (
        <div className="bg-[#FCEAEA] border border-[#EABABA] p-4 rounded-2xl flex items-center justify-between text-[#C94B4B] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={fetchKycList} className="admin-btn admin-btn-danger text-xs px-3 py-1">
            Retry Loading
          </button>
        </div>
      )}

      {/* 4. Table / Cards View */}
      {loading ? (
        <div className="admin-card p-8 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse flex items-center justify-between p-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2D9]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#EAE7DF] rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-36 h-4 bg-[#EAE7DF] rounded"></div>
                  <div className="w-48 h-3 bg-[#EAE7DF] rounded"></div>
                </div>
              </div>
              <div className="w-24 h-8 bg-[#EAE7DF] rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <AdminEmptyState
          icon="🎉"
          title="No KYC Reviews Pending"
          description="All tutor verification requests matching your filters are currently up to date."
        />
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const profile = record.tutorProfile;
            const completion = calculateProfileCompletion(profile);
            const priority = getPriority(record, completion.percentage);
            const isVerified = record.status === 'VERIFIED';
            const isRejected = record.status === 'REJECTED';
            const docs = record.documents || [];
            const identityDoc = docs.find((d) => d.type === 'GOVT_ID' || d.type === 'PHONE' || d.type === 'SELFIE');
            const qualDoc = docs.find((d) => d.type === 'COLLEGE_ID' || d.type === 'ADDRESS_PROOF');

            // Masked phone display: +91 98765 ****
            const rawPhone = record.user?.phone || '';
            const maskedPhone = rawPhone && rawPhone.length >= 10
              ? `${rawPhone.slice(0, 5)} ${'•'.repeat(rawPhone.length - 5)}`
              : (rawPhone || 'N/A');

            return (
              <div
                key={record._id}
                className={`admin-card p-5 sm:p-6 transition-all duration-200 ${
                  selectedIds.includes(record._id) ? 'border-[#D89B2B] bg-[#FFF8E8]' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
                  
                  {/* Left Column: Checkbox, Profile Avatar, Tutor Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record._id)}
                      onChange={() => toggleSelect(record._id)}
                      className="mt-4 rounded border-[#DDD9CF] text-[#D89B2B] focus:ring-0"
                    />

                    {/* Circular Profile Avatar (56px max) */}
                    <div className="relative flex-shrink-0">
                      <ProfileAvatar
                        src={profile?.profilePhoto?.url}
                        name={record.user?.name}
                        size="md"
                        showBadge={isVerified}
                      />
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#1C1C1A] text-base truncate flex items-center gap-1.5">
                          <span>{record.user?.name || 'Tutor User'}</span>
                          {isVerified && <span className="text-[#238B5A] text-xs" title="Verified Tutor">✓</span>}
                        </h3>
                        <span className="bg-[#F3F1EB] text-[#575752] border border-[#E6E2D9] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                          {record.user?.role || 'TUTOR'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>

                      <p className="text-xs text-[#85857D] truncate">
                        {record.user?.email} • <span className="font-mono text-[#575752]">{maskedPhone}</span>
                      </p>

                      {/* Status & Dates */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <span
                          className={`admin-badge ${
                            isVerified ? 'admin-badge-emerald' : isRejected ? 'admin-badge-rose' : 'admin-badge-amber'
                          }`}
                        >
                          {isVerified ? '🟢 Verified' : isRejected ? '🔴 Rejected' : '🟡 Pending Review'}
                        </span>

                        <span className="text-[#85857D] text-[11px]">
                          Submitted: <strong className="text-[#1C1C1A]">{new Date(record.createdAt).toLocaleDateString()}</strong>
                        </span>
                      </div>

                      {/* Profile Completion Progress Bar */}
                      <div className="pt-2 max-w-md">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-bold text-[#575752]">
                            Profile Completion: <span className="text-[#A96F13] font-semibold">({completion.tier})</span>
                          </span>
                          <span className="font-black text-[#A96F13]">{completion.percentage}%</span>
                        </div>
                        <div className="admin-progress-track">
                          <div
                            className={`h-full transition-all duration-300 ${
                              completion.percentage >= 80 ? 'admin-progress-fill-complete' : completion.percentage >= 50 ? 'admin-progress-fill-good' : 'admin-progress-fill-incomplete'
                            }`}
                            style={{ width: `${completion.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Aadhaar & Document Status Indicators */}
                  <div className="w-full lg:w-72 space-y-2.5 text-xs bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E6E2D9]">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#85857D]">Aadhaar & ID Document</span>
                      {record.digilockerVerified && (
                        <span className="text-[10px] font-bold text-[#1D7446] bg-[#EBF7EE] border border-[#B3E5C4] px-1.5 py-0.5 rounded">
                          🛡️ DigiLocker
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[#575752]">Aadhaar Number:</span>
                      <span className="font-mono font-bold text-[#1C1C1A]">•••• •••• {record.aadhaarLast4 || record.govtIdLast4 || record.tutorProfile?.aadhaarLast4 || 'XXXX'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#575752]">Verhoeff Check:</span>
                      {(record.aadhaarVerhoeffPass ?? record.tutorProfile?.aadhaarVerhoeffPass ?? true) ? (
                        <span className="bg-[#EBF7EE] text-[#1D7446] border border-[#B3E5C4] text-[10px] font-bold px-2 py-0.5 rounded">
                          ✓ Pass
                        </span>
                      ) : (
                        <span className="bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[10px] font-bold px-2 py-0.5 rounded">
                          ⚠️ Warning / Check
                        </span>
                      )}
                    </div>

                    {/* Document Status & View Aadhaar Action Button */}
                    <div className="pt-2 border-t border-[#E6E2D9] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#575752] font-medium">Document Status:</span>
                        {getHasAadhaarDoc(record) ? (
                          <span className="bg-[#E7F5ED] text-[#238B5A] border border-[#B9DEC9] text-[10px] font-bold px-2 py-0.5 rounded">
                            ✓ Document Uploaded
                          </span>
                        ) : (
                          <span className="bg-[#FCEAEA] text-[#C94B4B] border border-[#EABABA] text-[10px] font-bold px-2 py-0.5 rounded">
                            ✕ Document Not Uploaded
                          </span>
                        )}
                      </div>

                      {getHasAadhaarDoc(record) ? (
                        <button
                          type="button"
                          id={`view-aadhaar-btn-${record._id}`}
                          onClick={() => handleOpenAadhaarViewer(record)}
                          className="w-full py-2 px-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] border border-[#1E293B]"
                          title="View tutor's uploaded Aadhaar document"
                        >
                          <span className="text-sm">📄</span>
                          <span>View Aadhaar Document</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-3 bg-[#F3F1EB] text-[#85857D] border border-[#E6E2D9] font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                          title="No Aadhaar document uploaded by tutor"
                        >
                          <span className="text-sm">✕</span>
                          <span>Document Not Uploaded</span>
                        </button>
                      )}
                    </div>

                    {record.rejectionReason && (
                      <div className="mt-1 p-2 bg-[#FCEAEA] border border-[#EABABA] rounded text-[10px] text-[#C94B4B]">
                        <strong>Rejection Reason:</strong> {record.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Right Column: 40px Square Glass Action Buttons */}
                  <div className="w-full lg:w-auto flex items-center lg:flex-row gap-2 justify-end">
                    <button
                      onClick={() => setDetailItem(record)}
                      className="admin-btn-square view"
                      title="View Details"
                    >
                      👁️
                    </button>

                    {!isVerified && (
                      <button
                        onClick={() => handleApproveConfirm(record)}
                        className="admin-btn-square approve"
                        title="Approve KYC"
                      >
                        ✓
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        onClick={() => setRejectItem(record)}
                        className="admin-btn-square reject"
                        title="Reject KYC"
                      >
                        ✕
                      </button>
                    )}

                    <button
                      onClick={() => setWhatsappItem(record)}
                      disabled={!record.user?.phone}
                      className={`admin-btn-square whatsapp ${
                        !record.user?.phone ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      title={record.user?.phone ? 'Contact tutor on WhatsApp' : 'Phone number unavailable'}
                    >
                      💬
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: VIEW DETAILS DRAWER */}
      {/* ========================================================================= */}
      {detailItem && (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-[#E3DFD6] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#1C1C1A]">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#FAF9F6] border-b border-[#E6E2D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ProfileAvatar src={detailItem.tutorProfile?.profilePhoto?.url} name={detailItem.user?.name} size="md" />
                <div>
                  <h3 className="font-bold text-[#1C1C1A] text-lg">{detailItem.user?.name}</h3>
                  <p className="text-xs text-[#77766E]">{detailItem.user?.email} • Phone: {detailItem.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-[#85857D] hover:text-[#1C1C1A] font-bold text-xl p-1">✕</button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
              
              {/* Profile Completion Bar */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E6E2D9] space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#575752]">Profile Completion Status ({calculateProfileCompletion(detailItem.tutorProfile).tier})</span>
                  <span className="text-[#A96F13]">{calculateProfileCompletion(detailItem.tutorProfile).percentage}%</span>
                </div>
                <div className="admin-progress-track">
                  <div
                    className="admin-progress-fill-good h-full transition-all"
                    style={{ width: `${calculateProfileCompletion(detailItem.tutorProfile).percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Identity Verification Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#A96F13] uppercase tracking-wider">IDENTITY VERIFICATION</h4>
                  {getHasAadhaarDoc(detailItem) ? (
                    <button
                      onClick={() => handleOpenAadhaarViewer(detailItem)}
                      className="px-3 py-1 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>📄</span>
                      <span>View Aadhaar Document</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[#C94B4B] bg-[#FCEAEA] px-2 py-0.5 rounded border border-[#EABABA]">
                      Document Not Uploaded
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(detailItem.idPhotoPath || detailItem.tutorProfile?.idPhotoPath) && (
                    <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E6E2D9] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1C1C1A] block">Aadhaar / ID Card</span>
                        <span className="text-[10px] text-[#85857D]">Uploaded Document</span>
                      </div>
                      <button
                        onClick={() => handleOpenAadhaarViewer(detailItem)}
                        className="admin-btn admin-btn-primary py-1 text-xs"
                      >
                        Inspect Aadhaar ↗
                      </button>
                    </div>
                  )}
                  {(detailItem.documents || []).map((doc, idx) => (
                    <div key={idx} className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E6E2D9] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1C1C1A] block">{doc.type || 'Document'}</span>
                        <span className="text-[10px] text-[#85857D]">Uploaded {new Date(doc.uploadedAt || detailItem.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.url ? (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="admin-btn admin-btn-secondary py-1 text-xs"
                        >
                          View Document ↗
                        </button>
                      ) : (
                        <span className="text-[#C94B4B] italic font-bold">No File</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Information Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#A96F13] uppercase tracking-wider">PROFILE INFORMATION</h4>
                <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E6E2D9] space-y-2.5 text-[#575752]">
                  <p><strong className="text-[#1C1C1A]">Headline:</strong> {detailItem.tutorProfile?.professionalHeadline || 'Not provided'}</p>
                  <p><strong className="text-[#1C1C1A]">Bio:</strong> {detailItem.tutorProfile?.bio || 'No bio submitted.'}</p>
                  <p><strong className="text-[#1C1C1A]">Subjects Taught:</strong> {detailItem.tutorProfile?.subjects?.join(', ') || 'N/A'}</p>
                  <p><strong className="text-[#1C1C1A]">Classes / Grades:</strong> {detailItem.tutorProfile?.grades?.join(', ') || 'N/A'}</p>
                  <p><strong className="text-[#1C1C1A]">Teaching Modes:</strong> {detailItem.tutorProfile?.teachingModes?.join(', ') || 'N/A'}</p>
                  <p><strong className="text-[#1C1C1A]">Expected Fees:</strong> ₹{detailItem.tutorProfile?.fees?.amount || 0} / {detailItem.tutorProfile?.fees?.frequency || 'Month'}</p>
                  <p><strong className="text-[#1C1C1A]">Experience:</strong> {detailItem.tutorProfile?.experience?.years || 0} Years</p>
                  <p><strong className="text-[#1C1C1A]">Location:</strong> {detailItem.tutorProfile?.location?.area}, {detailItem.tutorProfile?.location?.city} ({detailItem.tutorProfile?.location?.pincode})</p>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-[#FAF9F6] border-t border-[#E6E2D9] flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setWhatsappItem(detailItem)}
                disabled={!detailItem.user?.phone}
                className="admin-btn admin-btn-success disabled:opacity-50"
              >
                💬 WhatsApp Tutor
              </button>

              {detailItem.status !== 'VERIFIED' && (
                <button
                  onClick={() => handleApproveConfirm(detailItem)}
                  className="admin-btn admin-btn-primary"
                >
                  ✓ Approve KYC
                </button>
              )}

              {detailItem.status !== 'REJECTED' && (
                <button
                  onClick={() => setRejectItem(detailItem)}
                  className="admin-btn admin-btn-danger"
                >
                  ✕ Reject KYC
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: REJECT KYC FORM */}
      {/* ========================================================================= */}
      {rejectItem && (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl border border-[#E3DFD6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#1C1C1A]">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-[#1C1C1A] text-base">Reject KYC Application</h3>
              <button onClick={() => setRejectItem(null)} className="text-[#85857D] hover:text-[#1C1C1A]">✕</button>
            </div>

            <p className="text-xs text-[#575752]">
              Please select a mandatory rejection reason for <strong className="text-[#1C1C1A]">{rejectItem.user?.name}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#575752] uppercase tracking-wider mb-1">Reason Category</label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="admin-select w-full"
                >
                  <option value="Incomplete documents">Incomplete documents</option>
                  <option value="Invalid identity document">Invalid identity document</option>
                  <option value="Qualification proof missing">Qualification proof missing</option>
                  <option value="Document unreadable">Document unreadable</option>
                  <option value="Information mismatch">Information mismatch</option>
                  <option value="Other">Other (specify below)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#575752] uppercase tracking-wider mb-1">Additional Comments</label>
                <textarea
                  rows="3"
                  value={customRejectComment}
                  onChange={(e) => setCustomRejectComment(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  className="admin-textarea w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectItem(null)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="admin-btn admin-btn-danger flex-1"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: WHATSAPP TEMPLATES */}
      {/* ========================================================================= */}
      {whatsappItem && (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl border border-[#E3DFD6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#1C1C1A]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-[#25D366] text-lg">💬</span>
                <h3 className="font-bold text-[#1C1C1A] text-base">Contact Tutor on WhatsApp</h3>
              </div>
              <button onClick={() => setWhatsappItem(null)} className="text-[#85857D] hover:text-[#1C1C1A]">✕</button>
            </div>

            <p className="text-xs text-[#575752]">
              Select a message template to contact <strong className="text-[#1C1C1A]">{whatsappItem.user?.name}</strong> via WhatsApp.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#575752] uppercase tracking-wider mb-1">Message Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="admin-select w-full"
                >
                  <option value="profile">Incomplete Profile Reminder</option>
                  <option value="kyc">KYC Pending Reminder</option>
                  <option value="approved">KYC Approval Notice</option>
                  <option value="rejected">KYC Rejection / Update Notice</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>

              {selectedTemplate === 'custom' && (
                <div>
                  <label className="block font-bold text-[#575752] uppercase tracking-wider mb-1">Custom Message</label>
                  <textarea
                    rows="3"
                    value={customWaMsg}
                    onChange={(e) => setCustomWaMsg(e.target.value)}
                    placeholder="Type message to tutor..."
                    className="admin-textarea w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setWhatsappItem(null)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="admin-btn admin-btn-success flex-1"
              >
                <span>💬 Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: SECURE DOCUMENT PREVIEW */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl border border-[#E3DFD6] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-[#1C1C1A]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#1C1C1A] text-base">Document Preview: {previewDoc.type || 'Govt Document'}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-[#85857D] hover:text-[#1C1C1A]">✕</button>
            </div>

            <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#E6E2D9] flex items-center justify-center min-h-[250px] max-h-[400px] overflow-hidden">
              {previewDoc.url ? (
                previewDoc.url.endsWith('.pdf') ? (
                  <iframe src={previewDoc.url} title="Doc Preview" className="w-full h-80 rounded-xl" />
                ) : (
                  <img src={previewDoc.url} alt="Document Preview" className="max-h-80 max-w-full object-contain rounded-xl" />
                )
              ) : (
                <p className="text-[#85857D] italic">Document file not uploaded or link unavailable.</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {previewDoc.url ? (
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn admin-btn-primary"
                >
                  Open Original ↗
                </a>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setPreviewDoc(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: PROFESSIONAL AADHAAR DOCUMENT INSPECTION VIEWER */}
      {/* ========================================================================= */}
      {aadhaarModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="aadhaar-modal-title"
          className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAadhaarModal();
          }}
        >
          <div className="bg-[#0F172A] border border-[#334155] rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            
            {/* 1. Modal Header: Tutor Name, Masked Aadhaar, Status Badges, Close Button */}
            <div className="p-4 sm:p-5 bg-[#1E293B] border-b border-[#334155] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#334155] flex items-center justify-center text-xl font-bold flex-shrink-0">
                  🛡️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 id="aadhaar-modal-title" className="font-extrabold text-white text-base sm:text-lg truncate">
                      {aadhaarModal.data?.tutorName || aadhaarModal.record?.user?.name || 'Tutor Aadhaar Document'}
                    </h3>
                    <span className="bg-[#334155] text-slate-200 border border-[#475569] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                      Tutor ID
                    </span>
                    {aadhaarModal.data?.isDigilocker && (
                      <span className="bg-[#064E3B] text-[#6EE7B7] border border-[#047857] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <span>🛡️</span>
                        <span>DigiLocker UIDAI</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                    <span>Aadhaar:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {aadhaarModal.data?.maskedAadhaar || '•••• •••• XXXX'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">
                      {aadhaarModal.data?.tutorEmail || aadhaarModal.record?.user?.email || 'Confidential'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Close button */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    aadhaarModal.data?.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : aadhaarModal.data?.kycStatus === 'REJECTED'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                      : 'bg-amber-950/80 text-amber-300 border-amber-700'
                  }`}
                >
                  {aadhaarModal.data?.kycStatus === 'VERIFIED'
                    ? '🟢 Verified'
                    : aadhaarModal.data?.kycStatus === 'REJECTED'
                    ? '🔴 Rejected'
                    : '🟡 Pending Review'}
                </span>

                <button
                  type="button"
                  onClick={handleCloseAadhaarModal}
                  className="w-9 h-9 rounded-xl bg-[#334155] hover:bg-[#475569] text-slate-200 hover:text-white flex items-center justify-center font-bold text-base transition-all"
                  title="Close viewer (Esc)"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2. Sub-header: Document Side Tabs (Front / Back) & Document Info */}
            <div className="px-4 py-2.5 bg-[#162032] border-b border-[#334155] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  Sides / Pages:
                </span>
                {(!aadhaarModal.data?.documents || aadhaarModal.data.documents.length === 0) ? (
                  <span className="text-rose-400 font-bold">No documents attached</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {aadhaarModal.data.documents.map((doc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAadhaarModal((prev) => ({
                            ...prev,
                            activeDocIndex: idx,
                            zoom: 1,
                            rotation: 0,
                            isImageLoading: true,
                            imageLoadError: false,
                          }));
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          aadhaarModal.activeDocIndex === idx
                            ? 'bg-[#D89B2B] text-[#1C1C1A] shadow-md font-extrabold'
                            : 'bg-[#1E293B] text-slate-300 hover:bg-[#334155] border border-[#334155]'
                        }`}
                      >
                        <span>{idx === 0 ? '📄 Front Side' : idx === 1 ? '📄 Back Side' : `📄 Doc #${idx + 1}`}</span>
                        {doc.side && (
                          <span className="text-[10px] opacity-75 uppercase">({doc.side})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active document label */}
              {aadhaarModal.data?.documents?.[aadhaarModal.activeDocIndex] && (
                <span className="text-slate-400 text-[11px] truncate max-w-xs">
                  Viewing: <strong className="text-slate-200">{aadhaarModal.data.documents[aadhaarModal.activeDocIndex].label || 'Aadhaar Card'}</strong>
                </span>
              )}
            </div>

            {/* 3. Inspection Controls Toolbar (Zoom in/out, fit, rotate, open original) */}
            <div className="px-4 py-2 bg-[#1E293B]/70 border-b border-[#334155] flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Zoom controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={aadhaarModal.zoom <= 0.5}
                  className="px-2.5 py-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-40 disabled:hover:bg-[#334155] text-white rounded font-bold transition-all"
                  title="Zoom Out"
                >
                  −
                </button>
                <span className="font-mono font-bold text-slate-200 px-2 py-0.5 bg-[#0F172A] rounded border border-[#334155] min-w-[54px] text-center">
                  {Math.round(aadhaarModal.zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={aadhaarModal.zoom >= 3.5}
                  className="px-2.5 py-1 bg-[#334155] hover:bg-[#475569] disabled:opacity-40 disabled:hover:bg-[#334155] text-white rounded font-bold transition-all"
                  title="Zoom In"
                >
                  +
                </button>

                <div className="h-4 w-px bg-[#334155] mx-1"></div>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 py-1 bg-[#334155] hover:bg-[#475569] text-white rounded font-semibold text-xs transition-all flex items-center gap-1"
                  title="Fit to Screen (Reset zoom and rotation)"
                >
                  <span>⟲</span>
                  <span>Fit Screen</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1 bg-[#334155] hover:bg-[#475569] text-white rounded font-semibold text-xs transition-all flex items-center gap-1"
                  title="Rotate 90 degrees clockwise"
                >
                  <span>↻</span>
                  <span>Rotate</span>
                </button>
              </div>

              {/* External open link */}
              {aadhaarModal.data?.documents?.[aadhaarModal.activeDocIndex]?.url && (
                <a
                  href={getDocumentViewerUrl(aadhaarModal.data.documents[aadhaarModal.activeDocIndex].url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded font-bold text-xs transition-all flex items-center gap-1"
                  title="Open full resolution in new browser tab"
                >
                  <span>Open Full Resolution</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* 4. Document Canvas Area */}
            <div className="flex-1 min-h-[380px] max-h-[58vh] overflow-auto bg-[#020617] relative flex items-center justify-center p-4 select-none">
              
              {/* State A: Loading from API */}
              {aadhaarModal.loading && (
                <div className="flex flex-col items-center justify-center p-8 space-y-3 text-slate-300">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold">Retrieving secure Aadhaar document...</p>
                  <p className="text-xs text-slate-500">Decrypting & verifying admin authorization</p>
                </div>
              )}

              {/* State B: Error State */}
              {!aadhaarModal.loading && (aadhaarModal.error || aadhaarModal.imageLoadError) && (
                <div className="bg-[#1E293B] border border-rose-900/60 p-6 rounded-2xl max-w-md text-center space-y-3">
                  <span className="text-3xl block">⚠️</span>
                  <h4 className="font-bold text-rose-300 text-sm">Unable to Render Document</h4>
                  <p className="text-xs text-slate-400">
                    {aadhaarModal.error || 'The image could not be loaded from storage or may require refreshed admin access credentials.'}
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAadhaarViewer(aadhaarModal.record)}
                      className="px-3 py-1.5 bg-[#334155] hover:bg-[#475569] text-white font-bold text-xs rounded-xl"
                    >
                      🔄 Retry Loading
                    </button>
                    {aadhaarModal.data?.documents?.[aadhaarModal.activeDocIndex]?.url && (
                      <a
                        href={getDocumentViewerUrl(aadhaarModal.data.documents[aadhaarModal.activeDocIndex].url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl"
                      >
                        Try Direct Link ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* State C: Document Missing */}
              {!aadhaarModal.loading && !aadhaarModal.error && !aadhaarModal.imageLoadError && (!aadhaarModal.data?.documents || aadhaarModal.data.documents.length === 0) && (
                <div className="bg-[#1E293B] border border-[#334155] p-8 rounded-2xl max-w-md text-center space-y-3">
                  <span className="text-4xl block">📄</span>
                  <h4 className="font-bold text-amber-300 text-base">Document Not Uploaded</h4>
                  <p className="text-xs text-slate-400">
                    This tutor has not uploaded an Aadhaar or Government ID document file yet.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Aadhaar Last 4 entered: <strong className="text-slate-300">{aadhaarModal.data?.maskedAadhaar || 'Not specified'}</strong>
                  </p>
                </div>
              )}

              {/* State D: Document Preview (Image or PDF) */}
              {!aadhaarModal.loading && !aadhaarModal.error && !aadhaarModal.imageLoadError && aadhaarModal.data?.documents?.[aadhaarModal.activeDocIndex] && (
                (() => {
                  const currentDoc = aadhaarModal.data.documents[aadhaarModal.activeDocIndex];
                  const docUrl = getDocumentViewerUrl(currentDoc.url);
                  const isPdf = (docUrl || '').toLowerCase().includes('.pdf');

                  if (isPdf) {
                    return (
                      <div className="w-full h-full min-h-[460px] flex flex-col items-center">
                        <iframe
                          src={docUrl}
                          title="Aadhaar Document PDF"
                          className="w-full h-full min-h-[460px] rounded-xl border border-[#334155] bg-white"
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center justify-center w-full h-full overflow-hidden p-2">
                      <img
                        src={docUrl}
                        alt={`Aadhaar Document - ${currentDoc.label || 'Tutor Govt ID'}`}
                        style={{
                          transform: `scale(${aadhaarModal.zoom}) rotate(${aadhaarModal.rotation}deg)`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-2xl border border-[#334155] cursor-grab active:cursor-grabbing"
                        onLoad={() => setAadhaarModal((prev) => ({ ...prev, isImageLoading: false, imageLoadError: false }))}
                        onError={() => setAadhaarModal((prev) => ({ ...prev, isImageLoading: false, imageLoadError: true }))}
                      />
                    </div>
                  );
                })()
              )}

            </div>

            {/* 5. Modal Footer: Security Notice & Close Button */}
            <div className="p-4 bg-[#1E293B] border-t border-[#334155] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-amber-400 font-bold">🔒 Secure Inspection Mode:</span>
                <span className="text-slate-400 hidden sm:inline">
                  Authorized Admin access only • Viewing document does NOT alter tutor approval or verification status.
                </span>
                <span className="text-slate-400 sm:hidden">
                  Viewing does NOT alter verification status.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseAadhaarModal}
                  className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white font-bold rounded-xl text-xs transition-all border border-[#475569]"
                >
                  Close Viewer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal Component */}
      <AdminActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
};

export default AdminKYCPage;
