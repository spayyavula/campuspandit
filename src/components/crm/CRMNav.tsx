import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  Ticket,
  Megaphone,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

const CRMNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/crm',
      description: 'CRM Overview'
    },
    {
      title: 'Contacts',
      icon: Users,
      path: '/crm/contacts',
      description: 'Manage Contacts'
    },
    {
      title: 'Deals',
      icon: Target,
      path: '/crm/deals',
      description: 'Sales Pipeline'
    },
    {
      title: 'Activities',
      icon: Calendar,
      path: '/crm/activities',
      description: 'Tasks & Events'
    },
    {
      title: 'Tickets',
      icon: Ticket,
      path: '/crm/tickets',
      description: 'Support Tickets'
    },
    {
      title: 'Marketing',
      icon: Megaphone,
      path: '/crm/campaigns',
      description: 'Campaigns'
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/crm/reports',
      description: 'Analytics'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3 overflow-x-auto">
          {/* Back to Home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </button>

          <div className="w-px h-8 bg-neutral-200 flex-shrink-0" />

          {/* CRM Navigation */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all flex-shrink-0 ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                title={item.description}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : ''}`} />
                <span className="text-sm whitespace-nowrap">{item.title}</span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CRMNav;
