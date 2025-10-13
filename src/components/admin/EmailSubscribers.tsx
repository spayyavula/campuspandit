import React, { useState, useEffect } from 'react';
import { Mail, Download, Users, TrendingUp, Filter, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { emailMarketingAPI, EmailSubscriber } from '../../utils/emailMarketing';

/**
 * EmailSubscribers Admin Component
 * View, filter, and export email subscribers for marketing campaigns
 */
export default function EmailSubscribers() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<EmailSubscriber[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'subscribed' | 'unsubscribed'>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    loadSubscribers();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [subscribers, searchTerm, filterStatus, filterSource]);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await emailMarketingAPI.getAllSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const counts = await emailMarketingAPI.getSubscriberCount();
      setStats(counts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...subscribers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        sub =>
          sub.email.toLowerCase().includes(term) ||
          sub.name?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus === 'subscribed') {
      filtered = filtered.filter(sub => sub.subscribed);
    } else if (filterStatus === 'unsubscribed') {
      filtered = filtered.filter(sub => !sub.subscribed);
    }

    // Source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(sub => sub.source === filterSource);
    }

    setFilteredSubscribers(filtered);
  };

  const handleExportCSV = async () => {
    try {
      const csv = await emailMarketingAPI.exportSubscribersCSV(true);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'profile':
        return 'bg-green-100 text-green-800';
      case 'landing_page':
        return 'bg-purple-100 text-purple-800';
      case 'manual':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Subscribers</h1>
            <p className="text-gray-600">Manage and export your email marketing list</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Subscribers</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Conversion Rate</p>
              <p className="text-3xl font-bold mt-1">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="w-5 h-5" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="registration">Registration</option>
              <option value="profile">Profile</option>
              <option value="landing_page">Landing Page</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-600">
            Showing {filteredSubscribers.length} of {subscribers.length} subscribers
          </p>
          <button
            onClick={loadSubscribers}
            className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="text-center p-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No subscribers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferences
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{subscriber.name || 'No Name'}</div>
                        <div className="text-sm text-gray-500">{subscriber.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscriber.subscribed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscriber.subscribed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Subscribed
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Unsubscribed
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(
                          subscriber.source
                        )}`}
                      >
                        {subscriber.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(subscriber.consent_date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {subscriber.preferences?.course_updates && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Courses</span>
                        )}
                        {subscriber.preferences?.tournament_notifications && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            Tournaments
                          </span>
                        )}
                        {subscriber.preferences?.weekly_digest && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Digest</span>
                        )}
                        {subscriber.preferences?.promotional_offers && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Offers</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Marketing Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Export the CSV to import into your email marketing platform (Mailchimp, SendGrid, etc.)</li>
          <li>Use the preferences columns to segment your audience for targeted campaigns</li>
          <li>Respect unsubscribe requests to maintain compliance with email marketing laws</li>
          <li>Regularly clean your list to maintain high engagement rates</li>
        </ul>
      </div>
    </div>
  );
}
