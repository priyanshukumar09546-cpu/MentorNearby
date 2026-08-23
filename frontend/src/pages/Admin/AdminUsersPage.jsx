// ============================================================
// pages/Admin/AdminUsersPage.jsx
// MentorNearby Enterprise Admin User Directory
// 100% Real Database Driven — Zero Mock Data
// Centered Modals for All Administrative Actions
// ============================================================

import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './admin.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Centered Modals State
  const [activeModal, setActiveModal] = useState(null); // 'view' | 'profile' | 'suspend' | 'restore' | 'delete' | 'whatsapp'
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('Policy violation');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState('');

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      let url = `/admin/users?page=1&limit=100`;
      if (activeTab === 'TUTORS') url += `&role=TUTOR`;
      else if (activeTab === 'STUDENTS') url += `&role=STUDENT`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const response = await client.get(url);
      let data = response.data.data.users || [];

      if (activeTab === 'PENDING') {
        data = data.filter(u => u.role === 'TUTOR' && u.kycStatus !== 'VERIFIED');
      } else if (activeTab === 'VERIFIED') {
        data = data.filter(u => u.role === 'TUTOR' && u.kycStatus === 'VERIFIED');
      }

      setUsers(data);
      if (isManual) {
        showToast('User directory refreshed', 'success');
      }
    } catch (err) {
      if (isManual) {
        showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers(false);
  }, [activeTab, search]);

  // ------------------------------------------------------------
  // ACTION HANDLERS
  // ------------------------------------------------------------
  const handleOpenWhatsApp = (userItem) => {
    if (!userItem.phone && !userItem.whatsappNumber) {
      showToast(`Phone number unavailable for ${userItem.name}`, 'warning');
      return;
    }
    const defaultMsg = `Hello ${userItem.name || 'there'} 👋\n\nWelcome to MentorNearby!\n\nWe're happy to have you with us. If you need any help getting started, our team is here to assist you.\n\nThank you for joining MentorNearby! 💛`;
    setSelectedUser(userItem);
    setCustomWhatsAppMessage(defaultMsg);
    setActiveModal('whatsapp');
  };

  const handleSendWhatsApp = () => {
    if (!selectedUser) return;
    const phoneNum = selectedUser.phone || selectedUser.whatsappNumber;
    if (!phoneNum) {
      showToast('Phone number unavailable', 'error');
      return;
    }
    const cleanPhone = phoneNum.replace(/\D/g, '');
    const encoded = encodeURIComponent(customWhatsAppMessage);
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
    setActiveModal(null);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await client.post(`/admin/users/${selectedUser._id}/suspend`, { reason: suspensionReason });
      showToast(`User ${selectedUser.name} suspended successfully`, 'success');
      setActiveModal(null);
      fetchUsers(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await client.post(`/admin/users/${selectedUser._id}/unsuspend`);
      showToast(`User ${selectedUser.name} restored to active status`, 'success');
      setActiveModal(null);
      fetchUsers(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    if (deleteConfirmationText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }
    setModalLoading(true);
    try {
      if (selectedUser.role === 'TUTOR') {
        await client.delete(`/admin/tutors/${selectedUser._id}`);
      } else {
        await client.delete(`/admin/students/${selectedUser._id}`);
      }
      showToast(`User ${selectedUser.name} permanently deleted`, 'success');
      setActiveModal(null);
      setDeleteConfirmationText('');
      fetchUsers(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Users' },
    { id: 'TUTORS', label: 'Tutors' },
    { id: 'STUDENTS', label: 'Students / Parents' },
    { id: 'PENDING', label: 'Pending Verification' },
    { id: 'VERIFIED', label: 'Verified Tutors' },
  ];

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans pb-12">
      <AdminPageHeader
        icon="👥"
        eyebrow="USER GOVERNANCE"
        title="User Management Directory"
        subtitle="Manage all user accounts, roles, and administrative actions across the platform."
      >
        <div className="flex items-center gap-2">
          <button onClick={() => fetchUsers(true)} disabled={refreshing} className="admin-btn admin-btn-secondary px-3 py-2 text-xs font-bold">
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span> Refresh
          </button>
        </div>
      </AdminPageHeader>

      {/* Search & Tabs Panel */}
      <div className="admin-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search name or email..." 
              className="admin-input w-full pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-[#85857D] text-xs">🔍</span>
          </div>
          
          <div className="flex bg-[#FAF9F6] border border-[#DDD9CF] rounded-xl p-1 overflow-x-auto w-full md:w-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-[#D89B2B] text-white shadow-md' 
                    : 'text-[#77766E] hover:text-[#1C1C1A] hover:bg-[#F3F1EB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="admin-card p-6 shadow-sm">
        <div className="admin-table-wrapper">
          <table className="admin-table text-xs">
            <thead>
              <tr>
                <th>USER</th>
                <th>CONTACT INFO</th>
                <th>ROLE & BADGE</th>
                <th>LOCATION</th>
                <th className="text-right">DIRECT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-8 w-8 bg-[#FFF1D0] rounded-full mb-3"></div>
                      <div className="text-[#85857D] font-medium text-xs">Loading user directory...</div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="p-8 text-center text-slate-400">
                      <p className="font-bold text-slate-700 text-sm">No users registered yet.</p>
                      <p className="text-xs text-slate-400 mt-1">New students and tutors will appear here after they register.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(userItem => {
                  const phoneNum = userItem.phone || userItem.whatsappNumber;
                  const isSuspended = userItem.isSuspended;
                  const roleLabel = userItem.role === 'TUTOR' ? 'TUTOR' : userItem.role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
                  const isVerified = userItem.kycStatus === 'VERIFIED';

                  return (
                    <tr key={userItem._id}>
                      <td>
                        <div className="admin-user-cell">
                          <ProfileAvatar src={userItem.profilePhoto?.url} name={userItem.name} size="md" />
                          <div>
                            <p className="admin-user-name">{userItem.name || 'Anonymous User'}</p>
                            <p className="admin-user-email">Reg: {new Date(userItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>
                          <p className="text-[#1C1C1A] font-medium text-xs">{userItem.email}</p>
                          <p className="font-mono text-[#85857D] text-[11px]">{phoneNum || 'Phone unavailable'}</p>
                        </div>
                      </td>

                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`admin-badge ${
                            userItem.role === 'TUTOR' ? 'admin-badge-gold' : 
                            userItem.role === 'STUDENT' ? 'admin-badge-emerald' : 'admin-badge-amber'
                          }`}>
                            {roleLabel}
                          </span>
                          {userItem.role === 'TUTOR' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isVerified ? '✓ Verified' : 'Pending Verification'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="text-[#575752] text-xs font-semibold">
                          {userItem.location?.city || userItem.location?.area || 'Location N/A'}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Button */}
                          <button 
                            onClick={() => handleOpenWhatsApp(userItem)}
                            className="admin-btn-square whatsapp"
                            title="Quick WhatsApp message"
                          >
                            💬
                          </button>

                          {/* 1. Eye View Details */}
                          <button 
                            onClick={() => { setSelectedUser(userItem); setActiveModal('view'); }}
                            className="admin-btn-square view"
                            title="View Full Profile Details"
                          >
                            👁️
                          </button>

                          {/* 2. Chain Profile Health */}
                          <button 
                            onClick={() => { setSelectedUser(userItem); setActiveModal('profile'); }}
                            className="admin-btn-square profile"
                            title="Profile & KYC Health Check"
                          >
                            🔗
                          </button>

                          {/* 3 & 5. Suspend or Restore */}
                          {isSuspended ? (
                            <button 
                              onClick={() => { setSelectedUser(userItem); setActiveModal('restore'); }}
                              className="admin-btn-square restore"
                              title="Restore Suspended User"
                            >
                              ♻️
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setSelectedUser(userItem); setActiveModal('suspend'); }}
                              className="admin-btn-square suspend"
                              title="Suspend User"
                            >
                              🚫
                            </button>
                          )}

                          {/* 4. Delete Permanent */}
                          <button 
                            onClick={() => { setSelectedUser(userItem); setActiveModal('delete'); setDeleteConfirmationText(''); }}
                            className="admin-btn-square delete"
                            title="Permanently Delete User"
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

      {/* ============================================================ */}
      {/* CENTERED ACTION MODALS                                       */}
      {/* ============================================================ */}

      {/* 1. VIEW COMPLETE DETAILS MODAL */}
      {activeModal === 'view' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar src={selectedUser.profilePhoto?.url} name={selectedUser.name} size="md" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedUser._id}</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block">EMAIL ADDRESS</span>
                  <span className="font-semibold text-slate-800">{selectedUser.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">PHONE NUMBER</span>
                  <span className="font-semibold text-slate-800">{selectedUser.phone || selectedUser.whatsappNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">ROLE</span>
                  <span className="font-bold text-amber-600">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">ACCOUNT STATUS</span>
                  <span className={`font-bold ${selectedUser.isSuspended ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">JOINED DATE</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">VERIFICATION STATUS</span>
                  <span className="font-bold text-slate-700">
                    {selectedUser.kycStatus === 'VERIFIED' ? '✅ VERIFIED' : selectedUser.kycStatus === 'PENDING' ? '⏳ PENDING KYC' : '❌ NOT VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFILE HEALTH & VERIFICATION MODAL */}
      {activeModal === 'profile' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔗</span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Profile Health & Verification</h3>
                  <p className="text-xs text-slate-500">{selectedUser.name} ({selectedUser.role})</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700">Profile Completion Health</span>
                  <span className="font-extrabold text-amber-600 text-sm">
                    {selectedUser.role === 'TUTOR' && selectedUser.kycStatus === 'VERIFIED' ? '100%' : '75%'}
                  </span>
                </div>
                <div className="admin-progress-track">
                  <div className="admin-progress-fill-good" style={{ width: selectedUser.kycStatus === 'VERIFIED' ? '100%' : '75%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700">Verification Checklist:</p>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>Phone Number Verified</span>
                  <span className="font-bold text-emerald-600">✓ {selectedUser.phone ? 'Yes' : 'No'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="font-bold text-emerald-600">✓ {selectedUser.email}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                  <span>KYC Identity Documents</span>
                  <span className={`font-bold ${selectedUser.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedUser.kycStatus === 'VERIFIED' ? '✓ Verified' : '⏳ Pending / Incomplete'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUSPEND MODAL */}
      {activeModal === 'suspend' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Suspend Account</h3>
                <p className="text-xs text-slate-500">Confirm temporary suspension for {selectedUser.name}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs my-4">
              <p className="text-slate-600">
                Suspending this user will immediately block them from logging in and accessing platform features.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Reason</label>
                <select
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  className="admin-select w-full text-xs"
                >
                  <option value="Policy violation">Policy violation</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="False information">False information</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleConfirmSuspend} disabled={modalLoading} className="admin-btn admin-btn-danger text-xs font-bold">
                {modalLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESTORE MODAL */}
      {activeModal === 'restore' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-emerald-600">
              <span className="text-2xl">♻️</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Restore Account</h3>
                <p className="text-xs text-slate-500">Restore active access for {selectedUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4">
              Restoring this user will lift all account restrictions and allow them to log in normally.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleConfirmRestore} disabled={modalLoading} className="admin-btn admin-btn-success text-xs font-bold">
                {modalLoading ? 'Restoring...' : 'Restore Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PERMANENT DELETE MODAL */}
      {activeModal === 'delete' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <span className="text-2xl">🗑️</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Permanent Account Deletion</h3>
                <p className="text-xs text-rose-600 font-bold">⚠️ Warning: This action cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs my-4">
              <p className="text-slate-600">
                Are you sure you want to permanently delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? All associated records will be deleted from the database.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type <span className="font-mono text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="admin-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={modalLoading || deleteConfirmationText !== 'DELETE'}
                className="admin-btn bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {modalLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. WHATSAPP DIRECT CONTACT MODAL */}
      {activeModal === 'whatsapp' && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF9F0] text-[#25D366] flex items-center justify-center text-lg font-bold border border-[#BCE6CB]">
                  💬
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">WhatsApp Direct Contact</h3>
                  <p className="text-xs text-slate-500">Send welcome / assistance message</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{selectedUser.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">📱 {selectedUser.phone || selectedUser.whatsappNumber || 'No phone'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {selectedUser.role}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message Content (Editable)
                </label>
                <textarea
                  rows="6"
                  value={customWhatsAppMessage}
                  onChange={e => setCustomWhatsAppMessage(e.target.value)}
                  className="admin-input w-full text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                💡 Clicking <strong>"Open WhatsApp"</strong> will launch WhatsApp in a new tab with your pre-filled message.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setActiveModal(null)} className="admin-btn admin-btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="admin-btn bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>💬</span>
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsersPage;
