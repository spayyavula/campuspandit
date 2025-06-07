import React from 'react';
import { BookOpen, Calculator, FlaskRound as Flask, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { Course } from '../types';
import { calculateCourseProgress } from '../utils/progress';

interface SubjectCardProps {
  subject: 'physics' | 'math' | 'chemistry';
  courses: Course[];
  onSelectSubject: (subject: string) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, courses, onSelectSubject }) => {
  const subjectCourses = courses.filter(course => course.subject === subject);
  const totalProgress = subjectCourses.length > 0 
    ? Math.round(subjectCourses.reduce((sum, course) => sum + calculateCourseProgress(course), 0) / subjectCourses.length)
    : 0;

  const getSubjectConfig = () => {
    switch (subject) {
      case 'physics':
        return {
          title: 'Physics',
          description: 'Explore the fundamental laws of nature and motion',
          icon: '⚛️',
          secondaryIcon: BookOpen,
          gradient: 'from-blue-500 to-indigo-600',
          bgGradient: 'from-blue-50 to-indigo-50',
          borderGradient: 'from-blue-200 to-indigo-200',
          courseCount: subjectCourses.length,
          emoji: '🔬'
        };
      case 'math':
        return {
          title: 'Mathematics',
          description: 'Master algebraic concepts and problem-solving',
          icon: '📐',
          secondaryIcon: Calculator,
          gradient: 'from-green-500 to-emerald-600',
          bgGradient: 'from-green-50 to-emerald-50',
          borderGradient: 'from-green-200 to-emerald-200',
          courseCount: subjectCourses.length,
          emoji: '🧮'
        };
      case 'chemistry':
        return {
          title: 'Chemistry',
          description: 'Understand atoms, molecules, and chemical reactions',
          icon: '🧪',
          secondaryIcon: Flask,
          gradient: 'from-purple-500 to-pink-600',
          bgGradient: 'from-purple-50 to-pink-50',
          borderGradient: 'from-purple-200 to-pink-200',
          courseCount: subjectCourses.length,
          emoji: '⚗️'
        };
    }
  };

  const config = getSubjectConfig();
  const SecondaryIcon = config.secondaryIcon;

  return (
    <div 
      className={`relative bg-gradient-to-br ${config.bgGradient} rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-gradient-to-br ${config.borderGradient} group overflow-hidden`}
      onClick={() => onSelectSubject(subject)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 text-6xl">{config.emoji}</div>
        <div className="absolute bottom-4 left-4 text-4xl opacity-50">{config.icon}</div>
      </div>
      
      {/* Progress Badge */}
      <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white bg-opacity-90 rounded-full px-3 py-1 shadow-sm">
        <Star className="w-3 h-3 text-yellow-500" />
        <span className="text-xs font-bold text-gray-700">{totalProgress}%</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow relative`}>
              <SecondaryIcon className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 text-lg">{config.icon}</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{config.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{config.courseCount} courses</span>
                <TrendingUp className="w-3 h-3 text-green-500" />
              </div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
        
        <p className="text-gray-700 text-sm mb-6 leading-relaxed">{config.description}</p>
        
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{totalProgress}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-white bg-opacity-50 rounded-full h-3 shadow-inner">
              <div 
                className={`bg-gradient-to-r ${config.gradient} h-3 rounded-full transition-all duration-500 shadow-sm relative overflow-hidden`}
                style={{ width: `${totalProgress}%` }}
              >
                <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button className={`w-full mt-4 bg-gradient-to-r ${config.gradient} text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2`}>
          <span>Start Learning</span>
          <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;