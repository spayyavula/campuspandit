import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, DollarSign, Users, Star, TrendingUp,
  Video, CheckCircle, XCircle, AlertCircle, Settings, Loader
} from 'lucide-react';
import { tutorAPI, sessionAPI, TutorProfile, TutoringSession } from '../../utils/tutoringAPI';
import { supabase } from '../../utils/supabase';
import VideoCallInterface from '../video/VideoCallInterface';
import { sessionAPI as newSessionAPI } from '../../services/sessionAPI';

/**
 * TutorDashboard Component
 * Dashboard for tutors to manage their sessions, earnings, and profile
 */
export default function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TutoringSession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalHours: 0,
    averageRating: 0,
    totalEarnings: 0
  });
  const [activeVideoSession, setActiveVideoSession] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get tutor profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await tutorAPI.getTutorByUserId(user.id);
      if (!profile) return;

      setTutorProfile(profile);

      // Get sessions
      const allSessions = await sessionAPI.getUserSessions();
      setSessions(allSessions);

      // Filter upcoming sessions
      const upcoming = allSessions.filter(
        s => s.status === 'scheduled' && new Date(s.scheduled_start) > new Date()
      );
      setUpcomingSessions(upcoming);

      // Calculate stats
      const totalHours = profile.total_hours_taught || 0;
      const totalSessions = profile.total_sessions || 0;
      const averageRating = profile.average_rating || 0;
      const totalEarnings = totalHours * profile.hourly_rate_usd;

      setStats({
        totalSessions,
        totalHours,
        averageRating,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    const result = await sessionAPI.updateSessionStatus(sessionId, status);
    if (result.success) {
      loadDashboardData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const joinVideoCall = async (sessionId: string) => {
    try {
      setActiveVideoSession(sessionId);
    } catch (error) {
      console.error('Error joining video call:', error);
      alert('Failed to join video call. Please try again.');
    }
  };

  const handleLeaveCall = () => {
    setActiveVideoSession(null);
    loadDashboardData(); // Refresh session data
  };

  const canJoinSession = (session: TutoringSession) => {
    const scheduledStart = new Date(session.scheduled_start);
    const now = new Date();
    const fifteenMinutesEarly = new Date(scheduledStart.getTime() - 15 * 60 * 1000);

    return now >= fifteenMinutesEarly && session.status !== 'completed' && session.status !== 'cancelled';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: 'Scheduled' },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Confirmed' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Video, text: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tutorProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tutor Profile Found</h3>
          <p className="text-gray-500">Please complete your tutor registration first.</p>
        </div>
      </div>
    );
  }

  // Show video interface if in active call
  if (activeVideoSession) {
    return (
      <VideoCallInterface
        sessionId={activeVideoSession}
        onLeave={handleLeaveCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {tutorProfile.full_name}!</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>

        {/* Verification Status */}
        {tutorProfile.verification_status === 'pending' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Profile Under Review</p>
              <p>Your profile is being reviewed by our team. You'll be notified once it's approved.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-blue-100 text-sm font-medium">Total Sessions</p>
            <p className="text-3xl font-bold mt-1">{stats.totalSessions}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-200" />
            </div>
            <p className="text-green-100 text-sm font-medium">Hours Taught</p>
            <p className="text-3xl font-bold mt-1">{stats.totalHours.toFixed(1)}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
            <p className="text-yellow-100 text-sm font-medium">Average Rating</p>
            <p className="text-3xl font-bold mt-1">{stats.averageRating.toFixed(1)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
            <p className="text-purple-100 text-sm font-medium">Total Earnings</p>
            <p className="text-3xl font-bold mt-1">${stats.totalEarnings.toFixed(0)}</p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Upcoming Sessions ({upcomingSessions.length})
          </h2>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{session.subject}</h3>
                        {getStatusBadge(session.status!)}
                      </div>
                      {session.topic && (
                        <p className="text-sm text-gray-600 mb-2">{session.topic}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.scheduled_start)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.scheduled_start)} - {formatTime(session.scheduled_end)}
                        </span>
                        <span>{session.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canJoinSession(session) ? (
                        <button
                          onClick={() => joinVideoCall(session.id!)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join Session
                        </button>
                      ) : session.status === 'scheduled' && (
                        <button
                          onClick={() => updateSessionStatus(session.id!, 'confirmed')}
                          className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Sessions Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Sessions</h2>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No sessions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(session.scheduled_start)}
                          </div>
                          <div className="text-gray-500">{formatTime(session.scheduled_start)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{session.subject}</div>
                          {session.topic && <div className="text-gray-500">{session.topic}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{session.duration_minutes} min</td>
                      <td className="px-4 py-3">{getStatusBadge(session.status!)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${session.price_usd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
