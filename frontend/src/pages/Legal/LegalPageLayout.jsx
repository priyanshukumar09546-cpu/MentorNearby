import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCmsPage } from '../../api/cms';
import './LegalPageLayout.css';

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
    <div className="mn-legal-root">
      <div className="mn-legal-container">
        
        {/* Breadcrumbs */}
        <div className="mn-legal-breadcrumbs">
          <Link to="/" style={{ color: 'var(--color-text-muted, #8C827A)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-text-primary, #18181B)', fontWeight: 700 }}>{title}</span>
        </div>

        <div className="mn-legal-grid">
          
          {/* Left Sidebar: Quick Policy Links */}
          <div className="mn-legal-sidebar">
            <h4 className="mn-legal-sidebar-title">
              Legal &amp; Policies
            </h4>
            <div className="mn-legal-sidebar-links">
              {LEGAL_NAV.map((nav) => {
                const isActive = nav.slug === slug || nav.path === window.location.pathname;
                return (
                  <Link
                    key={nav.slug}
                    to={nav.path}
                    className={`mn-legal-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {nav.label}
                  </Link>
                );
              })}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border-subtle, #F0EAE0)', fontSize: 12, color: 'var(--color-text-muted, #8C827A)', lineHeight: 1.5 }}>
              Have questions? Visit our{' '}
              <Link to="/contact" style={{ color: 'var(--color-red, #E11D48)', fontWeight: 700, textDecoration: 'none' }}>
                Contact Support
              </Link>{' '}
              center.
            </div>
          </div>

          {/* Right Main Content Card */}
          <div className="mn-legal-content-card">
            <div className="mn-legal-header-box">
              <span className="mn-legal-policy-badge">
                Official Platform Policy
              </span>
              <h1 className="mn-legal-title">
                {title}
              </h1>
              <span className="mn-legal-date">
                Last Updated: February 2026 • MentorNearby Compliance Team
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted, #8C827A)' }}>
                Loading policy document...
              </div>
            ) : (
              <div className="mn-legal-body">
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

