import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Plus, Edit, Trash2, Save, X, Upload, Video,
  FileText, CheckCircle, AlertCircle, ArrowLeft, Eye
} from 'lucide-react';
import Navigation from '../Navigation';
import { coursesAPI } from '../../services/api';

interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_type: 'video' | 'reading' | 'quiz';
  duration_minutes: number;
  content?: string;
  video_url?: string;
  video_id?: string;
  video_status?: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  status: string;
  thumbnail_url?: string;
}

const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lesson form state
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    lesson_type: 'video' as 'video' | 'reading' | 'quiz',
    duration_minutes: 10,
    content: ''
  });

  // Video upload state
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseData = await coursesAPI.getCourse(courseId!);
      setCourse(courseData);

      // Fetch lessons separately
      const lessonsResponse = await fetch(`/api/v1/courses/${courseId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);
      } else {
        setLessons([]);
      }
    } catch (err: any) {
      setError('Failed to load course');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      description: '',
      lesson_type: 'video',
      duration_minutes: 10,
      content: ''
    });
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      lesson_type: lesson.lesson_type,
      duration_minutes: lesson.duration_minutes,
      content: lesson.content || ''
    });
    setShowLessonForm(true);
  };

  const handleSaveLesson = async () => {
    try {
      setError('');

      if (editingLesson) {
        // Update existing lesson
        await fetch(`/api/v1/lessons/${editingLesson.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            ...lessonForm,
            order_index: editingLesson.order_index
          })
        });
        setSuccess('Lesson updated successfully');
      } else {
        // Create new lesson
        await fetch(`/api/v1/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            ...lessonForm,
            course_id: courseId,
            order_index: lessons.length
          })
        });
        setSuccess('Lesson added successfully');
      }

      setShowLessonForm(false);
      fetchCourseData();
    } catch (err: any) {
      setError('Failed to save lesson');
      console.error(err);
    }
  };

  const handleVideoUpload = async (lessonId: string, file: File) => {
    try {
      setUploadingVideo(true);
      setUploadProgress(0);
      setError('');

      // Step 1: Get upload URL from backend
      const uploadResponse = await fetch(`/api/v1/lessons/${lessonId}/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type
        })
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_url, video_id } = await uploadResponse.json();

      // Step 2: Upload video to storage provider
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          setSuccess('Video uploaded successfully! Processing...');
          setUploadingVideo(false);
          fetchCourseData();
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setError('Video upload failed');
        setUploadingVideo(false);
      });

      xhr.open('PUT', upload_url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (err: any) {
      setError('Failed to upload video');
      setUploadingVideo(false);
      console.error(err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await fetch(`/api/v1/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setSuccess('Lesson deleted successfully');
      fetchCourseData();
    } catch (err: any) {
      setError('Failed to delete lesson');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="/instructor/courses" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="/instructor/courses" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
            <Link to="/instructor/dashboard" className="text-purple-600 hover:text-purple-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="/instructor/courses" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-purple-600" />
                Edit Course: {course.title}
              </h1>
              <p className="text-gray-600 mt-2">Manage your course content and lessons</p>
            </div>

            <Link
              to={`/courses/${courseId}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Lessons Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
            <button
              onClick={handleAddLesson}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons yet</h3>
              <p className="text-gray-600 mb-6">Start building your course by adding your first lesson</p>
              <button
                onClick={handleAddLesson}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Lesson
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Lesson Number */}
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-semibold">{index + 1}</span>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-gray-600 text-sm">{lesson.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.lesson_type === 'video' && (
                            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
                              <Upload className="w-4 h-4" />
                              Upload Video
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleVideoUpload(lesson.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}

                          <button
                            onClick={() => handleEditLesson(lesson)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Lesson Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {lesson.lesson_type === 'video' ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          {lesson.lesson_type}
                        </span>
                        <span>{lesson.duration_minutes} min</span>
                        {lesson.video_status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            lesson.video_status === 'ready' ? 'bg-green-100 text-green-800' :
                            lesson.video_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lesson.video_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
              </h2>
              <button
                onClick={() => setShowLessonForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lesson Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Introduction to React Hooks"
                />
              </div>

              {/* Lesson Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Type *
                </label>
                <select
                  value={lessonForm.lesson_type}
                  onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="video">Video Lesson</option>
                  <option value="reading">Reading Material</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of what students will learn"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Content (for reading type) */}
              {lessonForm.lesson_type === 'reading' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (Markdown supported)
                  </label>
                  <textarea
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="# Your content here\n\nUse markdown for formatting..."
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowLessonForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={!lessonForm.title}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingLesson ? 'Update' : 'Add'} Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {uploadingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Uploading Video...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600">{uploadProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEditor;
