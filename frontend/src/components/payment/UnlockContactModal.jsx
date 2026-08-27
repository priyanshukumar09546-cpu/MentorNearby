import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { checkUnlockEligibility, createFreeUnlock, createPaymentOrder, verifyPaymentAndUnlock } from '../../api/contactUnlocks';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UnlockContactModal = ({ isOpen, onClose, tutorId }) => {
  const [step, setStep] = useState('checking');
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        setStep('auth-required');
        return;
      }
      checkEligibility();
    }
  }, [isOpen, isAuthenticated]);

  const checkEligibility = async () => {
    try {
      setStep('checking');
      const res = await checkUnlockEligibility(tutorId);
      setEligibility(res.data.data);
      
      if (res.data.data.alreadyUnlocked) {
        setContactInfo(res.data.data.contactInfo);
        setStep('success');
      } else {
        setStep('decision');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check eligibility');
      setStep('error');
    }
  };

  const handleFreeUnlock = async () => {
    try {
      setStep('processing');
      const res = await createFreeUnlock(tutorId);
      setContactInfo(res.data.data.contactInfo);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlock');
      setStep('error');
    }
  };

  const handlePaidUnlock = async () => {
    try {
      setStep('processing');
      const orderRes = await createPaymentOrder({ tutorId });
      const { orderId, amount, currency } = orderRes.data.data;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency: currency,
        name: 'MentorNearby',
        description: 'Unlock Tutor Contact',
        order_id: orderId,
        handler: async function (response) {
          try {
            setStep('processing');
            const verifyRes = await verifyPaymentAndUnlock({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setContactInfo(verifyRes.data.data.contactInfo);
            setStep('success');
          } catch (err) {
            setError('Payment verification failed');
            setStep('error');
          }
        },
        theme: { color: '#1e3a5f' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setError('Payment failed or cancelled');
        setStep('error');
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setStep('error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Contact">
      <div className="text-center p-4">
        
        {step === 'auth-required' && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h4>Login Required</h4>
            <p className="text-muted mt-2">You need to be logged in to unlock tutor contacts.</p>
            <div className="flex gap-4 mt-6 justify-center">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>Login Now</button>
            </div>
          </div>
        )}

        {step === 'checking' && (
          <div className="flex flex-col items-center">
            <div className="spinner spinner-lg mb-4"></div>
            <p>Checking unlock eligibility...</p>
          </div>
        )}

        {step === 'decision' && eligibility && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔓</div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Unlock Tutor Contact</h4>
            <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">Get direct access to phone number, email, and WhatsApp.</p>
            
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl mt-4 p-5 text-left shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 px-2.5 py-1 rounded">
                  Unlock #{eligibility.unlockNumber || 1}
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">₹{eligibility.price}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                Standard contact unlock fee (₹{eligibility.price} per unlock).
              </p>
              <button 
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
                onClick={handlePaidUnlock}
              >
                <span>💳 Pay ₹{eligibility.price} with Razorpay</span>
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center">
            <div className="spinner spinner-lg mb-4"></div>
            <p>Processing unlock request...</p>
          </div>
        )}

        {step === 'success' && contactInfo && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h4 className="text-success">Contact Unlocked!</h4>
            <p className="text-muted mt-2">You can now reach out to the tutor directly.</p>
            
            <div className="card mt-6 p-4">
              <p className="text-lg font-bold">📞 {contactInfo.phone}</p>
              {contactInfo.whatsappNumber && (
                <p className="text-lg font-bold mt-2 text-success">💬 {contactInfo.whatsappNumber} (WhatsApp)</p>
              )}
            </div>
            
            <button className="btn btn-outline w-full mt-6" onClick={onClose}>Close</button>
          </div>
        )}

        {step === 'error' && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h4 className="text-danger">Action Failed</h4>
            <p className="text-muted mt-2">{error}</p>
            <div className="flex gap-4 mt-6 justify-center">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={checkEligibility}>Try Again</button>
            </div>
          </div>
        )}
        
      </div>
    </Modal>
  );
};
export default UnlockContactModal;
