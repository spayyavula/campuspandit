import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  Ticket,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Target,
  Megaphone
} from 'lucide-react';
import { getDashboardStats, getSalesPipeline } from '../../utils/crmAPI';
import { Button, Card } from '../ui';

interface CRMDashboardProps {
  userId: string;
}

const CRMDashboard: React.FC<CRMDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_contacts: 0,
    total_deals: 0,
    pending_tasks: 0,
    open_tickets: 0,
    total_revenue: 0,
    deals_this_month: 0
  });
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, pipelineData] = await Promise.all([
        getDashboardStats(userId),
        getSalesPipeline()
      ]);
      setStats(statsData || stats);
      setPipeline(pipelineData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats.total_contacts,
      icon: Users,
      color: 'from-primary-500 to-primary-600',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      link: '/crm/contacts'
    },
    {
      title: 'Active Deals',
      value: stats.total_deals,
      icon: DollarSign,
      color: 'from-success-500 to-success-600',
      textColor: 'text-success-600',
      bgColor: 'bg-success-50',
      link: '/crm/deals'
    },
    {
      title: 'Pending Tasks',
      value: stats.pending_tasks,
      icon: CheckSquare,
      color: 'from-secondary-500 to-secondary-600',
      textColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      link: '/crm/tasks'
    },
    {
      title: 'Open Tickets',
      value: stats.open_tickets,
      icon: Ticket,
      color: 'from-error-500 to-error-600',
      textColor: 'text-error-600',
      bgColor: 'bg-error-50',
      link: '/crm/tickets'
    }
  ];

  const quickActions = [
    {
      title: 'Add Contact',
      description: 'Create new lead or customer',
      icon: Users,
      color: 'primary',
      action: () => navigate('/crm/contacts/new')
    },
    {
      title: 'New Deal',
      description: 'Start tracking opportunity',
      icon: DollarSign,
      color: 'success',
      action: () => navigate('/crm/deals/new')
    },
    {
      title: 'Log Activity',
      description: 'Record call, email or meeting',
      icon: Phone,
      color: 'secondary',
      action: () => navigate('/crm/activities/new')
    },
    {
      title: 'Create Ticket',
      description: 'Log customer service request',
      icon: Ticket,
      color: 'error',
      action: () => navigate('/crm/tickets/new')
    }
  ];

  const modules = [
    {
      title: 'Contacts & Leads',
      description: 'Manage your contacts and leads',
      icon: Users,
      count: stats.total_contacts,
      color: 'primary',
      link: '/crm/contacts'
    },
    {
      title: 'Deals Pipeline',
      description: 'Track sales opportunities',
      icon: Target,
      count: stats.total_deals,
      color: 'success',
      link: '/crm/deals'
    },
    {
      title: 'Activities',
      description: 'Calls, emails, meetings',
      icon: Calendar,
      count: 0,
      color: 'secondary',
      link: '/crm/activities'
    },
    {
      title: 'Marketing',
      description: 'Email campaigns & automation',
      icon: Megaphone,
      count: 0,
      color: 'warning',
      link: '/crm/campaigns'
    },
    {
      title: 'Service Tickets',
      description: 'Customer support requests',
      icon: Ticket,
      count: stats.open_tickets,
      color: 'error',
      link: '/crm/tickets'
    },
    {
      title: 'Reports',
      description: 'Analytics & insights',
      icon: BarChart3,
      count: 0,
      color: 'neutral',
      link: '/crm/reports'
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
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">CRM Dashboard</h1>
              <p className="text-neutral-600 mt-1">Manage your sales, marketing, and customer service</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/crm/contacts/new')}>
              <Users className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-neutral-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${action.color}-50 flex items-center justify-center flex-shrink-0`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{action.title}</h3>
                    <p className="text-sm text-neutral-600 mt-1">{action.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sales Pipeline */}
        {pipeline.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Sales Pipeline</h2>
              <Button variant="ghost" onClick={() => navigate('/crm/deals')}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {pipeline.map((stage, index) => (
                  <div
                    key={index}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-neutral-900 capitalize">
                        {stage.stage.replace('_', ' ')}
                      </h3>
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                        {stage.deal_count}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      ₹{(stage.total_value || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Avg: ₹{(stage.avg_deal_size || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Modules Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">CRM Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => navigate(module.link)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg bg-${module.color}-50 flex items-center justify-center`}>
                        <module.icon className={`w-5 h-5 text-${module.color}-600`} />
                      </div>
                      <h3 className="font-semibold text-neutral-900">{module.title}</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{module.description}</p>
                    {module.count > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-neutral-900">{module.count}</span>
                        <span className="text-sm text-neutral-500">items</span>
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity placeholder */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">No recent activity</p>
              <p className="text-sm text-neutral-500 mt-1">
                Start by adding contacts or creating deals
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
