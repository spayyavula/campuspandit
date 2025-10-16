import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createHmac } from 'node:crypto';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

// Verify Razorpay signature
function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
    if (!RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay secret key');
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId
    } = await req.json();

    // Validate required parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return corsResponse({
        error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature'
      }, 400);
    }

    // Verify signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      console.error('Invalid signature for payment:', razorpay_payment_id);

      // Update transaction status to failed
      if (transactionId) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            razorpay_payment_id: razorpay_payment_id,
            metadata: {
              error: 'Invalid signature',
              verified_at: new Date().toISOString(),
            },
          })
          .eq('id', transactionId)
          .eq('user_id', user.id);
      }

      return corsResponse({
        success: false,
        error: 'Payment verification failed',
        verified: false
      }, 400);
    }

    // Signature is valid - update transaction
    try {
      const updateData: any = {
        status: 'completed',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
      };

      let query = supabase
        .from('payment_transactions')
        .update(updateData);

      if (transactionId) {
        query = query.eq('id', transactionId);
      } else {
        query = query.eq('razorpay_order_id', razorpay_order_id);
      }

      query = query.eq('user_id', user.id);

      const { data: transaction, error: dbError } = await query.select().single();

      if (dbError) {
        console.error('Failed to update transaction:', dbError);
        // Payment is valid, but we couldn't update DB
        return corsResponse({
          success: true,
          verified: true,
          warning: 'Payment verified but database update failed',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
      }

      return corsResponse({
        success: true,
        verified: true,
        transaction: {
          id: transaction.id,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Payment is still valid
      return corsResponse({
        success: true,
        verified: true,
        warning: 'Payment verified but database error occurred',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
