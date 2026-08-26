import React, { useState } from 'react';

const ProfileAvatar = ({
  src,
  name = 'User',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  className = '',
  showBadge = false,
  badgeType = 'verified',
  onUploadClick = null,
  editable = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Strict sizing rules (never allows image to blow up layout)
  const sizeClasses = {
    sm: 'w-10 h-10 min-w-[40px] min-h-[40px]',
    md: 'w-16 h-16 min-w-[64px] min-h-[64px]',
    lg: 'w-24 h-24 min-w-[96px] min-h-[96px]',
    xl: 'w-32 h-32 min-w-[128px] min-h-[128px]',
    hero: 'w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 max-w-[192px] max-h-[192px]',
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <div
        className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-100 flex items-center justify-center aspect-square"
        style={{ borderRadius: '50%', overflow: 'hidden' }}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center rounded-full"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', aspectRatio: '1/1' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-blue-900 text-white font-bold flex items-center justify-center text-lg md:text-xl rounded-full">
            {getInitials(name)}
          </div>
        )}
      </div>

      {showBadge && (
        <span
          className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow text-xs flex items-center justify-center"
          title={badgeType === 'verified' ? 'KYC Verified Tutor' : 'Verified'}
        >
          ✓
        </span>
      )}

      {editable && onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg border-2 border-white transition-transform hover:scale-105"
          title="Upload Profile Photo"
        >
          📷
        </button>
      )}
    </div>
  );
};

export default ProfileAvatar;
