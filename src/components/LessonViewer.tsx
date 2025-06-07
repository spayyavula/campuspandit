import React, { useState } from 'react';
import { ArrowLeft, Play, CheckCircle, BookOpen, ArrowRight } from 'lucide-react';
import { Course, Lesson, Exercise } from '../types';

interface LessonViewerProps {
  course: Course;
  topicId: string;
  lessonId: string;
  onBack: () => void;
  onComplete: (courseId: string, lessonId: string) => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ 
  course, 
  topicId, 
  lessonId, 
  onBack, 
  onComplete 
}) => {
  const [showExercises, setShowExercises] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [showResults, setShowResults] = useState(false);

  const topic = course.topics.find(t => t.id === topicId);
  const lesson = topic?.lessons.find(l => l.id === lessonId);

  if (!lesson || !topic) {
    return <div>Lesson not found</div>;
  }

  const handleAnswerSelect = (exerciseId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [exerciseId]: answerIndex
    }));
  };

  const handleSubmitExercises = () => {
    setShowResults(true);
  };

  const handleCompleteLesson = () => {
    onComplete(course.id, lesson.id);
    onBack();
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </button>
        
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getSubjectColor(course.subject)} rounded-lg flex items-center justify-center`}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <p className="text-gray-600">{course.title} • {topic.title}</p>
            <div className="flex items-center text-gray-500 text-sm mt-2">
              <Play className="w-4 h-4 mr-1" />
              {lesson.duration} minutes
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        {!showExercises ? (
          <div>
            <div className="prose max-w-none">
              <div className="text-lg leading-relaxed text-gray-800 mb-8">
                {lesson.content}
              </div>
              
              {/* Simulated video player */}
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-8">
                <div className="text-center">
                  <Play className="w-16 h-16 text-white mb-4 mx-auto" />
                  <p className="text-white text-lg">Video Content ({lesson.duration} min)</p>
                  <p className="text-gray-300 text-sm">Interactive lesson video would be embedded here</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {lesson.isCompleted && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Completed</span>
                  </>
                )}
              </div>
              
              <div className="flex space-x-3">
                {lesson.exercises && lesson.exercises.length > 0 && (
                  <button
                    onClick={() => setShowExercises(true)}
                    className={`px-6 py-2 bg-gradient-to-r ${getSubjectColor(course.subject)} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center`}
                  >
                    Practice Exercises
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
                <button
                  onClick={handleCompleteLesson}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Exercises</h2>
            
            <div className="space-y-6">
              {lesson.exercises?.map((exercise: Exercise, index) => (
                <div key={exercise.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Question {index + 1}: {exercise.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {exercise.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswers[exercise.id] === optionIndex;
                      const isCorrect = optionIndex === exercise.correctAnswer;
                      const showCorrect = showResults && isCorrect;
                      const showIncorrect = showResults && isSelected && !isCorrect;
                      
                      return (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(exercise.id, optionIndex)}
                          disabled={showResults}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            showCorrect
                              ? 'border-green-500 bg-green-50'
                              : showIncorrect
                              ? 'border-red-500 bg-red-50'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                        </button>
                      );
                    })}
                  </div>
                  
                  {showResults && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Explanation:</strong> {exercise.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
              <button
                onClick={() => setShowExercises(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Lesson
              </button>
              
              <div className="flex space-x-3">
                {!showResults ? (
                  <button
                    onClick={handleSubmitExercises}
                    disabled={Object.keys(selectedAnswers).length < (lesson.exercises?.length || 0)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteLesson}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Lesson
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonViewer;