import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './admin.css';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await client.get('/admin/config');
      } catch (e) {
        console.warn('Failed to load admin settings:', e?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans max-w-4xl mx-auto">
      
      <AdminPageHeader
        icon="⚙️"
        eyebrow="SYSTEM CONFIGURATION"
        title="Platform Settings & Pricing Configuration"
        subtitle="Configure systemic marketplace rules and administrator profile"
      />

      {/* Admin Profile Card */}
      <div className="admin-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1C1C1A] border-b border-[#E6E2D9] pb-3 flex items-center gap-2">
          <span>👤</span> Administrator Profile
        </h3>
        <div className="space-y-2 text-xs text-[#575752]">
          <p><strong className="text-[#1C1C1A]">Admin Name:</strong> {user?.name || 'Super Administrator'}</p>
          <p><strong className="text-[#1C1C1A]">Email Address:</strong> {user?.email || 'admin@mentornearby.in'}</p>
          <p className="flex items-center gap-2">
            <strong className="text-[#1C1C1A]">Role & Permissions:</strong> 
            <span className="admin-badge admin-badge-amber">SUPER_ADMIN</span>
          </p>
        </div>
      </div>

      {/* Pricing Policy Card */}
      <div className="admin-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#1C1C1A] border-b border-[#E6E2D9] pb-3 flex items-center gap-2">
          <span>💳</span> Active Pricing Structure
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center bg-[#FAF9F6] p-4 rounded-xl border border-[#E6E2D9] shadow-sm">
            <div>
              <p className="font-bold text-[#1C1C1A] text-sm">Contact Unlock #1 & #2 Fee</p>
              <p className="text-[#77766E] mt-1">Standard rate for first two tutor contact unlocks</p>
            </div>
            <span className="text-[#A96F13] font-black text-lg">₹100</span>
          </div>

          <div className="flex justify-between items-center bg-[#FAF9F6] p-4 rounded-xl border border-[#E6E2D9] shadow-sm">
            <div>
              <p className="font-bold text-[#1C1C1A] text-sm">Contact Unlock #3+ Fee</p>
              <p className="text-[#77766E] mt-1">Discounted rate for 3rd unlock onward</p>
            </div>
            <span className="text-[#238B5A] font-black text-lg">₹60</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
