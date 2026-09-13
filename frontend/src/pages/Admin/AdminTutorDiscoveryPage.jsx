// ============================================================
// pages/Admin/AdminTutorDiscoveryPage.jsx
// MentorNearby Autonomous India-Wide Real Tutor Discovery Center
// 100% Real Data Pipeline & Provenance Audit
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import { useToast } from '../../context/ToastContext';
import {
  getDiscoveryCities,
  addDiscoveryCity,
  updateDiscoveryCity,
  deleteDiscoveryCity,
  startDiscovery,
  pauseDiscovery,
  resumeDiscovery,
  retryFailedDiscovery,
  getDiscoveryStats,
  getDiscoveryLogs,
  runDiscoveryDeduplication,
  getDiscoveryProviders,
  toggleDiscoveryProvider,
  getTutorLeads,
  getTutorLeadById,
  inviteTutorLead,
  markLeadContacted,
  approveTutorLead,
  rejectTutorLead,
} from '../../api/tutorDiscovery';
import './AdminTutorDiscoveryPage.css';
import './admin.css';

const AdminTutorDiscoveryPage = () => {
  const { showToast } = useToast();

  // Active Tab: 'cities' | 'leads' | 'logs' | 'providers'
  const [activeTab, setActiveTab] = useState('cities');

  // Stats & Engine State
  const [stats, setStats] = useState({
    totalCities: 0,
    totalLeads: 0,
    pipeline: {
      discovered: 0,
      lead: 0,
      invited: 0,
      claimed: 0,
      profileCompleted: 0,
      verificationPending: 0,
      verified: 0,
      live: 0,
    },
    worker: { isRunning: false, isPaused: false, currentCity: null },
  });

  // Cities Management
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citySearch, setCitySearch] = useState('');
  const [cityFilterPriority, setCityFilterPriority] = useState('ALL');

  // Leads Explorer
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadTotal, setLeadTotal] = useState(0);
  const [leadPage, setLeadPage] = useState(1);
  const [leadPageSize, setLeadPageSize] = useState(20);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadCityFilter, setLeadCityFilter] = useState('ALL');
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL');

  // Terminal Logs
  const [logs, setLogs] = useState([]);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const logsTerminalRef = useRef(null);

  // Providers
  const [providers, setProviders] = useState([]);

  // Modals
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityForm, setCityForm] = useState({ name: '', state: '', targetLeadCount: 50, isPriority: false });

  const [viewLeadModal, setViewLeadModal] = useState({ isOpen: false, lead: null, loading: false });
  const [inviteModal, setInviteModal] = useState({ isOpen: false, lead: null, inviteUrl: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // ── 1. Fetch Stats & Engine Status ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await getDiscoveryStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching discovery stats:', err);
    }
  }, []);

  // ── 2. Fetch Cities ──
  const fetchCities = useCallback(async () => {
    try {
      setCitiesLoading(true);
      const res = await getDiscoveryCities({ limit: 100 });
      if (res.data?.success) {
        setCities(res.data.data.cities || []);
      }
    } catch (err) {
      console.error('Error fetching discovery cities:', err);
      showToast?.('Failed to load discovery cities', 'error');
    } finally {
      setCitiesLoading(false);
    }
  }, [showToast]);

  // ── 3. Fetch Leads ──
  const fetchLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const params = {
        page: leadPage,
        limit: leadPageSize,
        search: leadSearch || undefined,
        city: leadCityFilter !== 'ALL' ? leadCityFilter : undefined,
        status: leadStatusFilter !== 'ALL' ? leadStatusFilter : undefined,
      };
      const res = await getTutorLeads(params);
      if (res.data?.success) {
        setLeads(res.data.data.leads || []);
        setLeadTotal(res.data.data.pagination?.total ?? res.data.data.total ?? res.data.data.leads?.length ?? 0);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      showToast?.('Failed to load tutor leads', 'error');
    } finally {
      setLeadsLoading(false);
    }
  }, [leadPage, leadPageSize, leadSearch, leadCityFilter, leadStatusFilter, showToast]);

  // ── 4. Fetch Logs ──
  const fetchLogs = useCallback(async () => {
    try {
      const res = await getDiscoveryLogs({ limit: 50 });
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching discovery logs:', err);
    }
  }, []);

  // ── 5. Fetch Providers ──
  const fetchProviders = useCallback(async () => {
    try {
      const res = await getDiscoveryProviders();
      if (res.data?.success) {
        setProviders(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchStats();
    fetchCities();
    fetchProviders();
    fetchLogs();
  }, [fetchStats, fetchCities, fetchProviders, fetchLogs]);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLeads, fetchLogs]);

  // Polling when Engine is Running
  useEffect(() => {
    let interval = null;
    if (stats.worker?.isRunning && !stats.worker?.isPaused) {
      interval = setInterval(() => {
        fetchStats();
        if (activeTab === 'cities') fetchCities();
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'leads') fetchLeads();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stats.worker?.isRunning, stats.worker?.isPaused, activeTab, fetchStats, fetchCities, fetchLogs, fetchLeads]);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (autoScrollLogs && logsTerminalRef.current) {
      logsTerminalRef.current.scrollTop = logsTerminalRef.current.scrollHeight;
    }
  }, [logs, autoScrollLogs]);

  // ── Engine Controls ──
  const handleStartDiscovery = async (cityId = null, cityName = null) => {
    try {
      setActionLoading(true);
      const res = await startDiscovery({ cityId, cityName });
      if (res.data?.success) {
        showToast?.(cityName ? `Discovery started for ${cityName}` : 'Discovery engine launched across priority cities!', 'success');
        fetchStats();
        fetchCities();
        fetchLogs();
        if (cityName) {
          setLeadCityFilter(cityName);
          setLeadPage(1);
          setActiveTab('leads');
        }
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to start discovery engine', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareOnWhatsApp = async (lead) => {
    try {
      setActionLoading(true);
      let regUrl = '';
      try {
        const res = await markLeadContacted(lead._id);
        if (res.data?.success) {
          regUrl = res.data.data.registrationUrl;
        }
      } catch (e) {
        console.warn('markLeadContacted error, fallback url:', e);
      }

      if (!regUrl) {
        const token = lead.claimToken || lead.registrationToken || lead._id;
        regUrl = `${window.location.origin}/become-tutor?leadId=${lead._id}&token=${token}`;
      }

      const message = `Hello ${lead.name || 'Tutor'},\n\nWe’re inviting selected tutors to join MentorNearby — a platform designed to connect qualified tutors with students and parents looking for trusted home and online tutoring.\n\nWe came across your tutoring profile and believe your teaching experience could be a great fit for our platform.\n\nJoin MentorNearby and start receiving relevant student enquiries based on your preferred subjects, classes and location.\n\n👉 Join MentorNearby:\n${regUrl}\n\nWe’d be happy to have you onboard.\n\nRegards,\nTeam MentorNearby\nConnecting Students with the Right Mentors`;

      const cleanPhone = (lead.phone || '').replace(/\D/g, '');
      let waUrl = '';
      if (cleanPhone.length >= 10) {
        const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
      } else {
        waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      }

      window.open(waUrl, '_blank', 'noopener,noreferrer');
      showToast?.(`Tutor "${lead.name}" marked as CONTACTED and WhatsApp opened!`, 'success');
      fetchLeads();
      fetchStats();
    } catch (err) {
      showToast?.('Could not open WhatsApp', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseDiscovery = async () => {
    try {
      setActionLoading(true);
      await pauseDiscovery();
      showToast?.('Discovery engine paused gracefully', 'info');
      fetchStats();
    } catch (err) {
      showToast?.('Failed to pause engine', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeDiscovery = async () => {
    try {
      setActionLoading(true);
      await resumeDiscovery();
      showToast?.('Discovery engine resumed', 'success');
      fetchStats();
    } catch (err) {
      showToast?.('Failed to resume engine', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDeduplication = async () => {
    try {
      setActionLoading(true);
      const res = await runDiscoveryDeduplication();
      if (res.data?.success) {
        showToast?.(`Deduplication complete! Removed/merged duplicates. Total verified leads: ${res.data.data?.remaining || 'Active'}`, 'success');
        fetchStats();
        fetchCities();
        if (activeTab === 'leads') fetchLeads();
      }
    } catch (err) {
      showToast?.('Failed to run deduplication', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── City CRUD ──
  const handleSaveCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name.trim() || !cityForm.state.trim()) {
      showToast?.('City Name and State are required', 'error');
      return;
    }
    try {
      setActionLoading(true);
      if (editingCity) {
        await updateDiscoveryCity(editingCity._id, cityForm);
        showToast?.(`City ${cityForm.name} updated`, 'success');
      } else {
        await addDiscoveryCity(cityForm);
        showToast?.(`City ${cityForm.name} added to discovery registry`, 'success');
      }
      setCityModalOpen(false);
      setEditingCity(null);
      setCityForm({ name: '', state: '', targetLeadCount: 50, isPriority: false });
      fetchCities();
      fetchStats();
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to save city', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCity = async (city) => {
    if (!window.confirm(`Are you sure you want to remove ${city.name} from discovery targets?`)) return;
    try {
      setActionLoading(true);
      await deleteDiscoveryCity(city._id);
      showToast?.(`City ${city.name} removed`, 'info');
      fetchCities();
      fetchStats();
    } catch (err) {
      showToast?.('Failed to delete city', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Lead Operations ──
  const handleViewLead = async (lead) => {
    try {
      setViewLeadModal({ isOpen: true, lead, loading: true });
      const res = await getTutorLeadById(lead._id);
      if (res.data?.success) {
        setViewLeadModal({ isOpen: true, lead: res.data.data, loading: false });
      }
    } catch (err) {
      setViewLeadModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGenerateInvite = async (lead) => {
    try {
      setActionLoading(true);
      const res = await inviteTutorLead(lead._id);
      if (res.data?.success) {
        const claimUrl = `${window.location.origin}/claim-profile/${res.data.data.claimToken}`;
        setInviteModal({ isOpen: true, lead, inviteUrl: claimUrl });
        showToast?.('Claim invitation token generated successfully!', 'success');
        fetchLeads();
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to generate invitation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to approve "${lead.name}" and publish to the live tutor marketplace?`)) return;
    try {
      setActionLoading(true);
      const res = await approveLead(lead._id, { notes: 'Approved via Admin Discovery Center' });
      if (res.data?.success) {
        showToast?.(`Tutor "${lead.name}" is now LIVE on the public marketplace!`, 'success');
        fetchLeads();
        fetchStats();
        fetchCities();
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'Failed to approve lead', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLead = async (lead) => {
    const reason = window.prompt(`Enter rejection reason for "${lead.name}":`, 'Unverifiable contact / unresponsive');
    if (reason === null) return;
    try {
      setActionLoading(true);
      await rejectTutorLead(lead._id, { reason });
      showToast?.(`Lead "${lead.name}" rejected/archived`, 'info');
      fetchLeads();
      fetchStats();
    } catch (err) {
      showToast?.('Failed to reject lead', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Cities list
  const filteredCities = cities.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state?.toLowerCase().includes(citySearch.toLowerCase());
    const matchPriority =
      cityFilterPriority === 'ALL'
        ? true
        : cityFilterPriority === 'PRIORITY'
        ? c.isPriority
        : !c.isPriority;
    return matchSearch && matchPriority;
  });

  return (
    <div className="discovery-page-container">
      {/* ── 1. Page Header ── */}
      <AdminPageHeader
        icon="🛰️"
        title="Autonomous Real Tutor Discovery Engine"
        subtitle="Automated, ethical discovery and onboarding pipeline across Indian cities. ZERO synthetic data, strict lead-to-live verification."
        badge="ENTERPRISE PIPELINE"
        eyebrow="LEAD GENERATION & TARGET MANAGEMENT"
      >
        <button
          className="admin-btn admin-btn-secondary"
          onClick={handleRunDeduplication}
          disabled={actionLoading}
          title="Consolidate duplicates across phone, email, and normalized name"
        >
          🧹 Run Deduplication Sweep
        </button>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setEditingCity(null);
            setCityForm({ name: '', state: '', targetLeadCount: 50, isPriority: false });
            setCityModalOpen(true);
          }}
        >
          + Add Target City
        </button>
      </AdminPageHeader>

      {/* ── 2. Engine Control & Status Banner ── */}
      <div className="engine-status-banner">
        <div className="engine-status-left">
          <div
            className={`engine-pulse-indicator ${
              stats.worker?.isRunning ? (stats.worker?.isPaused ? 'paused' : 'running') : 'idle'
            }`}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Engine Status:{' '}
              {stats.worker?.isRunning
                ? stats.worker?.isPaused
                  ? 'PAUSED'
                  : 'ACTIVE & DISCOVERING'
                : 'IDLE (READY)'}
              {stats.worker?.currentCity && (
                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
                  [Scanning: {stats.worker.currentCity}]
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Permitted directories & partner feeds with rate-limiting & multi-factor deduplication
            </div>
          </div>
        </div>

        <div className="engine-actions-group">
          {!stats.worker?.isRunning ? (
            <button
              className="admin-btn admin-btn-primary"
              style={{ background: '#10b981', color: '#ffffff', borderColor: '#10b981' }}
              onClick={() => handleStartDiscovery()}
              disabled={actionLoading}
            >
              ▶ Start All Priority Cities
            </button>
          ) : stats.worker?.isPaused ? (
            <button
              className="admin-btn admin-btn-primary"
              style={{ background: '#10b981', color: '#ffffff' }}
              onClick={handleResumeDiscovery}
              disabled={actionLoading}
            >
              ▶ Resume Engine
            </button>
          ) : (
            <button
              className="admin-btn admin-btn-secondary"
              style={{ background: '#f59e0b', color: '#ffffff', borderColor: '#f59e0b' }}
              onClick={handlePauseDiscovery}
              disabled={actionLoading}
            >
              ⏸ Pause Engine
            </button>
          )}

          <button
            className="admin-btn admin-btn-secondary"
            onClick={fetchStats}
            title="Refresh engine state"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── 3. KPI Stat Cards ── */}
      <div className="discovery-kpi-grid">
        <div className="discovery-kpi-card">
          <div>
            <div className="kpi-title">Target Cities</div>
            <div className="kpi-value">{stats.totalCities || cities.length || 0}</div>
            <div className="kpi-subtext">⭐ {cities.filter((c) => c.isPriority).length || 4} Priority Focus</div>
          </div>
          <div className="kpi-icon-bubble">🏙️</div>
        </div>

        <div className="discovery-kpi-card">
          <div>
            <div className="kpi-title">Discovered Leads</div>
            <div className="kpi-value">{stats.totalLeads ?? leadTotal ?? 0}</div>
            <div className="kpi-subtext">Real extracted profiles</div>
          </div>
          <div className="kpi-icon-bubble">📥</div>
        </div>

        <div className="discovery-kpi-card">
          <div>
            <div className="kpi-title">Claimed & In Review</div>
            <div className="kpi-value">
              {(stats.pipeline?.claimed || 0) +
                (stats.pipeline?.profileCompleted || 0) +
                (stats.pipeline?.verificationPending || 0)}
            </div>
            <div className="kpi-subtext">Tutor claimed profile</div>
          </div>
          <div className="kpi-icon-bubble">🤝</div>
        </div>

        <div className="discovery-kpi-card">
          <div>
            <div className="kpi-title">Live Marketplace</div>
            <div className="kpi-value" style={{ color: '#15803d' }}>
              {stats.pipeline?.live || 0}
            </div>
            <div className="kpi-subtext">Admin verified & active</div>
          </div>
          <div className="kpi-icon-bubble" style={{ background: '#dcfce7' }}>
            ✅
          </div>
        </div>
      </div>

      {/* ── 4. Navigation Tabs ── */}
      <div className="discovery-nav-tabs">
        <button
          className={`discovery-tab-btn ${activeTab === 'cities' ? 'active' : ''}`}
          onClick={() => setActiveTab('cities')}
        >
          🏙️ City Targets & Quotas ({cities.length})
        </button>
        <button
          className={`discovery-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          👨‍🏫 Discovered Leads Explorer ({stats.totalLeads ?? leadTotal ?? 0})
        </button>
        <button
          className={`discovery-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          💻 Live Discovery Terminal
        </button>
        <button
          className={`discovery-tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          🔌 Modular Providers ({providers.length})
        </button>
      </div>

      {/* ── TAB 1: CITIES & TARGETS ── */}
      {activeTab === 'cities' && (
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search city or state..."
                className="admin-input"
                style={{ width: '240px' }}
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              <select
                className="admin-select"
                value={cityFilterPriority}
                onChange={(e) => setCityFilterPriority(e.target.value)}
              >
                <option value="ALL">All Priority Tiers</option>
                <option value="PRIORITY">⭐ Priority 1 Cities (Hapur, Ghaziabad, Delhi, Meerut)</option>
                <option value="NORMAL">Standard Cities</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredCities.length} of {cities.length} cities
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>City / Region</th>
                  <th>Priority</th>
                  <th>Target Quota</th>
                  <th>Discovered</th>
                  <th>Claimed / Completed</th>
                  <th>Live Tutors</th>
                  <th>Engine Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                      <AdminEmptyState
                        title="No target cities found"
                        subtitle="Add a new city above to start expanding tutor acquisition."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((city) => {
                    const percent = Math.min(100, Math.round(((city.discoveredCount || 0) / (city.targetLeadCount || 50)) * 100));
                    return (
                      <tr key={city._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {city.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {city.state}
                          </div>
                        </td>
                        <td>
                          {city.isPriority ? (
                            <span className="priority-star" title="Priority 1 City">⭐ Priority</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Normal</span>
                          )}
                        </td>
                        <td style={{ minWidth: '140px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span>{city.discoveredCount || 0} / {city.targetLeadCount || 50}</span>
                            <span style={{ fontWeight: 600 }}>{percent}%</span>
                          </div>
                          <div className="quota-progress-container">
                            <div className="quota-progress-bar" style={{ width: `${percent}%` }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {city.discoveredCount || 0}
                        </td>
                        <td>
                          {(city.claimedCount || 0)}
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-success">
                            {city.liveCount || 0} LIVE
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${city.status || 'IDLE'}`}>
                            {city.status || 'IDLE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              onClick={() => handleStartDiscovery(city._id, city.name)}
                              disabled={actionLoading || city.status === 'RUNNING'}
                              title="Run discovery for this city now"
                            >
                              🚀 Discover
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                              onClick={() => {
                                setEditingCity(city);
                                setCityForm({
                                  name: city.name,
                                  state: city.state,
                                  targetLeadCount: city.targetLeadCount || 50,
                                  isPriority: !!city.isPriority,
                                });
                                setCityModalOpen(true);
                              }}
                              title="Edit target quota or priority"
                            >
                              ✏️
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              onClick={() => handleDeleteCity(city)}
                              title="Delete city"
                            >
                              🗑️
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

      {/* ── TAB 2: DISCOVERED LEADS EXPLORER ── */}
      {activeTab === 'leads' && (
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search by name, subject, phone, email..."
                className="admin-input"
                style={{ width: '280px' }}
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setLeadPage(1);
                    fetchLeads();
                  }
                }}
              />
              <select
                className="admin-select"
                value={leadCityFilter}
                onChange={(e) => {
                  setLeadCityFilter(e.target.value);
                  setLeadPage(1);
                }}
              >
                <option value="ALL">All Cities ({cities.length})</option>
                {cities.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}, {c.state}
                  </option>
                ))}
              </select>
              <select
                className="admin-select"
                value={leadStatusFilter}
                onChange={(e) => {
                  setLeadStatusFilter(e.target.value);
                  setLeadPage(1);
                }}
              >
                <option value="ALL">All Lifecycle Statuses</option>
                <option value="DISCOVERED">DISCOVERED</option>
                <option value="CONTACTED">CONTACTED (Shared on WhatsApp)</option>
                <option value="REGISTERED">REGISTERED</option>
                <option value="PENDING APPROVAL">PENDING APPROVAL</option>
                <option value="LIVE">LIVE (On Public Search)</option>
                <option value="LEAD">LEAD</option>
                <option value="INVITED">INVITED</option>
                <option value="CLAIMED">CLAIMED</option>
                <option value="PROFILE_COMPLETED">PROFILE_COMPLETED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <button className="admin-btn admin-btn-secondary" onClick={() => { setLeadPage(1); fetchLeads(); }}>
                🔍 Filter
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Found {leadTotal} discovered leads
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tutor Lead</th>
                  <th>Location</th>
                  <th>Subjects & Classes</th>
                  <th>Contact Info</th>
                  <th>Source Provenance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                      <p style={{ color: 'var(--text-muted)' }}>Loading discovered leads from database...</p>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <AdminEmptyState
                        title="No tutor leads discovered yet"
                        description="Connect an authorized provider or feed to discover real tutor profiles."
                      />
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#475569',
                              fontSize: '0.9rem',
                            }}
                          >
                            {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {lead.name}
                            </div>
                            {lead.experienceYears > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {lead.experienceYears} yrs experience
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{lead.city || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {lead.state || 'India'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '200px' }}>
                          {(lead.subjects || []).slice(0, 3).map((sub, i) => (
                            <span
                              key={i}
                              style={{
                                background: 'var(--admin-bg-soft, #f7f5f0)',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {sub}
                            </span>
                          ))}
                          {(lead.subjects || []).length > 3 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              +{(lead.subjects || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {lead.phone ? <div>📞 {lead.phone}</div> : null}
                          {lead.email ? <div>✉️ {lead.email}</div> : null}
                          {!lead.phone && !lead.email && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              Profile via directory
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-gold-dark)' }}>
                            {lead.sourceName || lead.providerName}
                          </div>
                          {lead.sourceUrl ? (
                            <a
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.7rem', color: '#0284c7', textDecoration: 'underline' }}
                            >
                              View Provenance ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Open index</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${lead.status || 'LEAD'}`}>
                          {lead.status || 'LEAD'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="admin-btn admin-btn-sm"
                            style={{
                              backgroundColor: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={() => handleShareOnWhatsApp(lead)}
                            title="Open WhatsApp with customized invitation message and mark lead as CONTACTED"
                          >
                            <span>💬</span> Share on WhatsApp
                          </button>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            onClick={() => handleViewLead(lead)}
                            title="Inspect full lead & source provenance"
                          >
                            👁️
                          </button>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => handleGenerateInvite(lead)}
                            title="Generate secure onboarding claim link"
                          >
                            🔗 Invite
                          </button>
                          {lead.status !== 'LIVE' && (
                            <button
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              style={{ background: '#10b981', borderColor: '#10b981' }}
                              onClick={() => handleApproveLead(lead)}
                              title="Verify and publish to live marketplace"
                            >
                              ✅
                            </button>
                          )}
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleRejectLead(lead)}
                            title="Reject lead"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {leadPage} of {Math.max(1, Math.ceil(leadTotal / leadPageSize))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="admin-btn admin-btn-sm admin-btn-secondary"
                disabled={leadPage <= 1 || leadsLoading}
                onClick={() => setLeadPage((p) => Math.max(1, p - 1))}
              >
                ◀ Previous
              </button>
              <button
                className="admin-btn admin-btn-sm admin-btn-secondary"
                disabled={leadPage * leadPageSize >= leadTotal || leadsLoading}
                onClick={() => setLeadPage((p) => p + 1)}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LIVE DISCOVERY TERMINAL ── */}
      {activeTab === 'logs' && (
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>ENGINE LOG STREAM (LAST 50 EVENTS)</span>
              <span style={{ fontSize: '0.75rem', background: '#21262d', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                Auto-purge 30d TTL
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoScrollLogs}
                  onChange={(e) => setAutoScrollLogs(e.target.checked)}
                />
                Auto-scroll
              </label>
              <button
                className="admin-btn admin-btn-sm admin-btn-secondary"
                onClick={fetchLogs}
              >
                🔄 Refresh Logs
              </button>
            </div>
          </div>

          <div className="discovery-terminal" ref={logsTerminalRef}>
            {logs.length === 0 ? (
              <div style={{ color: '#8b949e', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
                No engine logs recorded yet. Start a discovery run to stream real-time events.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="terminal-log-line">
                  <span className="log-time">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className={`log-level ${log.level || 'INFO'}`}>
                    [{log.level || 'INFO'}]
                  </span>
                  {log.city && <span className="log-city">[{log.city}]</span>}
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: MODULAR PROVIDERS ── */}
      {activeTab === 'providers' && (
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Pluggable Provider Architecture
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            All providers adhere to ethical crawling standards: respect for robots.txt, 1-request/second rate limiting, identifying User-Agent headers, and zero synthetic generation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {providers.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  background: 'var(--admin-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</h4>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span
                        className={`admin-badge ${
                          p.isEnabled ? 'admin-badge-success' : 'admin-badge-amber'
                        }`}
                      >
                        {p.isEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                      <span
                        className={`admin-badge ${
                          p.isConnected ? 'admin-badge-success' : 'admin-badge-amber'
                        }`}
                        title={p.isConnected ? 'API / feed endpoint is configured' : 'External feed URL not configured'}
                      >
                        {p.connectionStatus || (p.isConnected ? 'CONNECTED' : 'Source not connected')}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>Source Type: <strong>{p.sourceType}</strong></div>
                    <div>
                      Feed Status:{' '}
                      <strong style={{ color: p.isConnected ? '#10b981' : '#f59e0b' }}>
                        {p.connectionStatus || (p.isConnected ? 'Connected' : 'Source not connected')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className={`admin-btn admin-btn-sm ${p.isEnabled ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                    onClick={async () => {
                      try {
                        await toggleDiscoveryProvider({ name: p.name, providerId: p.id || p.name, isEnabled: !p.isEnabled });
                        showToast?.(`Provider "${p.name}" updated`, 'success');
                        fetchProviders();
                      } catch (err) {
                        showToast?.('Failed to toggle provider', 'error');
                      }
                    }}
                  >
                    {p.isEnabled ? 'Disable Provider' : 'Enable Provider'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL 1: ADD / EDIT CITY ── */}
      {cityModalOpen && (
        <div className="discovery-modal-backdrop" onClick={() => setCityModalOpen(false)}>
          <div className="discovery-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="discovery-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                {editingCity ? `Edit Target: ${editingCity.name}` : 'Add New Indian Target City'}
              </h3>
              <button
                onClick={() => setCityModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCity}>
              <div className="discovery-modal-body">
                <div>
                  <label className="admin-label">City Name</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="e.g. Hapur, Meerut, Delhi"
                    value={cityForm.name}
                    onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">State / Region</label>
                  <input
                    type="text"
                    required
                    className="admin-input"
                    placeholder="e.g. Uttar Pradesh, Delhi NCR"
                    value={cityForm.state}
                    onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="admin-label">Lead Quota Target</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    className="admin-input"
                    value={cityForm.targetLeadCount}
                    onChange={(e) => setCityForm({ ...cityForm, targetLeadCount: parseInt(e.target.value, 10) || 50 })}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Engine stops searching once this count of unique real tutor leads is reached.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="isPriorityCheck"
                    checked={cityForm.isPriority}
                    onChange={(e) => setCityForm({ ...cityForm, isPriority: e.target.checked })}
                  />
                  <label htmlFor="isPriorityCheck" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    ⭐ Mark as Priority 1 City (e.g. Hapur, Ghaziabad, Delhi, Meerut)
                  </label>
                </div>
              </div>

              <div className="discovery-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setCityModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : editingCity ? 'Update City' : 'Add City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: LEAD DETAILS & AUDIT PROVENANCE ── */}
      {viewLeadModal.isOpen && viewLeadModal.lead && (
        <div className="discovery-modal-backdrop" onClick={() => setViewLeadModal({ isOpen: false, lead: null })}>
          <div className="discovery-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="discovery-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                Lead Provenance & Verification Audit
              </h3>
              <button
                onClick={() => setViewLeadModal({ isOpen: false, lead: null })}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="discovery-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--admin-bg-soft)', borderRadius: '10px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}
                >
                  {viewLeadModal.lead.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{viewLeadModal.lead.name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    📍 {viewLeadModal.lead.city}, {viewLeadModal.lead.state}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span className={`status-pill ${viewLeadModal.lead.status}`}>
                      {viewLeadModal.lead.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Extracted Contact & Profile Data
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Phone:</strong> {viewLeadModal.lead.phone || 'None published'}</div>
                  <div><strong>Email:</strong> {viewLeadModal.lead.email || 'None published'}</div>
                  <div><strong>Experience:</strong> {viewLeadModal.lead.experienceYears || 0} years</div>
                  <div><strong>Qualifications:</strong> {viewLeadModal.lead.qualifications || 'N/A'}</div>
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Subjects & Classes
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(viewLeadModal.lead.subjects || []).map((s, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'var(--admin-bg-soft)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Source Provenance Citation
                </h5>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div><strong>Primary Provider:</strong> {viewLeadModal.lead.providerName}</div>
                  <div><strong>Source Label:</strong> {viewLeadModal.lead.sourceName}</div>
                  {viewLeadModal.lead.sourceUrl && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>Original Web Source: </strong>
                      <a
                        href={viewLeadModal.lead.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0284c7', textDecoration: 'underline' }}
                      >
                        {viewLeadModal.lead.sourceUrl} ↗
                      </a>
                    </div>
                  )}
                  <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                    Discovered at: {new Date(viewLeadModal.lead.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="discovery-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setViewLeadModal({ isOpen: false, lead: null })}
              >
                Close
              </button>
              <button
                className="admin-btn"
                style={{ background: '#25D366', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                onClick={() => {
                  const targetLead = viewLeadModal.lead;
                  setViewLeadModal({ isOpen: false, lead: null });
                  handleShareOnWhatsApp(targetLead);
                }}
              >
                💬 Share on WhatsApp
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  const targetLead = viewLeadModal.lead;
                  setViewLeadModal({ isOpen: false, lead: null });
                  handleGenerateInvite(targetLead);
                }}
              >
                🔗 Generate Claim Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SHAREABLE CLAIM INVITATION ── */}
      {inviteModal.isOpen && inviteModal.lead && (
        <div className="discovery-modal-backdrop" onClick={() => setInviteModal({ isOpen: false, lead: null, inviteUrl: '' })}>
          <div className="discovery-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="discovery-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                Claim & Onboarding Link for {inviteModal.lead.name}
              </h3>
              <button
                onClick={() => setInviteModal({ isOpen: false, lead: null, inviteUrl: '' })}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="discovery-modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This secure one-time link lets the teacher join MentorNearby, review their information, set their hourly fees and subjects, and submit for verification.
              </p>

              <div>
                <label className="admin-label">Direct Onboarding Link</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    className="admin-input"
                    value={inviteModal.inviteUrl}
                    style={{ background: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteModal.inviteUrl);
                      showToast?.('Claim link copied to clipboard!', 'success');
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <button
                  onClick={() => {
                    handleShareOnWhatsApp(inviteModal.lead);
                  }}
                  className="admin-btn"
                  style={{ background: '#25D366', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  💬 Share on WhatsApp (Official Template)
                </button>
              </div>
            </div>

            <div className="discovery-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setInviteModal({ isOpen: false, lead: null, inviteUrl: '' })}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTutorDiscoveryPage;
