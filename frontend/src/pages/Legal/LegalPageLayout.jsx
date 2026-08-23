// ============================================================
// pages/Legal/LegalPageLayout.jsx
// Standard Professional Legal & Policy Page Template with CMS Integration
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCmsPage } from '../../api/cms';

const LEGAL_NAV = [
  { slug: 'privacy-policy', label: 'Privacy Policy', path: '/privacy' },
  { slug: 'terms-and-conditions', label: 'Terms & Conditions', path: '/terms' },
  { slug: 'refund-policy', label: 'Refund Policy', path: '/refund' },
  { slug: 'cancellation-policy', label: 'Cancellation Policy', path: '/cancellation' },
  { slug: 'safety-trust', label: 'Safety & Trust', path: '/safety' },
];

const LegalPageLayout = ({ slug, defaultTitle, defaultContent }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadPage = async () => {
      try {
        setLoading(true);
        const res = await fetchCmsPage(slug);
        if (isMounted && res.data?.page) {
          setPage(res.data.page);
        }
      } catch (_) {
        // Fallback to default
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPage();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const title = page?.title || defaultTitle;
  const content = page?.content || defaultContent;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B', marginBottom: 24 }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>{title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36, alignItems: 'flex-start' }}>
          
          {/* Left Sidebar: Quick Policy Links */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, position: 'sticky', top: 90, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 16px' }}>
              Legal &amp; Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LEGAL_NAV.map((nav) => {
                const isActive = nav.slug === slug || nav.path === window.location.pathname;
                return (
                  <Link
                    key={nav.slug}
                    to={nav.path}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 13.5,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#E11D48' : '#475569',
                      background: isActive ? '#FFF1F2' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      borderLeft: isActive ? '3px solid #E11D48' : '3px solid transparent',
                    }}
                  >
                    {nav.label}
                  </Link>
                );
              })}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
              Have questions? Visit our{' '}
              <Link to="/contact" style={{ color: '#E11D48', fontWeight: 700, textDecoration: 'none' }}>
                Contact Support
              </Link>{' '}
              center.
            </div>
          </div>

          {/* Right Main Content Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: '36px 44px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 20, marginBottom: 28 }}>
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#E11D48', background: '#FFF1F2', padding: '4px 10px', borderRadius: 6 }}>
                Official Platform Policy
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '12px 0 6px' }}>
                {title}
              </h1>
              <span style={{ fontSize: 12.5, color: '#94A3B8' }}>
                Last Updated: February 2026 • MentorNearby Compliance Team
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                Loading policy document...
              </div>
            ) : (
              <div
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.8,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {content}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;
