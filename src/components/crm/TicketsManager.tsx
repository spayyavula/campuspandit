import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Filter, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { getTickets, updateTicket, Ticket as TicketType } from '../../utils/crmAPI';
import { Button, Card, Input } from '../ui';

const TicketsManager: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, filterStatus, filterPriority]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.ticket_number?.toString().includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    setFilteredTickets(filtered);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket(ticketId, { status: newStatus as any });
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-neutral-100 text-neutral-700',
      medium: 'bg-secondary-100 text-secondary-700',
      high: 'bg-warning-100 text-warning-700',
      urgent: 'bg-error-100 text-error-700'
    };
    return colors[priority] || 'bg-neutral-100 text-neutral-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-primary-100 text-primary-700',
      in_progress: 'bg-secondary-100 text-secondary-700',
      waiting_customer: 'bg-warning-100 text-warning-700',
      resolved: 'bg-success-100 text-success-700',
      closed: 'bg-neutral-100 text-neutral-700'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <MessageSquare className="w-4 h-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
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
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Service Tickets</h1>
              <p className="text-neutral-600 mt-1">{filteredTickets.length} total tickets</p>
            </div>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
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
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No tickets found</p>
                <Button variant="primary" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </div>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-neutral-500">
                        #{ticket.ticket_number}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{ticket.subject}</h3>

                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>

                    {ticket.contact && (
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>
                          From: {ticket.contact.first_name} {ticket.contact.last_name}
                        </span>
                        {ticket.contact.email && <span>{ticket.contact.email}</span>}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-neutral-500">
                      Created {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="ml-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className="text-sm px-3 py-1 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_customer">Waiting Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsManager;
