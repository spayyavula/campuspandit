import React, { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, Clock, Award, TrendingUp, Calendar, Download, RefreshCw, Filter, ChevronDown, ChevronUp, CheckSquare, Target, Zap, Brain } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    usersByRole: { role: string; count: number }[];
    userActivity: { date: string; count: number }[];
  };
  courseStats: {
    totalCourses: number;
    totalLessons: number;
    mostPopularCourses: { id: string; title: string; enrollments: number; completionRate: number }[];
    courseEngagement: { course: string; views: number; completions: number; avgRating: number }[];
  };
  learningStats: {
    totalTimeSpent: number; // in hours
    avgSessionDuration: number; // in minutes
    completionRates: { subject: string; rate: number }[];
    quizPerformance: { subject: string; avgScore: number }[];
  };
  discussionStats: {
    totalTopics: number;
    totalReplies: number;
    activeDiscussions: { id: string; title: string; replies: number; lastActivity: string }[];
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    users: true,
    courses: true,
    learning: true,
    discussions: true
  });

  // Sample analytics data
  const generateSampleData = (range: '7d' | '30d' | '90d' | '1y'): AnalyticsData => {
    // Adjust data based on time range
    const multiplier = range === '7d' ? 1 : range === '30d' ? 4 : range === '90d' ? 12 : 48;
    
    return {
      userStats: {
        totalUsers: 1250 + (multiplier * 50),
        activeUsers: 850 + (multiplier * 30),
        newUsers: 75 + (multiplier * 5),
        usersByRole: [
          { role: 'student', count: 1100 + (multiplier * 40) },
          { role: 'teacher', count: 120 + (multiplier * 8) },
          { role: 'admin', count: 30 + (multiplier * 2) }
        ],
        userActivity: Array.from({ length: multiplier > 30 ? 30 : multiplier }, (_, i) => ({
          date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
          count: Math.floor(Math.random() * 50) + 100
        })).reverse()
      },
      courseStats: {
        totalCourses: 45 + (multiplier * 2),
        totalLessons: 1250 + (multiplier * 50),
        mostPopularCourses: [
          { id: '1', title: 'Advanced Physics', enrollments: 450 + (multiplier * 20), completionRate: 68 },
          { id: '2', title: 'Organic Chemistry', enrollments: 380 + (multiplier * 15), completionRate: 72 },
          { id: '3', title: 'Calculus for JEE', enrollments: 420 + (multiplier * 18), completionRate: 65 },
          { id: '4', title: 'Biology: Human Physiology', enrollments: 310 + (multiplier * 12), completionRate: 78 },
          { id: '5', title: 'Algebra and Coordinate Geometry', enrollments: 350 + (multiplier * 14), completionRate: 70 }
        ],
        courseEngagement: [
          { course: 'Physics', views: 12500 + (multiplier * 500), completions: 850 + (multiplier * 30), avgRating: 4.7 },
          { course: 'Chemistry', views: 10800 + (multiplier * 450), completions: 720 + (multiplier * 25), avgRating: 4.8 },
          { course: 'Mathematics', views: 11500 + (multiplier * 480), completions: 780 + (multiplier * 28), avgRating: 4.6 },
          { course: 'Biology', views: 8900 + (multiplier * 350), completions: 620 + (multiplier * 22), avgRating: 4.9 }
        ]
      },
      learningStats: {
        totalTimeSpent: 8500 + (multiplier * 350), // hours
        avgSessionDuration: 45 + (multiplier * 0.5), // minutes
        completionRates: [
          { subject: 'Physics', rate: 68 + (multiplier * 0.2) },
          { subject: 'Chemistry', rate: 72 + (multiplier * 0.2) },
          { subject: 'Mathematics', rate: 65 + (multiplier * 0.2) },
          { subject: 'Biology', rate: 78 + (multiplier * 0.2) }
        ],
        quizPerformance: [
          { subject: 'Physics', avgScore: 76 + (multiplier * 0.1) },
          { subject: 'Chemistry', avgScore: 72 + (multiplier * 0.1) },
          { subject: 'Mathematics', avgScore: 68 + (multiplier * 0.1) },
          { subject: 'Biology', avgScore: 82 + (multiplier * 0.1) }
        ]
      },
      discussionStats: {
        totalTopics: 350 + (multiplier * 15),
        totalReplies: 2800 + (multiplier * 120),
        activeDiscussions: [
          { 
            id: '1', 
            title: 'Understanding Quantum Entanglement', 
            replies: 8 + Math.floor(multiplier * 0.5), 
            lastActivity: format(subDays(new Date(), 1), 'yyyy-MM-dd') 
          },
          { 
            id: '2', 
            title: 'Help with Organic Chemistry Reaction Mechanisms', 
            replies: 5 + Math.floor(multiplier * 0.3), 
            lastActivity: format(subDays(new Date(), 2), 'yyyy-MM-dd') 
          },
          { 
            id: '3', 
            title: 'Integration Techniques for JEE Advanced', 
            replies: 3 + Math.floor(multiplier * 0.2), 
            lastActivity: format(subDays(new Date(), 3), 'yyyy-MM-dd') 
          },
          { 
            id: '4', 
            title: 'Cell Division Process Animation Resources', 
            replies: 6 + Math.floor(multiplier * 0.4), 
            lastActivity: format(subDays(new Date(), 4), 'yyyy-MM-dd') 
          },
          { 
            id: '5', 
            title: 'Coordinate Geometry Problem Set Solutions', 
            replies: 4 + Math.floor(multiplier * 0.3), 
            lastActivity: format(subDays(new Date(), 5), 'yyyy-MM-dd') 
          }
        ]
      }
    };
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real app, fetch analytics from Supabase
      // For now, use sample data
      setTimeout(() => {
        setAnalyticsData(generateSampleData(timeRange));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
    }
  };

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
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
          <p className="text-gray-600">Comprehensive insights into platform performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>{getTimeRangeLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 hidden">
              <div className="py-1">
                <button
                  onClick={() => setTimeRange('7d')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setTimeRange('90d')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Last 90 Days
                </button>
                <button
                  onClick={() => setTimeRange('1y')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Last Year
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.userStats.totalUsers)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+{Math.round(analyticsData.userStats.newUsers / analyticsData.userStats.totalUsers * 100)}%</span>
            <span className="text-gray-600 ml-1">from previous {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Course Enrollments</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analyticsData.courseStats.mostPopularCourses.reduce((sum, course) => sum + course.enrollments, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-600 ml-1">from previous {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Hours</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(analyticsData.learningStats.totalTimeSpent)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-600 ml-1">from previous {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(analyticsData.learningStats.completionRates.reduce((sum, item) => sum + item.rate, 0) / analyticsData.learningStats.completionRates.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-600 ml-1">from previous {timeRange}</span>
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            User Analytics
          </h3>
          <button
            onClick={() => toggleSection('users')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expandedSections.users ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.users && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Growth Chart */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-4">User Activity</h4>
                <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Daily Active Users</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {Math.round(analyticsData.userStats.userActivity.reduce((sum, day) => sum + day.count, 0) / analyticsData.userStats.userActivity.length)} users/day
                    </div>
                  </div>
                  
                  <div className="relative h-48">
                    {/* This would be a real chart in a production app */}
                    <div className="absolute inset-0 flex items-end">
                      {analyticsData.userStats.userActivity.map((day, index) => (
                        <div 
                          key={index} 
                          className="flex-1 mx-0.5 bg-blue-500 rounded-t-sm"
                          style={{ height: `${(day.count / 150) * 100}%` }}
                          title={`${day.date}: ${day.count} users`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">User Distribution</h4>
                <div className="space-y-4">
                  {analyticsData.userStats.usersByRole.map((role, index) => {
                    const percentage = Math.round((role.count / analyticsData.userStats.totalUsers) * 100);
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 capitalize">{role.role}s</span>
                          <span className="text-sm text-gray-600">{formatNumber(role.count)} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">New Users</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-1">This {timeRange}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.userStats.newUsers)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 mb-1">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">24.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-green-600" />
            Course Analytics
          </h3>
          <button
            onClick={() => toggleSection('courses')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expandedSections.courses ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.courses && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Popular Courses */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-4">Most Popular Courses</h4>
                <div className="space-y-4">
                  {analyticsData.courseStats.mostPopularCourses.map((course, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{course.title}</h5>
                        <span className="text-sm text-gray-600">{formatNumber(course.enrollments)} enrollments</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full bg-green-500"
                            style={{ width: `${course.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{course.completionRate}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Completion rate</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Engagement */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Subject Engagement</h4>
                <div className="space-y-4">
                  {analyticsData.courseStats.courseEngagement.map((subject, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{subject.course}</h5>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-600">{subject.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Views</p>
                          <p className="font-medium text-gray-900">{formatNumber(subject.views)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completions</p>
                          <p className="font-medium text-gray-900">{formatNumber(subject.completions)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Learning Performance
          </h3>
          <button
            onClick={() => toggleSection('learning')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expandedSections.learning ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.learning && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completion Rates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Completion Rates by Subject</h4>
                <div className="space-y-4">
                  {analyticsData.learningStats.completionRates.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                        <span className="text-sm text-gray-600">{subject.rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            subject.rate >= 75 ? 'bg-green-500' :
                            subject.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${subject.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz Performance */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Quiz Performance by Subject</h4>
                <div className="space-y-4">
                  {analyticsData.learningStats.quizPerformance.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                        <span className="text-sm text-gray-600">{subject.avgScore.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            subject.avgScore >= 75 ? 'bg-green-500' :
                            subject.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${subject.avgScore}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-4">Learning Time Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.learningStats.totalTimeSpent)}</p>
                    <p className="text-sm text-purple-800">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.learningStats.avgSessionDuration.toFixed(1)}</p>
                    <p className="text-sm text-purple-800">Avg. Session (min)</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">Learning Achievements</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">84%</p>
                    <p className="text-sm text-blue-800">Goal Completion</p>
                  </div>
                  <div className="text-center">
                    <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">1,250</p>
                    <p className="text-sm text-blue-800">Badges Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discussion Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
            Discussion Analytics
          </h3>
          <button
            onClick={() => toggleSection('discussions')}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expandedSections.discussions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedSections.discussions && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 text-center">
                <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.discussionStats.totalTopics)}</p>
                <p className="text-sm text-orange-800">Total Topics</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 text-center">
                <MessageCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.discussionStats.totalReplies)}</p>
                <p className="text-sm text-orange-800">Total Replies</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 text-center">
                <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.discussionStats.totalReplies / analyticsData.discussionStats.totalTopics)}</p>
                <p className="text-sm text-orange-800">Avg. Replies per Topic</p>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-4">Most Active Discussions</h4>
            <div className="space-y-4">
              {analyticsData.discussionStats.activeDiscussions.map((discussion, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{discussion.title}</h5>
                    <span className="text-sm text-gray-600">{discussion.replies} replies</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Last activity: {format(new Date(discussion.lastActivity), 'MMM d, yyyy')}</span>
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;