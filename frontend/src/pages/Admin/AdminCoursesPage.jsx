// ============================================================
// pages/Admin/AdminCoursesPage.jsx
// Admin Control Center: Courses & PYQ Mastery Management
// Search, Filter, Create, Edit, Delete with Confirmation,
// Manage Yearly Papers, Stream Bundles & Revenue Analytics
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAddPaper,
  adminCreateBundle,
  adminUpdateBundle,
  adminDeleteBundle,
  adminGetCourseAnalytics,
  getCourseBundles,
} from '../../api/courses';

const AdminCoursesPage = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'bundles' | 'analytics'
  const [courses, setCourses] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter States for Courses Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'
  const [filterStream, setFilterStream] = useState('ALL');

  // Modal States
  const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false);
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState(null);

  const [addPaperModalOpen, setAddPaperModalOpen] = useState(false);
  const [selectedCourseForPaper, setSelectedCourseForPaper] = useState(null);

  const [createBundleModalOpen, setCreateBundleModalOpen] = useState(false);
  const [editBundleModalOpen, setEditBundleModalOpen] = useState(false);
  const [selectedBundleForEdit, setSelectedBundleForEdit] = useState(null);

  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'COURSE' | 'BUNDLE', item: obj }

  // Form States
  const [newCourse, setNewCourse] = useState({
    title: '',
    classLevel: '10',
    subject: '',
    stream: 'General',
    board: 'CBSE',
    category: 'PYQ_MASTERY',
    chapter: '',
    pyqYearsRange: '2015–2026',
    youtubeUrl: '',
    tagline: '10 Years of Board PYQs + Complete Video Solutions',
    price: 249,
    originalPrice: 499,
    description: '',
    thumbnailUrl: '',
    instructorName: 'MentorNearby Senior Faculty',
    instructorCredentials: 'M.Sc, B.Ed • 10+ Years Board Experience',
    published: true,
  });

  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    classLevel: '10',
    subject: '',
    stream: 'General',
    board: 'CBSE',
    category: 'PYQ_MASTERY',
    chapter: '',
    pyqYearsRange: '2015–2026',
    youtubeUrl: '',
    tagline: '',
    price: 249,
    originalPrice: 499,
    description: '',
    thumbnailUrl: '',
    instructorName: '',
    instructorCredentials: '',
    published: true,
  });

  const [newPaper, setNewPaper] = useState({
    year: 2025,
    title: '',
    chapter: '',
    paperCode: 'Set 1 / Official Board Paper',
    isFreeSample: false,
    durationMinutes: 48,
    youtubeUrl: '',
    videoUrl: '',
    pptUrl: '',
    downloadPrice: 19,
    summary: '',
  });

  const [newBundle, setNewBundle] = useState({
    name: '',
    bundleType: 'ALL_SUBJECT_COMBO',
    classLevel: '10',
    stream: 'General',
    description: '',
    price: 599,
    originalPrice: 1245,
    badge: 'BEST VALUE',
    selectedCourseIds: [],
  });

  const [editBundleForm, setEditBundleForm] = useState({
    name: '',
    bundleType: 'ALL_SUBJECT_COMBO',
    classLevel: '10',
    stream: 'General',
    description: '',
    price: 599,
    originalPrice: 1245,
    badge: 'BEST VALUE',
    selectedCourseIds: [],
    published: true,
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [coursesRes, bundlesRes, analyticsRes] = await Promise.all([
        adminGetCourses(),
        getCourseBundles(),
        adminGetCourseAnalytics(),
      ]);

      setCourses(coursesRes.data?.courses || []);
      setBundles(bundlesRes.data?.bundles || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      setErrorMsg('Failed to load courses admin data.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic list of unique subjects across all courses
  const uniqueSubjects = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Real-time filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesSub = c.subject?.toLowerCase().includes(q);
        const matchesClass = `class ${c.classLevel}`.toLowerCase().includes(q) || c.classLevel?.toString() === q;
        if (!matchesTitle && !matchesSub && !matchesClass) return false;
      }

      // 2. Class Filter
      if (filterClass !== 'ALL') {
        if (c.classLevel?.toString() !== filterClass) return false;
      }

      // 3. Subject Filter
      if (filterSubject !== 'ALL') {
        if (c.subject?.toLowerCase() !== filterSubject.toLowerCase()) return false;
      }

      // 4. Status Filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'PUBLISHED' && !c.published) return false;
        if (filterStatus === 'DRAFT' && c.published) return false;
      }

      // 5. Stream Filter
      if (filterStream !== 'ALL') {
        if (c.stream?.toLowerCase() !== filterStream.toLowerCase()) return false;
      }

      return true;
    });
  }, [courses, searchQuery, filterClass, filterSubject, filterStatus, filterStream]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterClass('ALL');
    setFilterSubject('ALL');
    setFilterStatus('ALL');
    setFilterStream('ALL');
  };

  // --- COURSE ACTIONS ---
  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim() || !newCourse.subject.trim()) {
      setErrorMsg('Course title and subject are required.');
      return;
    }
    if (Number(newCourse.price) < 0) {
      setErrorMsg('Price must be a valid non-negative number.');
      return;
    }

    try {
      await adminCreateCourse(newCourse);
      setSuccessMsg('Course created successfully!');
      setCreateCourseModalOpen(false);
      setNewCourse({
        title: '',
        classLevel: '10',
        subject: '',
        stream: 'General',
        board: 'CBSE',
        category: 'PYQ_MASTERY',
        tagline: '10 Years of Board PYQs + Complete Video Solutions',
        price: 249,
        originalPrice: 499,
        description: '',
        thumbnailUrl: '',
        instructorName: 'MentorNearby Senior Faculty',
        instructorCredentials: 'M.Sc, B.Ed • 10+ Years Board Experience',
        published: true,
      });
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create course.');
    }
  };

  const handleOpenEditCourse = (course) => {
    setSelectedCourseForEdit(course);
    setEditCourseForm({
      title: course.title || '',
      classLevel: course.classLevel?.toString() || '10',
      subject: course.subject || '',
      stream: course.stream || 'General',
      board: course.board || 'CBSE',
      category: course.category || 'PYQ_MASTERY',
      chapter: course.chapter || '',
      pyqYearsRange: course.pyqYearsRange || '2015–2026',
      youtubeUrl: course.youtubeUrl || '',
      tagline: course.tagline || '',
      price: Number(course.price) || 0,
      originalPrice: Number(course.originalPrice) || Number(course.price) * 2,
      description: course.description || '',
      thumbnailUrl: course.thumbnail?.url || '',
      instructorName: course.instructor?.name || 'MentorNearby Senior Faculty',
      instructorCredentials: course.instructor?.credentials || '',
      published: course.published !== false,
    });
    setEditCourseModalOpen(true);
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForEdit) return;

    if (!editCourseForm.title.trim() || !editCourseForm.subject.trim()) {
      setErrorMsg('Course title and subject cannot be empty.');
      return;
    }
    if (Number(editCourseForm.price) < 0) {
      setErrorMsg('Price must be a valid positive number.');
      return;
    }

    try {
      const payload = {
        title: editCourseForm.title,
        classLevel: editCourseForm.classLevel,
        subject: editCourseForm.subject,
        stream: editCourseForm.stream,
        board: editCourseForm.board,
        category: editCourseForm.category,
        chapter: editCourseForm.chapter,
        pyqYearsRange: editCourseForm.pyqYearsRange,
        youtubeUrl: editCourseForm.youtubeUrl,
        tagline: editCourseForm.tagline,
        price: Number(editCourseForm.price),
        originalPrice: Number(editCourseForm.originalPrice),
        description: editCourseForm.description,
        thumbnail: { url: editCourseForm.thumbnailUrl },
        instructor: {
          name: editCourseForm.instructorName,
          credentials: editCourseForm.instructorCredentials,
        },
        published: Boolean(editCourseForm.published),
      };

      await adminUpdateCourse(selectedCourseForEdit._id, payload);
      setSuccessMsg(`Course "${editCourseForm.title}" updated successfully!`);
      setEditCourseModalOpen(false);
      setSelectedCourseForEdit(null);
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update course.');
    }
  };

  const togglePublishCourse = async (course) => {
    try {
      await adminUpdateCourse(course._id, { published: !course.published });
      setSuccessMsg(`Course marked as ${!course.published ? 'Published' : 'Draft'}.`);
      fetchAdminData();
    } catch (_) {
      setErrorMsg('Failed to update course status.');
    }
  };

  // --- PAPER ACTIONS ---
  const handleAddPaperSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForPaper) return;
    try {
      await adminAddPaper(selectedCourseForPaper._id, newPaper);
      setSuccessMsg(`Paper for Year ${newPaper.year} added successfully!`);
      setAddPaperModalOpen(false);
      setNewPaper({
        year: 2025,
        title: '',
        chapter: '',
        paperCode: 'Set 1 / Official Board Paper',
        isFreeSample: false,
        durationMinutes: 48,
        youtubeUrl: '',
        videoUrl: '',
        pptUrl: '',
        summary: '',
      });
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add paper.');
    }
  };

  // --- BUNDLE ACTIONS ---
  const handleCreateBundleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminCreateBundle({
        ...newBundle,
        courseIds: newBundle.selectedCourseIds,
      });
      setSuccessMsg('Course bundle created successfully!');
      setCreateBundleModalOpen(false);
      setNewBundle({
        name: '',
        bundleType: 'ALL_SUBJECT_COMBO',
        classLevel: '10',
        stream: 'General',
        description: '',
        price: 599,
        originalPrice: 1245,
        badge: 'BEST VALUE',
        selectedCourseIds: [],
      });
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create bundle.');
    }
  };

  const handleOpenEditBundle = (bundle) => {
    setSelectedBundleForEdit(bundle);
    const existingIds = (bundle.courses || []).map((c) => (typeof c === 'object' ? c._id : c));
    setEditBundleForm({
      name: bundle.name || '',
      bundleType: bundle.bundleType || 'ALL_SUBJECT_COMBO',
      classLevel: bundle.classLevel?.toString() || '10',
      stream: bundle.stream || 'General',
      description: bundle.description || '',
      price: Number(bundle.price) || 0,
      originalPrice: Number(bundle.originalPrice) || 0,
      badge: bundle.badge || 'BEST VALUE',
      selectedCourseIds: existingIds,
      published: bundle.published !== false,
    });
    setEditBundleModalOpen(true);
  };

  const handleEditBundleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBundleForEdit) return;

    try {
      await adminUpdateBundle(selectedBundleForEdit._id, {
        name: editBundleForm.name.trim(),
        bundleType: editBundleForm.bundleType,
        classLevel: editBundleForm.classLevel,
        stream: editBundleForm.stream,
        description: editBundleForm.description,
        price: Number(editBundleForm.price),
        originalPrice: Number(editBundleForm.originalPrice),
        badge: editBundleForm.badge,
        courses: editBundleForm.selectedCourseIds,
        published: Boolean(editBundleForm.published),
      });

      setSuccessMsg(`Bundle "${editBundleForm.name}" updated successfully!`);
      setEditBundleModalOpen(false);
      setSelectedBundleForEdit(null);
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update bundle.');
    }
  };

  // --- DELETE CONFIRMATION ---
  const handleOpenDeleteConfirm = (type, item) => {
    setItemToDelete({ type, item });
    setDeleteConfirmModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    const { type, item } = itemToDelete;

    try {
      if (type === 'COURSE') {
        await adminDeleteCourse(item._id);
        setSuccessMsg(`Course "${item.title}" and all its papers deleted.`);
      } else if (type === 'BUNDLE') {
        await adminDeleteBundle(item._id);
        setSuccessMsg(`Bundle "${item.name}" deleted.`);
      }
      setDeleteConfirmModalOpen(false);
      setItemToDelete(null);
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>
            🎓 Courses &amp; PYQ Mastery Control Center
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 0' }}>
            Manage video courses, 10-year board papers, free samples, combos, and revenue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setCreateCourseModalOpen(true)}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
            }}
          >
            <span>➕ Create Course</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateBundleModalOpen(true)}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>📦 New Bundle</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Analytics Ribbon */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Total Courses</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{courses.length}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Total Student Enrollments</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>{analytics.totalEnrollments || 0}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Course Sales Revenue</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>₹{analytics.totalRevenue || 0}</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Active Stream Bundles</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{bundles.length}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #CBD5E1', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: 13.5,
            border: 'none',
            background: 'none',
            color: activeTab === 'courses' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'courses' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Courses Catalog ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bundles')}
          style={{
            padding: '8px 16px',
            fontWeight: 800,
            fontSize: 13.5,
            border: 'none',
            background: 'none',
            color: activeTab === 'bundles' ? '#2563EB' : '#64748B',
            borderBottom: activeTab === 'bundles' ? '2px solid #2563EB' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Stream &amp; Subject Bundles ({bundles.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: COURSES CATALOG & SEARCH/FILTER TOOLBAR               */}
      {/* ============================================================ */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Search & Filter Toolbar */}
          <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            
            {/* Left: Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 260px', maxWidth: 360, background: '#F8FAFC', padding: '6px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}>
              <span>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject, or class..."
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, color: '#0F172A' }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>✕</button>
              )}
            </div>

            {/* Middle: Filter Dropdowns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              
              {/* Class Filter */}
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155' }}
              >
                <option value="ALL">All Classes</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>

              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155' }}
              >
                <option value="ALL">All Subjects</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155' }}
              >
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft / Unpublished</option>
              </select>

              {/* Stream Filter */}
              <select
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155' }}
              >
                <option value="ALL">All Streams</option>
                <option value="General">General</option>
                <option value="Science">Science (PCM/PCB)</option>
                <option value="Commerce">Commerce</option>
                <option value="Humanities">Humanities</option>
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || filterClass !== 'ALL' || filterSubject !== 'ALL' || filterStatus !== 'ALL' || filterStream !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right: Results Count */}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>
              Showing {filteredCourses.length} of {courses.length} courses
            </div>

          </div>

          {/* Courses Table */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
            {filteredCourses.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: 36 }}>🔍</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '12px 0 6px' }}>No Courses Found</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 14px' }}>
                  No courses matched your current search and filter selections.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                      <th style={{ padding: '12px 18px' }}>Course Title</th>
                      <th style={{ padding: '12px 18px' }}>Class / Subject</th>
                      <th style={{ padding: '12px 18px' }}>Price</th>
                      <th style={{ padding: '12px 18px' }}>Papers / Sample</th>
                      <th style={{ padding: '12px 18px' }}>Enrollments</th>
                      <th style={{ padding: '12px 18px' }}>Status</th>
                      <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.title}</div>
                          {c.tagline && <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{c.tagline}</div>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ background: '#EEF2FF', color: '#2563EB', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11.5 }}>
                            Class {c.classLevel} • {c.subject}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>₹{c.price}</div>
                          {c.originalPrice > c.price && (
                            <div style={{ fontSize: 11, color: '#94A3B8', textDecoration: 'line-through' }}>₹{c.originalPrice}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            {c.papersCount || 10} Papers ({c.freeSamplesCount || 1} Free Sample)
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#059669' }}>
                          {c.enrolledCount || 0}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: c.published ? '#ECFDF5' : '#FEF2F2', color: c.published ? '#059669' : '#DC2626' }}>
                            {c.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {/* 1. EDIT BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCourse(c)}
                              style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title="Edit course details"
                            >
                              ✏️ Edit
                            </button>

                            {/* 2. ADD YEAR PAPER BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCourseForPaper(c);
                                setAddPaperModalOpen(true);
                              }}
                              style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title="Add exam paper & solution"
                            >
                              + Add Year
                            </button>

                            {/* 3. PUBLISH / UNPUBLISH */}
                            <button
                              type="button"
                              onClick={() => togglePublishCourse(c)}
                              style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title={c.published ? 'Unpublish course' : 'Publish course'}
                            >
                              {c.published ? 'Unpublish' : 'Publish'}
                            </button>

                            {/* 4. DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirm('COURSE', c)}
                              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                              title="Delete course"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: STREAM & SUBJECT BUNDLES                              */}
      {/* ============================================================ */}
      {activeTab === 'bundles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {bundles.map((b) => (
            <div key={b._id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                    Class {b.classLevel} • {b.bundleType}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>₹{b.price}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{b.name}</h3>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>{b.description}</p>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 14 }}>
                  Includes {b.courses?.length || 0} Courses • Sales: {b.salesCount || 0}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditBundle(b)}
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏️ Edit Bundle
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeleteConfirm('BUNDLE', b)}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE COURSE                                         */}
      {/* ============================================================ */}
      {createCourseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 540, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 16px', color: '#0F172A' }}>Create New Course</h3>
            <form onSubmit={handleCreateCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. 10 Years Board PYQ Mastery — Class 10 Mathematics"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Class Level</label>
                  <select
                    value={newCourse.classLevel}
                    onChange={(e) => setNewCourse({ ...newCourse, classLevel: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="10">Class 10</option>
                    <option value="12">Class 12</option>
                    <option value="9">Class 9</option>
                    <option value="11">Class 11</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subject</label>
                  <input
                    type="text"
                    required
                    value={newCourse.subject}
                    onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Original / MRP Price (₹)</label>
                  <input
                    type="number"
                    value={newCourse.originalPrice}
                    onChange={(e) => setNewCourse({ ...newCourse, originalPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Chapter / Topic</label>
                  <input
                    type="text"
                    value={newCourse.chapter}
                    onChange={(e) => setNewCourse({ ...newCourse, chapter: e.target.value })}
                    placeholder="e.g. Chemical Reactions and Equations"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>PYQ Years Range</label>
                  <input
                    type="text"
                    value={newCourse.pyqYearsRange}
                    onChange={(e) => setNewCourse({ ...newCourse, pyqYearsRange: e.target.value })}
                    placeholder="e.g. 2015–2026"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  YouTube Video / Playlist URL <span style={{ color: '#EF4444' }}>(Recommended — 0 Server Storage Cost)</span>
                </label>
                <input
                  type="text"
                  value={newCourse.youtubeUrl}
                  onChange={(e) => setNewCourse({ ...newCourse, youtubeUrl: e.target.value })}
                  placeholder="e.g. https://www.youtube.com/watch?v=XXXXXXXX"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Tagline</label>
                <input
                  type="text"
                  value={newCourse.tagline}
                  onChange={(e) => setNewCourse({ ...newCourse, tagline: e.target.value })}
                  placeholder="e.g. 10 Years of Board PYQs + Complete Video Solutions"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Comprehensive syllabus overview and course benefits..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCreateCourseModalOpen(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT COURSE                                           */}
      {/* ============================================================ */}
      {editCourseModalOpen && selectedCourseForEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 560, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 16px', color: '#0F172A' }}>
              Edit Course — {selectedCourseForEdit.title}
            </h3>
            <form onSubmit={handleEditCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Course Title *</label>
                <input
                  type="text"
                  required
                  value={editCourseForm.title}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Class Level *</label>
                  <select
                    value={editCourseForm.classLevel}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, classLevel: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="10">Class 10</option>
                    <option value="12">Class 12</option>
                    <option value="9">Class 9</option>
                    <option value="11">Class 11</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subject *</label>
                  <input
                    type="text"
                    required
                    value={editCourseForm.subject}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, subject: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Stream</label>
                  <select
                    value={editCourseForm.stream}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, stream: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="General">General</option>
                    <option value="Science">Science (PCM/PCB)</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Humanities">Humanities</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Board</label>
                  <input
                    type="text"
                    value={editCourseForm.board}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, board: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editCourseForm.price}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Original / Crossed-out Price (₹)</label>
                  <input
                    type="number"
                    value={editCourseForm.originalPrice}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, originalPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Chapter / Topic</label>
                  <input
                    type="text"
                    value={editCourseForm.chapter}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, chapter: e.target.value })}
                    placeholder="e.g. Chemical Reactions and Equations"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>PYQ Years Range</label>
                  <input
                    type="text"
                    value={editCourseForm.pyqYearsRange}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, pyqYearsRange: e.target.value })}
                    placeholder="e.g. 2015–2026"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  YouTube Video / Playlist URL <span style={{ color: '#EF4444' }}>(Recommended — 0 Server Storage Cost)</span>
                </label>
                <input
                  type="text"
                  value={editCourseForm.youtubeUrl}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, youtubeUrl: e.target.value })}
                  placeholder="e.g. https://www.youtube.com/watch?v=XXXXXXXX"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Tagline</label>
                <input
                  type="text"
                  value={editCourseForm.tagline}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, tagline: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={editCourseForm.description}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Instructor Name</label>
                  <input
                    type="text"
                    value={editCourseForm.instructorName}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, instructorName: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Status</label>
                  <select
                    value={editCourseForm.published ? 'true' : 'false'}
                    onChange={(e) => setEditCourseForm({ ...editCourseForm, published: e.target.value === 'true' })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft / Unpublished</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditCourseModalOpen(false);
                    setSelectedCourseForEdit(null);
                  }}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD YEAR PAPER                                        */}
      {/* ============================================================ */}
      {addPaperModalOpen && selectedCourseForPaper && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 520, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', color: '#0F172A' }}>
              Add Examination Year Paper
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 16px' }}>
              Adding paper to: <strong>{selectedCourseForPaper.title}</strong>
            </p>

            <form onSubmit={handleAddPaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Exam Year</label>
                  <input
                    type="number"
                    required
                    value={newPaper.year}
                    onChange={(e) => setNewPaper({ ...newPaper, year: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Paper Title</label>
                  <input
                    type="text"
                    value={newPaper.title}
                    onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                    placeholder="e.g. 2025 Board Examination Paper"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  YouTube Video Solution URL <span style={{ color: '#EF4444' }}>(Recommended)</span>
                </label>
                <input
                  type="text"
                  value={newPaper.youtubeUrl}
                  onChange={(e) => setNewPaper({ ...newPaper, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Chapter / Specific Topic (Optional)</label>
                <input
                  type="text"
                  value={newPaper.chapter}
                  onChange={(e) => setNewPaper({ ...newPaper, chapter: e.target.value })}
                  placeholder="e.g. Section A: Calculus & Vectors"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Notes / PPT Solution PDF URL (Optional)</label>
                <input
                  type="text"
                  value={newPaper.pptUrl}
                  onChange={(e) => setNewPaper({ ...newPaper, pptUrl: e.target.value })}
                  placeholder="https://... Solution PDF URL"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>PPT Download Price (₹) (Default: ₹19)</label>
                <input
                  type="number"
                  min="0"
                  value={newPaper.downloadPrice}
                  onChange={(e) => setNewPaper({ ...newPaper, downloadPrice: Number(e.target.value) || 0 })}
                  placeholder="19"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
                <input
                  type="checkbox"
                  id="freeSampleCb"
                  checked={newPaper.isFreeSample}
                  onChange={(e) => setNewPaper({ ...newPaper, isFreeSample: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="freeSampleCb" style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Set as Free Sample (Open to non-enrolled students)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setAddPaperModalOpen(false);
                    setSelectedCourseForPaper(null);
                  }}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Add Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CREATE BUNDLE                                         */}
      {/* ============================================================ */}
      {createBundleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 540, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 16px', color: '#0F172A' }}>Create Stream Bundle</h3>
            <form onSubmit={handleCreateBundleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bundle Name</label>
                <input
                  type="text"
                  required
                  value={newBundle.name}
                  onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                  placeholder="e.g. Class 10 All-in-One Board PYQ Mastery"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Class Level</label>
                  <select
                    value={newBundle.classLevel}
                    onChange={(e) => setNewBundle({ ...newBundle, classLevel: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="10">Class 10</option>
                    <option value="12">Class 12</option>
                    <option value="9">Class 9</option>
                    <option value="11">Class 11</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bundle Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newBundle.price}
                    onChange={(e) => setNewBundle({ ...newBundle, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={newBundle.description}
                  onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Included Courses</label>
                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
                  {courses
                    .filter((c) => c.classLevel?.toString() === newBundle.classLevel?.toString())
                    .map((c) => {
                      const isSelected = newBundle.selectedCourseIds.includes(c._id);
                      return (
                        <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewBundle({ ...newBundle, selectedCourseIds: [...newBundle.selectedCourseIds, c._id] });
                              } else {
                                setNewBundle({ ...newBundle, selectedCourseIds: newBundle.selectedCourseIds.filter((id) => id !== c._id) });
                              }
                            }}
                          />
                          <span style={{ fontSize: 12.5, color: '#334155' }}>
                            {c.title} ({c.subject})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setCreateBundleModalOpen(false)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Create Bundle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT BUNDLE                                           */}
      {/* ============================================================ */}
      {editBundleModalOpen && selectedBundleForEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 540, width: '100%', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 16px', color: '#0F172A' }}>
              Edit Bundle — {selectedBundleForEdit.name}
            </h3>
            <form onSubmit={handleEditBundleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bundle Name *</label>
                <input
                  type="text"
                  required
                  value={editBundleForm.name}
                  onChange={(e) => setEditBundleForm({ ...editBundleForm, name: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Class Level</label>
                  <select
                    value={editBundleForm.classLevel}
                    onChange={(e) => setEditBundleForm({ ...editBundleForm, classLevel: e.target.value })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="10">Class 10</option>
                    <option value="12">Class 12</option>
                    <option value="9">Class 9</option>
                    <option value="11">Class 11</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Bundle Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editBundleForm.price}
                    onChange={(e) => setEditBundleForm({ ...editBundleForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={editBundleForm.description}
                  onChange={(e) => setEditBundleForm({ ...editBundleForm, description: e.target.value })}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Included Courses</label>
                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
                  {courses
                    .filter((c) => c.classLevel?.toString() === editBundleForm.classLevel?.toString())
                    .map((c) => {
                      const isSelected = editBundleForm.selectedCourseIds.includes(c._id);
                      return (
                        <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditBundleForm({ ...editBundleForm, selectedCourseIds: [...editBundleForm.selectedCourseIds, c._id] });
                              } else {
                                setEditBundleForm({ ...editBundleForm, selectedCourseIds: editBundleForm.selectedCourseIds.filter((id) => id !== c._id) });
                              }
                            }}
                          />
                          <span style={{ fontSize: 12.5, color: '#334155' }}>
                            {c.title} ({c.subject})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditBundleModalOpen(false);
                    setSelectedBundleForEdit(null);
                  }}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Bundle Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION DIALOG                            */}
      {/* ============================================================ */}
      {deleteConfirmModalOpen && itemToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, maxWidth: 450, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#DC2626' }}>
                ⚠️
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Confirm Permanent Deletion
              </h3>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Are you sure you want to delete{' '}
              <strong>"{itemToDelete.item.title || itemToDelete.item.name}"</strong>?
              {itemToDelete.type === 'COURSE' && (
                <span style={{ display: 'block', marginTop: 6, color: '#DC2626', fontSize: 12.5, fontWeight: 600 }}>
                  This will permanently remove the course and all associated exam papers, video solutions, and student syllabus mapping.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmModalOpen(false);
                  setItemToDelete(null);
                }}
                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                🗑️ Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCoursesPage;
