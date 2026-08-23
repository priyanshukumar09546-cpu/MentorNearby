import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/audit-logs');
    } catch (e) {
      console.warn('Failed to load administrative audit logs:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      <AdminPageHeader
        icon="🔐"
        eyebrow="SECURITY AUDIT"
        title="Administrative Audit Trail"
        subtitle="Immutable security log of admin actions (KYC approvals/rejections, suspensions, settings changes)"
      >
        <button onClick={fetchLogs} disabled={loading} className="admin-btn admin-btn-secondary px-3 py-2 text-xs">
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      <div className="admin-card p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#85857D] font-medium">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
              <div className="text-[#85857D] font-medium text-xs">Loading audit logs...</div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <AdminEmptyState
            icon="🔐"
            title="No Audit Logs"
            description="No administrative audit actions recorded yet."
            actionLabel="Refresh Data"
            onAction={fetchLogs}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ADMIN USER</th>
                  <th>ACTION RECORDED</th>
                  <th>TARGET MODULE</th>
                  <th>IP ADDRESS</th>
                  <th className="text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div className="font-bold text-[#1C1C1A]">{log.admin?.name || 'Admin'}</div>
                      <div className="text-[#85857D] text-[10px] mt-0.5">ID: #{log.admin?._id?.slice(-6) || 'System'}</div>
                    </td>
                    <td>
                      <span className="font-mono text-[#A96F13] font-bold text-xs">{log.action}</span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-slate uppercase">
                        {log.targetType || 'SYSTEM'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[#85857D] text-[11px]">{log.ipAddress || '127.0.0.1'}</span>
                    </td>
                    <td className="text-right">
                      <span className="text-[#85857D] text-xs font-semibold">{new Date(log.createdAt).toLocaleString()}</span>
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

export default AdminAuditLogsPage;
