import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import { initiateStripePayment, handleStripePaymentConfirmation } from '../../utils/stripePayment';
import { initiateTestStripePayment } from '../../utils/stripePayment';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentButtonProps {
  amount: number;
  productInfo: string;
  userId: string;
  firstName: string;
  email: string;
  phone: string;
  currency?: string;
  metadata?: Record<string, any>;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  testMode?: boolean;
}

// Payment Form Component (inside Stripe Elements context)
const StripePaymentForm: React.FC<{
  amount: number;
  productInfo: string;
  userId: string;
  firstName: string;
  email: string;
  phone: string;
  currency: string;
  metadata?: Record<string, any>;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}> = ({
  amount,
  productInfo,
  userId,
  firstName,
  email,
  phone,
  currency,
  metadata,
  onSuccess,
  onError,
  disabled,
  children,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required', // Don't redirect if not necessary
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment via backend
        const result = await handleStripePaymentConfirmation(
          paymentIntent.id,
          transactionId,
          onSuccess,
          onError
        );

        if (result.success) {
          // Redirect to success page
          window.location.href = `/payment/success?transaction_id=${result.transactionId}`;
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Methods Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-900">
          <p className="font-medium mb-2">💳 Multiple Payment Methods Available:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-white rounded border border-blue-200">Credit/Debit Cards</span>
            <span className="px-2 py-1 bg-white rounded border border-blue-200">PayPal</span>
            <span className="px-2 py-1 bg-white rounded border border-blue-200">Apple Pay</span>
            <span className="px-2 py-1 bg-white rounded border border-blue-200">Google Pay</span>
          </div>
          <p className="text-blue-800 mt-2">
            Choose your preferred payment method below. All options are secure and encrypted.
          </p>
        </div>
      </div>

      <PaymentElement />

      <Button
        type="submit"
        variant="primary"
        disabled={!stripe || disabled || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {children || `Pay ${currency.toUpperCase()} ${amount.toLocaleString()}`}
          </>
        )}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Payment Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-primary-900">
            <p className="font-medium mb-1">Secure Payment via Stripe</p>
            <p className="text-primary-800">
              Your payment is secured with industry-standard encryption. We don't store your card or PayPal details.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

// Main Stripe Payment Button Component
const StripePaymentButton: React.FC<StripePaymentButtonProps> = ({
  amount,
  productInfo,
  userId,
  firstName,
  email,
  phone,
  currency = 'usd',
  metadata,
  onSuccess,
  onError,
  className,
  disabled = false,
  children,
  testMode = false,
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (testMode) {
        // Handle test mode
        const result = await initiateTestStripePayment({
          amount,
          productInfo,
          userId,
          firstName,
          email,
          phone,
          metadata,
          onSuccess,
          onError,
        });

        if (onSuccess) {
          onSuccess(result.transactionId);
        }

        // Redirect to success page
        setTimeout(() => {
          window.location.href = `/payment/success?transaction_id=${result.transactionId}`;
        }, 2000);

        return;
      }

      // Initialize Stripe payment
      const result = await initiateStripePayment({
        amount,
        productInfo,
        userId,
        firstName,
        email,
        phone,
        currency,
        metadata,
        onSuccess,
        onError,
      });

      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      setTransactionId(result.transactionId);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize payment';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (testMode) {
    return (
      <div className={className}>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Test Mode Active</p>
            <p className="text-sm text-yellow-700 mt-1">
              {loading ? 'Processing test payment...' : 'Test payment completed successfully!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-neutral-600">Initializing payment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Initialization Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={initializePayment}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0066cc',
      },
    },
  };

  return (
    <div className={className}>
      <Elements stripe={stripePromise} options={elementsOptions}>
        <StripePaymentForm
          amount={amount}
          productInfo={productInfo}
          userId={userId}
          firstName={firstName}
          email={email}
          phone={phone}
          currency={currency}
          metadata={metadata}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
        >
          {children}
        </StripePaymentForm>
      </Elements>
    </div>
  );
};

export default StripePaymentButton;
