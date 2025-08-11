import React from 'react';
import { Trophy, Target, Clock, TrendingUp, Award } from 'lucide-react';
import { Course } from '../types';
import { calculateCourseProgress, getSubjectProgress } from '../utils/progress';

interface ProgressTrackerProps {}

const ProgressTracker: React.FC<ProgressTrackerProps> = () => {
  // Mock courses data
  const courses: Course[] = [
    {
      id: 'physics-basics',
      title: 'Physics Fundamentals',
      description: 'Master the fundamental concepts of physics from motion to energy',
      subject: 'physics',
      board: 'general',
      grade: 'Grade 10',
      difficulty: 'beginner',
      totalLessons: 12,
      completedLessons: 8,
      topics: []
    },
    {
      id: 'math-algebra',
      title: 'Algebra Essentials',
      description: 'Build strong algebraic foundations from linear equations to quadratics',
      subject: 'math',
      board: 'general',
      grade: 'Grade 9',
      difficulty: 'beginner',
      totalLessons: 15,
      completedLessons: 10,
      topics: []
    },
    {
      id: 'chemistry-atoms',
      title: 'Atomic Structure',
      description: 'Discover the building blocks of matter and chemical bonding',
      subject: 'chemistry',
      board: 'general',
      grade: 'Grade 11',
      difficulty: 'beginner',
      totalLessons: 10,
      completedLessons: 5,
      topics: []
    }
  ];
  
  const physicsProgress = getSubjectProgress(courses, 'physics');
  const mathProgress = getSubjectProgress(courses, 'math');
  const chemistryProgress = getSubjectProgress(courses, 'chemistry');

  const overallProgress = Math.round((physicsProgress + mathProgress + chemistryProgress) / 3);

  const achievements = [
    { title: 'First Lesson', description: 'Complete your first lesson', earned: true, icon: Target },
    { title: 'Physics Explorer', description: 'Complete 5 physics lessons', earned: true, icon: Trophy },
    { title: 'Math Wizard', description: 'Complete 10 math problems', earned: false, icon: Award },
    { title: 'Chemistry Pro', description: 'Master atomic structure', earned: false, icon: TrendingUp },
  ];

  const subjectData = [
    { name: 'Physics', progress: physicsProgress, color: 'from-blue-500 to-indigo-600', courses: courses.filter(c => c.subject === 'physics') },
    { name: 'Mathematics', progress: mathProgress, color: 'from-green-500 to-emerald-600', courses: courses.filter(c => c.subject === 'math') },
    { name: 'Chemistry', progress: chemistryProgress, color: 'from-purple-500 to-pink-600', courses: courses.filter(c => c.subject === 'chemistry') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h2>
        <p className="text-gray-600">Track your learning journey and achievements</p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Overall Progress</h3>
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${overallProgress * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-900">{overallProgress}%</span>
                <p className="text-gray-600">Complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {subjectData.map((subject) => (
          <div key={subject.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{subject.name}</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">{subject.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`bg-gradient-to-r ${subject.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${subject.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {subject.courses.map((course) => (
                <div key={course.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{course.title}</p>
                    <p className="text-xs text-gray-600">{course.completedLessons}/{course.totalLessons} lessons</p>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${subject.color} h-2 rounded-full`}
                      style={{ width: `${calculateCourseProgress(course)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div 
                key={index} 
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  achievement.earned 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  achievement.earned 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                {achievement.earned && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Earned
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;