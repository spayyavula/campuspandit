import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import BoardSelector from './components/BoardSelector';
import BoardSpecificCourseList from './components/BoardSpecificCourseList';
import GameDashboard from './components/GameDashboard';
import TournamentView from './components/TournamentView';
import TeamsView from './components/TeamsView';
import QuizBattle from './components/QuizBattle';
import ProgressTracker from './components/ProgressTracker';
import AdminDashboard from './components/AdminDashboard';
import AdminPanel from './components/AdminPanel';
import PhysicsGeneral from './components/PhysicsGeneral';
import { allCoursesWithCompetitive } from './data/boardCourses';
import { Auth } from './components/Auth';
import { supabase } from './utils/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
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

  const handleAuthStateChange = (user: any | null) => {
    setUser(user);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleBoardSelect = (board: string) => {
    setSelectedBoard(board);
    setCurrentView('board-courses');
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
  };
  const renderCurrentView = () => {
    switch (currentView) {
      case 'physics-general':
        return <PhysicsGeneral />;
      case 'dashboard':
        return (
          <Dashboard 
            courses={allCoursesWithCompetitive}
            onViewChange={handleViewChange}
            onSelectSubject={handleSelectSubject}
            onSelectBoard={handleBoardSelect}
          />
        );
      case 'courses':
        return (
          <CourseList 
            courses={allCoursesWithCompetitive}
            selectedSubject={selectedSubject}
            onSelectCourse={() => {}}
            onSelectLesson={() => {}}
          />
        );
      case 'board-selector':
        return (
          <BoardSelector 
            courses={allCoursesWithCompetitive}
            onBoardSelect={handleBoardSelect} 
          />
        );
      case 'board-courses':
        return selectedBoard ? (
          <BoardSpecificCourseList 
            courses={allCoursesWithCompetitive}
            board={selectedBoard} 
            selectedSubject={selectedSubject}
            onBack={() => setCurrentView('board-selector')} 
            onSelectCourse={() => {}}
            onSelectLesson={() => {}}
          />
        ) : (
          <BoardSelector 
            courses={allCoursesWithCompetitive}
            onBoardSelect={handleBoardSelect} 
          />
        );
      case 'gaming':
        return <GameDashboard onViewChange={handleViewChange} />;
      case 'tournament':
        return <TournamentView onBack={() => setCurrentView('gaming')} />;
      case 'teams':
        return <TeamsView onBack={() => setCurrentView('gaming')} />;
      case 'battle':
        return <QuizBattle onBack={() => setCurrentView('gaming')} />;
      case 'progress':
        return <ProgressTracker />;
      case 'admin':
        return <AdminDashboard />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return (
          <Dashboard 
            courses={allCoursesWithCompetitive}
            onViewChange={handleViewChange}
            onSelectSubject={handleSelectSubject}
            onSelectBoard={handleBoardSelect}
          />
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onAuthStateChange={handleAuthStateChange} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        user={user}
      />
      <div className="flex-1 min-w-0 safe-area-top safe-area-bottom">
        <main className="p-4 md:p-8">
         <Routes>
           <Route path="*" element={renderCurrentView()} />
         </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;