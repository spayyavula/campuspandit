import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  IndianRupee,
  Award,
  Globe,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { courseAPI, CourseDetail, Section, Lesson } from '../../services/courseAPI';
import CertificateViewer from './CertificateViewer';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseAPI.getCourse(courseId!);
      setCourse(data);

      // Expand first section by default
      if (data.sections.length > 0) {
        setExpandedSections(new Set([data.sections[0].id]));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course');
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    try {
      setEnrolling(true);
      await courseAPI.enrollInCourse(course.id);

      // Reload course to update enrollment status
      await loadCourse();

      // Navigate to learning dashboard
      navigate('/courses/my-learning');
    } catch (err: any) {
      alert(err.message || 'Failed to enroll in course');
      console.error('Enrollment error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!course?.is_enrolled && !lesson.is_preview) {
      alert('Please enroll in this course to access this lesson');
      return;
    }

    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading course...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = course.duration_minutes || 0;
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              <div className="mb-3">
                <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">{course.category}</span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>

              {course.subtitle && (
                <p className="text-xl text-gray-300 mb-6">{course.subtitle}</p>
              )}

              <p className="text-gray-300 mb-6">{course.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.average_rating.toFixed(1)}</span>
                  <span className="text-gray-400">({course.total_reviews} reviews)</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.enrollment_count.toLocaleString()} students</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{hours}h {minutes}m total</span>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.total_lessons} lessons</span>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span>{course.language}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {course.board && (
                  <span className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-sm">
                    {course.board}
                  </span>
                )}
                {course.grade_level && (
                  <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full text-sm">
                    Class {course.grade_level}
                  </span>
                )}
                <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm capitalize">
                  {course.level}
                </span>
              </div>
            </div>

            {/* Right: Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 text-gray-900 sticky top-4">
                {/* Preview Video/Thumbnail */}
                {course.promo_video_url || course.thumbnail_url ? (
                  <div className="aspect-video bg-gray-200 rounded-lg mb-6 relative overflow-hidden">
                    {course.thumbnail_url && (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    )}
                    {course.promo_video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-6 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white/50" />
                  </div>
                )}

                {/* Price */}
                {course.is_free ? (
                  <div className="text-3xl font-bold text-green-600 mb-4">FREE</div>
                ) : (
                  <div className="mb-4">
                    {course.discount_price && course.discount_price < course.price ? (
                      <div>
                        <div className="flex items-center text-3xl font-bold">
                          <IndianRupee className="w-6 h-6" />
                          {course.discount_price.toLocaleString()}
                        </div>
                        <div className="flex items-center text-lg text-gray-500 line-through">
                          <IndianRupee className="w-4 h-4" />
                          {course.price.toLocaleString()}
                        </div>
                        {course.discount_expires_at && (
                          <p className="text-sm text-red-600 mt-1">
                            Offer expires: {new Date(course.discount_expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-3xl font-bold">
                        <IndianRupee className="w-6 h-6" />
                        {course.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Enroll Button */}
                {course.is_enrolled ? (
                  <div>
                    <button
                      onClick={() => navigate('/courses/my-learning')}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold mb-3"
                    >
                      Go to My Learning
                    </button>
                    {course.enrollment && (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span>Progress:</span>
                          <span className="font-semibold">{course.enrollment.progress_percentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 rounded-full h-2"
                            style={{ width: `${course.enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                )}

                {/* Features */}
                {course.certificate_enabled && (
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span>Track your progress</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span>Lifetime access</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Section - Show if course is completed */}
      {course.is_enrolled && course.enrollment && course.enrollment.completed_at && course.enrollment.certificate_url && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              Your Certificate
            </h2>
            <p className="text-gray-600">
              Congratulations on completing this course! Download and share your certificate.
            </p>
          </div>
          <CertificateViewer
            enrollmentId={course.enrollment.id}
            certificateUrl={course.enrollment.certificate_url}
            issuedAt={course.enrollment.certificate_issued_at}
          />
        </div>
      )}

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.what_you_will_learn && course.what_you_will_learn.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.what_you_will_learn.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Course curriculum</h2>

              <div className="space-y-2">
                {course.sections.map((section) => (
                  <SectionAccordion
                    key={section.id}
                    section={section}
                    isExpanded={expandedSections.has(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    isEnrolled={course.is_enrolled}
                    onLessonClick={handleLessonClick}
                  />
                ))}
              </div>
            </div>

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Who This Course Is For */}
            {course.who_this_course_is_for && course.who_this_course_is_for.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Who this course is for</h2>
                <ul className="space-y-2">
                  {course.who_this_course_is_for.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Instructor Info */}
            {course.instructor_name && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">Instructor</h3>
                <p className="text-gray-700">{course.instructor_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section Accordion Component
function SectionAccordion({
  section,
  isExpanded,
  onToggle,
  isEnrolled,
  onLessonClick
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  isEnrolled: boolean;
  onLessonClick: (lesson: Lesson) => void;
}) {
  const totalDuration = section.lessons.reduce((sum, l) => sum + (l.video_duration || 0), 0);
  const completedLessons = section.lessons.filter(l => l.progress?.is_completed).length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          <div className="text-left">
            <h3 className="font-semibold">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {completedLessons > 0 && (
            <span className="mr-3">{completedLessons}/{section.lessons.length} completed</span>
          )}
          <span>{section.lessons.length} lessons</span>
          {totalDuration > 0 && (
            <span className="ml-3">{Math.ceil(totalDuration / 60)}min</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {section.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onLessonClick(lesson)}
              disabled={!isEnrolled && !lesson.is_preview}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3 flex-1">
                {lesson.progress?.is_completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : lesson.is_preview || isEnrolled ? (
                  <Play className="w-5 h-5 text-blue-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}

                <div className="flex-1">
                  <div className="font-medium">{lesson.title}</div>
                  {lesson.description && (
                    <div className="text-sm text-gray-600 mt-1">{lesson.description}</div>
                  )}
                  {lesson.progress && lesson.progress.completion_percentage > 0 && !lesson.progress.is_completed && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 rounded-full h-1"
                        style={{ width: `${lesson.progress.completion_percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                {lesson.is_preview && !isEnrolled && (
                  <span className="text-blue-600 font-medium">Preview</span>
                )}
                {lesson.video_duration && (
                  <span>{Math.ceil(lesson.video_duration / 60)}min</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
