import React, { useState } from 'react';
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
import { allCoursesWithCompetitive } from './data/boardCourses';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 min-w-0 safe-area-top safe-area-bottom">
        <main className="p-4 md:p-8">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default App;