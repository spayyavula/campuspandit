import React from 'react';
import { BookOpen, Clock, CheckCircle, Play } from 'lucide-react';
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'physics': return 'from-blue-500 to-indigo-600';
      case 'math': return 'from-green-500 to-emerald-600';
      case 'chemistry': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {selectedSubject ? `${selectedSubject.charAt(0).toUpperCase()}${selectedSubject.slice(1)} Courses` : 'All Courses'}
        </h2>
        <p className="text-gray-600">Expand your knowledge with our comprehensive course library</p>
      </div>

      <div className="space-y-6">
        {filteredCourses.map((course) => {
          const progress = calculateCourseProgress(course);
          
          return (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getSubjectColor(course.subject)} rounded-lg flex items-center justify-center`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-3">{course.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.totalLessons} lessons
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getSubjectColor(course.subject)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{progress}%</span>
                    </div>
                    <p className="text-sm text-gray-500">{course.completedLessons}/{course.totalLessons} completed</p>
                  </div>
                </div>

                {/* Topics */}
                <div className="space-y-3">
                  {course.topics.map((topic: Topic) => (
                    <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          {topic.isCompleted && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                          {topic.title}
                        </h4>
                        <span className="text-sm text-gray-500">{topic.lessons.length} lessons</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{topic.description}</p>
                      
                      {/* Lessons */}
                      <div className="space-y-2">
                        {topic.lessons.map((lesson) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => onSelectLesson(course.id, topic.id, lesson.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                lesson.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}>
                                {lesson.isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                  <Play className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{lesson.title}</p>
                                <p className="text-sm text-gray-500">{lesson.duration} min</p>
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