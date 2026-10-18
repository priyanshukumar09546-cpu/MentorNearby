import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import './admin.css';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Email Config State
  const [emailStatus, setEmailStatus] = useState(null);
  const [resendKeyInput, setResendKeyInput] = useState('');
  const [emailFromInput, setEmailFromInput] = useState('MentorNearby Team <notifications@mentornearby.com>');
  const [showKey, setShowKey] = useState(false);
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState('');
  const [testNote, setTestNote] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchEmailStatus = async () => {
    try {
      const res = await client.get('/admin/email/status');
      if (res?.data?.data) {
        setEmailStatus(res.data.data);
        if (res.data.data.emailSender) {
          setEmailFromInput(res.data.data.emailSender);
        }
      }
    } catch (e) {
      console.warn('Failed to load email status:', e?.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchEmailStatus(),
          client.get('/admin/config').catch(() => null),
        ]);
        if (user?.email) {
          setTestRecipient(user.email);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    if (resendKeyInput && !resendKeyInput.trim().startsWith('re_')) {
      showToast('Resend API Key must start with "re_"', 'error');
      return;
    }

    try {
      setSavingEmailConfig(true);
      if (resendKeyInput.trim()) {
        await client.put('/admin/config/RESEND_API_KEY', {
          key: 'RESEND_API_KEY',
          value: resendKeyInput.trim(),
        });
      }

      if (emailFromInput.trim()) {
        await client.put('/admin/config/EMAIL_FROM', {
          key: 'EMAIL_FROM',
          value: emailFromInput.trim(),
        });
      }

      showToast('Email settings saved successfully! Configuration is active immediately.', 'success');
      setResendKeyInput('');
      await fetchEmailStatus();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update email settings';
      showToast(msg, 'error');
    } finally {
      setSavingEmailConfig(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes('@')) {
      showToast('Please enter a valid recipient email address.', 'error');
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);

      const res = await client.post('/admin/email/test', {
        recipientEmail: testRecipient.trim(),
        testMessage: testNote.trim(),
      });

      const data = res?.data?.data || {};
      setTestResult(data);

      if (data.emailSent) {
        showToast('Live test email dispatched successfully via Resend API!', 'success');
      } else {
        showToast(data.emailError || 'Email could not be delivered', 'error');
      }
    } catch (err) {
      const errData = err?.response?.data?.data;
      const errMsg = err?.response?.data?.message || err.message || 'Test email dispatch failed';
      setTestResult(errData || { emailSent: false, emailError: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1C1A] font-sans max-w-4xl mx-auto">
      <AdminPageHeader
        icon="⚙️"
        eyebrow="SYSTEM CONFIGURATION"
        title="Platform Settings & Production Integrations"
        subtitle="Manage transactional email infrastructure, system policies, and admin profile"
      />

      {/* Production Email Delivery Infrastructure Card */}
      <div className="admin-card p-6 shadow-sm space-y-5 bg-white border border-[#E6E2D9] rounded-2xl">
        <div className="border-b border-[#E6E2D9] pb-4 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1C1C1A] flex items-center gap-2">
              <span>📧</span> Production Email Delivery Engine (Resend HTTPS API)
            </h3>
            <p className="text-xs text-[#77766E] mt-1">
              Enforces direct HTTPS REST API over port 443 (Zero SMTP timeouts; Render egress firewall blocks ports 25, 465, & 587)
            </p>
          </div>
          <div>
            {emailStatus?.isConfigured || emailStatus?.hasResendApiKey ? (
              <span className="admin-badge admin-badge-green flex items-center gap-1.5 px-3 py-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE (RESEND PORT 443)
              </span>
            ) : (
              <span className="admin-badge admin-badge-amber flex items-center gap-1.5 px-3 py-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                CONFIG PENDING
              </span>
            )}
          </div>
        </div>

        {/* Current Pipeline Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E6E2D9]">
            <span className="text-[#77766E] font-medium block">Active Engine</span>
            <strong className="text-[#1C1C1A] text-sm font-bold mt-0.5 block">
              {emailStatus?.activeProvider || 'RESEND'} (HTTPS REST)
            </strong>
          </div>
          <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E6E2D9]">
            <span className="text-[#77766E] font-medium block">Resend API Key Status</span>
            <strong className="text-[#1C1C1A] text-sm font-bold mt-0.5 block">
              {emailStatus?.hasResendApiKey
                ? `Configured (${emailStatus.keyPreview || 're_••••'})`
                : 'Not Configured'}
            </strong>
          </div>
          <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E6E2D9]">
            <span className="text-[#77766E] font-medium block">Active Sender Identity</span>
            <strong className="text-[#1C1C1A] text-xs font-mono font-bold mt-0.5 block truncate" title={emailStatus?.emailSender}>
              {emailStatus?.emailSender || 'notifications@mentornearby.com'}
            </strong>
          </div>
        </div>

        {/* Update Key & Sender Form */}
        <form onSubmit={handleSaveEmailConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1C1A] mb-1.5">
                Resend API Key (RESEND_API_KEY)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={resendKeyInput}
                  onChange={(e) => setResendKeyInput(e.target.value)}
                  placeholder={
                    emailStatus?.hasResendApiKey
                      ? `Key is active (${emailStatus.keyPreview}). Enter new key to rotate...`
                      : 're_123456789abcdef...'
                  }
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-[#D5D0C5] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A96F13] pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#77766E] hover:text-[#1C1C1A] px-1.5 py-0.5"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-[#77766E] mt-1">
                Keys start with <code className="font-mono text-[#A96F13]">re_</code>. Updates take effect immediately in MongoDB without redeploying.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1C1A] mb-1.5">
                Sender Identity (EMAIL_FROM)
              </label>
              <input
                type="text"
                value={emailFromInput}
                onChange={(e) => setEmailFromInput(e.target.value)}
                placeholder="MentorNearby Team <notifications@mentornearby.com>"
                className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-[#D5D0C5] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A96F13]"
              />
              <p className="text-[11px] text-[#77766E] mt-1">
                Must use a domain verified in your Resend dashboard (e.g., <code className="font-mono text-[#A96F13]">@mentornearby.com</code>).
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingEmailConfig || (!resendKeyInput && emailFromInput === emailStatus?.emailSender)}
              className="admin-btn admin-btn-primary text-xs px-4 py-2 font-bold disabled:opacity-50"
            >
              {savingEmailConfig ? 'Saving Settings...' : 'Save Email Settings'}
            </button>
          </div>
        </form>

        {/* Live Test Email Section */}
        <div className="border-t border-[#E6E2D9] pt-4 mt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#77766E] flex items-center gap-1.5">
            <span>🧪</span> Send Live Verification Test Email
          </h4>
          <form onSubmit={handleSendTestEmail} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-[#575752] mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D0C5] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#A96F13]"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-[#575752] mb-1">
                Optional Test Note
              </label>
              <input
                type="text"
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                placeholder="Testing live Resend dispatch"
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#D5D0C5] bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#A96F13]"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={sendingTest || !testRecipient}
                className="w-full admin-btn admin-btn-secondary text-xs py-2 font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#1C1C1A] border-t-transparent rounded-full animate-spin"></span>
                    Dispatching via Resend...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Send Test Email
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Dispatch Result Card */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                testResult.emailSent
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                <span>{testResult.emailSent ? '✅' : '❌'}</span>
                <span>
                  {testResult.emailSent
                    ? 'Test Email Successfully Accepted by Resend'
                    : 'Test Email Delivery Failed'}
                </span>
              </div>
              {testResult.messageId && (
                <p className="font-mono text-[11px]">
                  <strong>Message ID:</strong> {testResult.messageId} | <strong>Provider:</strong> {testResult.provider || 'RESEND'}
                </p>
              )}
              {testResult.emailError && (
                <p className="text-[11px] leading-relaxed">
                  <strong>Diagnostic:</strong> {testResult.emailError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

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
