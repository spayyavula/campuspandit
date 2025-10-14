import { supabase } from './supabase';

// Instamojo Configuration
const INSTAMOJO_CONFIG = {
  apiKey: import.meta.env.VITE_INSTAMOJO_API_KEY || '',
  authToken: import.meta.env.VITE_INSTAMOJO_AUTH_TOKEN || '',
  baseUrl: import.meta.env.VITE_INSTAMOJO_BASE_URL || 'https://test.instamojo.com', // Use https://www.instamojo.com for production
  mode: import.meta.env.VITE_INSTAMOJO_MODE || 'test' // 'test' or 'live'
};

export interface InstamojoPaymentRequest {
  amount: number;
  productInfo: string;
  userId: string;
  buyerName: string;
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
  instamojo_payment_id?: string;
  instamojo_payment_request_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

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
        instamojo_payment_id: paymentData.instamojo_payment_id,
        instamojo_payment_request_id: paymentData.instamojo_payment_request_id,
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
        instamojo_payment_id: updates.instamojo_payment_id,
        instamojo_payment_request_id: updates.instamojo_payment_request_id,
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
 * Create Instamojo Payment Request (Server-side implementation)
 * NOTE: In production, this MUST be done on the backend for security
 */
export const createInstamojoPaymentRequest = async (
  amount: number,
  purpose: string,
  buyerName: string,
  email: string,
  phone: string,
  transactionId: string
): Promise<{ success: boolean; paymentUrl?: string; paymentRequestId?: string; error?: string }> => {
  try {
    // IMPORTANT: This should be implemented on your backend server
    // Making API calls with API keys from frontend is INSECURE
    // This is a placeholder showing the structure

    const requestData = {
      amount: amount,
      purpose: purpose,
      buyer_name: buyerName,
      email: email,
      phone: phone,
      redirect_url: `${window.location.origin}/payment/instamojo/callback`,
      webhook: `${window.location.origin}/api/instamojo/webhook`,
      send_email: true,
      send_sms: true,
      allow_repeated_payments: false
    };

    // In production, call your backend API:
    // const response = await fetch('/api/instamojo/create-payment-request', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(requestData)
    // });

    // For now, return a placeholder
    throw new Error('Instamojo payment request creation must be implemented on the backend server for security reasons.');
  } catch (error: any) {
    console.error('Error creating Instamojo payment request:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment request'
    };
  }
};

/**
 * Initiate Instamojo payment
 */
export const initiateInstamojoPayment = async (
  paymentRequest: InstamojoPaymentRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Validate configuration
    if (!INSTAMOJO_CONFIG.apiKey || !INSTAMOJO_CONFIG.authToken) {
      throw new Error('Instamojo credentials not configured. Please add VITE_INSTAMOJO_API_KEY and VITE_INSTAMOJO_AUTH_TOKEN to environment variables.');
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
      payment_gateway: 'instamojo',
      status: 'pending',
      metadata: paymentRequest.metadata
    });

    if (!transaction) {
      throw new Error('Failed to create payment transaction record');
    }

    // Create Instamojo payment request
    const paymentRequestResult = await createInstamojoPaymentRequest(
      paymentRequest.amount,
      paymentRequest.productInfo,
      paymentRequest.buyerName,
      paymentRequest.email,
      paymentRequest.phone,
      transactionId
    );

    if (!paymentRequestResult.success) {
      throw new Error(paymentRequestResult.error || 'Failed to create payment request');
    }

    // Update transaction with payment request ID
    await updatePaymentTransaction(transactionId, {
      instamojo_payment_request_id: paymentRequestResult.paymentRequestId
    });

    // Redirect to Instamojo payment page
    if (paymentRequestResult.paymentUrl) {
      window.location.href = paymentRequestResult.paymentUrl;
    }

    return {
      success: true,
      transactionId
    };
  } catch (error: any) {
    console.error('Error initiating Instamojo payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment'
    };
  }
};

/**
 * Handle Instamojo payment callback
 */
export const handleInstamojoCallback = async (
  paymentId: string,
  paymentRequestId: string,
  paymentStatus: string
): Promise<{ success: boolean; message: string; transaction?: PaymentTransaction }> => {
  try {
    // Get transaction by payment request ID
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('instamojo_payment_request_id', paymentRequestId)
      .limit(1);

    if (error) throw error;

    if (!transactions || transactions.length === 0) {
      return {
        success: false,
        message: 'Transaction not found'
      };
    }

    const transaction = transactions[0];

    // Update transaction status
    let status: 'success' | 'failed' | 'cancelled' = 'failed';
    let message = 'Payment failed';

    if (paymentStatus === 'Credit') {
      status = 'success';
      message = 'Payment successful';
    } else if (paymentStatus === 'Failed') {
      status = 'failed';
      message = 'Payment failed';
    } else {
      status = 'cancelled';
      message = 'Payment cancelled';
    }

    await updatePaymentTransaction(transaction.transaction_id, {
      status,
      instamojo_payment_id: paymentId,
      metadata: {
        ...transaction.metadata,
        payment_status: paymentStatus
      }
    });

    // Get updated transaction
    const updatedTransaction = await getPaymentTransaction(transaction.transaction_id);

    return {
      success: status === 'success',
      message,
      transaction: updatedTransaction || undefined
    };
  } catch (error: any) {
    console.error('Error handling Instamojo callback:', error);
    return {
      success: false,
      message: error.message || 'Error processing payment callback'
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

export { INSTAMOJO_CONFIG };
