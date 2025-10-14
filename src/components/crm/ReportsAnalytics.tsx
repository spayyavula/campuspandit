import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  CheckSquare,
  Ticket,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  getDashboardStats,
  getSalesPipeline,
  getContactSummary,
  getTicketStats
} from '../../utils/crmAPI';
import { Button, Card } from '../ui';
import CRMNav from './CRMNav';

interface DashboardStats {
  total_contacts: number;
  total_deals: number;
  pending_tasks: number;
  open_tickets: number;
  total_revenue: number;
  deals_this_month: number;
}

const ReportsAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    total_contacts: 0,
    total_deals: 0,
    pending_tasks: 0,
    open_tickets: 0,
    total_revenue: 0,
    deals_this_month: 0
  });
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [contactSummary, setContactSummary] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [statsData, pipelineData, contactData, ticketData] = await Promise.all([
        getDashboardStats(),
        getSalesPipeline(),
        getContactSummary(),
        getTicketStats()
      ]);

      setStats(statsData || stats);
      setPipeline(pipelineData || []);
      setContactSummary(contactData || []);
      setTicketStats(ticketData || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-success-500 to-success-600',
      textColor: 'text-success-600',
      bgColor: 'bg-success-50',
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Total Contacts',
      value: stats.total_contacts,
      icon: Users,
      color: 'from-primary-500 to-primary-600',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Active Deals',
      value: stats.total_deals,
      icon: Target,
      color: 'from-secondary-500 to-secondary-600',
      textColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      change: '+15.3%',
      trend: 'up'
    },
    {
      title: 'Deals This Month',
      value: stats.deals_this_month,
      icon: Calendar,
      color: 'from-warning-500 to-warning-600',
      textColor: 'text-warning-600',
      bgColor: 'bg-warning-50',
      change: '+22.1%',
      trend: 'up'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <CRMNav />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Reports & Analytics</h1>
              <p className="text-neutral-600 mt-1">Track your CRM performance and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="primary">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trend === 'up' ? 'text-success-600' : 'text-error-600'}`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Sales Pipeline */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Sales Pipeline Analysis</h2>
          {pipeline.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Deals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Avg Deal Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Win Probability
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {pipeline.map((stage, index) => (
                      <tr key={index} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-neutral-900 capitalize">
                            {stage.stage.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-neutral-900">{stage.deal_count}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-success-600">
                            ₹{(stage.total_value || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-neutral-600">
                            ₹{(stage.avg_deal_size || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{ width: `${stage.avg_probability || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-neutral-600">
                              {(stage.avg_probability || 0).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No pipeline data available</p>
              </div>
            </Card>
          )}
        </div>

        {/* Contact Summary & Ticket Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Summary */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Contact Summary</h2>
            {contactSummary.length > 0 ? (
              <Card>
                <div className="space-y-3">
                  {contactSummary.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900 capitalize">
                          {item.contact_type} - {item.status}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {item.new_this_month > 0 && `${item.new_this_month} new this month`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neutral-900">{item.total_contacts}</p>
                        {item.avg_lead_score > 0 && (
                          <p className="text-xs text-neutral-500">
                            Score: {item.avg_lead_score.toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No contact data available</p>
                </div>
              </Card>
            )}
          </div>

          {/* Ticket Stats */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Support Tickets</h2>
            {ticketStats.length > 0 ? (
              <Card>
                <div className="space-y-3">
                  {ticketStats.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-neutral-500" />
                        <div>
                          <p className="font-medium text-neutral-900 capitalize">{item.status}</p>
                          <p className="text-sm text-neutral-600 capitalize">
                            Priority: {item.priority}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neutral-900">{item.ticket_count}</p>
                        {item.avg_satisfaction > 0 && (
                          <p className="text-xs text-success-600">
                            {item.avg_satisfaction.toFixed(1)}⭐
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No ticket data available</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-700 font-medium mb-1">Best Converting Stage</p>
                  <p className="text-2xl font-bold text-primary-900">Qualification</p>
                  <p className="text-sm text-primary-600 mt-1">85% conversion rate</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-success-50 to-success-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-success-700 font-medium mb-1">Top Contact Source</p>
                  <p className="text-2xl font-bold text-success-900">Website</p>
                  <p className="text-sm text-success-600 mt-1">45% of all leads</p>
                </div>
                <Users className="w-8 h-8 text-success-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-warning-50 to-warning-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-warning-700 font-medium mb-1">Avg Response Time</p>
                  <p className="text-2xl font-bold text-warning-900">2.5 hrs</p>
                  <p className="text-sm text-warning-600 mt-1">12% faster than last month</p>
                </div>
                <CheckSquare className="w-8 h-8 text-warning-600" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
