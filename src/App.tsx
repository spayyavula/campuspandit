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
        <Route path="/auth" element={!user ? <Auth onAuthStateChange={login} /> : <Navigate to="/coach" />} />

          {/* Protected Routes - Student */}
          <Route path="/coach" element={user ? <AICoach studentId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/weak-areas" element={user ? <WeakAreaManager studentId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/tutors" element={user ? <FindTutors /> : <Navigate to="/auth" />} />
          <Route path="/tutor/profile/:tutorId" element={user ? <TutorProfile /> : <Navigate to="/auth" />} />
          <Route path="/tutoring/tutor/:tutorId" element={user ? <TutorBooking /> : <Navigate to="/auth" />} />
          <Route path="/tutor/register" element={user ? <TutorRegistration /> : <Navigate to="/auth" />} />
          <Route path="/tutor/dashboard" element={user ? <TutorDashboard /> : <Navigate to="/auth" />} />
          <Route path="/messages" element={user ? <MessagingApp userId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/preferences" element={user ? <EmailPreferences /> : <Navigate to="/auth" />} />
          <Route path="/notebooklm" element={user ? <NotebookLMGuide studentId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/google-learn" element={user ? <GoogleLearnYourWay studentId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/openstax" element={user ? <OpenStaxHub studentId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/flashcards" element={user ? <FlashcardManager studentId={user.id} /> : <Navigate to="/auth" />} />

          {/* Protected Routes - Admin */}
          <Route path="/admin/coaching" element={user ? <ComingSoon featureName="Coaching Admin" /> : <Navigate to="/auth" />} />
          <Route path="/admin/emails" element={user ? <EmailSubscribers /> : <Navigate to="/auth" />} />
          <Route path="/admin/tutors" element={user ? <TutorManagementAdmin /> : <Navigate to="/auth" />} />

          {/* Protected Routes - CRM */}
          <Route path="/crm" element={user ? <CRMDashboard userId={user.id} /> : <Navigate to="/auth" />} />
          <Route path="/crm/contacts" element={user ? <ContactsManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/contacts/new" element={user ? <ContactsManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/deals" element={user ? <DealsPipeline /> : <Navigate to="/auth" />} />
          <Route path="/crm/deals/new" element={user ? <DealsPipeline /> : <Navigate to="/auth" />} />
          <Route path="/crm/activities" element={user ? <ActivitiesManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/activities/new" element={user ? <ActivitiesManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/tickets" element={user ? <TicketsManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/tickets/new" element={user ? <TicketsManager /> : <Navigate to="/auth" />} />
          <Route path="/crm/campaigns" element={user ? <MarketingCampaigns /> : <Navigate to="/auth" />} />
          <Route path="/crm/reports" element={user ? <ReportsAnalytics /> : <Navigate to="/auth" />} />

          {/* Protected Routes - Payment */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/history" element={user ? <PaymentHistory /> : <Navigate to="/auth" />} />

          {/* Protected Routes - Courses */}
          <Route path="/courses/my-learning" element={user ? <LearningDashboard /> : <Navigate to="/auth" />} />
          <Route path="/courses/create" element={user ? <CourseCreation /> : <Navigate to="/auth" />} />
          <Route path="/courses/:courseId/edit" element={user ? <CourseEditor /> : <Navigate to="/auth" />} />
          <Route path="/instructor/dashboard" element={user ? <InstructorDashboard /> : <Navigate to="/auth" />} />
          <Route path="/instructor/courses" element={user ? <InstructorDashboard /> : <Navigate to="/auth" />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={user ? <LessonPlayer /> : <Navigate to="/auth" />} />
          <Route path="/courses/:courseId" element={user ? <CourseDetail /> : <Navigate to="/auth" />} />
          <Route path="/courses" element={user ? <CourseCatalog /> : <Navigate to="/auth" />} />

          {/* Protected Routes - Video Library */}
          <Route path="/library" element={user ? <VideoLibrary /> : <Navigate to="/auth" />} />
          <Route path="/library/record" element={user ? <RecordingStudio /> : <Navigate to="/auth" />} />
          <Route path="/library/upload" element={user ? <UploadSession /> : <Navigate to="/auth" />} />
          <Route path="/library/:sessionId" element={user ? <VideoPlayer /> : <Navigate to="/auth" />} />

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