import React from 'react';

const ErrorState = ({ message = 'Something went wrong', onRetry }) => {
  return (
    <div className="error-state text-center p-8 flex flex-col items-center">
      <div style={{ color: 'var(--color-danger)', fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h3 style={{ marginBottom: '8px' }}>Error</h3>
      <p className="text-muted" style={{ marginBottom: '24px' }}>{message}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Try Again</button>}
    </div>
  );
};
export default ErrorState;
