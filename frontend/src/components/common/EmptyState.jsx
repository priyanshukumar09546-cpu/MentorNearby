import React from 'react';

const EmptyState = ({ title, description, icon = '🔍', action }) => {
  return (
    <div className="empty-state text-center p-8 flex flex-col items-center justify-center">
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '24px' }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
export default EmptyState;
