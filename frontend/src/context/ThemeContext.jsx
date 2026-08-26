// ============================================================
// context/ThemeContext.jsx
// MentorNearby Global Appearance & Theme System
// Default: Dark Mode (Pure Black #000000)
// Switchable to Light Mode via Navbar Toggle
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

const PRIMARY_STORAGE_KEY = 'theme';
const BRAND_STORAGE_KEY = 'mentornearby-theme';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(BRAND_STORAGE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    } catch (_) {}
    return 'dark'; // DEFAULT TO DARK MODE (PURE BLACK)
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const updateTheme = () => {
      let active = theme;
      if (theme === 'system') {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isSystemDark ? 'dark' : 'light';
      }

      setResolvedTheme(active);

      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(active);
      root.setAttribute('data-theme', active);
      root.className = `theme-${active} ${active}`;
      root.style.colorScheme = active === 'dark' ? 'dark' : 'light';

      try {
        localStorage.setItem(PRIMARY_STORAGE_KEY, theme);
        localStorage.setItem(BRAND_STORAGE_KEY, theme);
      } catch (_) {}
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
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme);
      try {
        localStorage.setItem(PRIMARY_STORAGE_KEY, newTheme);
        localStorage.setItem(BRAND_STORAGE_KEY, newTheme);
      } catch (_) {}
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = resolvedTheme === 'dark';

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
