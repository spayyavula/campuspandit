import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

// PayU Configuration
const PAYU_CONFIG = {
  merchantKey: import.meta.env.VITE_PAYU_MERCHANT_KEY || '',
  merchantSalt: import.meta.env.VITE_PAYU_MERCHANT_SALT || '',
  payuBaseUrl: import.meta.env.VITE_PAYU_BASE_URL || 'https://test.payu.in', // Use https://secure.payu.in for production
  mode: import.meta.env.VITE_PAYU_MODE || 'test' // 'test' or 'live'
};

export interface PaymentRequest {
  amount: number;
  productInfo: string;
  firstName: string;
  email: string;
  phone: string;
  userId: string;
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
  payu_payment_id?: string;
  payu_bank_ref_num?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generate PayU payment hash
 */
export const generatePayUHash = (
  txnid: string,
  amount: number,
  productInfo: string,
  firstName: string,
  email: string
): string => {
  const { merchantKey, merchantSalt } = PAYU_CONFIG;

  // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${merchantKey}|${txnid}|${amount}|${productInfo}|${firstName}|${email}|||||||||||${merchantSalt}`;

  return CryptoJS.SHA512(hashString).toString();
};

/**
 * Verify PayU response hash
 */
export const verifyPayUHash = (
  status: string,
  firstname: string,
  amount: string,
  txnid: string,
  productinfo: string,
  email: string,
  payuHash: string
): boolean => {
  const { merchantKey, merchantSalt } = PAYU_CONFIG;

  // Reverse hash for verification: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = `${merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${merchantKey}`;

  const generatedHash = CryptoJS.SHA512(hashString).toString();

  return generatedHash === payuHash;
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
        payu_payment_id: paymentData.payu_payment_id,
        payu_bank_ref_num: paymentData.payu_bank_ref_num,
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
        payu_payment_id: updates.payu_payment_id,
        payu_bank_ref_num: updates.payu_bank_ref_num,
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
 * Initiate PayU payment
 */
export const initiatePayUPayment = async (
  paymentRequest: PaymentRequest
): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> => {
  try {
    // Validate configuration
    if (!PAYU_CONFIG.merchantKey || !PAYU_CONFIG.merchantSalt) {
      throw new Error('PayU credentials not configured. Please add VITE_PAYU_MERCHANT_KEY and VITE_PAYU_MERCHANT_SALT to environment variables.');
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
      payment_gateway: 'payu',
      status: 'pending',
      metadata: paymentRequest.metadata
    });

    if (!transaction) {
      throw new Error('Failed to create payment transaction record');
    }

    // Generate PayU hash
    const hash = generatePayUHash(
      transactionId,
      paymentRequest.amount,
      paymentRequest.productInfo,
      paymentRequest.firstName,
      paymentRequest.email
    );

    // Build PayU payment form data
    const paymentData = {
      key: PAYU_CONFIG.merchantKey,
      txnid: transactionId,
      amount: paymentRequest.amount.toFixed(2),
      productinfo: paymentRequest.productInfo,
      firstname: paymentRequest.firstName,
      email: paymentRequest.email,
      phone: paymentRequest.phone,
      surl: `${window.location.origin}/payment/success`,
      furl: `${window.location.origin}/payment/failure`,
      hash: hash,
      udf1: paymentRequest.userId,
      udf2: JSON.stringify(paymentRequest.metadata || {})
    };

    // Create a form and submit to PayU
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${PAYU_CONFIG.payuBaseUrl}/_payment`;

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();

    return {
      success: true,
      transactionId
    };
  } catch (error: any) {
    console.error('Error initiating PayU payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate payment'
    };
  }
};

/**
 * Handle PayU payment response (callback from PayU)
 */
export const handlePayUResponse = async (
  responseData: Record<string, any>
): Promise<{ success: boolean; message: string; transaction?: PaymentTransaction }> => {
  try {
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      hash,
      mihpayid,
      bank_ref_num,
      mode,
      error_Message
    } = responseData;

    // Verify hash
    const isValidHash = verifyPayUHash(
      status,
      firstname,
      amount,
      txnid,
      productinfo,
      email,
      hash
    );

    if (!isValidHash) {
      console.error('Invalid PayU hash received');
      return {
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      };
    }

    // Update transaction based on status
    let transactionStatus: 'success' | 'failed' | 'cancelled' = 'failed';
    let message = 'Payment failed';

    if (status === 'success') {
      transactionStatus = 'success';
      message = 'Payment successful';
    } else if (status === 'failure') {
      transactionStatus = 'failed';
      message = error_Message || 'Payment failed';
    } else if (status === 'cancel') {
      transactionStatus = 'cancelled';
      message = 'Payment cancelled';
    }

    // Update payment transaction
    await updatePaymentTransaction(txnid, {
      status: transactionStatus,
      payment_method: mode,
      payu_payment_id: mihpayid,
      payu_bank_ref_num: bank_ref_num,
      metadata: {
        error_message: error_Message,
        response_data: responseData
      }
    });

    // Get updated transaction
    const transaction = await getPaymentTransaction(txnid);

    return {
      success: transactionStatus === 'success',
      message,
      transaction: transaction || undefined
    };
  } catch (error: any) {
    console.error('Error handling PayU response:', error);
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

export { PAYU_CONFIG };
