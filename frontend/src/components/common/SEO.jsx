// ============================================================
// components/common/SEO.jsx
// MentorNearby Dynamic SEO Metadata & Schema.org JSON-LD Manager
// 100% Lightweight Vanilla React • Zero External Dependencies
// ============================================================

import React, { useEffect } from 'react';

const SITE_ORIGIN = 'https://www.mentornearby.com';
const DEFAULT_TITLE = 'MentorNearby — Find Trusted Home & Online Tutors in India';
const DEFAULT_DESC =
  'Connect with verified home tutors and online tutors near you across Ghaziabad, Hapur, Delhi NCR and India. 100% KYC verified educators for Class 1-12, CBSE, ICSE, and competitive exams.';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-preview.jpg`;
const DEFAULT_KEYWORDS =
  'home tutors near me, tutors near me, home tuition nearby, private tutor, online tutor in india, home tutors in ghaziabad, home tutors in hapur, verified tutor, tutor registration, MentorNearby';

const setOrCreateMetaTag = (attributeName, attributeValue, contentValue) => {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', contentValue || '');
};

const setOrCreateLinkTag = (rel, href) => {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export const SEO = ({
  title,
  description,
  canonical,
  keywords,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  structuredData = null,
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Title Tag
    const pageTitle = title
      ? (title.includes('MentorNearby') ? title : `${title} | MentorNearby`)
      : DEFAULT_TITLE;
    document.title = pageTitle;

    // 2. Canonical URL
    let resolvedCanonical = canonical;
    if (!resolvedCanonical) {
      const pathname = window.location.pathname || '/';
      resolvedCanonical = `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
    } else if (resolvedCanonical.startsWith('/')) {
      resolvedCanonical = `${SITE_ORIGIN}${resolvedCanonical}`;
    }
    setOrCreateLinkTag('canonical', resolvedCanonical);

    // 3. Meta Description & Keywords
    const pageDesc = description || DEFAULT_DESC;
    setOrCreateMetaTag('name', 'description', pageDesc);

    const pageKeywords = Array.isArray(keywords)
      ? keywords.join(', ')
      : (keywords || DEFAULT_KEYWORDS);
    setOrCreateMetaTag('name', 'keywords', pageKeywords);

    // 4. Robots Meta (Strict noindex for private/sensitive pages)
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
    setOrCreateMetaTag('name', 'robots', robotsContent);

    // 5. Open Graph / Facebook / WhatsApp
    setOrCreateMetaTag('property', 'og:title', pageTitle);
    setOrCreateMetaTag('property', 'og:description', pageDesc);
    setOrCreateMetaTag('property', 'og:url', resolvedCanonical);
    setOrCreateMetaTag('property', 'og:type', ogType);
    setOrCreateMetaTag('property', 'og:image', ogImage);
    setOrCreateMetaTag('property', 'og:site_name', 'MentorNearby');

    // 6. Twitter Card
    setOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    setOrCreateMetaTag('name', 'twitter:title', pageTitle);
    setOrCreateMetaTag('name', 'twitter:description', pageDesc);
    setOrCreateMetaTag('name', 'twitter:image', ogImage);

    // 7. Dynamic Schema.org JSON-LD Script Injection
    const scriptId = 'mn-dynamic-schema';
    let scriptEl = document.getElementById(scriptId);

    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      try {
        scriptEl.textContent = JSON.stringify(structuredData);
      } catch (err) {
        console.warn('Failed to serialize structured data for SEO:', err);
      }
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up dynamic schema when leaving page
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, canonical, keywords, ogType, ogImage, noindex, structuredData]);

  return null;
};

export default SEO;
