import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, Eye, Calendar, User, BookOpen, ArrowLeft, Download, Share2 } from 'lucide-react';
import api from '../../services/api';

interface RecordedSession {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  subject: string;
  grade_level: string;
  board?: string;
  topics?: string[];
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  recorded_at: string;
  recording_type: string;
  attachments?: Array<{ name: string; url: string }>;
}

export default function VideoPlayer() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<RecordedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL ||
        'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/library/sessions/${sessionId}`, { headers });
      const data = await response.json();
      setSession(data);
      setLikeCount(data.like_count);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.post(`/library/sessions/${sessionId}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.like_count);
    } catch (error) {
      console.error('Error liking session:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h2>
          <button
            onClick={() => navigate('/library')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/library')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              <div className="aspect-video">
                {session.video_url ? (
                  session.video_url.includes('youtube.com') || session.video_url.includes('youtu.be') ? (
                    <iframe
                      className="w-full h-full"
                      src={session.video_url.replace('watch?v=', 'embed/')}
                      title={session.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : session.video_url.includes('cloudflare') ? (
                    <iframe
                      className="w-full h-full"
                      src={session.video_url}
                      title={session.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      className="w-full h-full"
                      controls
                      poster={session.thumbnail_url}
                    >
                      <source src={session.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <p className="text-white">Video not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{session.title}</h1>

              {/* Engagement Bar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span>{session.view_count} views</span>
                </div>

                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    liked
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>

                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{session.description}</p>
              </div>

              {/* Topics */}
              {session.topics && session.topics.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {session.attachments && session.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {session.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Instructor Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Instructor</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{session.instructor_name}</p>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{session.subject}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Grade {session.grade_level}</span>
                </div>

                {session.board && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Board:</span>
                    <span>{session.board}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Duration:</span>
                  <span>{formatDuration(session.duration_seconds)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Recorded:</span>
                  <span>{new Date(session.recorded_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">{session.recording_type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
