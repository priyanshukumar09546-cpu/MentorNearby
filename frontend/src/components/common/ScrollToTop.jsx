// ============================================================
// components/common/ScrollToTop.jsx
// Global Scroll Restoration & Scroll-To-Top Component
// Ensures every page navigation opens at (0, 0) on iPhone Safari & Android Chrome
// ============================================================

import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  // 1. Configure browser history scroll restoration on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch (_) {}
    }
  }, []);

  // 2. Instant scroll reset on route changes
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    if (hash) {
      // In-page anchor link (e.g. /terms#refund or /#faq)
      const targetId = hash.replace(/^#/, '');
      const elem = document.getElementById(targetId) || document.querySelector(hash);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Standard page navigation -> Force scroll to top (0, 0)
    const resetScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
      const mainContent = document.querySelector('.mn-app-main-content');
      if (mainContent) mainContent.scrollTop = 0;
    };

    // Immediate reset
    resetScroll();

    // Secondary reset via RAF & timer to handle lazy-loaded Suspense chunks
    const rafId = requestAnimationFrame(() => {
      resetScroll();
    });

    const timerId = setTimeout(() => {
      resetScroll();
    }, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
