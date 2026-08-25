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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md text-xs font-extrabold mb-2">
              <span>🎓</span>
              <span>STUDENT DASHBOARD</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white m-0">
              My Enrolled Courses
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your video solution progress and continue your board exam preparation.
            </p>
          </div>

          <Link
            to="/courses"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-extrabold inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <span>🔍 Browse More Courses</span>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-11 h-11 border-4 border-slate-300 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading your courses...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-red-200 dark:border-red-900 text-center">
            <p className="text-red-600 dark:text-red-400 font-bold">{errorMsg}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-slate-200 dark:border-gray-700 text-center shadow-sm">
            <span className="text-5xl">🎓</span>
            <h3 className="text-xl text-slate-900 dark:text-white mt-4 mb-2 font-extrabold">
              No Enrolled Courses Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Explore our 10-year PYQ Mastery courses with step-by-step video solutions, PPT summaries, and official CBSE scoring rubrics.
            </p>
            <Link
              to="/courses"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-extrabold inline-block"
            >
              Explore PYQ Mastery Courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progressPct = course.progress?.completionPercentage || 0;

              return (
                <div
                  key={course._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                        Class {course.classLevel} • {course.subject}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Purchased
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                      {course.title}
                    </h3>

                    {course.bundleName && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-3">
                        Included in <strong>{course.bundleName}</strong>
                      </span>
                    )}

                    {/* Progress Bar */}
                    <div className="my-4">
                      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                        <span>Course Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
                    <Link
                      to={`/courses/${course.slug || course._id}`}
                      className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 px-4 rounded-xl font-bold text-sm"
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
