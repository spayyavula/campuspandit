import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-neutral-600">Loading...</p>
    </div>
  </div>
);

// Critical - Load immediately (used on landing/auth)
import LandingPage from './components/LandingPage';
import { Auth } from './components/Auth';
import ComingSoon from './components/ComingSoon';

// Secondary public landing (student-facing variant of the B2B homepage)
const LandingPageStudent = lazy(() => import('./components/LandingPageStudent'));

// Blog
const Blog = lazy(() => import('./components/Blog'));
const BlogPost = lazy(() => import('./components/BlogPost'));

// Lazy load all other routes for better performance
// Coaching
const AICoach = lazy(() => import('./components/coaching/AICoach'));
const WeakAreaManager = lazy(() => import('./components/coaching/WeakAreaManager'));

// Tutoring
const FindTutors = lazy(() => import('./components/tutoring/FindTutors'));
const TutorRegistration = lazy(() => import('./components/tutoring/TutorRegistration'));
const TutorDashboard = lazy(() => import('./components/tutoring/TutorDashboard'));
const TutorBooking = lazy(() => import('./components/tutoring/TutorBooking'));
const TutorProfile = lazy(() => import('./components/tutoring/TutorProfile'));

// Settings
const EmailPreferences = lazy(() => import('./components/EmailPreferences'));

// Messaging
const MessagingApp = lazy(() => import('./components/messaging/MessagingApp'));

// Admin
// const CoachingAdmin = lazy(() => import('./components/admin/CoachingAdmin')); // Temporarily disabled
const EmailSubscribers = lazy(() => import('./components/admin/EmailSubscribers'));
const TutorManagementAdmin = lazy(() => import('./components/tutoring/TutorManagementAdmin'));

// CRM
const CRMDashboard = lazy(() => import('./components/crm/CRMDashboard'));
const ContactsManager = lazy(() => import('./components/crm/ContactsManager'));
const DealsPipeline = lazy(() => import('./components/crm/DealsPipeline'));
const TicketsManager = lazy(() => import('./components/crm/TicketsManager'));
const ActivitiesManager = lazy(() => import('./components/crm/ActivitiesManager'));
const MarketingCampaigns = lazy(() => import('./components/crm/MarketingCampaigns'));
const ReportsAnalytics = lazy(() => import('./components/crm/ReportsAnalytics'));

// Learning
const NotebookLMGuide = lazy(() => import('./components/learning/NotebookLMGuide'));
const GoogleLearnYourWay = lazy(() => import('./components/learning/GoogleLearnYourWay'));
const OpenStaxHub = lazy(() => import('./components/learning/OpenStaxHub'));
const FlashcardManager = lazy(() => import('./components/learning/FlashcardManager'));

// Payment
const PaymentSuccess = lazy(() => import('./components/payment/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./components/payment/PaymentFailure'));
const PaymentHistory = lazy(() => import('./components/payment/PaymentHistory'));

// Courses
const CourseCatalog = lazy(() => import('./components/courses/CourseCatalog'));
const CourseDetail = lazy(() => import('./components/courses/CourseDetail'));
const LearningDashboard = lazy(() => import('./components/courses/LearningDashboard'));
const LessonPlayer = lazy(() => import('./components/courses/LessonPlayer'));
const CourseCreation = lazy(() => import('./components/courses/CourseCreation'));
const CourseEditor = lazy(() => import('./components/courses/CourseEditor'));
const InstructorDashboard = lazy(() => import('./components/courses/InstructorDashboard'));

// Video Library
const VideoLibrary = lazy(() => import('./components/library/VideoLibrary'));
const VideoPlayer = lazy(() => import('./components/library/VideoPlayer'));
const UploadSession = lazy(() => import('./components/library/UploadSession'));
const RecordingStudio = lazy(() => import('./components/library/RecordingStudio'));

const ParkedRoute: React.FC = () => <Navigate to="/" replace />;

const AppRoutes: React.FC = () => {
  const { user, loading, login } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/for-students" element={<LandingPageStudent />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/auth" element={<ParkedRoute />} />

          {/* Protected Routes - Student */}
          <Route path="/coach" element={<ParkedRoute />} />
          <Route path="/weak-areas" element={<ParkedRoute />} />
          <Route path="/tutors" element={<ParkedRoute />} />
          <Route path="/tutor/profile/:tutorId" element={<ParkedRoute />} />
          <Route path="/tutoring/tutor/:tutorId" element={<ParkedRoute />} />
          <Route path="/tutor/register" element={<ParkedRoute />} />
          <Route path="/tutor/dashboard" element={<ParkedRoute />} />
          <Route path="/messages" element={<ParkedRoute />} />
          <Route path="/preferences" element={<ParkedRoute />} />
          <Route path="/notebooklm" element={<ParkedRoute />} />
          <Route path="/google-learn" element={<ParkedRoute />} />
          <Route path="/openstax" element={<ParkedRoute />} />
          <Route path="/flashcards" element={<ParkedRoute />} />

          {/* Protected Routes - Admin */}
          <Route path="/admin/coaching" element={<ParkedRoute />} />
          <Route path="/admin/emails" element={<ParkedRoute />} />
          <Route path="/admin/tutors" element={<ParkedRoute />} />

          {/* Protected Routes - CRM */}
          <Route path="/crm" element={<ParkedRoute />} />
          <Route path="/crm/contacts" element={<ParkedRoute />} />
          <Route path="/crm/contacts/new" element={<ParkedRoute />} />
          <Route path="/crm/deals" element={<ParkedRoute />} />
          <Route path="/crm/deals/new" element={<ParkedRoute />} />
          <Route path="/crm/activities" element={<ParkedRoute />} />
          <Route path="/crm/activities/new" element={<ParkedRoute />} />
          <Route path="/crm/tickets" element={<ParkedRoute />} />
          <Route path="/crm/tickets/new" element={<ParkedRoute />} />
          <Route path="/crm/campaigns" element={<ParkedRoute />} />
          <Route path="/crm/reports" element={<ParkedRoute />} />

          {/* Protected Routes - Payment */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/history" element={<ParkedRoute />} />

          {/* Protected Routes - Courses */}
          <Route path="/courses/my-learning" element={<ParkedRoute />} />
          <Route path="/courses/create" element={<ParkedRoute />} />
          <Route path="/courses/:courseId/edit" element={<ParkedRoute />} />
          <Route path="/instructor/dashboard" element={<ParkedRoute />} />
          <Route path="/instructor/courses" element={<ParkedRoute />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<ParkedRoute />} />
          <Route path="/courses/:courseId" element={<ParkedRoute />} />
          <Route path="/courses" element={<ParkedRoute />} />

          {/* Protected Routes - Video Library */}
          <Route path="/library" element={<ParkedRoute />} />
          <Route path="/library/record" element={<ParkedRoute />} />
          <Route path="/library/upload" element={<ParkedRoute />} />
          <Route path="/library/:sessionId" element={<ParkedRoute />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;