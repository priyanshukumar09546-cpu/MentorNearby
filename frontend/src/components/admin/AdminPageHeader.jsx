import React from 'react';

const AdminPageHeader = ({
  icon = '🛡️',
  title,
  subtitle,
  children,
  badge = 'SUPER ADMIN',
  eyebrow = null
}) => {
  return (
    <div className="admin-page-header flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="admin-header-icon-badge flex-shrink-0">
          {icon}
        </div>
        <div>
          {eyebrow && <div className="admin-eyebrow-label">{eyebrow}</div>}
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="admin-page-title">{title}</h1>
            {badge && (
              <span className="admin-badge admin-badge-amber">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="admin-page-subtitle max-w-2xl">{subtitle}</p>}
        </div>
      </div>

      {children && <div className="relative z-10 flex items-center gap-3">{children}</div>}
    </div>
  );
};

export default AdminPageHeader;
