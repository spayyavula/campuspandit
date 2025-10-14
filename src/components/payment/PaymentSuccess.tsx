import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { handlePayUResponse, getPaymentTransaction, PaymentTransaction } from '../../utils/payuPayment';
import { Button, Card } from '../ui';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handlePaymentResponse();
  }, []);

  const handlePaymentResponse = async () => {
    try {
      setLoading(true);

      // Extract PayU response parameters
      const responseData: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        responseData[key] = value;
      });

      // Handle PayU response
      const result = await handlePayUResponse(responseData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setTransaction(result.transaction || null);
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!transaction) return;

    // Create receipt content
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

    // Create and download file
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verification Failed</h1>
          <p className="text-neutral-600 mb-6">
            {error || 'Could not verify your payment. Please contact support.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/coach')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-neutral-600 mb-8">
            Your payment has been processed successfully.
          </p>

          {/* Transaction Details */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Transaction Details</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Transaction ID</span>
                <span className="font-medium text-neutral-900">{transaction.transaction_id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">Amount Paid</span>
                <span className="font-bold text-success-600 text-xl">
                  ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">Product</span>
                <span className="font-medium text-neutral-900">{transaction.product_info}</span>
              </div>

              {transaction.payment_method && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Payment Method</span>
                  <span className="font-medium text-neutral-900 uppercase">{transaction.payment_method}</span>
                </div>
              )}

              {transaction.payu_payment_id && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">PayU Payment ID</span>
                  <span className="font-medium text-neutral-900 text-sm">{transaction.payu_payment_id}</span>
                </div>
              )}

              {transaction.payu_bank_ref_num && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Bank Reference</span>
                  <span className="font-medium text-neutral-900 text-sm">{transaction.payu_bank_ref_num}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-600">Date & Time</span>
                <span className="font-medium text-neutral-900">
                  {new Date(transaction.created_at!).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={downloadReceipt} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="primary" onClick={() => navigate('/coach')} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Email Confirmation Note */}
          <p className="text-sm text-neutral-500 mt-6">
            A confirmation email has been sent to your registered email address.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
