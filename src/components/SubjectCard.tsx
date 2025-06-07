import React from 'react';
import { BookOpen, Calculator, FlaskRound as Flask, ChevronRight } from 'lucide-react';
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
          icon: BookOpen,
          gradient: 'from-blue-500 to-indigo-600',
          bgGradient: 'from-blue-50 to-indigo-50',
          courseCount: subjectCourses.length
        };
      case 'math':
        return {
          title: 'Mathematics',
          description: 'Master algebraic concepts and problem-solving',
          icon: Calculator,
          gradient: 'from-green-500 to-emerald-600',
          bgGradient: 'from-green-50 to-emerald-50',
          courseCount: subjectCourses.length
        };
      case 'chemistry':
        return {
          title: 'Chemistry',
          description: 'Understand atoms, molecules, and chemical reactions',
          icon: Flask,
          gradient: 'from-purple-500 to-pink-600',
          bgGradient: 'from-purple-50 to-pink-50',
          courseCount: subjectCourses.length
        };
    }
  };

  const config = getSubjectConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`bg-gradient-to-br ${config.bgGradient} rounded-xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-100`}
      onClick={() => onSelectSubject(subject)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{config.description}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{config.courseCount} courses</span>
        <div className="flex items-center space-x-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${config.gradient} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{totalProgress}%</span>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;