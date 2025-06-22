import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import BoardSelector from './components/BoardSelector';
import BoardSpecificCourseList from './components/BoardSpecificCourseList';
import LessonViewer from './components/LessonViewer';
import ProgressTracker from './components/ProgressTracker';
import GameDashboard from './components/GameDashboard';
import TournamentView from './components/TournamentView';
import TeamsView from './components/TeamsView';
import QuizBattle from './components/QuizBattle';
import PWAPrompt from './components/PWAPrompt';
import MobileOptimized from './components/MobileOptimized';
import { courses as initialCourses } from './data/courses';
import { allCoursesWithCompetitive } from './data/boardCourses';
import { tournaments, activeBattles } from './data/gameData';
import { Course } from './types';
import { offlineManager } from './utils/offline';
import { config, debugLog, isFeatureEnabled } from './config/env';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [boardCourses, setBoardCourses] = useState<Course[]>(allCoursesWithCompetitive);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Log app initialization in development
  React.useEffect(() => {
    debugLog('App initialized with config:', {
      environment: config.app.environment,
      version: config.app.version,
      features: config.features
    });
  }, []);

  // Initialize offline capabilities
  useEffect(() => {
    if (isFeatureEnabled('offlineMode')) {
      offlineManager.init().catch(console.error);
    }
    
    const handleOnline = () => {
      setIsOnline(true);
      if (isFeatureEnabled('offlineMode')) {
        offlineManager.syncWhenOnline();
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSelectBoard = (board: string) => {
    setSelectedBoard(board);
    setCurrentView('board-courses');
    setSelectedSubject(null);
    setSelectedCourse(null);
    setSelectedTopic(null);
    setSelectedLesson(null);
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    if (selectedBoard) {
      setCurrentView('board-courses');
    } else {
      setCurrentView('courses');
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const handleSelectLesson = async (courseId: string, topicId: string, lessonId: string) => {
    setSelectedCourse(courseId);
    setSelectedTopic(topicId);
    setSelectedLesson(lessonId);
    setCurrentView('lesson');

    // Cache lesson content for offline access
    const allCourses = [...courses, ...boardCourses];
    const course = allCourses.find(c => c.id === courseId);
    const topic = course?.topics.find(t => t.id === topicId);
    const lesson = topic?.lessons.find(l => l.id === lessonId);
    
    if (lesson) {
      await offlineManager.cacheLessonContent(lessonId, lesson);
    }
  };

  const handleCompleteLesson = async (courseId: string, lessonId: string) => {
    const updateCourses = (prevCourses: Course[]) => {
      return prevCourses.map(course => {
        if (course.id === courseId) {
          const updatedTopics = course.topics.map(topic => {
            const updatedLessons = topic.lessons.map(lesson => {
              if (lesson.id === lessonId) {
                return { ...lesson, isCompleted: true };
              }
              return lesson;
            });
            return { ...topic, lessons: updatedLessons };
          });
          
          // Update completed lessons count
          const completedCount = updatedTopics.reduce((count, topic) => {
            return count + topic.lessons.filter(lesson => lesson.isCompleted).length;
          }, 0);
          
          return { 
            ...course, 
            topics: updatedTopics,
            completedLessons: completedCount
          };
        }
        return course;
      });
    };

    // Update both regular courses and board courses
    setCourses(updateCourses);
    setBoardCourses(updateCourses);

    // Save progress offline
    try {
      if (isFeatureEnabled('offlineMode')) {
        await offlineManager.saveProgress(courseId, lessonId, { completed: true });
      }
    } catch (error) {
      console.error('Error saving progress offline:', error);
    }
  };

  const handleBackToCourses = () => {
    setSelectedLesson(null);
    setSelectedTopic(null);
    if (selectedBoard) {
      setCurrentView('board-courses');
    } else {
      setCurrentView('courses');
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      setSelectedSubject(null);
      setSelectedCourse(null);
      setSelectedTopic(null);
      setSelectedLesson(null);
      setSelectedTournament(null);
    } else if (view === 'board-selector') {
      setSelectedBoard(null);
      setSelectedSubject(null);
      setSelectedCourse(null);
      setSelectedTopic(null);
      setSelectedLesson(null);
      setSelectedTournament(null);
    }
  };

  const handleJoinTournament = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setCurrentView('tournament');
  };

  const handleJoinBattle = () => {
    setCurrentView('battle');
  };

  const handleViewTeams = () => {
    setCurrentView('teams');
  };

  const handleJoinTeam = (teamId: string) => {
    // Handle team joining logic
    console.log('Joining team:', teamId);
    setCurrentView('gaming');
  };

  const handleCreateTeam = () => {
    // Handle team creation logic
    console.log('Creating new team');
  };

  const handleTournamentComplete = async (score: number) => {
    console.log('Tournament completed with score:', score);
    
    // Save tournament result offline
    try {
      if (isFeatureEnabled('offlineMode')) {
        await offlineManager.saveQuizResult(selectedTournament || 'tournament', score, {});
      }
    } catch (error) {
      console.error('Error saving tournament result offline:', error);
    }
  };

  const handleBattleComplete = async (score: number) => {
    console.log('Battle completed with score:', score);
    
    // Save battle result offline
    try {
      if (isFeatureEnabled('offlineMode')) {
        await offlineManager.saveQuizResult('battle', score, {});
      }
    } catch (error) {
      console.error('Error saving battle result offline:', error);
    }
  };

  const allCourses = [...courses, ...boardCourses];
  const currentCourse = allCourses.find(course => course.id === selectedCourse);
  const currentTournament = tournaments.find(t => t.id === selectedTournament);

  return (
    <MobileOptimized>
      <div className="min-h-screen bg-gray-50 safe-area-top safe-area-bottom">
        <Header currentView={currentView} onViewChange={handleViewChange} />
        
        {currentView === 'lesson' && selectedCourse && selectedTopic && selectedLesson && currentCourse ? (
          <LessonViewer
            course={currentCourse}
            topicId={selectedTopic}
            lessonId={selectedLesson}
            onBack={handleBackToCourses}
            onComplete={handleCompleteLesson}
          />
        ) : currentView === 'board-selector' ? (
          <BoardSelector
            selectedBoard={selectedBoard}
            onSelectBoard={handleSelectBoard}
          />
        ) : currentView === 'board-courses' && selectedBoard ? (
          <BoardSpecificCourseList
            courses={boardCourses}
            selectedBoard={selectedBoard}
            selectedSubject={selectedSubject}
            onSelectCourse={handleSelectCourse}
            onSelectLesson={handleSelectLesson}
          />
        ) : currentView === 'courses' ? (
          <CourseList
            courses={courses}
            selectedSubject={selectedSubject}
            onSelectCourse={handleSelectCourse}
            onSelectLesson={handleSelectLesson}
          />
        ) : currentView === 'progress' ? (
          <ProgressTracker courses={courses} />
        ) : currentView === 'gaming' ? (
          isFeatureEnabled('gaming') ? <GameDashboard
            onJoinTournament={handleJoinTournament}
            onJoinBattle={handleJoinBattle}
            onViewTeams={handleViewTeams}
          /> : <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gaming Feature Disabled</h3>
            <p className="text-gray-600">Gaming features are currently disabled in this environment.</p>
          </div>
        ) : currentView === 'tournament' && currentTournament ? (
          isFeatureEnabled('gaming') ? <TournamentView
            tournament={currentTournament}
            onBack={() => setCurrentView('gaming')}
            onComplete={handleTournamentComplete}
          /> : null
        ) : currentView === 'teams' ? (
          isFeatureEnabled('gaming') ? <TeamsView
            onBack={() => setCurrentView('gaming')}
            onJoinTeam={handleJoinTeam}
            onCreateTeam={handleCreateTeam}
          /> : null
        ) : currentView === 'battle' ? (
          isFeatureEnabled('gaming') ? <QuizBattle
            battle={activeBattles[0]}
            onBack={() => setCurrentView('gaming')}
            onComplete={handleBattleComplete}
          /> : null
        ) : (
          <Dashboard 
            courses={courses} 
            onSelectSubject={handleSelectSubject}
            onSelectBoard={handleSelectBoard}
          />
        )}
        
        {isFeatureEnabled('pwaPrompts') && <PWAPrompt />}
      </div>
    </MobileOptimized>
  );
}

export default App;