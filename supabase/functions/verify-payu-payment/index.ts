import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createHash } from 'node:crypto';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

// Verify PayU response hash
function verifyPayUHash(params: {
  status: string;
  firstname: string;
  amount: string;
  txnid: string;
  productinfo: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  hash: string;
  salt: string;
}): boolean {
  try {
    // Reverse hash format for response: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = `${params.salt}|${params.status}||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}`;

    const generatedHash = createHash('sha512').update(hashString).digest('hex');

    return generatedHash === params.hash;
  } catch (error) {
    console.error('Hash verification error:', error);
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
    if (!PAYU_MERCHANT_SALT) {
      console.error('Missing PayU merchant salt');
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

    // Parse request body - PayU sends response parameters
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid, // PayU payment ID
      hash,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      field9, // Additional PayU response field
      error: payuError,
      error_Message,
      transactionId, // Our internal transaction ID
    } = await req.json();

    // Validate required parameters
    if (!status || !txnid || !hash) {
      return corsResponse({
        error: 'Missing required parameters: status, txnid, hash'
      }, 400);
    }

    // Verify hash
    const isValid = verifyPayUHash({
      status,
      firstname,
      amount,
      txnid,
      productinfo,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      hash,
      salt: PAYU_MERCHANT_SALT,
    });

    if (!isValid) {
      console.error('Invalid hash for PayU transaction:', txnid);

      // Update transaction status to failed
      if (transactionId) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            payu_mihpayid: mihpayid,
            metadata: {
              error: 'Invalid hash',
              payu_status: status,
              verified_at: new Date().toISOString(),
            },
          })
          .eq('id', transactionId)
          .eq('user_id', user.id);
      }

      return corsResponse({
        success: false,
        error: 'Payment verification failed - invalid hash',
        verified: false,
      }, 400);
    }

    // Check payment status
    const isSuccessful = status === 'success';
    const transactionStatus = isSuccessful ? 'completed' : 'failed';

    // Update transaction in database
    try {
      const updateData: any = {
        status: transactionStatus,
        payu_mihpayid: mihpayid,
        payu_status: status,
        metadata: {
          payu_status: status,
          mihpayid,
          field9,
          error: payuError,
          error_message: error_Message,
          verified_at: new Date().toISOString(),
        },
      };

      let query = supabase
        .from('payment_transactions')
        .update(updateData);

      if (transactionId) {
        query = query.eq('id', transactionId);
      } else {
        query = query.eq('payu_txnid', txnid);
      }

      query = query.eq('user_id', user.id);

      const { data: transaction, error: dbError } = await query.select().single();

      if (dbError) {
        console.error('Failed to update transaction:', dbError);
        return corsResponse({
          success: isSuccessful,
          verified: true,
          warning: 'Payment verified but database update failed',
          txnid,
          mihpayid,
          status,
        });
      }

      return corsResponse({
        success: isSuccessful,
        verified: true,
        transaction: {
          id: transaction.id,
          txnid,
          mihpayid,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          payuStatus: status,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return corsResponse({
        success: isSuccessful,
        verified: true,
        warning: 'Payment verified but database error occurred',
        txnid,
        mihpayid,
        status,
      });
    }
  } catch (error: any) {
    console.error('Error verifying PayU payment:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
