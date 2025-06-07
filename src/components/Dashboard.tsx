import React from 'react';
import { Clock, Award, Target, TrendingUp } from 'lucide-react';
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
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Lessons Completed',
      value: `${completedLessons}/${totalLessons}`,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Study Time',
      value: '24h 30m',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Streak',
      value: '7 days',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Student!</h2>
        <p className="text-gray-600">Continue your learning journey across Physics, Math, and Chemistry</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Subject Selection */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Subject</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SubjectCard subject="physics" courses={courses} onSelectSubject={onSelectSubject} />
          <SubjectCard subject="math" courses={courses} onSelectSubject={onSelectSubject} />
          <SubjectCard subject="chemistry" courses={courses} onSelectSubject={onSelectSubject} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { subject: 'Physics', lesson: 'Velocity and Acceleration', time: '2 hours ago', completed: true },
            { subject: 'Math', lesson: 'Solving Linear Equations', time: '1 day ago', completed: true },
            { subject: 'Chemistry', lesson: 'Atomic Structure', time: '2 days ago', completed: false }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${activity.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.lesson}</p>
                  <p className="text-sm text-gray-600">{activity.subject}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;