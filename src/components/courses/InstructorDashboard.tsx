import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Edit, TrendingUp, Users, DollarSign,
  Eye, BarChart3, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import Navigation from '../Navigation';
import { coursesAPI } from '../../services/api';

interface Course {
  id: string;
  title: string;
  status: string;
  enrollment_count: number;
  average_rating: number;
  total_reviews: number;
  total_lessons: number;
  created_at: string;
  thumbnail_url?: string;
}

const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await coursesAPI.getInstructorCourses({ status_filter: statusFilter });
      setCourses(response.courses || []);
    } catch (err: any) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.status === 'published').length,
    totalStudents: courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0),
    draftCourses: courses.filter(c => c.status === 'draft').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="/instructor/dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              Instructor Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your courses and track student progress
            </p>
          </div>

          <Link
            to="/courses/create"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Course
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Published</p>
                <p className="text-3xl font-bold text-gray-900">{stats.publishedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Drafts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.draftCourses}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'published', 'draft', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first course
              </p>
              <Link
                to="/courses/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {courses.map(course => (
                <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {course.title}
                          </h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                            {course.status}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrollment_count || 0} students
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.total_lessons || 0} lessons
                        </div>
                        {course.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {course.average_rating.toFixed(1)} ({course.total_reviews} reviews)
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(course.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Link
                          to={`/courses/${course.id}/edit`}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Course
                        </Link>
                        <Link
                          to={`/courses/${course.id}/statistics`}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Statistics
                        </Link>
                        <Link
                          to={`/courses/${course.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
