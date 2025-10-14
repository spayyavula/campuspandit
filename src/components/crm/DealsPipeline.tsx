import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, Plus, Edit2, Trash2, Calendar, User, Building2, X, Save } from 'lucide-react';
import { getDeals, updateDeal, deleteDeal, Deal, createDeal, getContacts } from '../../utils/crmAPI';
import { Button, Card, Input } from '../ui';
import CRMNav from './CRMNav';

const DealsPipeline: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    contact_id: '',
    amount: '',
    stage: 'prospecting' as any,
    probability: 10,
    expected_close_date: ''
  });

  const stages = [
    { id: 'prospecting', name: 'Prospecting', color: 'primary' },
    { id: 'qualification', name: 'Qualification', color: 'secondary' },
    { id: 'proposal', name: 'Proposal', color: 'warning' },
    { id: 'negotiation', name: 'Negotiation', color: 'success' }
  ];

  useEffect(() => {
    loadDeals();
    loadContacts();
  }, []);

  // Auto-open modal if route is /new
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setShowModal(true);
      navigate('/crm/deals', { replace: true });
    }
  }, [location]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await getDeals({ is_closed: false });
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeal({
        name: formData.name,
        contact_id: formData.contact_id,
        amount: parseFloat(formData.amount),
        stage: formData.stage,
        probability: formData.probability,
        expected_close_date: formData.expected_close_date || undefined
      });
      setShowModal(false);
      resetForm();
      loadDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_id: '',
      amount: '',
      stage: 'prospecting',
      probability: 10,
      expected_close_date: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      await updateDeal(dealId, { stage: newStage as any });
      loadDeals();
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage);
  };

  const getTotalValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + (deal.amount || 0), 0);
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
              <h1 className="text-3xl font-bold text-neutral-900">Deals Pipeline</h1>
              <p className="text-neutral-600 mt-1">{deals.length} active deals</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stages.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const totalValue = getTotalValue(stage.id);

            return (
              <div key={stage.id} className="flex flex-col">
                {/* Stage Header */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-neutral-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-neutral-900">{stage.name}</h3>
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    ₹{totalValue.toLocaleString()}
                  </p>
                </div>

                {/* Deals */}
                <div className="space-y-3 flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-neutral-200 p-6 text-center">
                      <p className="text-sm text-neutral-500">No deals</p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <Card
                        key={deal.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="mb-3">
                          <h4 className="font-medium text-neutral-900 mb-1">{deal.name}</h4>
                          <p className="text-2xl font-bold text-neutral-900">
                            ₹{deal.amount.toLocaleString()}
                          </p>
                        </div>

                        {deal.contact && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                            <User className="w-4 h-4" />
                            <span>
                              {deal.contact.first_name} {deal.contact.last_name}
                            </span>
                          </div>
                        )}

                        {deal.company && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                            <Building2 className="w-4 h-4" />
                            <span>{deal.company.name}</span>
                          </div>
                        )}

                        {deal.expected_close_date && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Stage Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          {stage.id !== 'prospecting' && (
                            <button
                              onClick={() => {
                                const currentIndex = stages.findIndex((s) => s.id === stage.id);
                                if (currentIndex > 0) {
                                  handleStageChange(deal.id, stages[currentIndex - 1].id);
                                }
                              }}
                              className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                            >
                              ← Move Back
                            </button>
                          )}
                          {stage.id !== 'negotiation' && (
                            <button
                              onClick={() => {
                                const currentIndex = stages.findIndex((s) => s.id === stage.id);
                                if (currentIndex < stages.length - 1) {
                                  handleStageChange(deal.id, stages[currentIndex + 1].id);
                                }
                              }}
                              className="text-xs px-2 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded transition-colors col-span-2"
                            >
                              Move Forward →
                            </button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Create New Deal</h2>
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
                    Deal Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Q1 Enterprise License"
                    required
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
                      Amount *
                    </label>
                    <Input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Probability (%)
                    </label>
                    <Input
                      type="number"
                      name="probability"
                      value={formData.probability}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Stage</label>
                    <select
                      name="stage"
                      value={formData.stage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="prospecting">Prospecting</option>
                      <option value="qualification">Qualification</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Expected Close Date
                    </label>
                    <Input
                      type="date"
                      name="expected_close_date"
                      value={formData.expected_close_date}
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
                    Create Deal
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

export default DealsPipeline;
