// ============================================================
// context/ThemeContext.jsx
// Global Appearance & Theme Management System for MentorNearby
// Modes: ☀️ Light, 🌙 Dark, 🌗 System Default, ☕ Eye Comfort
// Persisted in localStorage ('mentornearby-theme')
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

const THEME_STORAGE_KEY = 'mentornearby-theme';
const LEGACY_STORAGE_KEY = 'tutornearby-theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved && ['light', 'dark', 'system', 'eye-comfort'].includes(saved)) {
        return saved;
      }
    } catch (_) {}
    return 'light'; // Default to light matching primary reference
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Compute resolved theme
  useEffect(() => {
    const updateTheme = () => {
      let active = theme;
      if (theme === 'system') {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isSystemDark ? 'dark' : 'light';
      }

      setResolvedTheme(active);

      // Apply to document element
      const root = document.documentElement;
      root.setAttribute('data-theme', active);
      root.className = `theme-${active}`;
      if (active === 'dark' || active === 'eye-comfort') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      if (active === 'light') {
        root.style.colorScheme = 'light';
      } else {
        root.style.colorScheme = 'dark';
      }
    };

    updateTheme();

    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (['light', 'dark', 'system', 'eye-comfort'].includes(newTheme)) {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (_) {}
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'eye-comfort';

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
