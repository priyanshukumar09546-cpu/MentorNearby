import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUserProfile, updateUserProfile, updateStudentProfile, deleteUserAccount } from '../../api/users';
import { updateTutorProfile } from '../../api/tutors';
import { updatePassword } from '../../api/auth';
import { uploadPhoto } from '../../api/upload';

const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({ name: '', phone: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [studentForm, setStudentForm] = useState({
    city: '', area: '', pincode: '',
    class: '', board: '', medium: 'English',
    subjectsRequired: '', mode: 'Offline', budget: '',
    parentName: '', parentPhone: ''
  });
  const [tutorForm, setTutorForm] = useState({
    professionalHeadline: '', bio: '', city: '', area: '', pincode: '',
    subjects: '', grades: '', feeAmount: '', feeFrequency: 'Hour'
  });
  const [notifications, setNotifications] = useState({ email: true, inApp: true, requests: true, messages: true });
  const [privacy, setPrivacy] = useState({ profileVisible: true, contactVisible: false });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUserProfile();
        const { user: userData, profile } = res.data.data;
        
        setAccountForm({
          name: userData?.name || '',
          phone: userData?.phone || '',
          avatar: userData?.avatar || ''
        });

        if (userData?.role === 'STUDENT' && profile) {
          setStudentForm({
            city: profile.location?.city || '',
            area: profile.location?.area || '',
            pincode: profile.location?.pincode || '',
            class: profile.studentDetails?.class || '',
            board: profile.studentDetails?.board || '',
            medium: profile.studentDetails?.medium || 'English',
            subjectsRequired: profile.academicDetails?.subjectsRequired?.join(', ') || '',
            mode: profile.tuitionRequirements?.mode || 'Offline',
            budget: profile.tuitionRequirements?.budget || '',
            parentName: profile.parentDetails?.name || '',
            parentPhone: profile.parentDetails?.phone || ''
          });
        } else if (userData?.role === 'TUTOR' && profile) {
          setTutorForm({
            professionalHeadline: profile.professionalHeadline || '',
            bio: profile.bio || '',
            city: profile.location?.city || '',
            area: profile.location?.area || '',
            pincode: profile.location?.pincode || '',
            subjects: profile.subjects?.join(', ') || '',
            grades: profile.grades?.join(', ') || '',
            feeAmount: profile.fees?.amount || '',
            feeFrequency: profile.fees?.frequency || 'Hour'
          });
        }
      } catch (err) {
        showToast('Failed to load settings data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setSaving(true);
    try {
      const uploadRes = await uploadPhoto(file);
      const photoUrl = uploadRes.data.data.url;
      setAccountForm(prev => ({ ...prev, avatar: photoUrl }));
      await updateUserProfile({ avatar: photoUrl });
      await refreshUser();
      showToast('Profile photo updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to upload image', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({ name: accountForm.name, phone: accountForm.phone });
      await refreshUser();
      showToast('Account details updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.role === 'STUDENT') {
        await updateStudentProfile({
          location: { city: studentForm.city, area: studentForm.area, pincode: studentForm.pincode },
          studentDetails: { class: studentForm.class, board: studentForm.board, medium: studentForm.medium },
          academicDetails: { subjectsRequired: studentForm.subjectsRequired.split(',').map(s => s.trim()).filter(Boolean) },
          tuitionRequirements: { mode: studentForm.mode, budget: studentForm.budget },
          parentDetails: { name: studentForm.parentName, phone: studentForm.parentPhone }
        });
      } else if (user?.role === 'TUTOR') {
        await updateTutorProfile({
          professionalHeadline: tutorForm.professionalHeadline,
          bio: tutorForm.bio,
          location: { city: tutorForm.city, area: tutorForm.area, pincode: tutorForm.pincode },
          subjects: tutorForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
          grades: tutorForm.grades.split(',').map(g => g.trim()).filter(Boolean),
          fees: { amount: Number(tutorForm.feeAmount) || 0, frequency: tutorForm.feeFrequency }
        });
      }
      showToast('Preferences updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setSaving(true);
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteUserAccount();
      showToast('Account deleted successfully', 'info');
      logout();
    } catch (err) {
      showToast('Failed to delete account', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-1">
          <h2 className="font-bold text-gray-900 px-3 py-2 text-lg">Settings</h2>
          {[
            { id: 'account', label: '👤 Account', desc: 'Personal details & photo' },
            { id: 'preferences', label: user?.role === 'TUTOR' ? '👨‍🏫 Professional' : '🎓 Learning Preferences', desc: 'Subjects & requirements' },
            { id: 'notifications', label: '🔔 Notifications', desc: 'Email & in-app alerts' },
            { id: 'privacy', label: '🔒 Privacy', desc: 'Profile & contact rules' },
            { id: 'security', label: '🔑 Security', desc: 'Password & sessions' },
            { id: 'danger', label: '⚠️ Danger Zone', desc: 'Account deletion' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>{tab.label}</div>
              <div className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-400'}`}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-3">Account Details</h3>

              {/* Photo Upload */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl overflow-hidden border">
                  {accountForm.avatar ? (
                    <img src={accountForm.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    accountForm.name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <label className="btn btn-outline btn-sm cursor-pointer">
                    Upload New Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB. Uploads safely to Cloudinary.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={accountForm.name}
                    onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                    value={accountForm.phone}
                    onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Email address cannot be changed directly.</p>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Account Changes'}
              </button>
            </form>
          )}

          {/* TAB 2: PREFERENCES (STUDENT or TUTOR) */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-3">
                {user?.role === 'TUTOR' ? 'Professional Details' : 'Learning Preferences & Requirements'}
              </h3>

              {user?.role === 'STUDENT' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" value={studentForm.city} onChange={e => setStudentForm({ ...studentForm, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Area / Locality</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" value={studentForm.area} onChange={e => setStudentForm({ ...studentForm, area: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">PIN Code</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" value={studentForm.pincode} onChange={e => setStudentForm({ ...studentForm, pincode: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Class / Grade</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Class 10" value={studentForm.class} onChange={e => setStudentForm({ ...studentForm, class: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Board</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. CBSE" value={studentForm.board} onChange={e => setStudentForm({ ...studentForm, board: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Medium</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={studentForm.medium} onChange={e => setStudentForm({ ...studentForm, medium: e.target.value })}>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Required Subjects (comma-separated)</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Mathematics, Physics, Chemistry" value={studentForm.subjectsRequired} onChange={e => setStudentForm({ ...studentForm, subjectsRequired: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Teaching Mode</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={studentForm.mode} onChange={e => setStudentForm({ ...studentForm, mode: e.target.value })}>
                        <option value="Offline">Offline / Home Tuition</option>
                        <option value="Online">Online Video Class</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Budget</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. ₹5,000 / month" value={studentForm.budget} onChange={e => setStudentForm({ ...studentForm, budget: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Professional Headline</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Senior Math Educator with 8+ years experience" value={tutorForm.professionalHeadline} onChange={e => setTutorForm({ ...tutorForm, professionalHeadline: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio / Profile Description</label>
                    <textarea rows="3" className="w-full px-3 py-2 border rounded-lg" value={tutorForm.bio} onChange={e => setTutorForm({ ...tutorForm, bio: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Subjects Taught (comma-separated)</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg" value={tutorForm.subjects} onChange={e => setTutorForm({ ...tutorForm, subjects: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Classes / Grades Taught (comma-separated)</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg" value={tutorForm.grades} onChange={e => setTutorForm({ ...tutorForm, grades: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Fee Amount (₹)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg" value={tutorForm.feeAmount} onChange={e => setTutorForm({ ...tutorForm, feeAmount: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={tutorForm.feeFrequency} onChange={e => setTutorForm({ ...tutorForm, feeFrequency: e.target.value })}>
                        <option value="Hour">Per Hour</option>
                        <option value="Month">Per Month</option>
                        <option value="Session">Per Session</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-3">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'email', title: 'Email Notifications', desc: 'Receive transactional emails for account activity' },
                  { key: 'inApp', title: 'In-App Alerts', desc: 'Receive real-time alerts inside MentorNearby' },
                  { key: 'requests', title: 'Tutor Requests & Activity', desc: 'Alerts when tutors express interest or requests change' },
                  { key: 'messages', title: 'Direct Messages', desc: 'Alerts when a student or tutor sends a message' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                      checked={notifications[item.key]}
                      onChange={e => {
                        setNotifications({ ...notifications, [item.key]: e.target.checked });
                        showToast('Notification preference updated', 'success');
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-3">Privacy Rules</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <p className="font-bold">🔒 Privacy Guarantee</p>
                  <p>Your exact residential address and phone number are NEVER publicly displayed on MentorNearby.</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Public Profile Visibility</div>
                    <div className="text-xs text-gray-500">Allow your profile to appear in search results</div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                    checked={privacy.profileVisible}
                    onChange={e => {
                      setPrivacy({ ...privacy, profileVisible: e.target.checked });
                      showToast('Privacy settings updated', 'success');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-3">Security & Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* TAB 6: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-red-600 border-b pb-3">Danger Zone</h3>
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl space-y-4">
                <h4 className="font-bold text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700">
                  Deactivating your account will disable your profile and logout your active sessions.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Are you sure?</h3>
            <p className="text-sm text-gray-600">This action will deactivate your account and log you out. Proceed?</p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm" onClick={handleDeleteAccount}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
