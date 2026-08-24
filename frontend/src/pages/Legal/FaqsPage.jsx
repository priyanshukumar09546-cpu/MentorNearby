import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFaqs } from '../../api/cms';
import './FaqsPage.css';

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
    <div className="mn-faqs-root">
      <div className="mn-faqs-container">
        
        {/* Hero Header */}
        <div className="mn-faqs-hero">
          <div className="mn-faqs-badge">
            <span>❓</span>
            <span>HELP &amp; SUPPORT CENTER</span>
          </div>
          <h1 className="mn-faqs-title">
            Frequently Asked Questions
          </h1>
          <p className="mn-faqs-sub">
            Find quick answers regarding finding nearby tutors, free study resources, offline PDF downloads, and tutor verification.
          </p>

          {/* Search Input */}
          <div className="mn-faqs-search-wrap">
            <input
              type="text"
              placeholder="Search your question (e.g. refund, KYC, study notes)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mn-faqs-search-input"
            />
            <span className="mn-faqs-search-icon">
              🔍
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mn-faqs-categories-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`mn-faqs-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div className="mn-faqs-list">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === (faq._id || faq.id || faq.question);
            return (
              <div
                key={faq._id || faq.id || faq.question}
                className="mn-faqs-item-card"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq._id || faq.id || faq.question)}
                  className="mn-faqs-item-header"
                >
                  <span className="mn-faqs-question-text">
                    {faq.question}
                  </span>
                  <span className={`mn-faqs-toggle-btn ${isOpen ? 'open' : ''}`}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="mn-faqs-answer-box">
                    <div style={{ paddingTop: 14 }}>{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div className="mn-faqs-help-card">
          <h3 className="mn-faqs-help-title">
            Still have questions?
          </h3>
          <p className="mn-faqs-help-sub">
            Our team is always ready to assist students, parents, and tutors.
          </p>
          <Link
            to="/contact"
            className="mn-faqs-contact-btn"
          >
            <span>💬</span> Contact Support Team →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FaqsPage;

