import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { handlePayUResponse, PaymentTransaction } from '../../utils/payuPayment';
import { Button, Card } from '../ui';

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('Payment failed');

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

      setErrorMessage(result.message);
      setTransaction(result.transaction || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    // Navigate back to the payment page or tutors page
    navigate('/tutors');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Processing payment response...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center p-8">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-error-600" />
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-neutral-600 mb-8">
            {errorMessage}
          </p>

          {/* Transaction Details (if available) */}
          {transaction && (
            <div className="bg-neutral-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Transaction Details</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Transaction ID</span>
                  <span className="font-medium text-neutral-900">{transaction.transaction_id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Attempted Amount</span>
                  <span className="font-medium text-neutral-900">
                    ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Product</span>
                  <span className="font-medium text-neutral-900">{transaction.product_info}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Status</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-error-100 text-error-700">
                    {transaction.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Date & Time</span>
                  <span className="font-medium text-neutral-900">
                    {new Date(transaction.created_at!).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-warning-900 mb-3">Common Reasons for Payment Failure:</h3>
            <ul className="text-sm text-warning-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-warning-600 mt-0.5">•</span>
                <span>Insufficient balance in your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning-600 mt-0.5">•</span>
                <span>Incorrect card details or OTP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning-600 mt-0.5">•</span>
                <span>Transaction limit exceeded</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning-600 mt-0.5">•</span>
                <span>Bank server issue or network problem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning-600 mt-0.5">•</span>
                <span>Card not enabled for online transactions</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => navigate('/coach')} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="primary" onClick={handleRetry} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>

          {/* Support Note */}
          <p className="text-sm text-neutral-500 mt-6">
            If you continue to face issues, please contact our support team.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailure;
