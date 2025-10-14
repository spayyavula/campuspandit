import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, TrendingUp, Target, Clock, CheckCircle, AlertCircle, Flame, Trophy, BookOpen, Calendar, LogOut, MessageCircle, Users, BarChart3, Settings, Notebook, GraduationCap, Book } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import {
  getWeakAreas,
  getCoachingSessions,
  getRecommendations,
  getLatestAnalytics,
  getUpcomingRepetitions,
  generateDailyCoachingSession,
  performComprehensiveWeakAreaAnalysis,
  markCoachingSessionViewed,
  updateRecommendationStatus,
  WeakArea,
  CoachingSession,
  CoachingRecommendation,
  PerformanceAnalytics,
  RepetitionSchedule
} from '../../utils/coachingAI';

interface AICoachProps {
  studentId: string;
}

const AICoach: React.FC<AICoachProps> = ({ studentId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [latestSession, setLatestSession] = useState<CoachingSession | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [upcomingRepetitions, setUpcomingRepetitions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'weak-areas' | 'recommendations' | 'analytics'>('overview');

  useEffect(() => {
    loadCoachingData();
  }, [studentId]);

  const loadCoachingData = async () => {
    try {
      setLoading(true);

      const [
        weakAreasData,
        sessionsData,
        recommendationsData,
        analyticsData,
        repetitionsData
      ] = await Promise.all([
        getWeakAreas(studentId),
        getCoachingSessions(studentId, 1),
        getRecommendations(studentId, 'pending'),
        getLatestAnalytics(studentId, 'weekly'),
        getUpcomingRepetitions(studentId, 7)
      ]);

      setWeakAreas(weakAreasData || []);
      setLatestSession(sessionsData?.[0] || null);
      setRecommendations(recommendationsData || []);
      setAnalytics(analyticsData || null);
      setUpcomingRepetitions(repetitionsData || []);

      // Mark session as viewed
      if (sessionsData?.[0] && !sessionsData[0].student_viewed) {
        await markCoachingSessionViewed(sessionsData[0].id);
      }
    } catch (error) {
      // Silently handle errors - empty data is normal for new users
      console.log('Loading coaching data... Some data may not be available yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWeakAreas = async () => {
    try {
      setAnalyzing(true);
      await performComprehensiveWeakAreaAnalysis(studentId);
      await loadCoachingData();
    } catch (error) {
      console.error('Error analyzing weak areas:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateCoaching = async () => {
    try {
      setAnalyzing(true);
      await generateDailyCoachingSession(studentId);
      await loadCoachingData();
    } catch (error) {
      console.error('Error generating coaching session:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecommendationAction = async (id: string, action: 'start' | 'complete' | 'dismiss') => {
    try {
      const status = action === 'start' ? 'in_progress' : action === 'complete' ? 'completed' : 'dismissed';
      await updateRecommendationStatus(id, status);
      await loadCoachingData();
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600">Loading your AI coach...</p>
        </div>
      </div>
    );
  }

  const activeWeakAreas = weakAreas.filter(w => w.status === 'active');
  const improvingAreas = weakAreas.filter(w => w.status === 'improving');
  const resolvedAreas = weakAreas.filter(w => w.status === 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CampusPandit</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <Link
                to="/coach"
                className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                AI Coach
              </Link>
              <Link
                to="/weak-areas"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Weak Areas
              </Link>
              <Link
                to="/tutors"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Tutors
              </Link>
              <Link
                to="/messages"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Messages
              </Link>
              <Link
                to="/crm"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                CRM
              </Link>
              <Link
                to="/notebooklm"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Notebook className="w-4 h-4" />
                NotebookLM
              </Link>
              <Link
                to="/google-learn"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                Google Learn
              </Link>
              <Link
                to="/openstax"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Book className="w-4 h-4" />
                OpenStax
              </Link>
              <Link
                to="/preferences"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="ml-2 px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-8 h-8 text-purple-600" />
                AI Coach
              </h1>
              <p className="text-gray-600 mt-1">Your personalized learning companion</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAnalyzeWeakAreas}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                {analyzing ? 'Analyzing...' : 'Analyze Weak Areas'}
              </button>
              <button
                onClick={handleGenerateCoaching}
                disabled={analyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {analyzing ? 'Generating...' : 'Generate Coaching'}
              </button>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {latestSession?.motivational_message && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Today's Motivation</h3>
              <p className="text-purple-800">{latestSession.motivational_message}</p>
            </div>
          </div>
        </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Weak Areas</p>
                <p className="text-3xl font-bold text-red-600">{activeWeakAreas.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Improving</p>
                <p className="text-3xl font-bold text-yellow-600">{improvingAreas.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{resolvedAreas.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                <p className="text-3xl font-bold text-purple-600">{analytics?.study_streak_days || 0}</p>
              </div>
              <Flame className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('weak-areas')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'weak-areas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Weak Areas ({activeWeakAreas.length})
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'recommendations'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recommendations ({recommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Priority Actions */}
              {latestSession?.priority_actions && latestSession.priority_actions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Priority Actions
                  </h3>
                  <div className="space-y-2">
                    {latestSession.priority_actions.map((action, index) => (
                      <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-900">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Repetitions */}
              {upcomingRepetitions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Repetitions (Next 7 Days)
                  </h3>
                  <div className="space-y-2">
                    {upcomingRepetitions.slice(0, 5).map((rep) => (
                      <div key={rep.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">
                              {rep.student_weak_areas.topic} - {rep.student_weak_areas.subject}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Repetition #{rep.repetition_number} • {rep.content_type} • ~{rep.estimated_duration_minutes} min
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-900">
                              {new Date(rep.scheduled_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-blue-700">
                              Current: {rep.student_weak_areas.current_accuracy_percentage?.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Weak Areas */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Top Priority Weak Areas
                </h3>
                <div className="space-y-2">
                  {activeWeakAreas.slice(0, 5).map((area) => (
                    <div key={area.id} className={`p-4 border rounded-lg ${getSeverityColor(area.weakness_severity)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{area.topic}</span>
                            <span className="text-xs px-2 py-1 bg-white rounded-full">
                              {area.subject}
                            </span>
                            <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">
                              {area.weakness_severity}
                            </span>
                          </div>
                          <p className="text-sm opacity-80">{area.identification_reason}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span>Accuracy: {area.current_accuracy_percentage?.toFixed(1)}%</span>
                            <span>Target: {area.target_accuracy_percentage}%</span>
                            <span>Repeated: {area.times_repeated}/{area.target_repetitions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weak Areas Tab */}
          {activeTab === 'weak-areas' && (
            <div className="space-y-3">
              {activeWeakAreas.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">No Active Weak Areas!</p>
                  <p className="text-gray-600">You're doing great! Keep up the good work.</p>
                </div>
              ) : (
                weakAreas.filter(w => w.status !== 'resolved').map((area) => (
                  <div key={area.id} className={`p-6 border rounded-lg ${getSeverityColor(area.weakness_severity)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold">{area.topic}</h4>
                          <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">
                            {area.subject}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">
                            {area.weakness_severity}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            area.status === 'improving' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {area.status}
                          </span>
                        </div>
                        <p className="text-sm mb-3">{area.identification_reason}</p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress to Target</span>
                            <span>{area.current_accuracy_percentage?.toFixed(1)}% / {area.target_accuracy_percentage}%</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2">
                            <div
                              className="bg-current rounded-full h-2 transition-all"
                              style={{ width: `${(area.current_accuracy_percentage || 0) / area.target_accuracy_percentage * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="opacity-70">Attempts</p>
                            <p className="font-semibold">{area.attempts_count}</p>
                          </div>
                          <div>
                            <p className="opacity-70">Failures</p>
                            <p className="font-semibold">{area.failures_count}</p>
                          </div>
                          <div>
                            <p className="opacity-70">Repetitions</p>
                            <p className="font-semibold">{area.times_repeated}/{area.target_repetitions}</p>
                          </div>
                          <div>
                            <p className="opacity-70">Improvement</p>
                            <p className="font-semibold">{area.current_improvement_percentage?.toFixed(1) || 0}%</p>
                          </div>
                        </div>

                        {/* AI Recommendations */}
                        {area.ai_recommendations && area.ai_recommendations.length > 0 && (
                          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold mb-2">AI Recommendations:</p>
                            <ul className="text-xs space-y-1">
                              {area.ai_recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">No Recommendations Yet</p>
                  <p className="text-gray-600">Generate a coaching session to get personalized recommendations.</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="bg-white p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold">{rec.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                            {rec.recommendation_type}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{rec.description}</p>

                        {rec.rationale && (
                          <p className="text-sm text-gray-600 mb-3 italic">Why: {rec.rationale}</p>
                        )}

                        {/* Action Steps */}
                        {rec.action_steps && rec.action_steps.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">Action Steps:</p>
                            <ul className="text-sm space-y-1">
                              {rec.action_steps.map((step: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-600">✓</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {rec.estimated_time_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              ~{rec.estimated_time_hours}h
                            </span>
                          )}
                          {rec.tutor_required && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              Tutor Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'start')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'complete')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleRecommendationAction(rec.id, 'dismiss')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {analytics ? (
                <>
                  {/* Weekly Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-700 mb-1">Study Hours</p>
                        <p className="text-2xl font-bold text-purple-900">{analytics.total_study_hours?.toFixed(1)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700 mb-1">Flashcards</p>
                        <p className="text-2xl font-bold text-blue-900">{analytics.total_flashcards_reviewed}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 mb-1">Problems Solved</p>
                        <p className="text-2xl font-bold text-green-900">{analytics.total_problems_solved}</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-700 mb-1">Tutor Sessions</p>
                        <p className="text-2xl font-bold text-orange-900">{analytics.total_tutor_sessions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subject-wise Accuracy */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Subject-wise Accuracy</h3>
                    <div className="space-y-3">
                      {['physics', 'mathematics', 'chemistry', 'biology'].map((subject) => {
                        const accuracy = analytics[`${subject}_accuracy` as keyof PerformanceAnalytics] as number || 0;
                        return (
                          <div key={subject}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize font-medium">{subject}</span>
                              <span className="font-semibold">{accuracy.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  accuracy >= 80 ? 'bg-green-500' :
                                  accuracy >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${accuracy}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consistency */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Study Consistency</h3>
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Consistency Score</p>
                          <p className="text-3xl font-bold text-purple-900">{analytics.study_consistency_score?.toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Days Studied</p>
                          <p className="text-3xl font-bold text-blue-900">{analytics.days_studied_this_period}/7</p>
                        </div>
                      </div>
                      <div className="w-full bg-white rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-3 transition-all"
                          style={{ width: `${analytics.study_consistency_score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">No Analytics Yet</p>
                  <p className="text-gray-600">Study for a week to see your analytics.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AICoach;
