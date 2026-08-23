import React, { useState } from 'react';

const AdminActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning' | 'danger' | 'success' | 'prompt'
  promptLabel = '',
  promptPlaceholder = '',
  isLoading = false
}) => {
  const [promptValue, setPromptValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt' && !promptValue.trim()) {
      setError(`${promptLabel || 'Field'} is required`);
      return;
    }
    setError('');
    onConfirm(promptValue);
  };

  const badgeColors = {
    warning: 'bg-[#FFF3D6] text-[#A96F13] border-[#F0D28C]',
    danger: 'bg-[#FCEAEA] text-[#C94B4B] border-[#EABABA]',
    success: 'bg-[#E7F5ED] text-[#238B5A] border-[#B9DEC9]',
    prompt: 'bg-[#FFF4D8] text-[#A96F13] border-[#F2C66D]'
  };

  const buttonColors = {
    warning: 'bg-gradient-to-r from-[#D89B2B] to-[#A96F13] text-white hover:opacity-90',
    danger: 'bg-[#C94B4B] hover:bg-[#B53E3E] text-white',
    success: 'bg-[#238B5A] hover:bg-[#1E774D] text-white',
    prompt: 'bg-gradient-to-r from-[#D89B2B] to-[#A96F13] text-white hover:opacity-90'
  };

  return (
    <div className="fixed inset-0 bg-[#1C1C1A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-xl border border-[#E3DFD6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#1C1C1A]">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${badgeColors[type] || badgeColors.warning}`}>
              {type === 'danger' ? '⚠️ WARNING' : type === 'prompt' ? '📝 INPUT REQUIRED' : '⚡ CONFIRM'}
            </span>
            <h3 className="font-bold text-[#1C1C1A] text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#85857D] hover:text-[#1C1C1A] font-bold text-lg">✕</button>
        </div>

        {/* Description */}
        <p className="text-xs text-[#575752] leading-relaxed">{description}</p>

        {/* Prompt Input if applicable */}
        {type === 'prompt' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#575752] uppercase tracking-wider">
              {promptLabel || 'Reason / Details'} <span className="text-[#C94B4B]">*</span>
            </label>
            <textarea
              rows="3"
              value={promptValue}
              onChange={(e) => {
                setPromptValue(e.target.value);
                if (error) setError('');
              }}
              placeholder={promptPlaceholder || 'Enter detailed reason...'}
              className="admin-textarea w-full"
            />
            {error && <p className="text-[#C94B4B] text-[11px] font-bold mt-1">{error}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="admin-btn admin-btn-secondary flex-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-2 ${buttonColors[type] || buttonColors.warning}`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminActionModal;
