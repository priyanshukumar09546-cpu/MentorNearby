import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFaqs } from '../../api/cms';

const CATEGORIES = [
  { id: 'ALL', label: 'All Questions' },
  { id: 'STUDENTS', label: '👨‍🎓 Students & Parents' },
  { id: 'TUTORS', label: '👨‍🏫 Tutors & KYC' },
  { id: 'STUDY_RESOURCES', label: '📚 Study Resources' },
  { id: 'PAYMENTS', label: '💳 Payments & Downloads' },
  { id: 'COURSES', label: '🎓 Courses & PYQs' },
];

const DEFAULT_FAQS_LIST = [
  {
    _id: '1',
    category: 'STUDENTS',
    question: 'How do I find a verified tutor near my home?',
    answer: 'Enter your class, subject, and locality on the Find Tutors page. You can filter by home tuition, online mode, rating, and verified KYC status to connect with qualified mentors.',
  },
  {
    _id: '2',
    category: 'STUDY_RESOURCES',
    question: 'Is online reading for study resources really 100% free?',
    answer: 'Yes! All formula sheets, chapter study notes, NCERT books, and 10-year board PYQ video solutions are 100% free to read and watch online on MentorNearby without any subscription lock.',
  },
  {
    _id: '3',
    category: 'PAYMENTS',
    question: 'How much does it cost to download offline printable PDFs?',
    answer: 'Class 9 & 10 Formula Sheets are ₹7, Notes/PPTs are ₹12. Class 11 & 12 Formula Sheets are ₹8, Notes/PPTs are ₹14. Complete all-chapter combos start from ₹50 (Formula) and ₹100 (Notes).',
  },
  {
    _id: '4',
    category: 'TUTORS',
    question: 'How can a tutor get verified on MentorNearby?',
    answer: 'Tutors can log in to their dashboard, navigate to the KYC Verification section, and submit their government ID (Aadhaar/PAN) along with academic degree certificates for verification by our moderation team.',
  },
  {
    _id: '5',
    category: 'COURSES',
    question: 'Are PYQ Video Mastery courses free to watch?',
    answer: 'Yes! All 10-year video solutions across Mathematics, Science, and other board subjects are 100% free to watch in our video classroom. Only downloading offline solution PPTs is optional at ₹19 per PPT.',
  },
  {
    _id: '6',
    category: 'GENERAL',
    question: 'How do I contact MentorNearby customer support?',
    answer: 'You can reach us anytime at support@mentornearby.in, message our official WhatsApp Channel, or submit a message on our Contact Us page.',
  },
];

const FaqsPage = () => {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS_LIST);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [openFaqId, setOpenFaqId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const res = await fetchFaqs(activeCategory);
        if (isMounted && res.data?.faqs?.length) {
          setFaqs(res.data.faqs);
        }
      } catch (_) {
        // Fallback to default
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFaqs();
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = faqs.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
  });

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', padding: '48px 0 80px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF1F2', color: '#E11D48', padding: '6px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 800, marginBottom: 14 }}>
            <span>❓</span>
            <span>HELP &amp; SUPPORT CENTER</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', margin: '0 0 12px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 15.5, color: '#64748B', maxWidth: 580, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Find quick answers regarding finding nearby tutors, free study resources, offline PDF downloads, and tutor verification.
          </p>

          {/* Search Input */}
          <div style={{ maxWidth: 540, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search your question (e.g. refund, KYC, study notes)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                paddingLeft: 46,
                borderRadius: 14,
                border: '1.5px solid #CBD5E1',
                fontSize: 14,
                outline: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            />
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94A3B8' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: activeCategory === cat.id ? '#0F172A' : '#FFFFFF',
                color: activeCategory === cat.id ? '#FFFFFF' : '#475569',
                border: '1px solid',
                borderColor: activeCategory === cat.id ? '#0F172A' : '#E2E8F0',
                padding: '8px 16px',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === (faq._id || faq.id || faq.question);
            return (
              <div
                key={faq._id || faq.id || faq.question}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq._id || faq.id || faq.question)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    background: isOpen ? '#F8FAFC' : '#FFFFFF',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    {faq.question}
                  </span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isOpen ? '#E11D48' : '#F1F5F9',
                      color: isOpen ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 900,
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 24px 22px',
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: '#475569',
                      borderTop: '1px solid #F1F5F9',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ paddingTop: 14 }}>{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div style={{ marginTop: 48, background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', padding: 28, textAlign: 'center', boxShadow: '0 4px 18px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 16px' }}>
            Our team is always ready to assist students, parents, and tutors.
          </p>
          <Link
            to="/contact"
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>💬</span> Contact Support Team →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FaqsPage;
