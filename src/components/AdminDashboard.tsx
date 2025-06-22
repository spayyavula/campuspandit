import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  GraduationCap,
  BookOpen,
  Database
} from 'lucide-react';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import AuditLogs from './AuditLogs';
import QuestionManager from './QuestionManager';
import SystemSettings from './SystemSettings';
import AdminAnalytics from './AdminAnalytics';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  publishedQuestions: number;
  totalResponses: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'audit' | 'analytics' | 'settings' | 'questions'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalQuestions: 0,
    publishedQuestions: 0,
    totalResponses: 0,
    systemHealth: 'healthy'
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        totalQuestions: 3456,
        publishedQuestions: 2890,
        totalResponses: 45678,
        systemHealth: 'healthy'
      });

      setRecentActivity([
        {
          id: '1',
          user: 'John Doe',
          action: 'Created question',
          resource: 'Physics - Mechanics',
          timestamp: '2 minutes ago',
          status: 'success'
        },
        {
          id: '2',
          user: 'Jane Smith',
          action: 'Updated user role',
          resource: 'teacher@example.com',
          timestamp: '5 minutes ago',
          status: 'success'
        },
        {
          id: '3',
          user: 'System',
          action: 'Failed login attempt',
          resource: 'admin@example.com',
          timestamp: '10 minutes ago',
          status: 'warning'
        },
        {
          id: '4',
          user: 'Mike Johnson',
          action: 'Deleted question',
          resource: 'Chemistry - Organic',
          timestamp: '15 minutes ago',
          status: 'error'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: 'questions', label: 'Question Bank', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  if (activeTab !== 'overview') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-600">System administration and management</p>
                </div>
              </div>
              
              <button
                onClick={() => setActiveTab('overview')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Overview
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'audit' && <AuditLogs />}
          {activeTab === 'questions' && <QuestionManager />}
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System administration and management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(stats.systemHealth)}`}>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <span>System {stats.systemHealth}</span>
              </div>
              
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}%</span>
                  <span className="text-gray-600 ml-1">activity rate</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-blue-600 font-medium">{stats.publishedQuestions}</span>
                  <span className="text-gray-600 ml-1">published</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Responses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalResponses.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+8%</span>
                  <span className="text-gray-600 ml-1">this week</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Health</p>
                    <p className={`text-3xl font-bold capitalize ${
                      stats.systemHealth === 'healthy' ? 'text-green-600' :
                      stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stats.systemHealth}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stats.systemHealth === 'healthy' ? 'bg-green-100' :
                    stats.systemHealth === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Database className={`w-6 h-6 ${
                      stats.systemHealth === 'healthy' ? 'text-green-600' :
                      stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-600">All systems operational</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-600">Add, edit, or remove users</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('roles')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Role Management</p>
                    <p className="text-sm text-gray-600">Configure permissions</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Audit Logs</p>
                    <p className="text-sm text-gray-600">Track system activity</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">System Settings</p>
                    <p className="text-sm text-gray-600">Configure application</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All Logs
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityStatusColor(activity.status)}`}>
                        {activity.status === 'success' && <CheckCircle className="w-4 h-4" />}
                        {activity.status === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {activity.status === 'error' && <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          <span className="text-blue-600">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">{activity.resource}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Students</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">1,089 (87%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Teachers</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">142 (11%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Admins</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">16 (2%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Physics Questions</span>
                    <span className="text-sm font-medium text-gray-900">1,234 (36%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Math Questions</span>
                    <span className="text-sm font-medium text-gray-900">1,098 (32%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chemistry Questions</span>
                    <span className="text-sm font-medium text-gray-900">1,124 (32%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Draft Questions</span>
                    <span className="text-sm font-medium text-gray-900">566 (16%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;