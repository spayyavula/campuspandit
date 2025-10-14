import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { initiatePayUPayment, PaymentRequest as PayUPaymentRequest } from '../../utils/payuPayment';
import { initiateRazorpayPayment, RazorpayPaymentRequest } from '../../utils/razorpayPayment';
import { initiateInstamojoPayment, InstamojoPaymentRequest } from '../../utils/instamojoPayment';
import { Button } from '../ui';

type PaymentGateway = 'payu' | 'razorpay' | 'instamojo';

interface MultiGatewayPaymentButtonProps {
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
  defaultGateway?: PaymentGateway;
  allowGatewaySelection?: boolean;
}

const MultiGatewayPaymentButton: React.FC<MultiGatewayPaymentButtonProps> = ({
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
  children,
  defaultGateway = 'razorpay',
  allowGatewaySelection = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(defaultGateway);

  const gateways = [
    {
      id: 'razorpay' as PaymentGateway,
      name: 'Razorpay',
      logo: '💳',
      description: 'Cards, UPI, Wallets, NetBanking',
      available: true
    },
    {
      id: 'payu' as PaymentGateway,
      name: 'PayU',
      logo: '💰',
      description: 'Cards, UPI, EMI, Wallets',
      available: true
    },
    {
      id: 'instamojo' as PaymentGateway,
      name: 'Instamojo',
      logo: '🛒',
      description: 'Cards, UPI, Wallets',
      available: false // Set to false as it requires backend implementation
    }
  ];

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

      let result: { success: boolean; transactionId?: string; error?: string };

      switch (selectedGateway) {
        case 'payu':
          const payuRequest: PayUPaymentRequest = {
            amount,
            productInfo,
            firstName,
            email,
            phone,
            userId,
            metadata
          };
          result = await initiatePayUPayment(payuRequest);
          break;

        case 'razorpay':
          const razorpayRequest: RazorpayPaymentRequest = {
            amount,
            productInfo,
            userId,
            firstName,
            email,
            phone,
            metadata
          };
          result = await initiateRazorpayPayment(razorpayRequest);
          break;

        case 'instamojo':
          const instamojoRequest: InstamojoPaymentRequest = {
            amount,
            productInfo,
            userId,
            buyerName: firstName,
            email,
            phone,
            metadata
          };
          result = await initiateInstamojoPayment(instamojoRequest);
          break;

        default:
          throw new Error('Invalid payment gateway selected');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      // Payment initiated successfully
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
      {/* Gateway Selection */}
      {allowGatewaySelection && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gateways.map((gateway) => (
              <button
                key={gateway.id}
                type="button"
                onClick={() => gateway.available && setSelectedGateway(gateway.id)}
                disabled={!gateway.available || loading}
                className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                  selectedGateway === gateway.id
                    ? 'border-primary-500 bg-primary-50'
                    : gateway.available
                    ? 'border-neutral-300 hover:border-primary-300'
                    : 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{gateway.logo}</span>
                  {selectedGateway === gateway.id && (
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="font-semibold text-neutral-900 mb-1">{gateway.name}</div>
                <div className="text-xs text-neutral-600">{gateway.description}</div>
                {!gateway.available && (
                  <div className="mt-2 text-xs text-warning-600 font-medium">
                    Coming Soon
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Button */}
      <Button
        variant="primary"
        onClick={handlePayment}
        disabled={disabled || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {children || `Pay ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </>
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Gateway Info */}
      {!error && (
        <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-primary-900">
              <p className="font-medium mb-1">Secure Payment</p>
              <p className="text-primary-800">
                Your payment is secured with industry-standard encryption. We don't store your card details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiGatewayPaymentButton;
