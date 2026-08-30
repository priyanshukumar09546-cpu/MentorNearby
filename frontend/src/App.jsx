import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import CookieConsent from './components/common/CookieConsent';
import ErrorBoundary from './components/common/ErrorBoundary';
import StarsBackground from './components/StarsBackground';
import GlobalStars from './components/GlobalStars';

// Primary Core Routes (Eagerly loaded for instant first paint)
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import BecomeTutorPage from './pages/Auth/BecomeTutorPage';
import SearchPage from './pages/Search/SearchPage';
import TutorProfilePage from './pages/TutorProfile/TutorProfilePage';
import HowItWorksPage from './pages/Legal/HowItWorksPage';
import NotesAndPdfsPage from './pages/StudyResources/NotesAndPdfsPage';
import StudyResourcesPage from './pages/StudyResources/StudyResourcesPage';
import BookReaderPage from './pages/StudyResources/BookReaderPage';
import AuthCallback from './pages/AuthCallback';
import NotFoundPage from './pages/NotFoundPage';

// Secondary & Auth Routes (Code-split with React.lazy)
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/Auth/VerifyEmailPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboard/StudentDashboardPage'));
const TutorDashboardPage = lazy(() => import('./pages/TutorDashboard/TutorDashboardPage'));
const EditTutorProfilePage = lazy(() => import('./pages/TutorProfile/EditTutorProfilePage'));
const KYCPage = lazy(() => import('./pages/KYC/KYCPage'));
const SavedTutorsPage = lazy(() => import('./pages/SavedTutors/SavedTutorsPage'));
const PostRequirementPage = lazy(() => import('./pages/StudentDashboard/PostRequirementPage'));
const StudentRequirementsPage = lazy(() => import('./pages/StudentDashboard/StudentRequirementsPage'));
const TutorRequestsPage = lazy(() => import('./pages/TutorDashboard/TutorRequestsPage'));
const FindStudentsPage = lazy(() => import('./pages/FindStudents/FindStudentsPage'));
const StudentProfilePage = lazy(() => import('./pages/StudentProfile/StudentProfilePage'));
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const SubscriptionPage = lazy(() => import('./pages/Subscription/SubscriptionPage'));

// Admin Code-Split Routes
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage'));
const AdminKYCPage = lazy(() => import('./pages/Admin/AdminKYCPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/AdminUsersPage'));
const AdminStudentsPage = lazy(() => import('./pages/Admin/AdminStudentsPage'));
const AdminTutorsPage = lazy(() => import('./pages/Admin/AdminTutorsPage'));
const AdminRequestsPage = lazy(() => import('./pages/Admin/AdminRequestsPage'));
const AdminReportsPage = lazy(() => import('./pages/Admin/AdminReportsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/Admin/AdminPaymentsPage'));
const AdminContactUnlocksPage = lazy(() => import('./pages/Admin/AdminContactUnlocksPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/Admin/AdminAnalyticsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/Admin/AdminNotificationsPage'));
const AdminSettingsPage = lazy(() => import('./pages/Admin/AdminSettingsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/Admin/AdminAuditLogsPage'));
const AdminLoginPage = lazy(() => import('./pages/Admin/AdminLoginPage'));
const AdminContentPage = lazy(() => import('./pages/Admin/AdminContentPage'));
const AdminCoursesPage = lazy(() => import('./pages/Admin/AdminCoursesPage'));
const AdminStudyResourcesPage = lazy(() => import('./pages/Admin/AdminStudyResourcesPage'));
const AdminFooterCmsPage = lazy(() => import('./pages/Admin/AdminFooterCmsPage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/Admin/AdminSubscriptionsPage'));

// Books & Courses Secondary Routes
const BooksHomePage = lazy(() => import('./pages/Books/BooksHomePage'));
const BooksListPage = lazy(() => import('./pages/Books/BooksListPage'));
const BookDetailPage = lazy(() => import('./pages/Books/BookDetailPage'));
const BookmarksPage = lazy(() => import('./pages/Books/BookmarksPage'));
const BookChaptersPage = lazy(() => import('./pages/StudyResources/BookChaptersPage'));
const ChapterDetailPage = lazy(() => import('./pages/StudyResources/ChapterDetailPage'));
const StudyBookDetailPage = lazy(() => import('./pages/StudyResources/BookDetailPage'));
const SubjectResourcesPage = lazy(() => import('./pages/StudyResources/SubjectResourcesPage'));
const StudentPurchasesPage = lazy(() => import('./pages/StudentDashboard/StudentPurchasesPage'));
const CoursesPage = lazy(() => import('./pages/Courses/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/Courses/CourseDetailPage'));
const CourseWatchPage = lazy(() => import('./pages/Courses/CourseWatchPage'));
const MyCoursesPage = lazy(() => import('./pages/StudentDashboard/MyCoursesPage'));

// Legal & Informational Code-Split Routes
const PrivacyPolicyPage = lazy(() => import('./pages/Legal/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/Legal/TermsPage'));
const RefundPolicyPage = lazy(() => import('./pages/Legal/RefundPolicyPage'));
const CancellationPolicyPage = lazy(() => import('./pages/Legal/CancellationPolicyPage'));
const SafetyPage = lazy(() => import('./pages/Legal/SafetyPage'));
const FaqsPage = lazy(() => import('./pages/Legal/FaqsPage'));
const ReportIssuePage = lazy(() => import('./pages/Legal/ReportIssuePage'));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

// Suspense Fallback
const RouteLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div className="spinner" style={{ width: '36px', height: '36px', borderColor: '#FED7AA', borderTopColor: '#FF6A00' }}></div>
  </div>
);

const AppContent = () => {
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;
  const location = useLocation();

  const isChatRoute = ['/chat', '/messages', '/app/chat'].some((p) =>
    location.pathname.startsWith(p)
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.style.backgroundColor = '#000000';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = isChatRoute ? '#FFFFFF' : '#FFFBF5';
    }
  }, [isDarkMode, isChatRoute]);

  return (
    <div
      style={{
        backgroundColor: isDarkMode ? '#000000' : isChatRoute ? '#FFFFFF' : '#FFFBF5',
        height: isChatRoute ? '100vh' : 'auto',
        minHeight: '100vh',
        overflow: isChatRoute ? 'hidden' : 'visible',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      className={isDarkMode ? 'dark text-white' : 'light text-gray-900'}
    >
      {/* FIXED STARS & AMBIENT GLOW BACKGROUND IN DARK MODE (zIndex: 0) */}
      {isDarkMode && <StarsBackground />}

      {/* CONTENT - RELATIVE ON TOP OF STARS (zIndex: 10) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: isChatRoute ? '100vh' : 'auto',
          minHeight: isChatRoute ? '100vh' : '100vh',
          overflow: isChatRoute ? 'hidden' : 'visible',
          background: 'transparent',
        }}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Admin Entry & Login */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Control Center Protected Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="dashboard" element={<AdminDashboardPage />} />
                      <Route path="dashboard/*" element={<AdminDashboardPage />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="students" element={<AdminStudentsPage />} />
                            <Route path="tutors" element={<AdminTutorsPage />} />
                            <Route path="kyc" element={<AdminKYCPage />} />
                            <Route path="kyc-pending" element={<AdminKYCPage />} />
                            <Route path="requests" element={<AdminRequestsPage />} />
                            <Route path="courses" element={<AdminCoursesPage />} />
                            <Route path="study-resources" element={<AdminStudyResourcesPage />} />
                            <Route path="content" element={<AdminContentPage />} />
                            <Route path="footer-content" element={<AdminFooterCmsPage />} />
                            <Route path="footer" element={<AdminFooterCmsPage />} />
                            <Route path="reports" element={<AdminReportsPage />} />
                            <Route path="payments" element={<AdminPaymentsPage />} />
                            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                            <Route path="contact-unlocks" element={<AdminContactUnlocksPage />} />
                            <Route path="analytics" element={<AdminAnalyticsPage />} />
                            <Route path="notifications" element={<AdminNotificationsPage />} />
                            <Route path="settings" element={<AdminSettingsPage />} />
                            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                            <Route path="*" element={<AdminDashboardPage />} />
                          </Routes>
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Public & Main Application Layout */}
                  <Route
                    path="*"
                    element={
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: isChatRoute ? '100%' : 'auto',
                          minHeight: isChatRoute ? '100%' : '100vh',
                          overflow: isChatRoute ? 'hidden' : 'visible',
                          flex: 1,
                        }}
                      >
                        <Navbar />
                        <div
                          style={{
                            flex: 1,
                            display: isChatRoute ? 'flex' : 'block',
                            flexDirection: isChatRoute ? 'column' : 'initial',
                            overflow: isChatRoute ? 'hidden' : 'visible',
                            minHeight: 0,
                          }}
                        >
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/student/register" element={<RegisterPage />} />
                            <Route path="/student-register" element={<RegisterPage />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/auth-success" element={<AuthCallback />} />
                            <Route path="/become-tutor" element={<BecomeTutorPage />} />
                            <Route path="/become-a-tutor" element={<BecomeTutorPage />} />
                            <Route path="/tutor/register" element={<BecomeTutorPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/update-password" element={<ResetPasswordPage />} />
                            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                            
                            {/* 🧑‍🏫 Tutor Protected Routes */}
                            <Route path="/tutor/dashboard" element={<ProtectedRoute roles={['tutor']}><TutorDashboardPage /></ProtectedRoute>} />
                            <Route path="/tutor-dashboard" element={<ProtectedRoute roles={['tutor']}><TutorDashboardPage /></ProtectedRoute>} />
                            <Route path="/tutor/dashboard/*" element={<ProtectedRoute roles={['tutor']}><TutorDashboardPage /></ProtectedRoute>} />
                            <Route path="/mentor/dashboard" element={<ProtectedRoute roles={['tutor']}><TutorDashboardPage /></ProtectedRoute>} />
                            <Route path="/tutor/requests" element={<ProtectedRoute roles={['tutor']}><TutorRequestsPage /></ProtectedRoute>} />
                            <Route path="/student-requests" element={<ProtectedRoute roles={['tutor']}><TutorRequestsPage /></ProtectedRoute>} />
                            <Route path="/tutor/student-requests" element={<ProtectedRoute roles={['tutor']}><TutorRequestsPage /></ProtectedRoute>} />
                            <Route path="/dashboard/requests" element={<ProtectedRoute roles={['tutor']}><TutorRequestsPage /></ProtectedRoute>} />
                            <Route path="/tutor/profile" element={<ProtectedRoute roles={['tutor']}><EditTutorProfilePage /></ProtectedRoute>} />
                            <Route path="/tutor/profile/edit" element={<ProtectedRoute roles={['tutor']}><EditTutorProfilePage /></ProtectedRoute>} />
                            <Route path="/tutor/kyc" element={<ProtectedRoute roles={['tutor']}><KYCPage /></ProtectedRoute>} />
                            <Route path="/tutor/:id" element={<TutorProfilePage />} />
                            <Route path="/tutors/:id" element={<TutorProfilePage />} />
                            <Route path="/teacher/:id" element={<TutorProfilePage />} />
                            <Route path="/teachers/:id" element={<TutorProfilePage />} />
                            <Route path="/teacher-profile/:id" element={<TutorProfilePage />} />

                            {/* 🔍 Tutor & Student Search Routes */}
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/find-tutors" element={<SearchPage />} />
                            <Route path="/tutors" element={<SearchPage />} />
                            <Route path="/view-all-tutors" element={<SearchPage />} />
                            <Route path="/find-students" element={<FindStudentsPage />} />
                            <Route path="/students" element={<FindStudentsPage />} />
                            <Route path="/view-all-students" element={<FindStudentsPage />} />
                            <Route path="/requirements" element={<FindStudentsPage />} />
                            <Route path="/student/:id" element={<StudentProfilePage />} />
                            <Route path="/students/:id" element={<StudentProfilePage />} />
                            <Route path="/student-profile/:id" element={<StudentProfilePage />} />

                            {/* 🎓 Courses & PYQ Mastery Routes */}
                            <Route path="/courses" element={<CoursesPage />} />
                            <Route path="/courses/:slugOrId" element={<CourseDetailPage />} />
                            <Route path="/courses/watch/:courseId/:paperId" element={<CourseWatchPage />} />
                            <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                            <Route path="/dashboard/student/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />

                            {/* 📄 Notes & PDFs Page */}
                            <Route path="/study-resources" element={<NotesAndPdfsPage />} />
                            <Route path="/study-resources/notes" element={<NotesAndPdfsPage />} />
                            <Route path="/notes" element={<NotesAndPdfsPage />} />
                            <Route path="/notes-and-pdfs" element={<NotesAndPdfsPage />} />

                            {/* 📚 Book Bank */}
                            <Route path="/book-bank" element={<StudyResourcesPage />} />
                            <Route path="/study-resources/book-bank" element={<StudyResourcesPage />} />
                            <Route path="/book-bank/:bookId" element={<BookReaderPage />} />
                            <Route path="/book-bank/:bookId/chapter/:chapterNumber" element={<BookReaderPage />} />
                            <Route path="/study-resources/book-bank/:bookId" element={<BookReaderPage />} />
                            <Route path="/study-resources/reader/:bookId" element={<BookReaderPage />} />
                            <Route path="/study-resources/reader/:bookId/:chapterNumber" element={<BookReaderPage />} />
                            <Route path="/study-resources/book-bank/class-:classLevel/:subject" element={<BookReaderPage />} />
                            <Route path="/study-resources/book/:bookId" element={<BookChaptersPage />} />
                            <Route path="/study-resources/book/:bookId/chapter/:chapterNumber" element={<ChapterDetailPage />} />
                            <Route path="/study-resources/chapters/:bookId" element={<BookChaptersPage />} />
                            <Route path="/study-resources/books/:board/:classLevel/:slug" element={<BookChaptersPage />} />
                            <Route path="/study-resources/resource/:id" element={<StudyBookDetailPage />} />
                            <Route path="/study-resources/class/:classLevel/:subject" element={<SubjectResourcesPage />} />
                            <Route path="/student/purchases" element={<ProtectedRoute><StudentPurchasesPage /></ProtectedRoute>} />

                            {/* Educational Resources & Books Routes */}
                            <Route path="/books" element={<BooksHomePage />} />
                            <Route path="/ncert" element={<BooksHomePage />} />
                            <Route path="/ncert-books" element={<BooksHomePage />} />
                            <Route path="/free-books" element={<BooksHomePage />} />
                            <Route path="/books/browse" element={<BooksListPage />} />
                            <Route path="/books/resource/:id" element={<BookDetailPage />} />
                            <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />

                            {/* Legal & Safety Routes */}
                            <Route path="/privacy" element={<PrivacyPolicyPage />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/terms-and-conditions" element={<TermsPage />} />
                            <Route path="/terms-conditions" element={<TermsPage />} />
                            <Route path="/refund" element={<RefundPolicyPage />} />
                            <Route path="/refund-policy" element={<RefundPolicyPage />} />
                            <Route path="/cancellation" element={<CancellationPolicyPage />} />
                            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
                            <Route path="/safety" element={<SafetyPage />} />
                            <Route path="/safety-trust" element={<SafetyPage />} />
                            <Route path="/how-it-works" element={<HowItWorksPage />} />
                            <Route path="/faqs" element={<FaqsPage />} />
                            <Route path="/faq" element={<FaqsPage />} />
                            <Route path="/report-issue" element={<ReportIssuePage />} />
                            <Route path="/report" element={<ReportIssuePage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/contact-us" element={<ContactPage />} />

                            {/* Student Dashboard */}
                            <Route path="/dashboard" element={<ProtectedRoute roles={['student', 'parent']}><StudentDashboardPage /></ProtectedRoute>} />
                            <Route path="/student-dashboard" element={<ProtectedRoute roles={['student', 'parent']}><StudentDashboardPage /></ProtectedRoute>} />
                            <Route path="/dashboard/*" element={<ProtectedRoute roles={['student', 'parent']}><StudentDashboardPage /></ProtectedRoute>} />
                            <Route path="/student/dashboard" element={<ProtectedRoute roles={['student', 'parent']}><StudentDashboardPage /></ProtectedRoute>} />
                            <Route path="/student/dashboard/*" element={<ProtectedRoute roles={['student', 'parent']}><StudentDashboardPage /></ProtectedRoute>} />
                            <Route path="/student/profile" element={<ProtectedRoute roles={['student', 'parent']}><ProfilePage /></ProtectedRoute>} />
                            <Route path="/purchases" element={<ProtectedRoute><StudentPurchasesPage /></ProtectedRoute>} />
                            <Route path="/saved-tutors" element={<ProtectedRoute roles={['student', 'parent']}><SavedTutorsPage /></ProtectedRoute>} />
                            <Route path="/post-requirement" element={<ProtectedRoute roles={['student', 'parent']}><PostRequirementPage /></ProtectedRoute>} />
                            <Route path="/student/requirements" element={<ProtectedRoute roles={['student', 'parent']}><StudentRequirementsPage /></ProtectedRoute>} />

                            {/* User Channels & Chat */}
                            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                            <Route path="/app/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                            <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                            {/* 💎 Subscription & Pricing Plans */}
                            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                            <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                            <Route path="/pricing" element={<SubscriptionPage />} />
                            <Route path="/plans" element={<SubscriptionPage />} />

                            {/* 404 Catch-All */}
                            <Route path="*" element={<NotFoundPage />} />
                          </Routes>
                        </div>
                        {!isChatRoute && <Footer />}
                        {!isChatRoute && <CookieConsent />}
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </div>
  );
};

const App = () => {
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user) {
        const role = (user.role || '').toString().toLowerCase().trim();
        if (window.location.pathname === '/tutor/dashboard' && (role === 'student' || role === 'parent')) {
          window.location.replace('/student/dashboard');
        } else if (window.location.pathname === '/student/dashboard' && role === 'tutor') {
          window.location.replace('/tutor/dashboard');
        }
      }
    } catch (_) {}
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
