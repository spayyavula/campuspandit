import { supabase } from '@/lib/supabase'
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'

// Stripe configuration
const getStripeConfig = () => {
  const mode = import.meta.env.VITE_STRIPE_MODE || 'test'
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

  return {
    mode,
    publishableKey,
  }
}

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const config = getStripeConfig()
    stripePromise = loadStripe(config.publishableKey)
  }
  return stripePromise
}

// Database operations
export const createPaymentTransaction = async (data: {
  userId: string
  amount: number
  currency: string
  productInfo: string
  paymentGateway: string
  status: string
  metadata?: Record<string, any>
}) => {
  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: data.userId,
      amount: data.amount,
      currency: data.currency,
      product_info: data.productInfo,
      payment_gateway: data.paymentGateway,
      status: data.status,
      transaction_id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: data.metadata,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create payment transaction: ${error.message}`)
  }

  return transaction
}

export const updatePaymentTransaction = async (
  transactionId: string,
  updates: {
    status?: string
    stripePaymentIntentId?: string
    stripeChargeId?: string
    paymentMethod?: string
    metadata?: Record<string, any>
  }
) => {
  const updateData: any = {}

  if (updates.status) updateData.status = updates.status
  if (updates.stripePaymentIntentId) updateData.stripe_payment_intent_id = updates.stripePaymentIntentId
  if (updates.stripeChargeId) updateData.stripe_charge_id = updates.stripeChargeId
  if (updates.paymentMethod) updateData.payment_method = updates.paymentMethod
  if (updates.metadata) updateData.metadata = updates.metadata

  const { data, error } = await supabase
    .from('payment_transactions')
    .update(updateData)
    .eq('transaction_id', transactionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update payment transaction: ${error.message}`)
  }

  return data
}

export const getPaymentTransaction = async (transactionId: string) => {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (error) {
    throw new Error(`Failed to get payment transaction: ${error.message}`)
  }

  return data
}

// Create Payment Intent via Edge Function
export const createStripePaymentIntent = async (
  amount: number,
  currency: string,
  metadata: Record<string, any>
) => {
  const session = await supabase.auth.getSession()
  if (!session.data.session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-payment-intent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create payment intent: ${error}`)
  }

  return response.json()
}

// Verify Payment via Edge Function
export const verifyStripePayment = async (paymentIntentId: string) => {
  const session = await supabase.auth.getSession()
  if (!session.data.session) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-stripe-payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        paymentIntentId,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to verify payment: ${error}`)
  }

  return response.json()
}

// Main Stripe payment flow
export const initiateStripePayment = async ({
  amount,
  productInfo,
  userId,
  firstName,
  email,
  phone,
  currency = 'usd',
  metadata = {},
  onSuccess,
  onError,
}: {
  amount: number
  productInfo: string
  userId: string
  firstName: string
  email: string
  phone: string
  currency?: string
  metadata?: Record<string, any>
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
}) => {
  try {
    // Create payment transaction in database
    const transaction = await createPaymentTransaction({
      userId,
      amount,
      currency,
      productInfo,
      paymentGateway: 'stripe',
      status: 'pending',
      metadata: {
        ...metadata,
        firstName,
        email,
        phone,
      },
    })

    // Create payment intent via Edge Function
    const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
      amount,
      currency,
      {
        ...metadata,
        transactionId: transaction.transaction_id,
        userId,
        productInfo,
        firstName,
        email,
        phone,
      }
    )

    // Update transaction with payment intent ID
    await updatePaymentTransaction(transaction.transaction_id, {
      stripePaymentIntentId: paymentIntentId,
    })

    // Initialize Stripe
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    // Return client secret and transaction info for payment form
    return {
      clientSecret,
      paymentIntentId,
      transactionId: transaction.transaction_id,
      stripe,
    }
  } catch (error: any) {
    console.error('Stripe payment initiation failed:', error)
    if (onError) {
      onError(error.message || 'Payment initiation failed')
    }
    throw error
  }
}

// Handle payment confirmation
export const handleStripePaymentConfirmation = async (
  paymentIntentId: string,
  transactionId: string,
  onSuccess?: (transactionId: string) => void,
  onError?: (error: string) => void
) => {
  try {
    // Verify payment via Edge Function
    const result = await verifyStripePayment(paymentIntentId)

    if (result.verified && result.status === 'succeeded') {
      // Update transaction status
      await updatePaymentTransaction(transactionId, {
        status: 'success',
        stripeChargeId: result.chargeId,
        paymentMethod: result.paymentMethod,
      })

      if (onSuccess) {
        onSuccess(transactionId)
      }

      return { success: true, transactionId }
    } else {
      throw new Error('Payment verification failed')
    }
  } catch (error: any) {
    console.error('Stripe payment confirmation failed:', error)

    // Update transaction status to failed
    try {
      await updatePaymentTransaction(transactionId, {
        status: 'failed',
        metadata: { error: error.message },
      })
    } catch (updateError) {
      console.error('Failed to update transaction status:', updateError)
    }

    if (onError) {
      onError(error.message || 'Payment confirmation failed')
    }
    throw error
  }
}

// Get user's payment history
export const getUserPaymentHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('payment_gateway', 'stripe')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get payment history: ${error.message}`)
  }

  return data
}

// Get payment statistics
export const getUserPaymentStats = async (userId: string) => {
  const transactions = await getUserPaymentHistory(userId)

  const stats = {
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  }

  transactions.forEach((transaction) => {
    if (transaction.status === 'success') {
      stats.totalAmount += parseFloat(transaction.amount)
      stats.successfulPayments++
    } else if (transaction.status === 'failed') {
      stats.failedPayments++
    } else if (transaction.status === 'pending') {
      stats.pendingPayments++
    }
  })

  return stats
}

// Test payment mode
export const initiateTestStripePayment = async ({
  amount,
  productInfo,
  userId,
  firstName,
  email,
  phone,
  metadata = {},
  onSuccess,
  onError,
}: {
  amount: number
  productInfo: string
  userId: string
  firstName: string
  email: string
  phone: string
  metadata?: Record<string, any>
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
}) => {
  try {
    // Create a test payment transaction
    const transaction = await createPaymentTransaction({
      userId,
      amount,
      currency: 'usd',
      productInfo,
      paymentGateway: 'test',
      status: 'pending',
      metadata: {
        ...metadata,
        firstName,
        email,
        phone,
        testMode: true,
      },
    })

    // Simulate payment success after 2 seconds
    setTimeout(async () => {
      await updatePaymentTransaction(transaction.transaction_id, {
        status: 'success',
        paymentMethod: 'test_card',
      })

      if (onSuccess) {
        onSuccess(transaction.transaction_id)
      }
    }, 2000)

    return {
      transactionId: transaction.transaction_id,
      testMode: true,
    }
  } catch (error: any) {
    console.error('Test payment failed:', error)
    if (onError) {
      onError(error.message || 'Test payment failed')
    }
    throw error
  }
}
