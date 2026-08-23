import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import './admin.css';

const AdminContactUnlocksPage = () => {
  const [unlocks, setUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUnlocks = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/contact-unlocks');
    } catch (e) {
      console.warn('Failed to load contact unlocks:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnlocks();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      
      <AdminPageHeader
        icon="🔓"
        eyebrow="UNLOCK AUDIT"
        title="Contact Unlocks Log"
        subtitle="Full record of tutor contact detail unlocks by students and parents"
      >
        <button onClick={fetchUnlocks} disabled={loading} className="admin-btn admin-btn-secondary px-3 py-2 text-xs">
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      <div className="admin-card p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#85857D] font-medium">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
              <div className="text-[#85857D] font-medium text-xs">Loading contact unlocks...</div>
            </div>
          </div>
        ) : unlocks.length === 0 ? (
          <AdminEmptyState
            icon="🔓"
            title="No Unlocks Found"
            description="No contact unlock records found in the system."
            actionLabel="Refresh Data"
            onAction={fetchUnlocks}
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>STUDENT NAME</th>
                  <th>TUTOR UNLOCKED</th>
                  <th>AMOUNT PAID</th>
                  <th>UNLOCK STATUS</th>
                  <th className="text-right">UNLOCKED AT</th>
                </tr>
              </thead>
              <tbody>
                {unlocks.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="font-bold text-[#1C1C1A]">{u.user?.name || 'Student'}</div>
                      <div className="text-[#85857D] text-[10px] mt-0.5">ID: #{u.user?._id?.slice(-6) || 'Unknown'}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#575752]">{u.tutor?.name || 'Tutor'}</div>
                      <div className="text-[#85857D] text-[10px] mt-0.5">ID: #{u.tutor?._id?.slice(-6) || 'Unknown'}</div>
                    </td>
                    <td>
                      <div className="font-mono text-[#238B5A] font-bold">₹{u.paymentDetails?.amount || u.amount || 100}</div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-emerald uppercase">
                        {u.status || 'UNLOCKED'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-[#85857D] text-xs font-semibold">{new Date(u.createdAt).toLocaleDateString()}</span>
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

export default AdminContactUnlocksPage;
