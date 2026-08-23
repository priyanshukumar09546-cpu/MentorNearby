// ============================================================
// pages/StudentDashboard/MyCoursesPage.jsx
// Student Portal: Enrolled Video Courses & Progress Tracker
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyCourses } from '../../api/courses';

const MyCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getMyCourses();
      setCourses(res.data?.courses || []);
    } catch (err) {
      setErrorMsg('Failed to load your enrolled courses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '90vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
              <span>🎓</span>
              <span>STUDENT DASHBOARD</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              My Enrolled Courses
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
              Track your video solution progress and continue your board exam preparation.
            </p>
          </div>

          <Link
            to="/courses"
            style={{
              background: '#4F46E5',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <span>🔍 Browse More Courses</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#64748B', fontWeight: 600 }}>Loading your courses...</p>
          </div>
        ) : errorMsg ? (
          <div style={{ background: '#FFFFFF', padding: 30, borderRadius: 16, border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <p style={{ color: '#DC2626', fontWeight: 700 }}>{errorMsg}</p>
          </div>
        ) : courses.length === 0 ? (
          <div style={{ background: '#FFFFFF', padding: 48, borderRadius: 20, border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: 48 }}>🎓</span>
            <h3 style={{ fontSize: 20, color: '#0F172A', margin: '16px 0 8px', fontWeight: 800 }}>
              No Enrolled Courses Yet
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 450, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Explore our 10-year PYQ Mastery courses with step-by-step video solutions, PPT summaries, and official CBSE scoring rubrics.
            </p>
            <Link
              to="/courses"
              style={{
                background: '#4F46E5',
                color: '#FFF',
                padding: '12px 24px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Explore PYQ Mastery Courses →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {courses.map((course) => {
              const progressPct = course.progress?.completionPercentage || 0;

              return (
                <div
                  key={course._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    border: '1px solid #E2E8F0',
                    padding: 24,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: 4 }}>
                        Class {course.classLevel} • {course.subject}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>
                        ✓ Purchased
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.3 }}>
                      {course.title}
                    </h3>

                    {course.bundleName && (
                      <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginBottom: 12 }}>
                        Included in <strong>{course.bundleName}</strong>
                      </span>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        <span>Course Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: '#4F46E5', borderRadius: 4, transition: 'width 0.3s ease' }}></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                    <Link
                      to={`/courses/${course.slug || course._id}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        padding: '10px 16px',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 13.5,
                        textDecoration: 'none',
                      }}
                    >
                      Continue Learning →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
