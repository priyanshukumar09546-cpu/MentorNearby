import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminRequestsPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/requests');
    } catch (e) {
      console.warn('Failed to load tuition requirements:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const openCount = requirements.filter(r => (r.status || 'OPEN') === 'OPEN').length;
  const matchedCount = requirements.filter(r => r.status === 'MATCHED').length;
  const closedCount = requirements.filter(r => r.status === 'CLOSED').length;
  const totalCount = requirements.length;

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      {/* Page Header */}
      <AdminPageHeader
        icon="📋"
        eyebrow="STUDENT REQUIREMENTS"
        title="Tutor Requests"
        subtitle="Student tuition requirements posted on MentorNearby."
      >
        <button
          onClick={fetchRequirements}
          disabled={loading}
          className="admin-btn admin-btn-secondary px-3 py-2 text-xs"
          title="Refresh Requirements"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      {/* KPI Summary Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Requests</span>
            <div className="admin-kpi-icon-box">📋</div>
          </div>
          <p className="admin-kpi-value">{totalCount}</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Open Requests</span>
            <div className="admin-kpi-icon-box">🟡</div>
          </div>
          <p className="admin-kpi-value text-[#A96F13]">{openCount}</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Matched</span>
            <div className="admin-kpi-icon-box">🟢</div>
          </div>
          <p className="admin-kpi-value text-[#238B5A]">{matchedCount}</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Closed</span>
            <div className="admin-kpi-icon-box">⚪</div>
          </div>
          <p className="admin-kpi-value text-[#575752]">{closedCount}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-card p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#85857D] font-medium">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
              <div className="text-[#85857D] font-medium text-xs">Loading requests...</div>
            </div>
          </div>
        ) : requirements.length === 0 ? (
          <AdminEmptyState
            icon="📋"
            title="No Active Tuition Requests"
            description="When students post tuition requirements, they will appear here in real-time."
            actionLabel="Refresh List"
            onAction={fetchRequirements}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>SUBJECT & CLASS</th>
                  <th>MODE & BUDGET</th>
                  <th>STATUS</th>
                  <th className="text-right">POSTED DATE</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div className="font-bold text-[#1C1C1A]">{req.student?.name || 'Student User'}</div>
                      <div className="text-[#85857D] text-[10px] mt-0.5">ID: #{req._id.slice(-6)}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#575752]">
                        {req.subjects?.join(', ') || 'General Subjects'}
                      </div>
                      <div className="text-[11px] text-[#85857D] mt-1">Class {req.class || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="font-mono text-[#1C1C1A] text-xs">₹{req.budget || 'Negotiable'}</div>
                      <div className="text-[11px] text-[#A96F13] font-bold mt-1 tracking-wide">{req.mode || 'Online'}</div>
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        (req.status || 'OPEN') === 'OPEN' ? 'admin-badge-emerald' : 
                        req.status === 'MATCHED' ? 'admin-badge-gold' : 'admin-badge-slate'
                      }`}>
                        {req.status || 'OPEN'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-[#85857D] text-xs font-semibold">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequestsPage;
