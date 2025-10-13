import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { Auth } from './components/Auth';
import AICoach from './components/coaching/AICoach';
import WeakAreaManager from './components/coaching/WeakAreaManager';
import FindTutors from './components/tutoring/FindTutors';
import TutorRegistration from './components/tutoring/TutorRegistration';
import TutorDashboard from './components/tutoring/TutorDashboard';
import EmailPreferences from './components/EmailPreferences';
import MessagingApp from './components/messaging/MessagingApp';
import CoachingAdmin from './components/admin/CoachingAdmin';
import EmailSubscribers from './components/admin/EmailSubscribers';
import TutorManagementAdmin from './components/tutoring/TutorManagementAdmin';
import CRMDashboard from './components/crm/CRMDashboard';
import ContactsManager from './components/crm/ContactsManager';
import DealsPipeline from './components/crm/DealsPipeline';
import TicketsManager from './components/crm/TicketsManager';
import { supabase } from './utils/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={!user ? <Auth onAuthStateChange={setUser} /> : <Navigate to="/coach" />} />

        {/* Protected Routes - Student */}
        <Route path="/coach" element={user ? <AICoach studentId={user.id} /> : <Navigate to="/auth" />} />
        <Route path="/weak-areas" element={user ? <WeakAreaManager studentId={user.id} /> : <Navigate to="/auth" />} />
        <Route path="/tutors" element={user ? <FindTutors /> : <Navigate to="/auth" />} />
        <Route path="/tutor/register" element={user ? <TutorRegistration /> : <Navigate to="/auth" />} />
        <Route path="/tutor/dashboard" element={user ? <TutorDashboard /> : <Navigate to="/auth" />} />
        <Route path="/messages" element={user ? <MessagingApp userId={user.id} /> : <Navigate to="/auth" />} />
        <Route path="/preferences" element={user ? <EmailPreferences /> : <Navigate to="/auth" />} />

        {/* Protected Routes - Admin */}
        <Route path="/admin/coaching" element={user ? <CoachingAdmin /> : <Navigate to="/auth" />} />
        <Route path="/admin/emails" element={user ? <EmailSubscribers /> : <Navigate to="/auth" />} />
        <Route path="/admin/tutors" element={user ? <TutorManagementAdmin /> : <Navigate to="/auth" />} />

        {/* Protected Routes - CRM */}
        <Route path="/crm" element={user ? <CRMDashboard userId={user.id} /> : <Navigate to="/auth" />} />
        <Route path="/crm/contacts" element={user ? <ContactsManager /> : <Navigate to="/auth" />} />
        <Route path="/crm/deals" element={user ? <DealsPipeline /> : <Navigate to="/auth" />} />
        <Route path="/crm/tickets" element={user ? <TicketsManager /> : <Navigate to="/auth" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;