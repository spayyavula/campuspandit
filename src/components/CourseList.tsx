import React from 'react';
import { BookOpen, Clock, CheckCircle, Play, Star, Award, Target } from 'lucide-react';
import { Course, Topic } from '../types';
import { calculateCourseProgress } from '../utils/progress';

interface CourseListProps {
  courses: Course[];
  selectedSubject: string | null;
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, topicId: string, lessonId: string) => void;
}

const CourseList: React.FC<CourseListProps> = ({ 
  courses, 
  selectedSubject, 
  onSelectCourse, 
  onSelectLesson 
}) => {
  const filteredCourses = selectedSubject 
    ? courses.filter(course => course.subject === selectedSubject)
    : courses;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          {selectedSubject ? `${selectedSubject.charAt(0).toUpperCase()}${selectedSubject.slice(1)} Courses` : 'All Courses'}
        </h2>
        <p className="text-gray-600 text-lg">Expand your knowledge with our comprehensive course library</p>
      </div>

      <div className="space-y-8">
        {filteredCourses.map((course) => {
          const progress = calculateCourseProgress(course);
          const subjectConfig = getSubjectConfig(course.subject);
          const difficultyConfig = getDifficultyConfig(course.difficulty);
          
          return (
            <div key={course.id} className={`bg-gradient-to-br ${subjectConfig.bgGradient} rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow`}>
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${subjectConfig.gradient} rounded-2xl flex items-center justify-center shadow-lg relative`}>
                      <BookOpen className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 text-2xl">{subjectConfig.icon}</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
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
    </div>
  );
};

export default CourseList;