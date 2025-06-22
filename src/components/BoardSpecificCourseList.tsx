import React from 'react';
import { BookOpen, Clock, CheckCircle, Play, Star, Award, Target, Globe, GraduationCap } from 'lucide-react';
import { Course, Topic } from '../types';
import { calculateCourseProgress } from '../utils/progress';
import JEEMainDashboard from './JEEMainDashboard';
import IBToJEEBridgeProgram from './IBToJEEBridgeProgram';

interface BoardSpecificCourseListProps {
  courses: Course[];
  board: string;
  selectedSubject: string | null;
  onBack: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, topicId: string, lessonId: string) => void;
}

const BoardSpecificCourseList: React.FC<BoardSpecificCourseListProps> = ({ 
  courses, 
  board,
  selectedSubject, 
  onBack,
  onSelectCourse, 
  onSelectLesson 
}) => {
  const filteredCourses = courses.filter(course => {
    const boardMatch = course.board === board;
    const subjectMatch = selectedSubject ? course.subject === selectedSubject : true;
    return boardMatch && subjectMatch;
  });

  const getBoardConfig = (board: string) => {
    switch (board) {
      case 'jee':
        return {
          name: 'JEE Main & Advanced',
          icon: '🏗️',
          color: 'from-indigo-500 to-blue-600',
          bgColor: 'from-indigo-50 to-blue-50',
          features: ['IIT Entrance', 'Engineering Focus', 'Problem Solving']
        };
      case 'neet':
        return {
          name: 'NEET UG',
          icon: '🏥',
          color: 'from-red-500 to-pink-600',
          bgColor: 'from-red-50 to-pink-50',
          features: ['Medical Entrance', 'Conceptual Focus', 'AIIMS/JIPMER']
        };
      case 'cambridge':
        return {
          name: 'Cambridge International',
          icon: '🇬🇧',
          color: 'from-blue-500 to-indigo-600',
          bgColor: 'from-blue-50 to-indigo-50',
          features: ['IGCSE', 'AS & A Levels', 'Global Recognition']
        };
      case 'ib':
        return {
          name: 'International Baccalaureate',
          icon: '🌍',
          color: 'from-green-500 to-emerald-600',
          bgColor: 'from-green-50 to-emerald-50',
          features: ['Diploma Programme', 'Internal Assessment', 'Holistic Education']
        };
      case 'cbse':
        return {
          name: 'CBSE',
          icon: '🇮🇳',
          color: 'from-orange-500 to-red-600',
          bgColor: 'from-orange-50 to-red-50',
          features: ['NEP 2020', 'Competency Based', 'NCERT Aligned']
        };
      case 'isc':
        return {
          name: 'ISC',
          icon: '📚',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'from-purple-50 to-pink-50',
          features: ['Detailed Syllabus', 'Practical Focus', 'Comprehensive']
        };
      default:
        return {
          name: 'Board',
          icon: '📚',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'from-gray-50 to-gray-50',
          features: []
        };
    }
  };

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: '🌱',
          gradient: 'from-green-400 to-green-600'
        };
      case 'intermediate': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: '⚡',
          gradient: 'from-yellow-400 to-orange-600'
        };
      case 'advanced': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: '🔥',
          gradient: 'from-red-400 to-red-600'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: '📚',
          gradient: 'from-gray-400 to-gray-600'
        };
    }
  };

  const getSubjectConfig = (subject: string) => {
    switch (subject) {
      case 'physics': 
        return { 
          gradient: 'from-blue-500 to-indigo-600', 
          icon: '⚛️',
          bgGradient: 'from-blue-50 to-indigo-50'
        };
      case 'math': 
        return { 
          gradient: 'from-green-500 to-emerald-600', 
          icon: '📐',
          bgGradient: 'from-green-50 to-emerald-50'
        };
      case 'chemistry': 
        return { 
          gradient: 'from-purple-500 to-pink-600', 
          icon: '🧪',
          bgGradient: 'from-purple-50 to-pink-50'
        };
      default: 
        return { 
          gradient: 'from-gray-500 to-gray-600', 
          icon: '📚',
          bgGradient: 'from-gray-50 to-gray-50'
        };
    }
  };

  const boardConfig = getBoardConfig(board);

  // Special handling for JEE Main
  if (board === 'jee') {
    return (
      <JEEMainDashboard
        onSelectCourse={onSelectCourse}
        onSelectLesson={onSelectLesson}
      />
    );
  }

  // Special handling for IB to JEE Bridge Program
  if (board === 'ib-jee-bridge') {
    return (
      <IBToJEEBridgeProgram
        onSelectCourse={onSelectCourse}
        onSelectLesson={onSelectLesson}
      />
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <span className="mr-2">←</span>
        Back to Board Selection
      </button>
      
      {/* Board Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-16 h-16 bg-gradient-to-br ${boardConfig.color} rounded-2xl flex items-center justify-center shadow-lg relative`}>
            <GraduationCap className="w-8 h-8 text-white" />
            <div className="absolute -top-2 -right-2 text-2xl">{boardConfig.icon}</div>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          {boardConfig.name} Courses
        </h2>
        <p className="text-gray-600 text-lg mb-4">
          {selectedSubject ? `${selectedSubject.charAt(0).toUpperCase()}${selectedSubject.slice(1)} courses` : 'All subjects'} 
          {' '}aligned with {boardConfig.name} curriculum
        </p>
        
        {/* Board Features */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
          {boardConfig.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Available</h3>
          <p className="text-gray-600">
            Courses for {boardConfig.name} {selectedSubject ? `${selectedSubject} ` : ''}are coming soon!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCourses.map((course) => {
            const progress = calculateCourseProgress(course);
            const subjectConfig = getSubjectConfig(course.subject);
            const difficultyConfig = getDifficultyConfig(course.difficulty);
            
            return (
              <div key={course.id} className={`bg-gradient-to-br ${subjectConfig.bgGradient} rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow`}>
                <div className="p-8">
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${subjectConfig.gradient} rounded-2xl flex items-center justify-center shadow-lg relative`}>
                        <BookOpen className="w-8 h-8 text-white" />
                        <div className="absolute -top-2 -right-2 text-2xl">{subjectConfig.icon}</div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{course.title}</h3>
                          <div className="flex items-center space-x-1 bg-white bg-opacity-70 rounded-full px-3 py-1">
                            <Globe className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{course.grade}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed">{course.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${difficultyConfig.color} flex items-center space-x-1`}>
                            <span>{difficultyConfig.icon}</span>
                            <span>{course.difficulty}</span>
                          </span>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {course.totalLessons} lessons
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Target className="w-4 h-4 mr-1" />
                            {progress}% complete
                          </div>
                          {course.syllabus && (
                            <div className="flex items-center text-gray-600 text-sm">
                              <Star className="w-4 h-4 mr-1" />
                              {course.syllabus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className={`bg-gradient-to-r ${subjectConfig.gradient} h-3 rounded-full transition-all duration-500 shadow-sm relative overflow-hidden`}
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{progress}%</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center justify-end">
                        <Award className="w-4 h-4 mr-1" />
                        {course.completedLessons}/{course.totalLessons} completed
                      </p>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-4">
                    {course.topics.map((topic: Topic) => (
                      <div key={topic.id} className="bg-white bg-opacity-70 border border-gray-200 rounded-xl p-6 hover:bg-opacity-90 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
                            {topic.isCompleted ? (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white text-xs">📖</span>
                              </div>
                            )}
                            {topic.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {topic.lessons.length} lessons
                            </span>
                            {/* Board-specific indicators */}
                            {topic.boardSpecific && (
                              <div className="flex items-center space-x-1">
                                {board === 'cambridge' && topic.boardSpecific.cambridge && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {topic.boardSpecific.cambridge.paperType}
                                  </span>
                                )}
                                {board === 'ib' && topic.boardSpecific.ib?.internalAssessment && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    IA Component
                                  </span>
                                )}
                                {board === 'cbse' && topic.boardSpecific.cbse && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                    {topic.boardSpecific.cbse.chapterCode}
                                  </span>
                                )}
                                {board === 'isc' && topic.boardSpecific.isc?.practicalComponent && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Practical
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">{topic.description}</p>
                        
                        {/* Lessons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {topic.lessons.map((lesson) => (
                            <div 
                              key={lesson.id}
                              className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-colors shadow-sm border border-gray-100 group"
                              onClick={() => onSelectLesson(course.id, topic.id, lesson.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                                  lesson.isCompleted 
                                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                    : `bg-gradient-to-br ${subjectConfig.gradient}`
                                }`}>
                                  {lesson.isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  ) : (
                                    <Play className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{lesson.title}</p>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{lesson.duration} min</span>
                                    {lesson.isCompleted && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600 font-medium">✓ Completed</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BoardSpecificCourseList;