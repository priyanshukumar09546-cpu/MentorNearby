// ============================================================
// pages/Discovery/TutorDiscoveryHubPage.jsx
// MentorNearby Discovery Hub for Home Tutors & Online Tutors
// Serves Nationwide Intent: /home-tutors and /online-tutors
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import SEO from '../../components/common/SEO';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import './TutorDiscoveryHubPage.css';

const HUB_CONFIGS = {
  home: {
    type: 'home',
    title: 'Find Trusted Home Tutors Near You | 1-on-1 Private Tuition in India',
    canonical: '/home-tutors',
    heading: 'Find Verified Home Tutors Near You',
    subtitle:
      'Connect with background-verified private home tutors for personalized 1-on-1 tuition at your doorstep. Available across Ghaziabad, Hapur, Delhi NCR, and major Indian cities.',
    searchMode: 'Offline',
    keywords: [
      'home tutors near me',
      'find home tutor',
      'home tuition nearby',
      'private tutor near me',
      'home tutors in ghaziabad',
      'home tutors in hapur',
      'cbse home tutor',
      'icse home tuition',
      'MentorNearby',
    ],
    features: [
      { icon: '🏠', title: 'At-Home Comfort', desc: '1-on-1 personalized attention right in your home.' },
      { icon: '🛡️', title: '100% KYC Verified', desc: 'Identity & credentials verified by MentorNearby.' },
      { icon: '🎯', title: 'Curriculum Aligned', desc: 'CBSE, ICSE, and State Board specialized educators.' },
      { icon: '💰', title: 'Transparent Fees', desc: 'Direct tutor rates with zero hidden platform commissions.' },
    ],
  },
  online: {
    type: 'online',
    title: 'Find Top Online Tutors in India | Live 1-on-1 Interactive Classes',
    canonical: '/online-tutors',
    heading: 'Find Verified Online Tutors in India',
    subtitle:
      'Learn from top educators across India with live interactive classes, flexible schedules, and customized revision material for Class 1–12 and competitive exams.',
    searchMode: 'Online',
    keywords: [
      'online tutor in india',
      'best online tutors',
      'online tuition classes',
      'online maths tutor',
      'online science tutor',
      'cbse online tuition',
      'interactive tutoring',
      'MentorNearby',
    ],
    features: [
      { icon: '💻', title: 'Learn From Anywhere', desc: 'Connect with expert educators regardless of location.' },
      { icon: '🕒', title: 'Flexible Timings', desc: 'Schedule classes around your school and study routine.' },
      { icon: '📚', title: 'Free Notes & PDFs', desc: 'Instant access to chapter-wise notes and formula sheets.' },
      { icon: '🤝', title: 'Direct Communication', desc: 'Chat directly with tutors and track progress easily.' },
    ],
  },
};

const TutorDiscoveryHubPage = ({ hubType = 'home' }) => {
  const config = HUB_CONFIGS[hubType] || HUB_CONFIGS.home;
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const res = await searchTutors({
          mode: config.searchMode,
          limit: 12,
        });
        if (isMounted) {
          const list = res.data?.data?.tutors || res.data?.tutors || [];
          setTutors(list);
        }
      } catch (err) {
        if (isMounted) setTutors([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTutors();
    return () => {
      isMounted = false;
    };
  }, [config.searchMode]);

  const filteredTutors = selectedSubject === 'ALL'
    ? tutors
    : tutors.filter((t) => (t.subjects || []).some((s) => s.toLowerCase().includes(selectedSubject.toLowerCase())));

  // Schema.org Structured Data
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.mentornearby.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: config.heading,
          item: `https://www.mentornearby.com${config.canonical}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: config.heading,
      description: config.subtitle,
      provider: {
        '@type': 'EducationalOrganization',
        name: 'MentorNearby',
        url: 'https://www.mentornearby.com/',
      },
    },
  ];

  return (
    <div className="discovery-hub-container">
      <SEO
        title={config.title}
        description={config.subtitle}
        canonical={config.canonical}
        keywords={config.keywords}
        structuredData={structuredData}
      />

      {/* Hero Header */}
      <header className="discovery-hub-hero py-10 sm:py-14 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="discovery-hub-max-w text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
            <span>{config.type === 'home' ? '🏡 Home Tuition Hub' : '🌐 Online Learning Hub'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {config.heading}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {config.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to={`/search?mode=${encodeURIComponent(config.searchMode)}`}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              🔍 Search All {config.searchMode} Tutors
            </Link>
            <Link
              to="/post-requirement"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              📝 Post a Tuition Request
            </Link>
          </div>
        </div>
      </header>

      {/* Feature Highlights Strip */}
      <section className="discovery-features-strip bg-white border-b border-slate-200 py-6">
        <div className="discovery-hub-max-w">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xl">{feat.icon}</span>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">{feat.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Listing Area */}
      <main className="discovery-hub-main py-10">
        <div className="discovery-hub-max-w space-y-8">
          
          {/* Section Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Featured {config.searchMode} Tutors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? 'Loading tutors...'
                  : `${filteredTutors.length} verified teacher${filteredTutors.length === 1 ? '' : 's'} available`}
              </p>
            </div>

            {/* Subject Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'Mathematics', 'Science', 'English', 'Physics', 'Chemistry'].map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedSubject === sub
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {sub === 'ALL' ? 'All Subjects' : sub}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                      <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredTutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutors.map((tutor) => {
                const profileId = tutor.slug || tutor._id;
                return (
                  <article
                    key={tutor._id}
                    className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-3">
                        <ProfileAvatar
                          src={tutor.profilePhoto?.url}
                          name={tutor.user?.name}
                          size="md"
                          showBadge={tutor.isVerified}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-slate-900 text-base truncate">
                            <Link to={`/tutor/${profileId}`} className="hover:text-amber-600">
                              {tutor.user?.name || 'Verified Tutor'}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {tutor.professionalHeadline || 'Experienced Home & Online Tutor'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              ✓ Verified Tutor
                            </span>
                            {tutor.location?.city && (
                              <span className="text-[11px] text-slate-500 truncate">
                                📍 {tutor.location.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {tutor.bio && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {tutor.bio}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {(tutor.subjects || []).slice(0, 4).map((subj, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {subj}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Grades:</span>
                          <span className="font-semibold text-slate-700">
                            {(tutor.grades || []).slice(0, 3).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Fee</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{tutor.fees?.amount || 'Discuss'}
                          <span className="text-[10px] font-normal text-slate-500">
                            /{tutor.fees?.frequency === 'PER_HOUR' ? 'hr' : 'mo'}
                          </span>
                        </span>
                      </div>
                      <Link
                        to={`/tutor/${profileId}`}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                      >
                        View Profile ↗
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
              <span className="text-4xl block">🔍</span>
              <h3 className="font-extrabold text-slate-900 text-lg">No Tutors Matched Currently</h3>
              <p className="text-xs text-slate-500">
                Try selecting "All Subjects" or post your requirement to get matched directly with educators.
              </p>
            </div>
          )}

          {/* Regional Hubs & Class Links */}
          <section className="pt-8 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Popular Home Tuition Hubs in India:
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link to="/tutors/in/ghaziabad" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Ghaziabad
              </Link>
              <Link to="/tutors/in/hapur" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Hapur
              </Link>
              <Link to="/tutors/in/delhi" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Delhi NCR
              </Link>
              <Link to="/tutors/in/noida" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Noida
              </Link>
              <Link to="/tutors/in/meerut" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Meerut
              </Link>
              <Link to="/tutors/in/coimbatore" className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                📍 Home Tutors in Coimbatore
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default TutorDiscoveryHubPage;
