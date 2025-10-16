import { supabase } from './supabase';

// Shopify Configuration - No secrets on client-side!
const SHOPIFY_CONFIG = {
  mode: import.meta.env.VITE_SHOPIFY_MODE || 'test' // 'test' or 'live'
};

// Supabase Edge Functions URLs
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const CREATE_CHECKOUT_URL = `${SUPABASE_URL}/functions/v1/create-shopify-checkout`;
const VERIFY_ORDER_URL = `${SUPABASE_URL}/functions/v1/verify-shopify-order`;

export interface ShopifyPaymentRequest {
  amount: number;
  productInfo: string;
  userId: string;
  firstName: string;
  email: string;
  phone: string;
  metadata?: Record<string, any>;
}

export interface PaymentTransaction {
  id?: string;
  user_id: string;
  amount: number;
  currency: string;
  product_info: string;
  transaction_id: string;
  payment_gateway: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  payment_method?: string;
  shopify_checkout_id?: string;
  shopify_order_id?: string;
  shopify_order_number?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create Shopify checkout via secure Edge Function
 */
export const createShopifyCheckout = async (
  paymentRequest: ShopifyPaymentRequest,
  transactionId: string
): Promise<{ success: boolean; checkoutUrl?: string; checkoutId?: string; transactionId?: string; error?: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(CREATE_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        txnid: transactionId,
        amount: paymentRequest.amount,
        productInfo: paymentRequest.productInfo,
        firstName: paymentRequest.firstName,
        email: paymentRequest.email,
        phone: paymentRequest.phone,
        userId: paymentRequest.userId,
        metadata: paymentRequest.metadata || {},
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create Shopify checkout');
    }

    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      transactionId: result.transactionId,
    };
  } catch (error: any) {
    console.error('Error creating Shopify checkout:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout',
    };
  }
};

/**
 * Verify Shopify order via secure Edge Function
 */
export const verifyShopifyOrder = async (
  checkoutId: string,
  transactionId?: string
): Promise<{ success: boolean; verified: boolean; error?: string; transaction?: any }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(VERIFY_ORDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        checkoutId,
        transactionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed');
    }

    return result;
  } catch (error: any) {
    console.error('Error verifying Shopify order:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'Verification failed',
    };
  }
};

/**
 * Create a payment transaction in the database
 */
export const createPaymentTransaction = async (
  paymentData: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>
): Promise<PaymentTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: paymentData.user_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        product_info: paymentData.product_info,
        transaction_id: paymentData.transaction_id,
        payment_gateway: paymentData.payment_gateway,
        status: paymentData.status,
        payment_method: paymentData.payment_method,
        shopify_checkout_id: paymentData.shopify_checkout_id,
        shopify_order_id: paymentData.shopify_order_id,
        shopify_order_number: paymentData.shopify_order_number,
        metadata: paymentData.metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    return null;
  }
};

/**
 * Update payment transaction status
 */
export const updatePaymentTransaction = async (
  transactionId: string,
  updates: Partial<PaymentTransaction>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        status: updates.status,
        payment_method: updates.payment_method,
        shopify_checkout_id: updates.shopify_checkout_id,
        shopify_order_id: updates.shopify_order_id,
        shopify_order_number: updates.shopify_order_number,
        metadata: updates.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_id', transactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating payment transaction:', error);
    return false;
  }
};

/**
 * Get payment transaction by transaction ID
 */
export const getPaymentTransaction = async (
  transactionId: string
): Promise<PaymentTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment transaction:', error);
    return null;
  }
};

/**
 * Get user's payment history
 */
export const getUserPaymentHistory = async (
  userId: string
): Promise<PaymentTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

/**
 * Generate unique transaction ID
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10);
  return `TXN${timestamp}${random}`.toUpperCase();
};

/**
 * Initiate Shopify payment
 */
export const initiateShopifyPayment = async (
  paymentRequest: ShopifyPaymentRequest
): Promise<{ success: boolean; checkoutUrl?: string; transactionId?: string; error?: string }> => {
  try {
    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Create Shopify checkout via Edge Function (this also creates the DB transaction)
    const checkoutResult = await createShopifyCheckout(paymentRequest, transactionId);

    if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
      throw new Error(checkoutResult.error || 'Failed to create checkout. Please ensure Edge Functions are deployed.');
    }

    // Redirect to Shopify checkout
    window.location.href = checkoutResult.checkoutUrl;

    return {
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      transactionId: checkoutResult.transactionId || transactionId
    };
  } catch (error: any) {
    console.error('Error initiating Shopify payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment'
    };
  }
};

/**
 * Handle Shopify payment response (callback after checkout)
 */
export const handleShopifyResponse = async (
  checkoutId: string,
  transactionId?: string
): Promise<{ success: boolean; message: string; transaction?: PaymentTransaction }> => {
  try {
    // Verify order via Edge Function
    const verification = await verifyShopifyOrder(checkoutId, transactionId);

    if (!verification.verified) {
      console.error('Failed to verify Shopify order');
      return {
        success: false,
        message: verification.error || 'Order verification failed'
      };
    }

    // Transaction is already updated by Edge Function
    const transaction = verification.transaction;

    return {
      success: true,
      message: 'Order completed successfully',
      transaction: transaction || undefined
    };
  } catch (error: any) {
    console.error('Error handling Shopify response:', error);
    return {
      success: false,
      message: error.message || 'Error processing order response'
    };
  }
};

/**
 * Get payment statistics for a user
 */
export const getUserPaymentStats = async (
  userId: string
): Promise<{
  totalSpent: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
}> => {
  try {
    const transactions = await getUserPaymentHistory(userId);

    const stats = transactions.reduce(
      (acc, txn) => {
        if (txn.status === 'success') {
          acc.totalSpent += txn.amount;
          acc.successfulPayments += 1;
        } else if (txn.status === 'failed') {
          acc.failedPayments += 1;
        } else if (txn.status === 'pending') {
          acc.pendingPayments += 1;
        }
        return acc;
      },
      {
        totalSpent: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0
      }
    );

    return stats;
  } catch (error) {
    console.error('Error getting payment stats:', error);
    return {
      totalSpent: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0
    };
  }
};

export { SHOPIFY_CONFIG };
