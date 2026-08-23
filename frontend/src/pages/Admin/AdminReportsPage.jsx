import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminActionModal from '../../components/admin/AdminActionModal';
import './admin.css';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await client.get('/admin/reports');
    } catch (err) {
      console.warn('Failed to fetch reports:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (report) => {
    setModalConfig({
      isOpen: true,
      title: 'Resolve Moderation Report',
      description: `Mark safety complaint #${report._id.slice(-6)} filed by ${report.reporter?.name || 'User'} as RESOLVED?`,
      type: 'success',
      confirmText: 'Mark Resolved',
      onConfirm: async () => {
        try {
          await client.put(`/admin/reports/${report._id}`, {
            status: 'RESOLVED',
            adminNotes: 'Resolved by Super Admin moderation'
          });
          showToast('Report marked as resolved', 'success');
          fetchReports();
        } catch (err) {
          showToast('Failed to update report status', 'error');
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  const handleDismiss = (report) => {
    setModalConfig({
      isOpen: true,
      title: 'Dismiss Report',
      description: `Are you sure you want to dismiss complaint #${report._id.slice(-6)}?`,
      type: 'warning',
      confirmText: 'Dismiss Report',
      onConfirm: async () => {
        try {
          await client.put(`/admin/reports/${report._id}`, {
            status: 'REJECTED',
            adminNotes: 'Dismissed by Super Admin'
          });
          showToast('Report dismissed', 'warning');
          fetchReports();
        } catch (err) {
          showToast('Failed to dismiss report', 'error');
        } finally {
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      <AdminPageHeader
        icon="🛡️"
        eyebrow="SAFETY & MODERATION"
        title="Reports & User Safety Center"
        subtitle="Review safety complaints, harassment reports, and platform policy violations."
      >
        <button onClick={fetchReports} disabled={loading} className="admin-btn admin-btn-secondary px-3 py-2 text-xs">
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      {/* Reports Table */}
      <div className="admin-card p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#85857D] font-medium">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
              <div className="text-[#85857D] font-medium text-xs">Loading reports queue...</div>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <AdminEmptyState
            icon="🛡️"
            title="No Active Reports"
            description="There are no pending safety reports or complaints filed at this time."
            actionLabel="Refresh Reports"
            onAction={fetchReports}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>REPORT ID</th>
                  <th>REPORTER</th>
                  <th>REPORTED USER</th>
                  <th>CATEGORY & DETAILS</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <span className="font-mono text-[#85857D] font-bold">#{report._id.slice(-6)}</span>
                    </td>
                    <td>
                      <div className="font-bold text-[#1C1C1A]">{report.reporter?.name || 'Anonymous'}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#C94B4B]">{report.reportedUser?.name || 'N/A'}</div>
                    </td>
                    <td className="max-w-xs">
                      <span className="admin-badge admin-badge-rose mb-1.5 w-max">
                        {report.category || 'SAFETY'}
                      </span>
                      <p className="text-[#575752] truncate text-[11px] mt-1" title={report.description || report.reason}>
                        {report.description || report.reason}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          report.status === 'RESOLVED'
                            ? 'admin-badge-emerald'
                            : report.status === 'REJECTED'
                            ? 'admin-badge-slate'
                            : 'admin-badge-amber'
                        }`}
                      >
                        {report.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(report)}
                            className="admin-btn admin-btn-primary px-3 py-1.5 text-[11px]"
                          >
                            ✓ Resolve
                          </button>
                        )}
                        {report.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleDismiss(report)}
                            className="admin-btn admin-btn-secondary px-3 py-1.5 text-[11px]"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default AdminReportsPage;
