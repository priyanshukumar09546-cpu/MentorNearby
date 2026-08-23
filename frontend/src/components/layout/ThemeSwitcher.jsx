// ============================================================
// components/layout/ThemeSwitcher.jsx
// Instant Light / Dark Theme Switcher Button for MentorNearby
// ============================================================

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeSwitcher.css';

const ThemeSwitcher = ({ compact = false }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${compact ? 'compact' : ''}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} — Click to toggle`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          /* Radiant Moon Icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          /* Warm Sun Icon */
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" fill="#FEF3C7"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
      </span>
    </button>
  );
};

export default ThemeSwitcher;
