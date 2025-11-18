import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, ThumbsUp, Calendar, User, BookOpen, Upload, Video } from 'lucide-react';

interface RecordedSession {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  subject: string;
  grade_level: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  recorded_at: string;
  recording_type: string;
}

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: '',
    search: ''
  });

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.gradeLevel) params.append('grade_level', filters.gradeLevel);
      if (filters.search) params.append('search', filters.search);

      const apiUrl = import.meta.env.VITE_API_BASE_URL ||
        'https://campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io/api/v1';

      const response = await fetch(`${apiUrl}/library/sessions?${params}`);
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/library/record')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Video className="w-5 h-5" />
                Record Session
              </button>
              <button
                onClick={() => navigate('/library/upload')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload Session
              </button>
            </div>
          </div>
          <p className="text-gray-600">Browse recorded sessions and lectures</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />

            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>

            <select
              value={filters.gradeLevel}
              onChange={(e) => setFilters({ ...filters, gradeLevel: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Grades</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No sessions found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onClick={() => navigate(`/library/${session.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onClick }: { session: RecordedSession; onClick: () => void }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div onClick={onClick} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {session.thumbnail_url ? (
          <img src={session.thumbnail_url} alt={session.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {session.duration_seconds > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
            {formatDuration(session.duration_seconds)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{session.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{session.instructor_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{session.subject} • {session.grade_level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(session.recorded_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{session.view_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{session.like_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
