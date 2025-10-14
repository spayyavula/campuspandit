import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  ArrowLeft
} from 'lucide-react';
import { getUserPaymentHistory, getUserPaymentStats, PaymentTransaction } from '../../utils/payuPayment';
import { Button, Card, Input } from '../ui';
import { supabase } from '../../utils/supabase';

const PaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    totalSpent: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterStatus]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth');
        return;
      }

      const [transactionsData, statsData] = await Promise.all([
        getUserPaymentHistory(user.id),
        getUserPaymentStats(user.id)
      ]);

      setTransactions(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (txn) =>
          txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.product_info.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((txn) => txn.status === filterStatus);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-neutral-600" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      success: 'bg-success-100 text-success-700 border-success-200',
      failed: 'bg-error-100 text-error-700 border-error-200',
      pending: 'bg-warning-100 text-warning-700 border-warning-200',
      cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-200'
    };

    return badges[status as keyof typeof badges] || badges.pending;
  };

  const downloadReceipt = (transaction: PaymentTransaction) => {
    const receiptContent = `
      Payment Receipt
      ===============

      Transaction ID: ${transaction.transaction_id}
      Amount: ₹${transaction.amount.toFixed(2)}
      Product: ${transaction.product_info}
      Status: ${transaction.status}
      Payment Method: ${transaction.payment_method || 'N/A'}
      Date: ${new Date(transaction.created_at!).toLocaleString()}

      PayU Payment ID: ${transaction.payu_payment_id || 'N/A'}
      Bank Reference: ${transaction.payu_bank_ref_num || 'N/A'}

      Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.transaction_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
                <CreditCard className="w-8 h-8 text-primary-600" />
                Payment History
              </h1>
              <p className="text-neutral-600 mt-1">View all your payment transactions</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/coach')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-neutral-900">
                  ₹{stats.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Successful</p>
                <p className="text-2xl font-bold text-success-600">{stats.successfulPayments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-error-600">{stats.failedPayments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-error-50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-error-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-warning-600">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search by transaction ID or product..."
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
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No transactions found</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your payment history will appear here'}
                </p>
              </div>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Icon */}
                    <div className="mt-1">{getStatusIcon(transaction.status)}</div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {transaction.product_info}
                        </h3>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Transaction ID:</span>{' '}
                          <span className="text-neutral-900">{transaction.transaction_id}</span>
                        </div>
                        {transaction.payment_method && (
                          <div>
                            <span className="font-medium">Method:</span>{' '}
                            <span className="text-neutral-900 uppercase">{transaction.payment_method}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(transaction.created_at!).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' at '}
                          {new Date(transaction.created_at!).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-neutral-900">
                      ₹{transaction.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    {transaction.status === 'success' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadReceipt(transaction)}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Receipt
                      </Button>
                    )}
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

export default PaymentHistory;
