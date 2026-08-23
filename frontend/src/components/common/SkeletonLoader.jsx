import React from 'react';

const SkeletonLoader = ({ variant = 'card', count = 1, width, height }) => {
  const renderSkeleton = (key) => {
    const style = { width: width || '100%', height: height || '200px', borderRadius: '8px', marginBottom: '16px' };
    if (variant === 'text') { style.height = height || '20px'; }
    if (variant === 'avatar') { style.width = width || '50px'; style.height = height || '50px'; style.borderRadius = '50%'; }
    return <div key={key} className="skeleton" style={style}></div>;
  };
  return <>{Array.from({ length: count }).map((_, i) => renderSkeleton(i))}</>;
};

export default SkeletonLoader;
