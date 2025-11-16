import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  List,
  X,
  BookOpen,
  Loader2
} from 'lucide-react';
import CourseVideoPlayer from './CourseVideoPlayer';
import { courseAPI, CourseDetail, Lesson, LessonProgress, Section } from '../../services/courseAPI';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (courseId && lessonId) {
      loadCourseAndLesson();
    }
  }, [courseId, lessonId]);

  const loadCourseAndLesson = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load course details
      const courseData = await courseAPI.getCourse(courseId!);
      setCourse(courseData);

      // Find current lesson
      let foundLesson: Lesson | null = null;
      for (const section of courseData.sections) {
        const lesson = section.lessons.find(l => l.id === lessonId);
        if (lesson) {
          foundLesson = lesson;
          break;
        }
      }

      if (!foundLesson) {
        throw new Error('Lesson not found');
      }

      setCurrentLesson(foundLesson);

      // Load progress
      const progressData = await courseAPI.getProgress(lessonId!);
      setProgress(progressData);
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (newProgress: LessonProgress) => {
    setProgress(newProgress);
  };

  const handleComplete = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
    } else {
      alert('Congratulations! You have completed all lessons in this course!');
      navigate(`/courses/${courseId}`);
    }
  };

  const getNextLesson = (): Lesson | null => {
    if (!course || !currentLesson) return null;

    let foundCurrent = false;
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (foundCurrent) {
          return lesson;
        }
        if (lesson.id === currentLesson.id) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const getPreviousLesson = (): Lesson | null => {
    if (!course || !currentLesson) return null;

    let previousLesson: Lesson | null = null;
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (lesson.id === currentLesson.id) {
          return previousLesson;
        }
        previousLesson = lesson;
      }
    }
    return null;
  };

  const navigateToLesson = (lesson: Lesson) => {
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <span className="ml-3 text-white">Loading lesson...</span>
      </div>
    );
  }

  if (error || !course || !currentLesson) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="text-gray-300 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Back to Course</span>
            </button>

            <div className="border-l border-gray-700 pl-4">
              <h1 className="text-white font-semibold text-lg line-clamp-1">{course.title}</h1>
              <p className="text-gray-400 text-sm line-clamp-1">{currentLesson.title}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-gray-300 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <List className="w-5 h-5" />
            <span className="hidden md:inline">Course Content</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Main Content - Video Player */}
        <div className={`flex-1 ${showSidebar ? 'lg:pr-96' : ''}`}>
          <div className="relative">
            {currentLesson.video_url ? (
              <CourseVideoPlayer
                lesson={currentLesson}
                initialProgress={progress}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleComplete}
              />
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4" />
                  <p>Video not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info and Navigation */}
          <div className="bg-gray-900 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
            {currentLesson.description && (
              <p className="text-gray-400 mb-6">{currentLesson.description}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              <button
                onClick={() => previousLesson && navigateToLesson(previousLesson)}
                disabled={!previousLesson}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous Lesson
              </button>

              <button
                onClick={() => nextLesson && navigateToLesson(nextLesson)}
                disabled={!nextLesson}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Lesson
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Course Content */}
        {showSidebar && (
          <div className="fixed top-0 right-0 h-screen w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto lg:relative lg:h-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">Course Content</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {course.sections.map((section) => (
                <SectionList
                  key={section.id}
                  section={section}
                  currentLessonId={currentLesson.id}
                  onLessonClick={navigateToLesson}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Section List Component
function SectionList({
  section,
  currentLessonId,
  onLessonClick
}: {
  section: Section;
  currentLessonId: string;
  onLessonClick: (lesson: Lesson) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Expand if this section contains the current lesson
    return section.lessons.some(l => l.id === currentLessonId);
  });

  const completedCount = section.lessons.filter(l => l.progress?.is_completed).length;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
      >
        <div className="text-left">
          <h4 className="text-white font-medium mb-1">{section.title}</h4>
          <p className="text-sm text-gray-400">
            {completedCount}/{section.lessons.length} completed
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-700">
          {section.lessons.map((lesson, index) => {
            const isCurrent = lesson.id === currentLessonId;
            const isCompleted = lesson.progress?.is_completed;

            return (
              <button
                key={lesson.id}
                onClick={() => onLessonClick(lesson)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-750 transition-colors ${
                  isCurrent ? 'bg-gray-750 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                      isCurrent ? 'border-blue-600 text-blue-600' : 'border-gray-600 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <p className={`text-sm ${isCurrent ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {lesson.title}
                  </p>
                  {lesson.video_duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil(lesson.video_duration / 60)} min
                    </p>
                  )}
                  {lesson.progress && lesson.progress.completion_percentage > 0 && !isCompleted && (
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-600 rounded-full h-1"
                        style={{ width: `${lesson.progress.completion_percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
