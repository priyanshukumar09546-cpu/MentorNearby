import React from 'react';

const BADGE_CONFIG = {
  phone: { label: 'Phone Verified', icon: '📱', color: 'badge-primary', tooltip: 'Phone number has been OTP verified' },
  email: { label: 'Email Verified', icon: '✉️', color: 'badge-primary', tooltip: 'Email address has been verified' },
  identity: { label: 'ID Verified', icon: '🛡️', color: 'badge-success', tooltip: 'Government ID verified by admin' },
  college: { label: 'College Verified', icon: '🎓', color: 'badge-info', tooltip: 'Educational credentials verified' },
  profile: { label: 'Complete Profile', icon: '⭐', color: 'badge-warning', tooltip: 'Profile meets quality standards' }
};

const VerificationBadge = ({ type }) => {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  return (
    <span className={`badge ${config.color}`} title={config.tooltip} style={{ cursor: 'help' }}>
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
};
export default VerificationBadge;
