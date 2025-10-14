import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
  mode: import.meta.env.VITE_RAZORPAY_MODE || 'test' // 'test' or 'live'
};

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
 * Generate Razorpay signature for verification
 */
export const generateRazorpaySignature = (
  orderId: string,
  paymentId: string
): string => {
  const { keySecret } = RAZORPAY_CONFIG;
  const text = `${orderId}|${paymentId}`;
  return CryptoJS.HmacSHA256(text, keySecret).toString();
};

/**
 * Verify Razorpay signature
 */
export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const generatedSignature = generateRazorpaySignature(orderId, paymentId);
  return generatedSignature === signature;
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
 * Create Razorpay Order (Server-side in production)
 * This is a simplified version for client-side. In production, create orders on backend.
 */
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string
): Promise<{ orderId: string; amount: number } | null> => {
  try {
    // In production, this should be done on the server
    // For now, we'll use the transaction ID as order ID
    return {
      orderId: receipt,
      amount: amount
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
    // Validate configuration
    if (!RAZORPAY_CONFIG.keyId) {
      throw new Error('Razorpay Key ID not configured. Please add VITE_RAZORPAY_KEY_ID to environment variables.');
    }

    // Load Razorpay SDK
    const loaded = await loadRazorpaySDK();
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Create payment transaction record
    const transaction = await createPaymentTransaction({
      user_id: paymentRequest.userId,
      amount: paymentRequest.amount,
      currency: 'INR',
      product_info: paymentRequest.productInfo,
      transaction_id: transactionId,
      payment_gateway: 'razorpay',
      status: 'pending',
      metadata: paymentRequest.metadata
    });

    if (!transaction) {
      throw new Error('Failed to create payment transaction record');
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(
      paymentRequest.amount * 100, // Razorpay expects amount in paise
      'INR',
      transactionId
    );

    if (!order) {
      throw new Error('Failed to create Razorpay order');
    }

    // Configure Razorpay options
    const options = {
      key: RAZORPAY_CONFIG.keyId,
      amount: paymentRequest.amount * 100, // Amount in paise
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
          await updatePaymentTransaction(transactionId, {
            status: 'cancelled'
          });
          window.location.href = `/payment/failure?txnid=${transactionId}&status=cancelled`;
        }
      },
      handler: async (response: any) => {
        try {
          // Payment successful, verify signature
          const isValid = verifyRazorpaySignature(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          if (!isValid) {
            throw new Error('Invalid payment signature');
          }

          // Update transaction
          await updatePaymentTransaction(transactionId, {
            status: 'success',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });

          // Redirect to success page
          window.location.href = `/payment/success?txnid=${transactionId}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&status=success`;
        } catch (error: any) {
          console.error('Payment verification failed:', error);
          await updatePaymentTransaction(transactionId, {
            status: 'failed'
          });
          window.location.href = `/payment/failure?txnid=${transactionId}&status=failed&error=${encodeURIComponent(error.message)}`;
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', async (response: any) => {
      console.error('Payment failed:', response.error);
      await updatePaymentTransaction(transactionId, {
        status: 'failed',
        metadata: {
          error_code: response.error.code,
          error_description: response.error.description,
          error_reason: response.error.reason
        }
      });
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
