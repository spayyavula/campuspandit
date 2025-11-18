import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Video, ArrowLeft, Loader, Film } from 'lucide-react';
import api from '../../services/api';
import { uploadVideoSimple, getVideoMetadata } from '../../services/cloudflareUpload';

const RECORDING_TYPES = [
  { value: 'tutoring_session', label: 'Tutoring Session' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'live_class', label: 'Live Class' },
  { value: 'demo', label: 'Demo' },
  { value: 'other', label: 'Other' },
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Other',
];

const GRADE_LEVELS = [
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view' },
  { value: 'enrolled', label: 'Enrolled Only', description: 'Only enrolled students' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with link' },
  { value: 'private', label: 'Private', description: 'Only you can view' },
];

export default function UploadSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recording_type: 'tutoring_session',
    subject: '',
    grade_level: '',
    board: '',
    topics: '',
    video_url: '',
    visibility: 'public',
  });

  // Check if coming from recording studio
  useEffect(() => {
    if (location.state?.videoBlob) {
      setRecordedVideoBlob(location.state.videoBlob);
      const url = URL.createObjectURL(location.state.videoBlob);
      setVideoPreviewUrl(url);

      // Get video metadata
      getVideoMetadata(location.state.videoBlob).then((metadata) => {
        setVideoDuration(metadata.duration);
      }).catch(console.error);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const uploadToCloudflare = async (blob: Blob): Promise<string> => {
    // Upload video with progress tracking
    const videoUrl = await uploadVideoSimple(blob, (progress) => {
      setUploadProgress(progress.percentage);
    });
    return videoUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subject) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if we have either a recorded video or a video URL
    if (!recordedVideoBlob && !formData.video_url) {
      alert('Please provide a video URL or record a video');
      return;
    }

    try {
      setUploading(true);

      let videoUrl = formData.video_url;

      // If we have a recorded video, upload it to Cloudflare Stream
      if (recordedVideoBlob) {
        videoUrl = await uploadToCloudflare(recordedVideoBlob);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        recording_type: formData.recording_type,
        subject: formData.subject,
        grade_level: formData.grade_level || null,
        board: formData.board || null,
        topics: formData.topics ? formData.topics.split(',').map(t => t.trim()) : [],
        video_url: videoUrl,
        visibility: formData.visibility,
      };

      const response = await api.post('/library/sessions', payload);

      alert('Session uploaded successfully!');
      navigate(`/library/${response.data.id}`);
    } catch (error: any) {
      console.error('Error uploading session:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload session. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Session</h1>
          <p className="text-gray-600">Share your recorded sessions with students</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Recorded Video Preview */}
          {recordedVideoBlob && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recorded Video Preview
              </label>
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full"
                />
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <Film className="w-4 h-4" />
                Video recorded successfully! Fill in the details below.
              </p>
            </div>
          )}

          {/* Video URL */}
          {!recordedVideoBlob && (
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://stream.cloudflare.com/... or YouTube URL"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Enter your Cloudflare Stream URL, YouTube URL, or direct video URL
            </p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to Trigonometry"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this session..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Recording Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recording Type
              </label>
              <select
                name="recording_type"
                value={formData.recording_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {RECORDING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Subject</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Grade</option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Board */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board
              </label>
              <select
                name="board"
                value={formData.board}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Board</option>
                {BOARDS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics (comma-separated)
            </label>
            <input
              type="text"
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              placeholder="e.g., Sine, Cosine, Tangent"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Visibility */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={formData.visibility === option.value}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading video...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Session
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/library')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
