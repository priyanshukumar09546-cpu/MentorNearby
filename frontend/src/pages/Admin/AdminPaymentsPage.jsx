import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminPaymentsPage = () => {
  const [unlocks, setUnlocks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/contact-unlocks');
      const list = res.data.data.unlocks || res.data.data || [];
      setUnlocks(list);

      const totalRevenue = list.reduce((acc, curr) => acc + (curr.paymentDetails?.amount || curr.amount || 0), 0);
      const hundredRupeeCount = list.filter(u => (u.paymentDetails?.amount || u.amount) === 100).length;
      const sixtyRupeeCount = list.filter(u => (u.paymentDetails?.amount || u.amount) === 60).length;
    } catch (e) {
      console.warn('Failed to load transaction data:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      {/* Page Header */}
      <AdminPageHeader
        icon="💳"
        eyebrow="REVENUE MANAGEMENT"
        title="Payments & Platform Revenue"
        subtitle="Real-time Razorpay completed transactions & revenue breakdown."
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#FFF4D8] border border-[#F2C66D] px-5 py-2.5 rounded-2xl text-right shadow-sm">
            <span className="block text-[10px] font-bold text-[#A96F13] uppercase tracking-wider">Total Revenue</span>
            <span className="text-xl font-black text-[#1C1C1A]">₹{stats.totalRevenue || 0}</span>
          </div>
          <button onClick={fetchPayments} disabled={loading} className="admin-btn admin-btn-secondary px-3 py-2 text-xs">
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Transactions</span>
            <div className="admin-kpi-icon-box">💳</div>
          </div>
          <p className="admin-kpi-value">{stats.count || 0}</p>
          <p className="admin-kpi-subtext">Completed Razorpay payments</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">₹100 Rate Unlocks</span>
            <div className="admin-kpi-icon-box">⚡</div>
          </div>
          <p className="admin-kpi-value text-[#A96F13]">{stats.hundredRupeeCount || 0}</p>
          <p className="admin-kpi-subtext">Unlocks #1 & #2 (First 2 contacts)</p>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">₹60 Rate Unlocks</span>
            <div className="admin-kpi-icon-box">💎</div>
          </div>
          <p className="admin-kpi-value text-[#238B5A]">{stats.sixtyRupeeCount || 0}</p>
          <p className="admin-kpi-subtext">Unlocks #3+ (Bulk rate discount)</p>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="admin-card p-6 space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="animate-pulse h-12 bg-[#FAF9F6] rounded-xl border border-[#E6E2D9]"></div>
          ))}
        </div>
      ) : unlocks.length === 0 ? (
        <AdminEmptyState
          icon="💳"
          title="No Transactions Recorded"
          description="Completed contact unlock transactions will appear here in real-time."
          actionLabel="Refresh Data"
          onAction={fetchPayments}
        />
      ) : (
        <div className="admin-card p-6 shadow-sm">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Tutor Unlocked</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Razorpay Order ID</th>
                  <th>Transaction Date</th>
                </tr>
              </thead>
              <tbody>
                {unlocks.map((tx) => (
                  <tr key={tx._id}>
                    <td className="font-bold text-[#1C1C1A]">{tx.user?.name || 'Student User'}</td>
                    <td className="font-semibold text-[#575752]">{tx.tutor?.name || 'Tutor'}</td>
                    <td className="font-bold text-[#238B5A]">
                      ₹{tx.paymentDetails?.amount || tx.amount || 100}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-emerald">
                        {tx.paymentStatus || tx.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="font-mono text-[#85857D] text-xs">{tx.paymentDetails?.orderId || tx.razorpayOrderId || 'N/A'}</td>
                    <td className="text-[#85857D] text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPaymentsPage;
