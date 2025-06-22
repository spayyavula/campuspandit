import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Award,
  Target
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: { month: string; users: number; active: number }[];
  questionStats: { subject: string; total: number; published: number; responses: number }[];
  activityMetrics: { date: string; logins: number; questionsCreated: number; responsesSubmitted: number }[];
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
  };
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMetric, setSelectedMetric] = useState('users');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        userGrowth: [
          { month: 'Jan', users: 850, active: 680 },
          { month: 'Feb', users: 920, active: 750 },
          { month: 'Mar', users: 1050, active: 840 },
          { month: 'Apr', users: 1180, active: 950 },
          { month: 'May', users: 1320, active: 1080 },
          { month: 'Jun', users: 1450, active: 1200 }
        ],
        questionStats: [
          { subject: 'Physics', total: 1234, published: 1089, responses: 15678 },
          { subject: 'Mathematics', total: 1098, published: 945, responses: 18234 },
          { subject: 'Chemistry', total: 1124, published: 856, responses: 11567 },
          { subject: 'Biology', total: 567, published: 423, responses: 6789 }
        ],
        activityMetrics: [
          { date: '2024-01-15', logins: 245, questionsCreated: 12, responsesSubmitted: 1567 },
          { date: '2024-01-16', logins: 289, questionsCreated: 18, responsesSubmitted: 1789 },
          { date: '2024-01-17', logins: 312, questionsCreated: 15, responsesSubmitted: 1923 },
          { date: '2024-01-18', logins: 278, questionsCreated: 22, responsesSubmitted: 1654 },
          { date: '2024-01-19', logins: 334, questionsCreated: 19, responsesSubmitted: 2134 },
          { date: '2024-01-20', logins: 298, questionsCreated: 16, responsesSubmitted: 1876 }
        ],
        performanceMetrics: {
          averageResponseTime: 245,
          successRate: 99.2,
          errorRate: 0.8,
          uptime: 99.9
        }
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.users || 0],
      ['Active Users', analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.active || 0],
      ['Total Questions', analyticsData.questionStats.reduce((sum, stat) => sum + stat.total, 0)],
      ['Total Responses', analyticsData.questionStats.reduce((sum, stat) => sum + stat.responses, 0)],
      ['Success Rate', `${analyticsData.performanceMetrics.successRate}%`],
      ['Uptime', `${analyticsData.performanceMetrics.uptime}%`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights into system performance and usage</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.users.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-600 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.active.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">
              {Math.round((analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.active / 
                          analyticsData.userGrowth[analyticsData.userGrowth.length - 1]?.users) * 100)}%
            </span>
            <span className="text-gray-600 ml-1">engagement rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyticsData.questionStats.reduce((sum, stat) => sum + stat.total, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {analyticsData.questionStats.reduce((sum, stat) => sum + stat.published, 0)}
            </span>
            <span className="text-gray-600 ml-1">published</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-3xl font-bold text-gray-900">
                {analyticsData.performanceMetrics.uptime}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {analyticsData.performanceMetrics.successRate}%
            </span>
            <span className="text-gray-600 ml-1">success rate</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {analyticsData.userGrowth.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-12">{data.month}</span>
                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full relative"
                        style={{ width: `${(data.users / 1500) * 100}%` }}
                      >
                        <div 
                          className="bg-green-500 h-4 rounded-full absolute top-0 left-0"
                          style={{ width: `${(data.active / data.users) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{data.users}</div>
                  <div className="text-xs text-gray-600">{data.active} active</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Question Distribution by Subject</h3>
          
          <div className="space-y-4">
            {analyticsData.questionStats.map((stat, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
              const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
              const textColors = ['text-blue-800', 'text-green-800', 'text-purple-800', 'text-orange-800'];
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{stat.subject}</span>
                    <span className="text-sm text-gray-600">{stat.total} questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${colors[index]} h-3 rounded-full`}
                      style={{ width: `${(stat.published / stat.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 ${bgColors[index]} ${textColors[index]} rounded-full`}>
                      {stat.published} published
                    </span>
                    <span className="text-gray-600">{stat.responses} responses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Logins</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Questions Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Responses Submitted</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.activityMetrics.map((metric, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {new Date(metric.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-900">{metric.logins}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-900">{metric.questionsCreated}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-900">{metric.responsesSubmitted}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.performanceMetrics.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.performanceMetrics.successRate}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.performanceMetrics.errorRate}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.performanceMetrics.uptime}%
            </div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;