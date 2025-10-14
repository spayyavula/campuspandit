import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Send,
  Play,
  Pause,
  CheckCircle,
  X,
  Save
} from 'lucide-react';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  Campaign
} from '../../utils/crmAPI';
import { Button, Card, Input } from '../ui';
import CRMNav from './CRMNav';

const MarketingCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    campaign_type: 'email',
    status: 'draft',
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, filterStatus, filterType]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((c) => c.campaign_type === filterType);
    }

    setFilteredCampaigns(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign?.id) {
        await updateCampaign(editingCampaign.id, formData);
      } else {
        await createCampaign(formData);
      }
      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData(campaign);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      campaign_type: 'email',
      status: 'draft',
      total_sent: 0,
      total_opened: 0,
      total_clicked: 0
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-neutral-100 text-neutral-700',
      scheduled: 'bg-primary-100 text-primary-700',
      active: 'bg-success-100 text-success-700',
      paused: 'bg-warning-100 text-warning-700',
      completed: 'bg-secondary-100 text-secondary-700',
      cancelled: 'bg-error-100 text-error-700'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-primary-500" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-secondary-500" />;
      case 'social_media':
        return <Users className="w-5 h-5 text-success-500" />;
      default:
        return <Megaphone className="w-5 h-5 text-warning-500" />;
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    const openRate = campaign.total_sent > 0
      ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)
      : '0.0';
    const clickRate = campaign.total_opened > 0
      ? ((campaign.total_clicked / campaign.total_opened) * 100).toFixed(1)
      : '0.0';
    return { openRate, clickRate };
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
              <h1 className="text-3xl font-bold text-neutral-900">Marketing Campaigns</h1>
              <p className="text-neutral-600 mt-1">{filteredCampaigns.length} total campaigns</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingCampaign(null);
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
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
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social_media">Social Media</option>
              <option value="webinar">Webinar</option>
              <option value="event">Event</option>
              <option value="content">Content</option>
              <option value="paid_ads">Paid Ads</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">No campaigns found</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((campaign) => {
              const { openRate, clickRate } = calculateMetrics(campaign);
              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0">
                        {getCampaignTypeIcon(campaign.campaign_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">{campaign.name}</h3>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {campaign.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                          <span className="text-xs text-neutral-500 capitalize">
                            {campaign.campaign_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 mb-1">
                        <Send className="w-4 h-4" />
                        <span className="text-xs">Sent</span>
                      </div>
                      <div className="text-xl font-bold text-neutral-900">
                        {campaign.total_sent.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 mb-1">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Open Rate</span>
                      </div>
                      <div className="text-xl font-bold text-primary-600">{openRate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500 mb-1">
                        <MousePointer className="w-4 h-4" />
                        <span className="text-xs">Click Rate</span>
                      </div>
                      <div className="text-xl font-bold text-success-600">{clickRate}%</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Campaign Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Campaign Type *
                    </label>
                    <select
                      name="campaign_type"
                      value={formData.campaign_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="social_media">Social Media</option>
                      <option value="webinar">Webinar</option>
                      <option value="event">Event</option>
                      <option value="content">Content</option>
                      <option value="paid_ads">Paid Ads</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
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

export default MarketingCampaigns;
