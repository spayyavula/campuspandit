import { supabase } from './supabase';

// Razorpay Configuration - No secrets on client-side!
const RAZORPAY_CONFIG = {
  mode: import.meta.env.VITE_RAZORPAY_MODE || 'test' // 'test' or 'live'
};

// Supabase Edge Functions URLs
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const CREATE_ORDER_URL = `${SUPABASE_URL}/functions/v1/create-razorpay-order`;
const VERIFY_PAYMENT_URL = `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`;

export interface RazorpayPaymentRequest {
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
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Load Razorpay SDK
 */
export const loadRazorpaySDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Verify Razorpay signature via secure Edge Function
 */
export const verifyRazorpaySignature = async (
  orderId: string,
  paymentId: string,
  signature: string,
  transactionId?: string
): Promise<{ success: boolean; verified: boolean; error?: string; transaction?: any }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(VERIFY_PAYMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        transactionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed');
    }

    return result;
  } catch (error: any) {
    console.error('Error verifying signature:', error);
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
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
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
        razorpay_payment_id: updates.razorpay_payment_id,
        razorpay_order_id: updates.razorpay_order_id,
        razorpay_signature: updates.razorpay_signature,
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
 * Create Razorpay Order via secure Edge Function
 */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, any>,
  bookingId?: string,
  bookingType?: string
): Promise<{ orderId: string; amount: number; keyId: string; transactionId?: string } | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(CREATE_ORDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        amount: amount / 100, // Convert from paise to rupees
        currency,
        receipt,
        notes,
        bookingId,
        bookingType,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create order');
    }

    return {
      orderId: result.orderId,
      amount: result.amount,
      keyId: result.keyId,
      transactionId: result.transactionId,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return null;
  }
};

/**
 * Initiate Razorpay payment
 */
export const initiateRazorpayPayment = async (
  paymentRequest: RazorpayPaymentRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Load Razorpay SDK
    const loaded = await loadRazorpaySDK();
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Create Razorpay order via Edge Function (this also creates the DB transaction)
    const order = await createRazorpayOrder(
      paymentRequest.amount * 100, // Razorpay expects amount in paise
      'INR',
      transactionId,
      paymentRequest.metadata
    );

    if (!order) {
      throw new Error('Failed to create Razorpay order. Please ensure Edge Functions are deployed.');
    }

    // Configure Razorpay options
    const options = {
      key: order.keyId, // Key ID from server
      amount: order.amount, // Amount in paise from server
      currency: 'INR',
      name: 'CampusPandit',
      description: paymentRequest.productInfo,
      order_id: order.orderId,
      prefill: {
        name: paymentRequest.firstName,
        email: paymentRequest.email,
        contact: paymentRequest.phone
      },
      theme: {
        color: '#4F46E5' // Primary color
      },
      modal: {
        ondismiss: async () => {
          // User closed the modal
          if (order.transactionId) {
            await updatePaymentTransaction(transactionId, {
              status: 'cancelled'
            });
          }
          window.location.href = `/payment/failure?txnid=${transactionId}&status=cancelled`;
        }
      },
      handler: async (response: any) => {
        try {
          // Payment successful, verify signature via Edge Function
          const verification = await verifyRazorpaySignature(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            order.transactionId
          );

          if (!verification.verified) {
            throw new Error(verification.error || 'Invalid payment signature');
          }

          // Redirect to success page
          window.location.href = `/payment/success?txnid=${transactionId}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&status=success`;
        } catch (error: any) {
          console.error('Payment verification failed:', error);
          window.location.href = `/payment/failure?txnid=${transactionId}&status=failed&error=${encodeURIComponent(error.message)}`;
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', async (response: any) => {
      console.error('Payment failed:', response.error);
      if (order.transactionId) {
        await updatePaymentTransaction(transactionId, {
          status: 'failed',
          metadata: {
            error_code: response.error.code,
            error_description: response.error.description,
            error_reason: response.error.reason
          }
        });
      }
      window.location.href = `/payment/failure?txnid=${transactionId}&status=failed&error=${encodeURIComponent(response.error.description)}`;
    });

    razorpay.open();

    return {
      success: true,
      transactionId
    };
  } catch (error: any) {
    console.error('Error initiating Razorpay payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment'
    };
  }
};

/**
 * Handle Razorpay payment response (for success page)
 */
export const handleRazorpayResponse = async (
  transactionId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  status: string
): Promise<{ success: boolean; message: string; transaction?: PaymentTransaction }> => {
  try {
    // Get transaction
    const transaction = await getPaymentTransaction(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found'
      };
    }

    return {
      success: status === 'success',
      message: status === 'success' ? 'Payment successful' : 'Payment failed',
      transaction
    };
  } catch (error: any) {
    console.error('Error handling Razorpay response:', error);
    return {
      success: false,
      message: error.message || 'Error processing payment response'
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

export { RAZORPAY_CONFIG };
