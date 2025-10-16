import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SHOPIFY_STORE_DOMAIN = Deno.env.get('SHOPIFY_STORE_DOMAIN')!;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN')!;
const SHOPIFY_PRODUCT_ID = Deno.env.get('SHOPIFY_PRODUCT_ID'); // Optional: Default product for generic payments

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
      return corsResponse({ error: 'Shopify not configured. Please set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN' }, 500);
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
    const { txnid, amount, productInfo, firstName, email, phone, userId, metadata } = await req.json();

    // Validate required parameters
    if (!amount || !productInfo || !email) {
      return corsResponse({ error: 'Missing required parameters: amount, productInfo, email' }, 400);
    }

    // Create Shopify checkout using Storefront API
    const checkoutMutation = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            totalPrice {
              amount
              currencyCode
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    // Create line items
    // Note: For a real implementation, you would either:
    // 1. Pass product variant IDs from the client
    // 2. Have a mapping of your products to Shopify variant IDs
    // 3. Use a default product and adjust price with customAttributes
    const lineItems = SHOPIFY_PRODUCT_ID ? [
      {
        variantId: SHOPIFY_PRODUCT_ID,
        quantity: 1,
        customAttributes: [
          { key: 'product_info', value: productInfo },
          { key: 'transaction_id', value: txnid }
        ]
      }
    ] : [];

    const checkoutInput = {
      email: email,
      lineItems: lineItems,
      customAttributes: [
        { key: 'user_id', value: userId },
        { key: 'transaction_id', value: txnid },
        { key: 'product_info', value: productInfo },
        { key: 'metadata', value: JSON.stringify(metadata || {}) }
      ],
      note: `CampusPandit Order - ${productInfo}`,
      shippingAddress: {
        firstName: firstName || 'Customer',
        lastName: '',
        phone: phone || '',
      }
    };

    const shopifyResponse = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: checkoutMutation,
          variables: { input: checkoutInput }
        }),
      }
    );

    if (!shopifyResponse.ok) {
      const errorData = await shopifyResponse.text();
      console.error('Shopify checkout creation failed:', errorData);
      return corsResponse({ error: 'Failed to create Shopify checkout', details: errorData }, 500);
    }

    const shopifyData = await shopifyResponse.json();

    if (shopifyData.errors) {
      console.error('Shopify GraphQL errors:', shopifyData.errors);
      return corsResponse({ error: 'Failed to create checkout', details: shopifyData.errors }, 500);
    }

    const checkoutUserErrors = shopifyData.data?.checkoutCreate?.checkoutUserErrors;
    if (checkoutUserErrors && checkoutUserErrors.length > 0) {
      console.error('Shopify checkout user errors:', checkoutUserErrors);
      return corsResponse({ error: 'Checkout validation failed', details: checkoutUserErrors }, 400);
    }

    const checkout = shopifyData.data?.checkoutCreate?.checkout;

    if (!checkout || !checkout.webUrl) {
      return corsResponse({ error: 'Failed to create checkout - no checkout URL returned' }, 500);
    }

    // Save transaction to database
    try {
      const { data: transaction, error: dbError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          transaction_id: txnid,
          payment_gateway: 'shopify',
          amount: amount,
          currency: 'INR',
          product_info: productInfo,
          status: 'pending',
          shopify_checkout_id: checkout.id,
          metadata: {
            first_name: firstName,
            email: email,
            phone: phone,
            ...metadata
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
        checkoutUrl: checkout.webUrl,
        checkoutId: checkout.id,
        transactionId: txnid,
        totalPrice: checkout.totalPrice,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Still return checkout details so payment can proceed
      return corsResponse({
        success: true,
        checkoutUrl: checkout.webUrl,
        checkoutId: checkout.id,
        transactionId: txnid,
        warning: 'Transaction not saved to database',
      });
    }
  } catch (error: any) {
    console.error('Error creating Shopify checkout:', error);
    return corsResponse({ error: error.message || 'Internal server error' }, 500);
  }
});
