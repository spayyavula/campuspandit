import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, Phone, Mail, MessageSquare, Video, X, Save } from 'lucide-react';
import { getActivities, createActivity, updateActivity, getContacts, getDeals } from '../../utils/crmAPI';
import { Button, Card, Input } from '../ui';
import CRMNav from './CRMNav';

const ActivitiesManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    activity_type: 'call' as any,
    subject: '',
    description: '',
    contact_id: '',
    deal_id: '',
    scheduled_at: '',
    status: 'scheduled' as any
  });

  useEffect(() => {
    loadActivities();
    loadContacts();
    loadDeals();
  }, []);

  // Auto-open modal if route is /new
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setShowModal(true);
      navigate('/crm/activities', { replace: true });
    }
  }, [location]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterType]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await getActivities();
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadDeals = async () => {
    try {
      const data = await getDeals({ is_closed: false });
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createActivity({
        ...formData,
        scheduled_at: formData.scheduled_at || undefined,
        deal_id: formData.deal_id || undefined
      });
      setShowModal(false);
      resetForm();
      loadActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      activity_type: 'call',
      subject: '',
      description: '',
      contact_id: '',
      deal_id: '',
      scheduled_at: '',
      status: 'scheduled'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.activity_type === filterType);
    }

    setFilteredActivities(filtered);
  };

  const handleStatusChange = async (activityId: string, newStatus: string) => {
    try {
      await updateActivity(activityId, { status: newStatus as any });
      loadActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'meeting':
        return <Video className="w-5 h-5" />;
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      call: 'bg-primary-50 text-primary-600',
      email: 'bg-secondary-50 text-secondary-600',
      meeting: 'bg-success-50 text-success-600',
      task: 'bg-warning-50 text-warning-600',
      note: 'bg-neutral-50 text-neutral-600'
    };
    return colors[type] || 'bg-neutral-50 text-neutral-600';
  };

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
              <h1 className="text-3xl font-bold text-neutral-900">Activities</h1>
              <p className="text-neutral-600 mt-1">{filteredActivities.length} total activities</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
              <option value="task">Tasks</option>
              <option value="note">Notes</option>
            </select>
          </div>
        </Card>

        {/* Activities Timeline */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No activities found</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Activity
                </Button>
              </div>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getActivityColor(activity.activity_type)}`}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs uppercase font-semibold text-neutral-500">
                          {activity.activity_type}
                        </span>
                        {activity.scheduled_at && (
                          <span className="text-xs text-neutral-500">
                            {new Date(activity.scheduled_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {activity.subject}
                      </h3>
                      {activity.description && (
                        <p className="text-neutral-600 text-sm mb-3">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        {activity.contact && (
                          <span>
                            Contact: {activity.contact.first_name} {activity.contact.last_name}
                          </span>
                        )}
                        {activity.deal && (
                          <span>
                            Deal: {activity.deal.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <select
                    value={activity.status}
                    onChange={(e) => handleStatusChange(activity.id, e.target.value)}
                    className="text-sm px-3 py-1 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Log Activity</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Activity Type *
                    </label>
                    <select
                      name="activity_type"
                      value={formData.activity_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="task">Task</option>
                      <option value="note">Note</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Subject *
                  </label>
                  <Input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Follow-up call with customer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Additional details about the activity"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact *
                  </label>
                  <select
                    name="contact_id"
                    value={formData.contact_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} - {contact.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Related Deal (Optional)
                    </label>
                    <select
                      name="deal_id"
                      value={formData.deal_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">None</option>
                      {deals.map((deal) => (
                        <option key={deal.id} value={deal.id}>
                          {deal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Scheduled Date & Time
                    </label>
                    <Input
                      type="datetime-local"
                      name="scheduled_at"
                      value={formData.scheduled_at}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    <Save className="w-4 h-4 mr-2" />
                    Log Activity
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesManager;
