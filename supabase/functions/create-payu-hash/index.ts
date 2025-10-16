import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createHash } from 'node:crypto';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const PAYU_MERCHANT_KEY = Deno.env.get('PAYU_MERCHANT_KEY')!;
const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT')!;

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

// Generate PayU hash
function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ''}|${params.udf2 || ''}|${params.udf3 || ''}|${params.udf4 || ''}|${params.udf5 || ''}||||||${params.salt}`;

  return createHash('sha512').update(hashString).digest('hex');
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
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      console.error('Missing PayU credentials');
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
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      bookingId,
      bookingType,
    } = await req.json();

    // Validate required parameters
    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return corsResponse({
        error: 'Missing required parameters: txnid, amount, productinfo, firstname, email'
      }, 400);
    }

    // Generate transaction ID if not provided
    const transactionId = txnid || `TXN_${Date.now()}_${user.id.substring(0, 8)}`;

    // Generate hash
    const hash = generatePayUHash({
      key: PAYU_MERCHANT_KEY,
      txnid: transactionId,
      amount: amount.toString(),
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      salt: PAYU_MERCHANT_SALT,
    });

    // Save transaction to database
    try {
      const { data: transaction, error: dbError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          gateway: 'payu',
          amount: parseFloat(amount),
          currency: 'INR', // PayU primarily uses INR
          status: 'created',
          payu_txnid: transactionId,
          booking_id: bookingId || null,
          booking_type: bookingType || null,
          metadata: {
            productinfo,
            firstname,
            email,
            phone,
            udf1,
            udf2,
            udf3,
            udf4,
            udf5,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save transaction:', dbError);
      }

      return corsResponse({
        success: true,
        hash,
        txnid: transactionId,
        key: PAYU_MERCHANT_KEY, // Safe to send - this is the public merchant key
        transactionId: transaction?.id,
        paymentData: {
          key: PAYU_MERCHANT_KEY,
          txnid: transactionId,
          amount: amount.toString(),
          productinfo,
          firstname,
          email,
          phone,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
          hash,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Still return hash so payment can proceed
      return corsResponse({
        success: true,
        hash,
        txnid: transactionId,
        key: PAYU_MERCHANT_KEY,
        warning: 'Transaction not saved to database',
        paymentData: {
          key: PAYU_MERCHANT_KEY,
          txnid: transactionId,
          amount: amount.toString(),
          productinfo,
          firstname,
          email,
          phone,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
          hash,
        },
      });
    }
  } catch (error: any) {
    console.error('Error creating PayU hash:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
