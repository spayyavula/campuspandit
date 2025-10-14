import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { initiatePayUPayment, PaymentRequest } from '../../utils/payuPayment';
import { Button } from '../ui';

interface PaymentButtonProps {
  amount: number;
  productInfo: string;
  userId: string;
  firstName: string;
  email: string;
  phone: string;
  metadata?: Record<string, any>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  productInfo,
  userId,
  firstName,
  email,
  phone,
  metadata,
  onSuccess,
  onError,
  className,
  disabled = false,
  children
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (!email || !phone) {
        throw new Error('Email and phone are required for payment');
      }

      const paymentRequest: PaymentRequest = {
        amount,
        productInfo,
        firstName,
        email,
        phone,
        userId,
        metadata
      };

      const result = await initiatePayUPayment(paymentRequest);

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      // Payment form is submitted, user will be redirected to PayU
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process payment';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant="primary"
        onClick={handlePayment}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {children || `Pay ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;
