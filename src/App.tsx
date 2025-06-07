import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import LessonViewer from './components/LessonViewer';
import ProgressTracker from './components/ProgressTracker';
import GameDashboard from './components/GameDashboard';
import TournamentView from './components/TournamentView';
import TeamsView from './components/TeamsView';
import QuizBattle from './components/QuizBattle';
import { courses as initialCourses } from './data/courses';
import { tournaments, activeBattles } from './data/gameData';
import { Course } from './types';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView('courses');
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const handleSelectLesson = (courseId: string, topicId: string, lessonId: string) => {
    setSelectedCourse(courseId);
    setSelectedTopic(topicId);
    setSelectedLesson(lessonId);
    setCurrentView('lesson');
  };

  const handleCompleteLesson = (courseId: string, lessonId: string) => {
    setCourses(prevCourses => {
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
    });
  };

  const handleBackToCourses = () => {
    setSelectedLesson(null);
    setSelectedTopic(null);
    setCurrentView('courses');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'dashboard') {
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

  const handleTournamentComplete = (score: number) => {
    console.log('Tournament completed with score:', score);
  };

  const handleBattleComplete = (score: number) => {
    console.log('Battle completed with score:', score);
  };

  const currentCourse = courses.find(course => course.id === selectedCourse);
  const currentTournament = tournaments.find(t => t.id === selectedTournament);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      
      {currentView === 'lesson' && selectedCourse && selectedTopic && selectedLesson && currentCourse ? (
        <LessonViewer
          course={currentCourse}
          topicId={selectedTopic}
          lessonId={selectedLesson}
          onBack={handleBackToCourses}
          onComplete={handleCompleteLesson}
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
        <GameDashboard
          onJoinTournament={handleJoinTournament}
          onJoinBattle={handleJoinBattle}
          onViewTeams={handleViewTeams}
        />
      ) : currentView === 'tournament' && currentTournament ? (
        <TournamentView
          tournament={currentTournament}
          onBack={() => setCurrentView('gaming')}
          onComplete={handleTournamentComplete}
        />
      ) : currentView === 'teams' ? (
        <TeamsView
          onBack={() => setCurrentView('gaming')}
          onJoinTeam={handleJoinTeam}
          onCreateTeam={handleCreateTeam}
        />
      ) : currentView === 'battle' ? (
        <QuizBattle
          battle={activeBattles[0]}
          onBack={() => setCurrentView('gaming')}
          onComplete={handleBattleComplete}
        />
      ) : (
        <Dashboard courses={courses} onSelectSubject={handleSelectSubject} />
      )}
    </div>
  );
}

export default App;