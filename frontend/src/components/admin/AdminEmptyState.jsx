import React from 'react';

const AdminEmptyState = ({
  icon = '📋',
  title = 'No records found',
  description = 'There are no active records matching your criteria.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-white border border-[#E6E2D9] rounded-2xl p-12 text-center text-[#77766E] space-y-4 shadow-sm max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-[#FFF1D0] border border-[#F1D79C] flex items-center justify-center text-3xl mx-auto text-[#C98516] shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#1C1C1A] tracking-tight">{title}</h3>
        <p className="text-xs text-[#77766E] mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="admin-btn admin-btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default AdminEmptyState;
