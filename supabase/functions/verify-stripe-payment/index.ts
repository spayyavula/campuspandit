import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      throw new Error('Payment Intent ID is required')
    }

    // Retrieve Payment Intent from Stripe
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    )

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe API error:', error)
      throw new Error(`Stripe API error: ${error}`)
    }

    const paymentIntent = await stripeResponse.json()

    // Verify payment status
    const verified = paymentIntent.status === 'succeeded'
    const chargeId = paymentIntent.latest_charge || ''
    const paymentMethod = paymentIntent.payment_method_types?.[0] || 'card'

    // Return verification result
    return new Response(
      JSON.stringify({
        verified,
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        chargeId,
        paymentMethod,
        amount: paymentIntent.amount / 100, // Convert back to major currency unit
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
