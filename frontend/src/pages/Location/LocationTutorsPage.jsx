// ============================================================
// pages/Location/LocationTutorsPage.jsx
// MentorNearby Local SEO Landing Hub: Home Tutors in [City]
// 100% Real Database Tutors • Zero Fabricated Claims • Schema.org FAQ & Breadcrumbs
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import SEO from '../../components/common/SEO';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import './LocationTutorsPage.css';

// Curated Registry of Supported Indian Hub Cities
export const SUPPORTED_CITIES = {
  ghaziabad: {
    slug: 'ghaziabad',
    name: 'Ghaziabad',
    state: 'Uttar Pradesh (Delhi NCR)',
    searchQuery: 'Ghaziabad',
    tagline: 'Verified Home Tutors & Private Tuition in Ghaziabad',
    heroDescription:
      'Find background-verified home tutors in Ghaziabad for CBSE, ICSE, and UP Board. Connect with experienced educators for personalized 1-on-1 home tuition and online classes across Indirapuram, Vaishali, Vasundhara, Raj Nagar, and Crossings Republik.',
    popularLocalities: [
      'Indirapuram',
      'Vaishali',
      'Vasundhara',
      'Raj Nagar Extension',
      'Crossings Republik',
      'Kavi Nagar',
      'Sahibabad',
      'Lal Kuan',
    ],
    nearbyCities: [
      { name: 'Hapur', slug: 'hapur' },
      { name: 'Noida', slug: 'noida' },
      { name: 'Delhi', slug: 'delhi' },
      { name: 'Meerut', slug: 'meerut' },
    ],
    faqs: [
      {
        question: 'How do I find a verified home tutor in Ghaziabad on MentorNearby?',
        answer:
          'You can browse our list of KYC-verified tutors in Ghaziabad, filter by subject and class, view their qualifications and teaching experience, and request a session directly through MentorNearby.',
      },
      {
        question: 'What subjects are commonly taught by home tutors in Ghaziabad?',
        answer:
          'Tutors in Ghaziabad cover all primary and secondary subjects including Mathematics, Physics, Chemistry, Biology, English, Hindi, and Computer Science for Class 1 to 12.',
      },
      {
        question: 'Are home tutors in Ghaziabad background verified?',
        answer:
          'Yes, MentorNearby verifies tutor identity documents (including government ID and academic qualifications) before granting verified status.',
      },
      {
        question: 'What is the average cost of home tuition in Ghaziabad?',
        answer:
          'Home tuition fees in Ghaziabad generally range from ₹300 to ₹1,200 per hour or ₹3,000 to ₹8,000 per month depending on the class, subject, and tutor experience.',
      },
    ],
  },
  hapur: {
    slug: 'hapur',
    name: 'Hapur',
    state: 'Uttar Pradesh',
    searchQuery: 'Hapur',
    tagline: 'Verified Home Tutors & Tuition in Hapur',
    heroDescription:
      'Connect with trusted home tutors in Hapur for school academics, board exams, and competitive foundation. Top-rated educators available for Mathematics, Science, and English across Railway Road, Free Ganj, Delhi Road, and Pilkhuwa.',
    popularLocalities: [
      'Railway Road',
      'Free Ganj Road',
      'Delhi Road',
      'Modinagar Road',
      'Pilkhuwa',
      'Garh Road',
      'Swarg Ashram Road',
    ],
    nearbyCities: [
      { name: 'Ghaziabad', slug: 'ghaziabad' },
      { name: 'Meerut', slug: 'meerut' },
      { name: 'Noida', slug: 'noida' },
      { name: 'Delhi', slug: 'delhi' },
    ],
    faqs: [
      {
        question: 'Can I get a home tutor in Hapur for Class 9 and 10 boards?',
        answer:
          'Yes, MentorNearby has verified tutors in Hapur specializing in Class 9 and 10 board preparation for Mathematics, Science, and English.',
      },
      {
        question: 'Do tutors in Hapur offer both offline home tuition and online classes?',
        answer:
          'Many tutors in Hapur provide both in-person home tuition and interactive online classes based on student preferences.',
      },
      {
        question: 'How can teachers in Hapur register as home tutors on MentorNearby?',
        answer:
          'Educators in Hapur can register for free via the Become a Tutor page, complete their profile, submit verification documents, and start connecting with local students.',
      },
    ],
  },
  delhi: {
    slug: 'delhi',
    name: 'Delhi',
    state: 'Delhi NCR',
    searchQuery: 'Delhi',
    tagline: 'Trusted Home Tutors Across Delhi NCR',
    heroDescription:
      'Discover background-verified home tutors in Delhi for CBSE, ICSE, and international boards. Personalized tuition available across East, West, North, and South Delhi.',
    popularLocalities: ['South Delhi', 'Dwarka', 'Rohini', 'East Delhi', 'Laxmi Nagar', 'Janakpuri', 'Saket'],
    nearbyCities: [
      { name: 'Noida', slug: 'noida' },
      { name: 'Ghaziabad', slug: 'ghaziabad' },
      { name: 'Gurgaon', slug: 'gurgaon' },
      { name: 'Faridabad', slug: 'faridabad' },
    ],
    faqs: [
      {
        question: 'How does MentorNearby help parents in Delhi find home tutors?',
        answer:
          'Parents can search verified profiles by locality and subject, compare fees, and book background-verified educators directly without middleman commissions.',
      },
    ],
  },
  noida: {
    slug: 'noida',
    name: 'Noida',
    state: 'Uttar Pradesh (Delhi NCR)',
    searchQuery: 'Noida',
    tagline: 'Expert Home Tuition & Tutors in Noida',
    heroDescription:
      'Find qualified home tutors in Noida & Greater Noida for school excellence, Olympiads, and board exams. Quality tuition across Sector 62, Sector 18, Sector 50, and Noida Extension.',
    popularLocalities: ['Sector 62', 'Sector 50', 'Sector 18', 'Sector 137', 'Noida Extension', 'Greater Noida'],
    nearbyCities: [
      { name: 'Ghaziabad', slug: 'ghaziabad' },
      { name: 'Delhi', slug: 'delhi' },
      { name: 'Faridabad', slug: 'faridabad' },
      { name: 'Hapur', slug: 'hapur' },
    ],
    faqs: [
      {
        question: 'Are home tutors in Noida available for CBSE and ICSE boards?',
        answer:
          'Yes, our verified tutors in Noida have extensive experience teaching both CBSE and ICSE curriculums.',
      },
    ],
  },
  meerut: {
    slug: 'meerut',
    name: 'Meerut',
    state: 'Uttar Pradesh',
    searchQuery: 'Meerut',
    tagline: 'Verified Home Tutors in Meerut',
    heroDescription:
      'Connect with dedicated home tutors in Meerut for school students and board preparation. Expert guidance across Civil Lines, Shastri Nagar, Ganga Nagar, and Modipuram.',
    popularLocalities: ['Civil Lines', 'Shastri Nagar', 'Modipuram', 'Ganga Nagar', 'Kankerkhera'],
    nearbyCities: [
      { name: 'Hapur', slug: 'hapur' },
      { name: 'Ghaziabad', slug: 'ghaziabad' },
      { name: 'Noida', slug: 'noida' },
      { name: 'Delhi', slug: 'delhi' },
    ],
    faqs: [
      {
        question: 'How do I request a home tutor in Meerut?',
        answer:
          'You can post a tuition requirement on MentorNearby or browse verified tutor profiles in Meerut to get in touch.',
      },
    ],
  },
  coimbatore: {
    slug: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    searchQuery: 'Coimbatore',
    tagline: 'Verified Home & Online Tutors in Coimbatore',
    heroDescription:
      'Find dedicated tutors in Coimbatore for CBSE, State Board, Spoken English, and competitive exams across RS Puram, Gandhipuram, Peelamedu, and Saravanampatti.',
    popularLocalities: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Saravanampatti'],
    nearbyCities: [
      { name: 'Chennai', slug: 'chennai' },
      { name: 'Bengaluru', slug: 'bengaluru' },
    ],
    faqs: [
      {
        question: 'Are spoken English and academic tutors available in Coimbatore?',
        answer:
          'Yes, MentorNearby has verified tutors in Coimbatore providing academic coaching and language fluency training.',
      },
    ],
  },
};

const LocationTutorsPage = () => {
  const { citySlug } = useParams();
  const navigate = useNavigate();

  // Normalize slug
  const normalizedSlug = (citySlug || 'ghaziabad').toLowerCase().trim();
  const city = SUPPORTED_CITIES[normalizedSlug] || {
    slug: normalizedSlug,
    name: normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1),
    state: 'India',
    searchQuery: normalizedSlug,
    tagline: `Verified Home Tutors in ${normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)}`,
    heroDescription: `Find trusted home tutors and online educators serving students in ${normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1)}. 100% verified profiles for CBSE, ICSE, and state boards.`,
    popularLocalities: [],
    nearbyCities: [
      { name: 'Ghaziabad', slug: 'ghaziabad' },
      { name: 'Hapur', slug: 'hapur' },
      { name: 'Delhi', slug: 'delhi' },
      { name: 'Noida', slug: 'noida' },
    ],
    faqs: [],
  };

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchCityTutors = async () => {
      setLoading(true);
      try {
        const res = await searchTutors({
          city: city.searchQuery,
          limit: 12,
        });
        if (isMounted) {
          const fetchedTutors = res.data?.data?.tutors || res.data?.tutors || [];
          setTutors(fetchedTutors);
        }
      } catch (err) {
        if (isMounted) setTutors([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCityTutors();
    return () => {
      isMounted = false;
    };
  }, [city.searchQuery]);

  // Filter tutors by subject if selected
  const filteredTutors = selectedSubject === 'ALL'
    ? tutors
    : tutors.filter((t) => (t.subjects || []).some((s) => s.toLowerCase().includes(selectedSubject.toLowerCase())));

  // Schema.org Structured Data
  const structuredData = [
    // 1. BreadcrumbList
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
          name: 'Find Tutors',
          item: 'https://www.mentornearby.com/search',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `Home Tutors in ${city.name}`,
          item: `https://www.mentornearby.com/tutors/in/${city.slug}`,
        },
      ],
    },
    // 2. CollectionPage / Service
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Home Tutors in ${city.name} - MentorNearby`,
      description: city.heroDescription,
      url: `https://www.mentornearby.com/tutors/in/${city.slug}`,
      provider: {
        '@type': 'EducationalOrganization',
        name: 'MentorNearby',
        url: 'https://www.mentornearby.com/',
      },
    },
  ];

  // 3. FAQPage Schema if FAQs exist
  if (city.faqs && city.faqs.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: city.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <div className="location-page-container">
      {/* Dynamic SEO Meta & Schema */}
      <SEO
        title={`Home Tutors in ${city.name} | Verified Private Tuition Near You`}
        description={city.heroDescription}
        canonical={`/tutors/in/${city.slug}`}
        keywords={[
          `home tutors in ${city.name.toLowerCase()}`,
          `home tuition in ${city.name.toLowerCase()}`,
          `tutors near me in ${city.name.toLowerCase()}`,
          `private tutor ${city.name.toLowerCase()}`,
          `cbse tutor ${city.name.toLowerCase()}`,
          'home tuition nearby',
          'MentorNearby',
        ]}
        structuredData={structuredData}
      />

      {/* Breadcrumb Navigation */}
      <nav className="location-breadcrumbs" aria-label="Breadcrumbs">
        <div className="location-max-w flex items-center gap-2 text-xs text-slate-500 py-3">
          <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-amber-600 transition-colors">Find Tutors</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{city.name}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="location-hero">
        <div className="location-max-w text-center space-y-4 py-8 sm:py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
            <span>📍</span>
            <span>{city.state}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Home Tutors in <span className="text-amber-600">{city.name}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {city.heroDescription}
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={`/search?city=${encodeURIComponent(city.searchQuery)}`}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              🔍 Browse All {city.name} Tutors
            </Link>
            <Link
              to="/post-requirement"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              📝 Post Tuition Requirement
            </Link>
          </div>
        </div>
      </header>

      {/* Popular Localities Section */}
      {city.popularLocalities && city.popularLocalities.length > 0 && (
        <section className="location-localities-section bg-slate-50 border-y border-slate-200 py-4">
          <div className="location-max-w">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Popular Localities in {city.name}:</span>
              {city.popularLocalities.map((area, idx) => (
                <Link
                  key={idx}
                  to={`/search?city=${encodeURIComponent(city.searchQuery)}&q=${encodeURIComponent(area)}`}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 rounded-lg transition-colors font-medium"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="location-main py-10">
        <div className="location-max-w space-y-8">
          
          {/* Section Header with Subject Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Verified Tutors Available in {city.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? 'Checking tutor availability...'
                  : `${filteredTutors.length} verified teacher${filteredTutors.length === 1 ? '' : 's'} available in ${city.name}`}
              </p>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'Mathematics', 'Science', 'English', 'Physics'].map((sub) => (
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

          {/* Tutor Cards Grid */}
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
                      {/* Top: Avatar & Name */}
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

                      {/* Bio snippet */}
                      {tutor.bio && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {tutor.bio}
                        </p>
                      )}

                      {/* Subjects & Modes Tags */}
                      <div className="space-y-2 mb-4">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {(tutor.subjects || []).slice(0, 4).map((subj, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {subj}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Modes:</span>
                          <span className="font-semibold text-slate-700">
                            {(tutor.teachingModes || ['Online']).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Fee & View Button */}
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
            /* Honest, helpful fallback when no exact tutor records match */
            <div className="bg-amber-50/60 border border-amber-200 p-8 rounded-2xl text-center space-y-4 max-w-xl mx-auto">
              <span className="text-4xl block">📍</span>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Looking for a Home Tutor in {city.name}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We are actively onboarding more local home tutors across {city.name}. In the meantime, you can post a requirement to get connected with verified educators or explore our verified online tutors.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  to="/post-requirement"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  📝 Post Your Requirement
                </Link>
                <Link
                  to="/become-a-tutor"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  🎓 Become a Tutor in {city.name}
                </Link>
              </div>
            </div>
          )}

          {/* Nearby Hub Cities Navigation */}
          {city.nearbyCities && city.nearbyCities.length > 0 && (
            <section className="pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Explore Home Tutors in Nearby Cities:
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {city.nearbyCities.map((near, idx) => (
                  <Link
                    key={idx}
                    to={`/tutors/in/${near.slug}`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors font-medium flex items-center gap-1"
                  >
                    <span>📍</span>
                    <span>Home Tutors in {near.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Local FAQs Section (with FAQ Schema Markup) */}
          {city.faqs && city.faqs.length > 0 && (
            <section className="pt-8 border-t border-slate-200 space-y-4">
              <h2 className="text-xl font-black text-slate-900">
                Frequently Asked Questions about Home Tuition in {city.name}
              </h2>
              <div className="space-y-3">
                {city.faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group bg-white border border-slate-200 rounded-xl p-4 transition-all [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-center justify-between font-bold text-slate-900 text-sm cursor-pointer">
                      <span>{faq.question}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

export default LocationTutorsPage;
