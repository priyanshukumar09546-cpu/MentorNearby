import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './admin.css';

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/analytics');
    } catch (e) {
      console.warn('Failed to load analytics:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 text-[#1C1C1A] font-sans">
        <AdminPageHeader
          icon="📊"
          eyebrow="BUSINESS INSIGHTS"
          title="Marketplace Analytics & Insights"
          subtitle="Real MongoDB aggregation of subjects, locations, user growth & revenue metrics"
        />
        <div className="py-12 text-center text-[#85857D] font-medium admin-card">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
            <div className="text-[#85857D] font-medium text-xs">Loading Platform Analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans">
      <AdminPageHeader
        icon="📊"
        eyebrow="BUSINESS INSIGHTS"
        title="Marketplace Analytics & Insights"
        subtitle="Real MongoDB aggregation of subjects, locations, user growth & revenue metrics"
      >
        <button onClick={fetchAnalytics} disabled={loading} className="admin-btn admin-btn-secondary px-3 py-2 text-xs">
          <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Subjects Card */}
        <div className="admin-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#1C1C1A] border-b border-[#E6E2D9] pb-3">📚 Top Demanded Subjects</h3>
          <div className="space-y-3 text-xs">
            {analytics?.topSubjects?.length === 0 ? (
              <p className="text-[#85857D]">No subject data recorded yet.</p>
            ) : (
              analytics?.topSubjects?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#FAF9F6] p-3 rounded-xl border border-[#E6E2D9] shadow-sm">
                  <span className="font-bold text-[#1C1C1A]">{item.subject}</span>
                  <span className="admin-badge admin-badge-gold px-2.5 py-0.5 rounded font-bold">{item.count} Tutors</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Locations Card */}
        <div className="admin-card p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#1C1C1A] border-b border-[#E6E2D9] pb-3">📍 Top Active Locations</h3>
          <div className="space-y-3 text-xs">
            {analytics?.topLocations?.length === 0 ? (
              <p className="text-[#85857D]">No location data recorded yet.</p>
            ) : (
              analytics?.topLocations?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#FAF9F6] p-3 rounded-xl border border-[#E6E2D9] shadow-sm">
                  <span className="font-bold text-[#1C1C1A]">{item.city}</span>
                  <span className="admin-badge admin-badge-amber px-2.5 py-0.5 rounded font-bold">{item.count} Tutors</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
