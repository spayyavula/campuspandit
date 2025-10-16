import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Validate environment variables
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials');
      return corsResponse({ error: 'Payment gateway not configured' }, 500);
    }

    // Get and validate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    // Parse request body
    const { amount, currency, receipt, notes, bookingId, bookingType } = await req.json();

    // Validate required parameters
    if (!amount || !currency) {
      return corsResponse({ error: 'Missing required parameters: amount, currency' }, 400);
    }

    // Amount should be in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const orderData = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay order creation failed:', errorData);
      return corsResponse({ error: 'Failed to create payment order', details: errorData }, 500);
    }

    const order = await razorpayResponse.json();

    // Save transaction to database
    try {
      const { data: transaction, error: dbError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          gateway: 'razorpay',
          amount: amount,
          currency: currency,
          status: 'created',
          razorpay_order_id: order.id,
          booking_id: bookingId || null,
          booking_type: bookingType || null,
          metadata: {
            receipt: order.receipt,
            notes: order.notes,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save transaction:', dbError);
        // Continue anyway - payment can still proceed
      }

      return corsResponse({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID, // Safe to send - this is the public key
        transactionId: transaction?.id,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Still return order details so payment can proceed
      return corsResponse({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        warning: 'Transaction not saved to database',
      });
    }
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
