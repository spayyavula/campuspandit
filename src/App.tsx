import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import BoardSelector from './components/BoardSelector';
import BoardSpecificCourseList from './components/BoardSpecificCourseList';
import GameDashboard from './components/GameDashboard';
import TournamentView from './components/TournamentView';
import TeamsView from './components/TeamsView';
import QuizBattle from './components/QuizBattle';
import ProgressTracker from './components/ProgressTracker';
import QuestionManager from './components/QuestionManager';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleBoardSelect = (board: string) => {
    setSelectedBoard(board);
    setCurrentView('board-courses');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'courses':
        return <CourseList />;
      case 'board-selector':
        return <BoardSelector onBoardSelect={handleBoardSelect} />;
      case 'board-courses':
        return selectedBoard ? (
          <BoardSpecificCourseList 
            board={selectedBoard} 
            onBack={() => setCurrentView('board-selector')} 
          />
        ) : (
          <BoardSelector onBoardSelect={handleBoardSelect} />
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
      case 'questions':
        return <QuestionManager />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;