import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionData {
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

const SubscriptionStatus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          throw error;
        }

        setSubscription(data);
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message || 'Failed to fetch subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // No subscription data or not active
  if (!subscription || !subscription.subscription_id || subscription.subscription_status !== 'active') {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No Active Subscription</h3>
        <p className="text-gray-600 mt-1">
          You don't have an active subscription plan. Check out our pricing page to subscribe.
        </p>
      </div>
    );
  }

  // Active subscription
  const product = getProductByPriceId(subscription.price_id || '');
  const renewalDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString() 
    : 'Unknown';

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Active
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Plan:</span> {product?.name || 'Unknown Plan'}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Renewal Date:</span> {renewalDate}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Auto-Renewal:</span> {subscription.cancel_at_period_end ? 'Off' : 'On'}
        </p>
      </div>
    </div>
  );
};

export default SubscriptionStatus;