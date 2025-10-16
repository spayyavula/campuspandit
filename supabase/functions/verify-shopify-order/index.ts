import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN')!;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN')!;

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
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      console.error('Missing Shopify credentials');
      return corsResponse({ error: 'Shopify not configured' }, 500);
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
    const { checkoutId, transactionId } = await req.json();

    // Validate required parameters
    if (!checkoutId) {
      return corsResponse({ error: 'Missing required parameter: checkoutId' }, 400);
    }

    // Query Shopify checkout status
    const checkoutQuery = `
      query getCheckout($checkoutId: ID!) {
        node(id: $checkoutId) {
          ... on Checkout {
            id
            completedAt
            order {
              id
              orderNumber
              totalPrice {
                amount
                currencyCode
              }
              financialStatus
            }
            totalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const shopifyResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: checkoutQuery,
          variables: { checkoutId }
        }),
      }
    );

    if (!shopifyResponse.ok) {
      const errorData = await shopifyResponse.text();
      console.error('Shopify checkout query failed:', errorData);
      return corsResponse({ error: 'Failed to query checkout', details: errorData }, 500);
    }

    const shopifyData = await shopifyResponse.json();

    if (shopifyData.errors) {
      console.error('Shopify GraphQL errors:', shopifyData.errors);
      return corsResponse({ error: 'Failed to verify checkout', details: shopifyData.errors }, 500);
    }

    const checkout = shopifyData.data?.node;

    if (!checkout) {
      return corsResponse({ error: 'Checkout not found' }, 404);
    }

    // Determine if the checkout has been completed
    const isCompleted = !!checkout.completedAt;
    const hasOrder = !!checkout.order;
    const orderNumber = checkout.order?.orderNumber;
    const orderId = checkout.order?.id;
    const financialStatus = checkout.order?.financialStatus;

    // Update transaction status in database
    let status: 'pending' | 'success' | 'failed' = 'pending';

    if (isCompleted && hasOrder) {
      // Order was created successfully
      if (financialStatus === 'PAID' || financialStatus === 'AUTHORIZED') {
        status = 'success';
      } else if (financialStatus === 'VOIDED' || financialStatus === 'REFUNDED') {
        status = 'failed';
      } else {
        status = 'pending';
      }
    } else if (isCompleted && !hasOrder) {
      // Checkout was completed but no order (possibly abandoned)
      status = 'failed';
    }

    // Update transaction in database
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (orderId) {
        updateData.shopify_order_id = orderId;
      }
      if (orderNumber) {
        updateData.shopify_order_number = orderNumber.toString();
      }
      if (financialStatus) {
        updateData.metadata = { financial_status: financialStatus };
      }

      let query = supabase
        .from('payment_transactions')
        .update(updateData);

      // Update by transaction_id if provided, otherwise by checkout_id
      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      } else {
        query = query.eq('shopify_checkout_id', checkoutId);
      }

      const { data: transaction, error: dbError } = await query
        .select()
        .single();

      if (dbError) {
        console.error('Failed to update transaction:', dbError);
        return corsResponse({
          error: 'Failed to update transaction',
          details: dbError
        }, 500);
      }

      return corsResponse({
        success: true,
        verified: isCompleted && hasOrder,
        status: status,
        orderId: orderId,
        orderNumber: orderNumber,
        financialStatus: financialStatus,
        transaction: transaction,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return corsResponse({
        error: 'Database error while updating transaction',
        details: dbError
      }, 500);
    }
  } catch (error: any) {
    console.error('Error verifying Shopify order:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
