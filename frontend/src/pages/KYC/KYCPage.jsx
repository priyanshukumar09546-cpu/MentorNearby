import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const KYCPage = () => {
  const [kycStatusData, setKycStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    govtIdType: 'AADHAAR',
    govtIdLast4: '',
    govtIdUrl: '',
    collegeIdUrl: '',
    qualificationUrl: '',
    consent: false
  });

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const response = await client.get('/kyc/me');
      setKycStatusData(response.data.data);
    } catch (err) {
      setKycStatusData({ status: 'NOT_SUBMITTED' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.govtIdLast4 || !/^\d{4}$/.test(formData.govtIdLast4)) {
      showToast('Enter exactly the last 4 digits of your Govt ID', 'error');
      return;
    }
    if (!formData.govtIdUrl) {
      showToast('Govt ID document URL is required', 'error');
      return;
    }
    if (!formData.consent) {
      showToast('You must consent to document verification', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const docs = [
        { type: 'GOVT_ID', url: formData.govtIdUrl },
      ];
      if (formData.collegeIdUrl) docs.push({ type: 'COLLEGE_ID', url: formData.collegeIdUrl });
      if (formData.qualificationUrl) docs.push({ type: 'ADDRESS_PROOF', url: formData.qualificationUrl });

      await client.post('/kyc/submit', {
        govtIdType: formData.govtIdType,
        govtIdLast4: formData.govtIdLast4,
        documents: docs,
        consent: true
      });

      showToast('KYC documents submitted successfully!', 'success');
      fetchKycStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit KYC', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen p-8 text-center text-gray-500">Loading KYC Details...</div>;
  }

  const currentStatus = kycStatusData?.status || 'NOT_SUBMITTED';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tutor Verification & KYC</h1>
              <p className="text-sm text-gray-600">Get the "Verified Tutor" badge to build student trust.</p>
            </div>
            
            <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider ${
              currentStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
              currentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              currentStatus === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {currentStatus.replace('_', ' ')}
            </span>
          </div>

          {currentStatus === 'VERIFIED' && (
            <div className="bg-green-50 border border-green-200 text-green-900 p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-lg font-bold text-green-800">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                Your Profile is Fully Verified!
              </div>
              <p className="text-sm">
                Congratulations! Your government identity and qualification documents have been approved by the MentorNearby Admin team. 
                Your public profile now displays the official <strong>"✓ Verified Tutor"</strong> badge.
              </p>
            </div>
          )}

          {currentStatus === 'PENDING' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-lg font-bold text-yellow-800">
                ⏳ KYC Review Underway
              </div>
              <p className="text-sm">
                Your submitted documents are currently being reviewed by our trust and safety team. 
                This usually takes 24-48 hours. Once verified, your account will be automatically updated with the Verified badge.
              </p>
            </div>
          )}

          {currentStatus === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-xl space-y-2 mb-6">
              <div className="flex items-center gap-2 text-lg font-bold text-red-800">
                ✕ KYC Verification Rejected
              </div>
              <p className="text-sm">
                <strong>Reason:</strong> {kycStatusData?.rejectionReason || 'Documents provided were unclear or invalid.'}
              </p>
              <p className="text-xs text-red-700">
                Please re-upload clear, valid document links below to submit for re-verification.
              </p>
            </div>
          )}

          {(currentStatus === 'NOT_SUBMITTED' || currentStatus === 'REJECTED') && (
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold">🔒 Privacy & Security Promise</p>
                <p>
                  Documents submitted here are stored securely and viewed only by authorized administrators. 
                  Students or public visitors will <strong>NEVER</strong> see your sensitive document details or full ID numbers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Govt ID Type <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.govtIdType}
                    onChange={e => setFormData({...formData, govtIdType: e.target.value})}
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last 4 Digits of Govt ID <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    maxLength="4" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. 5678" 
                    value={formData.govtIdLast4} 
                    onChange={e => setFormData({...formData, govtIdLast4: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Govt ID Document URL / Link <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://res.cloudinary.com/..." 
                  value={formData.govtIdUrl} 
                  onChange={e => setFormData({...formData, govtIdUrl: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">College ID URL (Optional - For Student Tutors)</label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://..." 
                  value={formData.collegeIdUrl} 
                  onChange={e => setFormData({...formData, collegeIdUrl: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Degree Certificate / Marksheet Proof URL (Optional)</label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://..." 
                  value={formData.qualificationUrl} 
                  onChange={e => setFormData({...formData, qualificationUrl: e.target.value})} 
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    checked={formData.consent} 
                    onChange={e => setFormData({...formData, consent: e.target.checked})} 
                  />
                  <span className="text-xs text-gray-700">
                    I confirm these documents belong to me and give consent to MentorNearby to process them for safety verification. <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting Documents...' : 'Submit Documents for Verification'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default KYCPage;
