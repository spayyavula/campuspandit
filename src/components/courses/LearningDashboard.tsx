import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  CheckCircle,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { courseAPI, CourseDetail, Lesson } from '../../services/courseAPI';

export default function LearningDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseAPI.getMyCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load your courses');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get next lesson to watch for a course
  const getNextLesson = (course: CourseDetail): Lesson | null => {
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (!lesson.progress?.is_completed) {
          return lesson;
        }
      }
    }
    return null; // All lessons completed
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    // Apply status filter
    if (filter === 'completed' && (!course.enrollment || course.enrollment.progress_percentage < 100)) {
      return false;
    }
    if (filter === 'in-progress' && course.enrollment?.progress_percentage === 100) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      return course.title.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  // Calculate overall statistics
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.enrollment?.progress_percentage === 100).length;
  const inProgressCourses = courses.filter(c => c.enrollment && c.enrollment.progress_percentage > 0 && c.enrollment.progress_percentage < 100).length;
  const totalWatchTime = courses.reduce((sum, c) => sum + (c.enrollment?.total_watch_time_minutes || 0), 0);
  const totalCompletedLessons = courses.reduce((sum, c) => sum + (c.enrollment?.completed_lessons || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading your courses...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">My Learning</h1>
          <p className="text-xl text-blue-100">Track your progress and continue learning</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<BookOpen className="w-8 h-8" />}
            label="Enrolled Courses"
            value={totalCourses}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="In Progress"
            value={inProgressCourses}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8" />}
            label="Completed"
            value={completedCourses}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            label="Watch Time"
            value={`${Math.floor(totalWatchTime / 60)}h`}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'in-progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Course List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadMyCourses}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No courses found' : 'No enrolled courses yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Browse our course catalog to get started'}
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Explore Courses
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onContinue={() => {
                  const nextLesson = getNextLesson(course);
                  if (nextLesson) {
                    navigate(`/courses/${course.id}/lessons/${nextLesson.id}`);
                  } else {
                    navigate(`/courses/${course.id}`);
                  }
                }}
                onViewCourse={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

// Course Card Component
function CourseCard({
  course,
  onContinue,
  onViewCourse
}: {
  course: CourseDetail;
  onContinue: () => void;
  onViewCourse: () => void;
}) {
  const enrollment = course.enrollment;
  const progress = enrollment?.progress_percentage || 0;
  const isCompleted = progress === 100;

  // Calculate time since last access
  const lastAccessed = enrollment?.last_accessed_at
    ? new Date(enrollment.last_accessed_at)
    : null;
  const daysSinceAccess = lastAccessed
    ? Math.floor((Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="md:w-80 flex-shrink-0">
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 relative">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white/50" />
              </div>
            )}

            {isCompleted && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
              {course.subtitle && (
                <p className="text-gray-600 mb-3">{course.subtitle}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {course.board && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {course.board}
                  </span>
                )}
                {course.grade_level && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                    Class {course.grade_level}
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                  {course.level}
                </span>
              </div>
            </div>

            {enrollment?.certificate_url && (
              <button
                onClick={() => window.open(enrollment.certificate_url, '_blank')}
                className="ml-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Award className="w-5 h-5" />
                Certificate
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`rounded-full h-2 ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            {enrollment && (
              <>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>{enrollment.completed_lessons} / {course.total_lessons} lessons</span>
                </div>

                {enrollment.total_watch_time_minutes > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(enrollment.total_watch_time_minutes / 60)}h watched</span>
                  </div>
                )}

                {daysSinceAccess !== null && daysSinceAccess > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {daysSinceAccess === 0
                        ? 'Accessed today'
                        : daysSinceAccess === 1
                        ? 'Accessed yesterday'
                        : `Accessed ${daysSinceAccess} days ago`}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              <Play className="w-4 h-4" />
              {isCompleted ? 'Rewatch' : progress > 0 ? 'Continue Learning' : 'Start Learning'}
            </button>

            <button
              onClick={onViewCourse}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
