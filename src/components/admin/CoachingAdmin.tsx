import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, CheckCircle, AlertCircle, Award, BarChart3, Calendar, Download } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface CoachingAdminProps {}

interface AdminStats {
  totalStudents: number;
  studentsWithWeakAreas: number;
  totalWeakAreas: number;
  resolvedWeakAreas: number;
  activeCoachingSessions: number;
  avgAccuracyImprovement: number;
  totalRepetitionsCompleted: number;
  studentEngagementRate: number;
}

interface WeakAreaTrend {
  subject: string;
  count: number;
  avgAccuracy: number;
}

interface StudentPerformance {
  id: string;
  email: string;
  name: string;
  activeWeakAreas: number;
  resolvedWeakAreas: number;
  studyStreak: number;
  overallImprovement: number;
  lastActiveDate: string;
}

const CoachingAdmin: React.FC<CoachingAdminProps> = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    studentsWithWeakAreas: 0,
    totalWeakAreas: 0,
    resolvedWeakAreas: 0,
    activeCoachingSessions: 0,
    avgAccuracyImprovement: 0,
    totalRepetitionsCompleted: 0,
    studentEngagementRate: 0
  });
  const [weakAreaTrends, setWeakAreaTrends] = useState<WeakAreaTrend[]>([]);
  const [topStudents, setTopStudents] = useState<StudentPerformance[]>([]);
  const [strugglingStudents, setStrugglingStudents] = useState<StudentPerformance[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadAdminData();
  }, [dateRange]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadWeakAreaTrends(),
        loadStudentPerformance()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total students with weak areas
      const { data: students, error: studentsError } = await supabase
        .from('student_weak_areas')
        .select('student_id', { count: 'exact' })
        .not('student_id', 'is', null);

      if (studentsError) throw studentsError;

      const uniqueStudents = new Set(students?.map(s => s.student_id) || []);

      // Get weak area stats
      const { data: weakAreas, error: weakAreasError } = await supabase
        .from('student_weak_areas')
        .select('status, current_accuracy_percentage, initial_accuracy, current_improvement_percentage');

      if (weakAreasError) throw weakAreasError;

      const totalWeakAreas = weakAreas?.length || 0;
      const resolvedWeakAreas = weakAreas?.filter(w => w.status === 'resolved').length || 0;

      // Calculate average improvement
      const improvements = weakAreas
        ?.filter(w => w.current_improvement_percentage != null)
        .map(w => w.current_improvement_percentage) || [];
      const avgImprovement = improvements.length > 0
        ? improvements.reduce((a, b) => a + b, 0) / improvements.length
        : 0;

      // Get coaching sessions count
      const { count: sessionsCount } = await supabase
        .from('ai_coaching_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', getDateRangeStart());

      // Get repetitions completed
      const { count: repetitionsCount } = await supabase
        .from('repetition_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', getDateRangeStart());

      // Calculate engagement rate (students with recent activity)
      const { data: recentActivity } = await supabase
        .from('student_weak_areas')
        .select('student_id')
        .gte('updated_at', getDateRangeStart());

      const activeStudents = new Set(recentActivity?.map(a => a.student_id) || []);
      const engagementRate = uniqueStudents.size > 0
        ? (activeStudents.size / uniqueStudents.size) * 100
        : 0;

      setStats({
        totalStudents: uniqueStudents.size,
        studentsWithWeakAreas: uniqueStudents.size,
        totalWeakAreas: totalWeakAreas,
        resolvedWeakAreas: resolvedWeakAreas,
        activeCoachingSessions: sessionsCount || 0,
        avgAccuracyImprovement: avgImprovement,
        totalRepetitionsCompleted: repetitionsCount || 0,
        studentEngagementRate: engagementRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadWeakAreaTrends = async () => {
    try {
      const { data, error } = await supabase
        .from('student_weak_areas')
        .select('subject, current_accuracy_percentage, status')
        .eq('status', 'active');

      if (error) throw error;

      // Group by subject
      const subjectMap = new Map<string, { count: number; totalAccuracy: number }>();

      data?.forEach(area => {
        const existing = subjectMap.get(area.subject) || { count: 0, totalAccuracy: 0 };
        subjectMap.set(area.subject, {
          count: existing.count + 1,
          totalAccuracy: existing.totalAccuracy + (area.current_accuracy_percentage || 0)
        });
      });

      const trends: WeakAreaTrend[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        count: data.count,
        avgAccuracy: data.count > 0 ? data.totalAccuracy / data.count : 0
      }));

      trends.sort((a, b) => b.count - a.count);
      setWeakAreaTrends(trends);
    } catch (error) {
      console.error('Error loading weak area trends:', error);
    }
  };

  const loadStudentPerformance = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('student_coaching_dashboard')
        .select('*');

      if (error) throw error;

      // Get user details
      const studentIds = studentsData?.map(s => s.student_id) || [];
      const { data: usersData } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .in('id', studentIds);

      const students: StudentPerformance[] = studentsData?.map(student => {
        const user = usersData?.find(u => u.id === student.student_id);
        return {
          id: student.student_id,
          email: user?.email || 'Unknown',
          name: user?.raw_user_meta_data?.name || 'Unknown',
          activeWeakAreas: student.active_weak_areas || 0,
          resolvedWeakAreas: student.resolved_areas || 0,
          studyStreak: student.current_study_streak || 0,
          overallImprovement: student.monthly_improvement || 0,
          lastActiveDate: student.last_coaching_session || new Date().toISOString()
        };
      }) || [];

      // Top performers (most resolved weak areas and high improvement)
      const top = [...students]
        .filter(s => s.resolvedWeakAreas > 0)
        .sort((a, b) => {
          const scoreA = a.resolvedWeakAreas * 10 + a.overallImprovement + a.studyStreak;
          const scoreB = b.resolvedWeakAreas * 10 + b.overallImprovement + b.studyStreak;
          return scoreB - scoreA;
        })
        .slice(0, 10);

      // Struggling students (many active weak areas, low engagement)
      const struggling = [...students]
        .filter(s => s.activeWeakAreas > 3)
        .sort((a, b) => {
          const scoreA = a.activeWeakAreas * 10 - a.studyStreak;
          const scoreB = b.activeWeakAreas * 10 - b.studyStreak;
          return scoreB - scoreA;
        })
        .slice(0, 10);

      setTopStudents(top);
      setStrugglingStudents(struggling);
    } catch (error) {
      console.error('Error loading student performance:', error);
    }
  };

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        now.setDate(now.getDate() - 7);
        return now.toISOString();
      case 'month':
        now.setMonth(now.getMonth() - 1);
        return now.toISOString();
      case 'all':
        return '2000-01-01T00:00:00.000Z';
      default:
        return now.toISOString();
    }
  };

  const handleExportData = async () => {
    try {
      // Fetch all relevant data
      const { data: weakAreas } = await supabase
        .from('student_weak_areas')
        .select('*');

      const { data: sessions } = await supabase
        .from('ai_coaching_sessions')
        .select('*');

      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange,
        stats,
        weakAreaTrends,
        topStudents,
        strugglingStudents,
        weakAreas,
        sessions
      };

      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coaching-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600">Loading coaching analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              AI Coaching Analytics
            </h1>
            <p className="text-gray-600 mt-1">Monitor coaching system effectiveness and student progress</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Students</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">with weak areas</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Weak Areas</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalWeakAreas}</p>
          <p className="text-sm text-green-600 mt-1">{stats.resolvedWeakAreas} resolved</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Improvement</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgAccuracyImprovement.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">accuracy gain</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Engagement Rate</p>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.studentEngagementRate.toFixed(0)}%</p>
          <p className="text-sm text-gray-500 mt-1">students active</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-700">Coaching Sessions</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.activeCoachingSessions}</p>
          <p className="text-xs text-gray-500 mt-1">generated in period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-700">Repetitions Completed</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalRepetitionsCompleted}</p>
          <p className="text-xs text-gray-500 mt-1">scheduled practices done</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Resolution Rate</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalWeakAreas > 0 ? ((stats.resolvedWeakAreas / stats.totalWeakAreas) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">weak areas resolved</p>
        </div>
      </div>

      {/* Weak Area Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Weak Area Trends by Subject
        </h2>
        <div className="space-y-4">
          {weakAreaTrends.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No weak area data available</p>
          ) : (
            weakAreaTrends.map((trend) => (
              <div key={trend.subject}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium capitalize text-gray-900">{trend.subject}</span>
                    <span className="text-sm text-gray-600">{trend.count} weak areas</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Avg: {trend.avgAccuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        trend.avgAccuracy >= 70 ? 'bg-green-500' :
                        trend.avgAccuracy >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${trend.avgAccuracy}%` }}
                    />
                  </div>
                  <div className="w-16 bg-purple-100 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full"
                      style={{ width: `${(trend.count / weakAreaTrends[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Student Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Top Performers
          </h2>
          <div className="space-y-3">
            {topStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No data available</p>
            ) : (
              topStudents.map((student, index) => (
                <div key={student.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Resolved</p>
                      <p className="text-lg font-bold text-green-600">{student.resolvedWeakAreas}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Active</p>
                      <p className="font-semibold">{student.activeWeakAreas}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Streak</p>
                      <p className="font-semibold">{student.studyStreak} days</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Growth</p>
                      <p className="font-semibold">+{student.overallImprovement.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Struggling Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Needs Attention
          </h2>
          <div className="space-y-3">
            {strugglingStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No students need attention</p>
            ) : (
              strugglingStudents.map((student, index) => (
                <div key={student.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-600">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Weak Areas</p>
                      <p className="text-lg font-bold text-red-600">{student.activeWeakAreas}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Resolved</p>
                      <p className="font-semibold">{student.resolvedWeakAreas}</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Streak</p>
                      <p className="font-semibold">{student.studyStreak} days</p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <p className="text-gray-600">Last Active</p>
                      <p className="font-semibold">
                        {Math.floor((Date.now() - new Date(student.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))}d ago
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachingAdmin;
