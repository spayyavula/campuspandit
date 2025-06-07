import React from 'react';
import { Clock, Award, Target, TrendingUp, Zap, BookOpen, Users, Trophy } from 'lucide-react';
import { Course } from '../types';
import { getTotalProgress } from '../utils/progress';
import SubjectCard from './SubjectCard';

interface DashboardProps {
  courses: Course[];
  onSelectSubject: (subject: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, onSelectSubject }) => {
  const totalProgress = getTotalProgress(courses);
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);

  const stats = [
    {
      title: 'Overall Progress',
      value: `${totalProgress}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      emoji: '🎯'
    },
    {
      title: 'Lessons Completed',
      value: `${completedLessons}/${totalLessons}`,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-green-600',
      emoji: '🏆'
    },
    {
      title: 'Study Time',
      value: '24h 30m',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-500 to-purple-600',
      emoji: '⏰'
    },
    {
      title: 'Streak',
      value: '7 days',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-500 to-orange-600',
      emoji: '🔥'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">👋</span>
          </div>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
          Welcome back, Student!
        </h2>
        <p className="text-gray-600 text-lg">Continue your learning journey across Physics, Math, and Chemistry</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow relative`}>
                  <Icon className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 text-lg">{stat.emoji}</div>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Subject Selection */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Subject</h3>
          <p className="text-gray-600">Select a subject to start your learning adventure</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SubjectCard subject="physics" courses={courses} onSelectSubject={onSelectSubject} />
          <SubjectCard subject="math" courses={courses} onSelectSubject={onSelectSubject} />
          <SubjectCard subject="chemistry" courses={courses} onSelectSubject={onSelectSubject} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
            <p className="text-gray-600">Your latest learning progress</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { subject: 'Physics', lesson: 'Velocity and Acceleration', time: '2 hours ago', completed: true, icon: '⚛️', color: 'from-blue-500 to-indigo-600' },
            { subject: 'Math', lesson: 'Solving Linear Equations', time: '1 day ago', completed: true, icon: '📐', color: 'from-green-500 to-emerald-600' },
            { subject: 'Chemistry', lesson: 'Atomic Structure', time: '2 days ago', completed: false, icon: '🧪', color: 'from-purple-500 to-pink-600' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${activity.color} rounded-xl flex items-center justify-center shadow-lg relative`}>
                  <span className="text-lg">{activity.icon}</span>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    activity.completed ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {activity.completed ? (
                      <span className="text-white text-xs">✓</span>
                    ) : (
                      <span className="text-white text-xs">⏳</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activity.lesson}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{activity.subject}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activity.completed ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;