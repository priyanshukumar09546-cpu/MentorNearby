// ============================================================
// pages/StudyResources/NotesAndPdfsPage.jsx
// MentorNearby Official Notes & PDFs Portal
// Complete Dual System: Full Notes + Full Formula Sheets (Classes 9–12)
// Exact Alignment with Reference Screenshot media_1787434630244.png
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchStudyResources } from '../../api/studyResources';
import { OFFICIAL_NOTES_AND_FORMULAS_CATALOG } from '../../data/officialAcademicCatalog';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import StudyPaymentModal from '../../components/studyResources/StudyPaymentModal';
import ComboPreviewModal from '../../components/studyResources/ComboPreviewModal';
import PrintModal from '../../components/studyResources/PrintModal';
import './NotesAndPdfs.css';

// Dynamic Single-Class + Single-Subject Combo Definitions
const COMBO_DEFINITIONS = [
  // Class 9 Combos
  {
    id: 'combo-c9-math-formula',
    name: 'Class 9 Maths Formula Sheets Combo',
    title: 'Class 9 Maths Formula Sheets Combo',
    classLevel: '9',
    subject: 'Mathematics',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 50,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c9-sci-formula',
    name: 'Class 9 Science Formula Sheets Combo',
    title: 'Class 9 Science Formula Sheets Combo',
    classLevel: '9',
    subject: 'Science',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 50,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c9-math-notes',
    name: 'Class 9 Maths Notes Combo',
    title: 'Class 9 Maths Notes Combo',
    classLevel: '9',
    subject: 'Mathematics',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 100,
    badgeColor: 'green',
  },
  {
    id: 'combo-c9-sci-notes',
    name: 'Class 9 Science Notes Combo',
    title: 'Class 9 Science Notes Combo',
    classLevel: '9',
    subject: 'Science',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 100,
    badgeColor: 'green',
  },

  // Class 10 Combos
  {
    id: 'combo-c10-math-formula',
    name: 'Class 10 Maths Formula Sheets Combo',
    title: 'Class 10 Maths Formula Sheets Combo',
    classLevel: '10',
    subject: 'Mathematics',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 50,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c10-sci-formula',
    name: 'Class 10 Science Formula Sheets Combo',
    title: 'Class 10 Science Formula Sheets Combo',
    classLevel: '10',
    subject: 'Science',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 50,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c10-math-notes',
    name: 'Class 10 Maths Notes Combo',
    title: 'Class 10 Maths Notes Combo',
    classLevel: '10',
    subject: 'Mathematics',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 100,
    badgeColor: 'green',
  },
  {
    id: 'combo-c10-sci-notes',
    name: 'Class 10 Science Notes Combo',
    title: 'Class 10 Science Notes Combo',
    classLevel: '10',
    subject: 'Science',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 100,
    badgeColor: 'green',
  },

  // Class 11 Combos
  {
    id: 'combo-c11-math-formula',
    name: 'Class 11 Maths Formula Sheets Combo',
    title: 'Class 11 Maths Formula Sheets Combo',
    classLevel: '11',
    subject: 'Mathematics',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 60,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c11-sci-formula',
    name: 'Class 11 Science Formula Sheets Combo',
    title: 'Class 11 Science Formula Sheets Combo',
    classLevel: '11',
    subject: 'Physics',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 60,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c11-math-notes',
    name: 'Class 11 Maths Notes Combo',
    title: 'Class 11 Maths Notes Combo',
    classLevel: '11',
    subject: 'Mathematics',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 120,
    badgeColor: 'green',
  },
  {
    id: 'combo-c11-sci-notes',
    name: 'Class 11 Science Notes Combo',
    title: 'Class 11 Science Notes Combo',
    classLevel: '11',
    subject: 'Physics',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 120,
    badgeColor: 'green',
  },

  // Class 12 Combos
  {
    id: 'combo-c12-math-formula',
    name: 'Class 12 Maths Formula Sheets Combo',
    title: 'Class 12 Maths Formula Sheets Combo',
    classLevel: '12',
    subject: 'Mathematics',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 60,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c12-sci-formula',
    name: 'Class 12 Science Formula Sheets Combo',
    title: 'Class 12 Science Formula Sheets Combo',
    classLevel: '12',
    subject: 'Chemistry',
    type: 'FORMULA',
    resourceType: 'FORMULA_SHEET',
    icon: '📐',
    price: 60,
    badgeColor: 'purple',
  },
  {
    id: 'combo-c12-math-notes',
    name: 'Class 12 Maths Notes Combo',
    title: 'Class 12 Maths Notes Combo',
    classLevel: '12',
    subject: 'Mathematics',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 120,
    badgeColor: 'green',
  },
  {
    id: 'combo-c12-sci-notes',
    name: 'Class 12 Science Notes Combo',
    title: 'Class 12 Science Notes Combo',
    classLevel: '12',
    subject: 'Chemistry',
    type: 'NOTES',
    resourceType: 'NOTES',
    icon: '📚',
    price: 120,
    badgeColor: 'green',
  },
];

// Trending Items on Right Sidebar
const TRENDING_ITEMS = [
  {
    id: 'c10-sci-ch1-notes',
    title: 'Class 10 Science – Chapter 1 Notes',
    views: '1.8K views',
    color: 'blue',
  },
  {
    id: 'c11-phy-ch2-formula',
    title: 'Class 11 Physics – Chapter 2 Formula Sheet',
    views: '1.4K views',
    color: 'purple',
  },
  {
    id: 'c9-math-ch1-notes',
    title: 'Class 9 Maths – Chapter 1 Notes',
    views: '1.2K views',
    color: 'green',
  },
  {
    id: 'c12-chem-ch3-formula',
    title: 'Class 12 Chemistry – Chapter 3 Formula Sheet',
    views: '1.1K views',
    color: 'orange',
  },
  {
    id: 'c10-sci-ch2-notes',
    title: 'Class 10 Science – Chapter 2 Notes',
    views: '986 views',
    color: 'red',
  },
];

const NotesAndPdfsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State (Default: Both Notes & Formula Sheets enabled)
  const [selectedTypes, setSelectedTypes] = useState(['NOTES', 'FORMULA_SHEET']);
  const [selectedClass, setSelectedClass] = useState('9'); // 'All' | '9' | '10' | '11' | '12'
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedChapter, setSelectedChapter] = useState('All Chapters');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCombosSection, setShowCombosSection] = useState(false);

  // Backend Data
  const [dbResources, setDbResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals State
  const [viewerData, setViewerData] = useState({ isOpen: false, resource: null, resourceId: null });
  const [paymentData, setPaymentData] = useState({ isOpen: false, resource: null, bundle: null, purchaseType: 'INDIVIDUAL' });
  const [comboPreviewData, setComboPreviewData] = useState({ isOpen: false, combo: null });
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Fetch Database Resources & Map types
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const res = await searchStudyResources({ limit: 300 });
        const list = res.data?.resources || res.resources || [];
        setDbResources(list);
      } catch (err) {
        console.warn('Using offline curated academic catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Merge static catalog with database entries
  const allResources = useMemo(() => {
    const combined = [...OFFICIAL_NOTES_AND_FORMULAS_CATALOG];
    dbResources.forEach((dbItem) => {
      const isFormula = dbItem.resourceType === 'FORMULA_SHEET' || dbItem.resourceType === 'NOTES_FORMULAS';
      const effectiveType = isFormula ? 'FORMULA_SHEET' : 'NOTES';
      const isSenior = ['11', '12'].includes(String(dbItem.classLevel));
      const price = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);

      const existingIndex = combined.findIndex(
        (c) => c.id === dbItem._id || (c.chapterNumber === dbItem.chapterNumber && c.classLevel === String(dbItem.classLevel) && c.subject?.toLowerCase() === dbItem.subject?.toLowerCase() && c.resourceType === effectiveType)
      );

      if (existingIndex !== -1) {
        // Upgrade with DB real record
        combined[existingIndex] = {
          ...combined[existingIndex],
          id: dbItem._id,
          _id: dbItem._id,
          title: dbItem.title || combined[existingIndex].title,
          fileUrl: dbItem.fileUrl || `/api/study-resources/stream/${dbItem._id}`,
          fileReference: dbItem.fileReference,
        };
      } else {
        combined.push({
          id: dbItem._id,
          _id: dbItem._id,
          chapterNumber: dbItem.chapterNumber || 1,
          chapter: dbItem.chapter || `Chapter ${dbItem.chapterNumber || 1}`,
          chapterTitle: dbItem.chapterTitle || dbItem.title,
          title: dbItem.title,
          classLevel: String(dbItem.classLevel || '9'),
          subject: dbItem.subject || 'Science',
          resourceType: effectiveType,
          fileSize: '340 KB',
          downloadPrice: price,
          viewsCount: '1.2K',
          fileUrl: dbItem.fileUrl || `/api/study-resources/stream/${dbItem._id}`,
        });
      }
    });
    return combined;
  }, [dbResources]);

  // Dynamically extract subjects for the selected class
  const classSubjects = useMemo(() => {
    const subs = new Set();
    allResources
      .filter((r) => selectedClass === 'All' || String(r.classLevel) === String(selectedClass))
      .forEach((r) => {
        if (r.subject) subs.add(r.subject);
      });
    return ['All Subjects', ...Array.from(subs)];
  }, [allResources, selectedClass]);

  // Dynamic Chapter Options for the selected Class & Subject
  const chapterOptions = useMemo(() => {
    const chs = new Set();
    allResources
      .filter((r) => selectedClass === 'All' || String(r.classLevel) === String(selectedClass))
      .filter((r) => selectedSubject === 'All Subjects' || r.subject?.toLowerCase() === selectedSubject.toLowerCase())
      .forEach((r) => {
        if (r.chapterTitle) chs.add(r.chapterTitle);
      });
    return ['All Chapters', ...Array.from(chs)];
  }, [allResources, selectedClass, selectedSubject]);

  // Active Combos for the selected Class & Filters
  const activeCombos = useMemo(() => {
    return COMBO_DEFINITIONS.filter((combo) => {
      if (selectedClass !== 'All' && String(combo.classLevel) !== String(selectedClass)) return false;
      if (selectedSubject !== 'All Subjects' && combo.subject?.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedTypes.length === 1) {
        if (selectedTypes.includes('NOTES') && combo.type !== 'NOTES') return false;
        if (selectedTypes.includes('FORMULA_SHEET') && combo.type !== 'FORMULA') return false;
      }
      return true;
    });
  }, [selectedClass, selectedSubject, selectedTypes]);

  // Filtered Notes & Formula Sheet Resources for Main Grid
  const filteredResources = useMemo(() => {
    let list = [...allResources];

    // 1. Class Filter
    if (selectedClass && selectedClass !== 'All') {
      list = list.filter((r) => String(r.classLevel) === String(selectedClass));
    }

    // 2. Resource Type Filter (Notes / Formula Sheets / Both)
    if (selectedTypes.length === 1) {
      list = list.filter((r) => selectedTypes.includes(r.resourceType));
    }

    // 3. Subject Filter
    if (selectedSubject && selectedSubject !== 'All Subjects') {
      list = list.filter((r) => r.subject?.toLowerCase() === selectedSubject.toLowerCase());
    }

    // 4. Chapter Filter
    if (selectedChapter && selectedChapter !== 'All Chapters') {
      list = list.filter((r) => r.chapterTitle === selectedChapter || r.chapter === selectedChapter);
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.chapterTitle?.toLowerCase().includes(q) ||
          r.subject?.toLowerCase().includes(q) ||
          `class ${r.classLevel}`.includes(q)
      );
    }

    return list;
  }, [allResources, selectedClass, selectedTypes, selectedSubject, selectedChapter, searchQuery]);

  // Pagination
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(start, start + itemsPerPage);
  }, [filteredResources, currentPage]);

  // Toggle Resource Type
  const handleToggleType = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type);
        return next.length === 0 ? ['NOTES', 'FORMULA_SHEET'] : next;
      } else {
        return [...prev, type];
      }
    });
    setCurrentPage(1);
  };

  // Clear Filters
  const handleClearAll = () => {
    setSelectedTypes(['NOTES', 'FORMULA_SHEET']);
    setSelectedClass('9');
    setSelectedSubject('All Subjects');
    setSelectedChapter('All Chapters');
    setSelectedLanguage('All Languages');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Open In-App PDF Viewer (100% Free Online Reading for both Notes and Formula Sheets)
  const handleViewPdf = (res) => {
    if (!res) return;
    const targetId = res._id || res.id || 'c9-sci-ch1-notes';
    const isSenior = ['11', '12'].includes(String(res.classLevel || '9'));
    const isFormula =
      res.resourceType === 'FORMULA_SHEET' ||
      res.type === 'FORMULA' ||
      (res.id && String(res.id).includes('formula')) ||
      (res.title && String(res.title).toLowerCase().includes('formula'));
    const price = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);

    const getFullDocUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
        const backendBase =
          import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()
            ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
            : 'https://mentornearby-2.onrender.com';
        return `${backendBase}${url}`;
      }
      return url;
    };

    const rawUrl = res.fileUrl || res.fileReference?.url || `/api/study-resources/stream/${targetId}`;
    const targetUrl = getFullDocUrl(rawUrl);

    // Open full-screen in-app PDF viewer overlay
    setViewerData({
      isOpen: true,
      resource: {
        _id: targetId,
        id: targetId,
        title: res.title || (res.chapterTitle ? `${res.chapter || 'Chapter'} – ${res.chapterTitle}` : 'Study Resource PDF'),
        chapter: res.chapter,
        chapterTitle: res.chapterTitle || res.title,
        classLevel: String(res.classLevel || '9'),
        subject: res.subject || 'Science',
        resourceType: isFormula ? 'FORMULA_SHEET' : 'NOTES',
        fileUrl: targetUrl,
        fileReference: {
          url: targetUrl,
          filename: `${(res.title || (isFormula ? 'FormulaSheet' : 'Notes')).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          fileSize: 1048576,
        },
        downloadPrice: price,
        isDownloadUnlocked: false,
        isFree: true,
      },
      resourceId: targetId,
    });
  };

  // Open Payment Download Modal for Individual Card
  const handleOpenDownloadModal = (res) => {
    const isSenior = ['11', '12'].includes(String(res.classLevel));
    const isFormula = res.resourceType === 'FORMULA_SHEET';
    const price = isFormula ? (isSenior ? 8 : 7) : (isSenior ? 14 : 12);
    setPaymentData({
      isOpen: true,
      purchaseType: 'INDIVIDUAL',
      resource: {
        _id: res.id,
        id: res.id,
        title: `${res.chapter} – ${res.chapterTitle}`,
        chapter: res.chapter,
        chapterTitle: res.chapterTitle,
        classLevel: res.classLevel,
        subject: res.subject,
        resourceType: res.resourceType,
        downloadPrice: price,
        salePrice: price,
        originalPrice: isFormula ? 49 : 79,
      },
      bundle: null,
      classLevel: res.classLevel,
      subject: res.subject,
    });
  };

  // Open Direct Combo Purchase from Combo Modal or Buy Button
  const handleBuyCombo = (combo) => {
    setPaymentData({
      isOpen: true,
      purchaseType: 'COMBO',
      bundle: combo,
      resource: null,
      classLevel: combo.classLevel,
      subject: combo.subject,
    });
  };

  return (
    <div className="mn-np-page">
      <div className="mn-np-container">

        {/* ------------------------------------------------------------ */}
        {/* BREADCRUMB                                                   */}
        {/* ------------------------------------------------------------ */}
        <div className="mn-np-breadcrumbs">
          <Link to="/">Home</Link>
          <span>›</span>
          <span className="current">Study Resources</span>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* 1. HERO SECTION                                              */}
        {/* ------------------------------------------------------------ */}
        <section className="mn-np-hero">
          <div className="mn-np-hero-content">
            <div className="mn-np-hero-left">
              <h1 className="mn-np-hero-title">
                Study Smarter. <span className="mn-np-orange-text">Learn Better.</span>
              </h1>
              <h2 className="mn-np-hero-h2">Notes &amp; Formula Sheets (Class 9 – 12)</h2>
              <p className="mn-np-hero-sub">All your important revision material in one place.</p>
            </div>

            {/* 3D Stacked Books Graphic */}
            <div className="mn-np-hero-graphic">
              <div className="mn-np-graphic-wrap">
                <span style={{ fontSize: 52 }}>📚</span>
                <span style={{ fontSize: 46 }}>✏️</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mn-np-search-box">
            <input
              type="text"
              className="mn-np-search-input"
              placeholder="Search by class, subject, chapter or resource name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 2. MAIN 3-PART GRID LAYOUT                                   */}
        {/* ------------------------------------------------------------ */}
        <div className="mn-np-main-grid">

          {/* ---------------------------------------------------------- */}
          {/* LEFT FILTERS SIDEBAR                                       */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-np-filters-sidebar">
            <div className="mn-np-filter-header">
              <h3 className="mn-np-filter-title">Filters</h3>
              <button type="button" className="mn-np-clear-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>

            {/* Resource Type Buttons: Notes / Formula Sheets */}
            <div className="mn-np-fg">
              <label className="mn-np-flabel">Resource Type</label>
              <div className="mn-np-type-toggle-row">
                <button
                  type="button"
                  className={`mn-np-type-pill ${selectedTypes.includes('NOTES') ? 'active' : ''}`}
                  onClick={() => handleToggleType('NOTES')}
                >
                  <span>📗</span> Notes
                </button>
                <button
                  type="button"
                  className={`mn-np-type-pill ${selectedTypes.includes('FORMULA_SHEET') ? 'active' : ''}`}
                  onClick={() => handleToggleType('FORMULA_SHEET')}
                >
                  <span>📓</span> Formula Sheets
                </button>
              </div>
            </div>

            {/* Class Dropdown */}
            <div className="mn-np-fg">
              <label className="mn-np-flabel">Class</label>
              <select
                className="mn-np-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSubject('All Subjects');
                  setSelectedChapter('All Chapters');
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Classes</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>

            {/* Subject Dropdown */}
            <div className="mn-np-fg">
              <label className="mn-np-flabel">Subject</label>
              <select
                className="mn-np-select"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedChapter('All Chapters');
                  setCurrentPage(1);
                }}
              >
                {classSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Chapter Dropdown */}
            <div className="mn-np-fg">
              <label className="mn-np-flabel">Chapter</label>
              <select
                className="mn-np-select"
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {chapterOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Language Dropdown */}
            <div className="mn-np-fg">
              <label className="mn-np-flabel">Language</label>
              <select
                className="mn-np-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="All Languages">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <button
              type="button"
              className="mn-np-apply-btn"
              onClick={() => setCurrentPage(1)}
            >
              Apply Filters 🔽
            </button>
          </aside>

          {/* ---------------------------------------------------------- */}
          {/* CENTER CONTENT: RESOURCE CARDS GRID                        */}
          {/* ---------------------------------------------------------- */}
          <main className="mn-np-center-content">

            {/* Top Row: Title & Controls */}
            <div className="mn-np-center-header">
              <div>
                <h2 className="mn-np-center-h2">All Notes &amp; Formula Sheets</h2>
                <p className="mn-np-center-sub">Showing results from Class 9 to 12</p>
              </div>

              <div className="mn-np-controls-right">
                <button
                  type="button"
                  className="mn-np-view-class-btn"
                  onClick={() => setShowCombosSection((prev) => !prev)}
                >
                  <span>🪟</span> {showCombosSection ? 'Hide Combos' : 'View Combos'}
                </button>
                <select
                  className="mn-np-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">Latest First ▾</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">A–Z</option>
                </select>
              </div>
            </div>

            {/* Class Pill Tabs (Class 9, 10, 11, 12) */}
            <div className="mn-np-class-tabs">
              {['9', '10', '11', '12'].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className={`mn-np-class-tab ${selectedClass === cls ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSelectedSubject('All Subjects');
                    setSelectedChapter('All Chapters');
                    setCurrentPage(1);
                  }}
                >
                  Class {cls}
                </button>
              ))}
            </div>

            {/* Dynamic Single-Class Single-Subject Combo Section */}
            {showCombosSection && activeCombos.length > 0 && (
              <section className="mn-np-combos-section" style={{ marginBottom: 20 }}>
                <div className="mn-np-combos-header">
                  <div>
                    <h3 className="mn-np-combos-title">⚡ Available Combo Packs for Class {selectedClass}</h3>
                    <p className="mn-np-combos-sub">One Class + One Subject + One Resource Type Package</p>
                  </div>
                  <span className="mn-np-combos-badge">Best Value</span>
                </div>

                <div className="mn-np-combos-grid">
                  {activeCombos.map((combo) => (
                    <div
                      key={combo.id}
                      className={`mn-np-combo-card ${combo.badgeColor}`}
                      onClick={() => setComboPreviewData({ isOpen: true, combo })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="mn-np-combo-top">
                        <div className="mn-np-combo-icon-wrap">
                          <span className="mn-np-combo-icon">{combo.icon}</span>
                        </div>
                        <span className={`mn-np-combo-pill ${combo.type === 'FORMULA' ? 'formula' : 'notes'}`}>
                          {combo.type === 'FORMULA' ? 'Formula Combo' : 'Notes Combo'}
                        </span>
                      </div>

                      <h4 className="mn-np-combo-name">{combo.name}</h4>
                      <div className="mn-np-combo-classes">
                        Class {combo.classLevel} • {combo.subject}
                      </div>

                      <div className="mn-np-combo-price-row">
                        <span className="mn-np-combo-price">₹{combo.price}</span>
                        <button
                          type="button"
                          className="mn-np-btn-buy-combo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyCombo(combo);
                          }}
                        >
                          Buy Combo – ₹{combo.price}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Group Label */}
            <div className="mn-np-group-label">
              Class {selectedClass || '9'} – {selectedSubject !== 'All Subjects' ? selectedSubject : 'Science & Maths'} – {selectedTypes.length === 1 ? (selectedTypes[0] === 'NOTES' ? 'Notes' : 'Formula Sheets') : 'Notes & Formula Sheets'}
            </div>

            {/* Empty State */}
            {filteredResources.length === 0 && (
              <div className="mn-np-empty-state">
                <span style={{ fontSize: 44 }}>📄</span>
                <h3>No resources available yet</h3>
                <p>Try selecting another class or subject filter.</p>
                <button type="button" className="mn-np-clear-btn" onClick={handleClearAll}>
                  Reset Filters
                </button>
              </div>
            )}

            {/* MAIN INDIVIDUAL RESOURCE CARDS GRID (NOTES + FORMULA SHEETS) */}
            {filteredResources.length > 0 && (
              <>
                <div className="mn-np-cards-grid">
                  {paginatedResources.map((item) => {
                    const isFormula = item.resourceType === 'FORMULA_SHEET';
                    return (
                      <div key={item.id || item._id} className="mn-np-card">
                        <div className="mn-np-card-top">
                          <span className="mn-np-card-doc-icon">📄</span>
                          <span className={`mn-np-card-badge ${isFormula ? 'formula' : 'notes'}`}>
                            {isFormula ? 'Formula Sheet' : 'Notes'}
                          </span>
                        </div>

                        <h4 className="mn-np-card-title">{item.title}</h4>

                        <div className="mn-np-card-sub">
                          {item.subject} • Class {item.classLevel}
                        </div>

                        <div className="mn-np-card-meta">
                          <span>📄</span> PDF • {item.fileSize || '340 KB'}
                        </div>

                        <div className="mn-np-card-actions">
                          <button
                            type="button"
                            className="mn-np-btn-view"
                            onClick={() => handleViewPdf(item)}
                          >
                            View PDF
                          </button>

                          <button
                            type="button"
                            className="mn-np-btn-download"
                            onClick={() => handleOpenDownloadModal(item)}
                          >
                            Download 🔒
                          </button>

                          <button
                            type="button"
                            className="mn-np-preview-link"
                            onClick={() => handleViewPdf(item)}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mn-np-pagination">
                    <button
                      type="button"
                      className="mn-np-page-pill"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      ‹
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
                      <button
                        key={idx + 1}
                        type="button"
                        className={`mn-np-page-pill ${currentPage === idx + 1 ? 'active' : ''}`}
                        onClick={() => setCurrentPage(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    {totalPages > 5 && <span>...</span>}
                    {totalPages > 5 && (
                      <button
                        type="button"
                        className={`mn-np-page-pill ${currentPage === totalPages ? 'active' : ''}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      type="button"
                      className="mn-np-page-pill"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}

          </main>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT SIDEBAR (TRENDING + GET IT DELIVERED)                */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-np-right-sidebar">

            {/* Trending This Week Card */}
            <div className="mn-np-trending-card">
              <div className="mn-np-trending-header">
                <h3 className="mn-np-trending-title">Trending This Week</h3>
                <span className="mn-np-view-all-link">View All</span>
              </div>

              <div className="mn-np-trending-list">
                {TRENDING_ITEMS.map((trend) => (
                  <div key={trend.id} className="mn-np-trend-row">
                    <div className={`mn-np-trend-icon-box ${trend.color}`}>
                      📄
                    </div>
                    <div className="mn-np-trend-info">
                      <h4 className="mn-np-trend-name">{trend.title}</h4>
                      <span className="mn-np-trend-views">👁️ {trend.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Get It Delivered to You Card */}
            <div className="mn-np-delivery-card">
              <div className="mn-np-delivery-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎓</span>
                  <h3 className="mn-np-delivery-title">Get It Delivered to You</h3>
                </div>
                <span className="mn-np-new-badge">New</span>
              </div>

              <p className="mn-np-delivery-desc">
                No time to study now? Get this PDF printout delivered in minutes.
              </p>

              <div className="mn-np-delivery-partners">
                <div
                  className="mn-np-partner-box zepto"
                  onClick={() => window.open('https://www.zeptonow.com', '_blank')}
                >
                  <div className="mn-np-pname">zepto</div>
                  <div className="mn-np-ptime">10–15 min delivery</div>
                </div>

                <div
                  className="mn-np-partner-box blinkit"
                  onClick={() => window.open('https://blinkit.com', '_blank')}
                >
                  <div className="mn-np-pname">blinkit</div>
                  <div className="mn-np-ptime">10–20 min delivery</div>
                </div>
              </div>

              <button
                type="button"
                className="mn-np-order-print-btn"
                onClick={() => setPrintModalOpen(true)}
              >
                Order Print Copy
              </button>

              <p className="mn-np-delivery-footnote">* Delivery available in select cities</p>
            </div>

          </aside>

        </div>

        {/* ------------------------------------------------------------ */}
        {/* 3. BOTTOM TRUST STRIP                                        */}
        {/* ------------------------------------------------------------ */}
        <section className="mn-np-bottom-strip">
          <div className="mn-np-trust-item">
            <div className="mn-np-trust-icon">🛡️</div>
            <div>
              <h4 className="mn-np-trust-title">100% Quality Content</h4>
              <p className="mn-np-trust-desc">All notes and formula sheets are checked for accuracy and quality.</p>
            </div>
          </div>

          <div className="mn-np-trust-item">
            <div className="mn-np-trust-icon">🔒</div>
            <div>
              <h4 className="mn-np-trust-title">Safe &amp; Secure</h4>
              <p className="mn-np-trust-desc">No spam, no misleading content. Just pure learning.</p>
            </div>
          </div>

          <div className="mn-np-trust-item">
            <div className="mn-np-trust-icon">👥</div>
            <div>
              <h4 className="mn-np-trust-title">Trusted by Students</h4>
              <p className="mn-np-trust-desc">Millions of students trust MentorNearby for their learning.</p>
            </div>
          </div>

          <div className="mn-np-trust-item">
            <div className="mn-np-trust-icon">⬇️</div>
            <div>
              <h4 className="mn-np-trust-title">Easy to Access</h4>
              <p className="mn-np-trust-desc">Download, read online or study anytime, anywhere.</p>
            </div>
          </div>
        </section>

        {/* Bottom Information Notice Bar */}
        <div className="mn-np-bottom-notice">
          <span>ℹ️</span>
          <p>
            <strong>Note:</strong> All resources are in PDF format. Click on <strong>"View PDF"</strong> to open the file in full screen for the best reading experience.
          </p>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. MODALS: IN-BROWSER VIEWER & PAYMENT DOWNLOAD MODALS       */}
      {/* ============================================================ */}
      {viewerData.isOpen && (
        <StudyResourceViewerModal
          isOpen={viewerData.isOpen}
          onClose={() => setViewerData({ isOpen: false, resource: null, resourceId: null })}
          resourceId={viewerData.resourceId}
          resource={viewerData.resource}
          initialResource={viewerData.resource}
          onOpenPaymentModal={(res) => {
            setViewerData({ isOpen: false, resource: null, resourceId: null });
            handleOpenDownloadModal(res || viewerData.resource);
          }}
          onBuyDownload={(res) => {
            setViewerData({ isOpen: false, resource: null, resourceId: null });
            handleOpenDownloadModal(res || viewerData.resource);
          }}
        />
      )}

      {paymentData.isOpen && (
        <StudyPaymentModal
          isOpen={paymentData.isOpen}
          onClose={() => setPaymentData({ isOpen: false, resource: null, bundle: null, purchaseType: 'INDIVIDUAL' })}
          resource={paymentData.resource}
          bundle={paymentData.bundle}
          purchaseType={paymentData.purchaseType}
          classLevel={paymentData.classLevel || paymentData.resource?.classLevel || '9'}
          subject={paymentData.subject || paymentData.resource?.subject || 'Science'}
          onSuccess={() => {
            setPaymentData({ isOpen: false, resource: null, bundle: null, purchaseType: 'INDIVIDUAL' });
          }}
        />
      )}

      {comboPreviewData.isOpen && (
        <ComboPreviewModal
          isOpen={comboPreviewData.isOpen}
          onClose={() => setComboPreviewData({ isOpen: false, combo: null })}
          combo={comboPreviewData.combo}
          allResources={allResources}
          onBuyCombo={(c) => handleBuyCombo(c)}
          onViewIncludedResources={(c) => {
            setSelectedClass(String(c.classLevel));
            setSelectedSubject(c.subject);
            setSelectedTypes(c.type === 'FORMULA' ? ['FORMULA_SHEET'] : ['NOTES']);
          }}
        />
      )}

      {printModalOpen && (
        <PrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          resource={{
            title: `Class ${selectedClass} ${selectedSubject} Study Material`,
            subject: selectedSubject,
            classLevel: selectedClass,
          }}
        />
      )}

    </div>
  );
};

export default NotesAndPdfsPage;
