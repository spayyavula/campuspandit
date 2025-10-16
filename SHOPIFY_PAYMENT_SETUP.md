# Shopify Payment Integration - Quick Setup Guide

This guide helps you quickly integrate Shopify as a payment option in CampusPandit.

## Overview

Shopify has been added as a payment gateway option alongside Razorpay, PayU, and Instamojo. Users can now checkout through Shopify's hosted checkout page, which supports all major payment methods.

## What's Included

### 1. Client-Side Code
- **src/utils/shopifyPayment.ts** - Payment utility functions
- **src/components/payment/MultiGatewayPaymentButton.tsx** - Updated to include Shopify option

### 2. Server-Side Code (Supabase Edge Functions)
- **supabase/functions/create-shopify-checkout/** - Creates Shopify checkout sessions
- **supabase/functions/verify-shopify-order/** - Verifies order completion

### 3. Documentation
- **.env.local.example** - Updated with Shopify configuration
- **PAYMENT_EDGE_FUNCTIONS_SETUP.md** - Complete deployment guide

## Quick Setup (5 Steps)

### Step 1: Create Shopify Store

1. Sign up at [shopify.com](https://shopify.com)
2. Create a development store (free for testing)
3. Add at least one product to your store

### Step 2: Get Shopify Credentials

1. Go to **Shopify Admin** → **Apps** → **Develop apps**
2. Click **Create an app**
3. Name it "CampusPandit Payments"
4. Go to **Configuration** → **Storefront API**
5. Enable the following scopes:
   - `unauthenticated_read_checkouts`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_product_listings`
6. Click **Install app** and copy the **Storefront Access Token**
7. Note your store domain: `your-store.myshopify.com`

### Step 3: Configure Supabase Secrets

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set Shopify secrets
supabase secrets set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
supabase secrets set SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here

# Optional: Set default product for generic payments
supabase secrets set SHOPIFY_PRODUCT_ID=gid://shopify/ProductVariant/123456
```

### Step 4: Deploy Edge Functions

```bash
# Deploy Shopify Edge Functions
supabase functions deploy create-shopify-checkout
supabase functions deploy verify-shopify-order

# Verify deployment
supabase functions list
```

### Step 5: Update Environment Variables

Add to your `.env.local` file:

```env
VITE_SHOPIFY_MODE=test
```

## Testing the Integration

### 1. Enable Shopify Test Mode

In Shopify Admin:
1. Go to **Settings** → **Payments**
2. Enable **Shopify Payments test mode** or add **Bogus Gateway**
3. Save changes

### 2. Test Payment Flow

1. Run your app: `npm run dev`
2. Navigate to a page with the payment button
3. Select **Shopify** as payment method
4. Click "Pay" - you'll be redirected to Shopify checkout
5. Use test card: `1` (Bogus Gateway accepts any number)
6. Complete checkout
7. Verify order appears in Shopify Admin → Orders

### 3. Verify Database

Check that transaction was saved:

```sql
SELECT * FROM payment_transactions
WHERE payment_gateway = 'shopify'
ORDER BY created_at DESC
LIMIT 10;
```

## How It Works

```
User clicks "Pay with Shopify"
         ↓
Client calls create-shopify-checkout Edge Function
         ↓
Edge Function creates checkout via Shopify Storefront API
         ↓
User redirected to Shopify's hosted checkout page
         ↓
User completes payment on Shopify
         ↓
Shopify redirects back to your app
         ↓
Client calls verify-shopify-order Edge Function
         ↓
Edge Function verifies order and updates transaction status
         ↓
User sees success/failure page
```

## Database Schema

The `payment_transactions` table includes these Shopify-specific columns:

- `shopify_checkout_id` - Shopify checkout ID
- `shopify_order_id` - Shopify order ID (after successful payment)
- `shopify_order_number` - Human-readable order number

## Product Mapping

You have two options for handling products:

### Option 1: Single Default Product (Simpler)
- Set `SHOPIFY_PRODUCT_ID` to a generic "Service Payment" product
- All payments use this product
- Product info stored in checkout custom attributes

### Option 2: Product Mapping (Advanced)
- Create Shopify products for each service (tutoring, courses, etc.)
- Map your internal products to Shopify variant IDs
- Modify `create-shopify-checkout/index.ts` to handle product mapping

## Going Live

Before accepting real payments:

1. **Switch to Production Store**
   ```bash
   supabase secrets set SHOPIFY_STORE_DOMAIN=your-production-store.myshopify.com
   supabase secrets set SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_production_token
   ```

2. **Update Environment Variable**
   ```env
   VITE_SHOPIFY_MODE=live
   ```

3. **Enable Payment Gateway**
   - Go to Shopify Admin → Settings → Payments
   - Set up Shopify Payments or third-party gateway
   - Complete verification process

4. **Test with Real Cards** (small amounts)
   - Make a real purchase
   - Verify order in Shopify Admin
   - Verify transaction in database
   - Test refund process

5. **Configure Webhooks** (Recommended)
   - Set up Shopify webhooks for `checkout/complete` and `orders/paid`
   - Create webhook handler in your backend
   - Automatically sync payment status

## Customization

### Custom Checkout Attributes

Modify `create-shopify-checkout/index.ts` to add custom data:

```typescript
customAttributes: [
  { key: 'user_id', value: userId },
  { key: 'course_id', value: courseId },
  { key: 'session_id', value: sessionId }
]
```

### Return URLs

Configure where users return after payment:

```typescript
// In shopifyPayment.ts
const checkoutInput = {
  // ... other fields
  successUrl: `${window.location.origin}/payment/success`,
  cancelUrl: `${window.location.origin}/payment/cancelled`
};
```

## Troubleshooting

### "Shopify not configured" Error
- Check secrets are set: `supabase secrets list`
- Verify `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are present

### "Failed to create checkout" Error
- Verify Storefront API permissions
- Check Edge Function logs: `supabase functions logs create-shopify-checkout`
- Ensure store has at least one product (if using SHOPIFY_PRODUCT_ID)

### Checkout URL redirects to error page
- Verify store domain is correct (must end with .myshopify.com)
- Check that Storefront Access Token is valid
- Ensure checkout hasn't expired (checkouts expire after 24 hours)

### Order not appearing in Shopify
- User may have abandoned checkout
- Check Edge Function logs for errors
- Verify payment gateway is enabled in Shopify

## Security Notes

- Storefront Access Token is server-side only (never exposed to client)
- Checkout creation is authenticated via Supabase Auth
- All payment processing happens on Shopify's secure servers
- Your app never handles card details

## Support Resources

- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [Shopify Checkout Documentation](https://shopify.dev/docs/api/storefront/latest/mutations/checkoutCreate)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Next Steps

1. Customize checkout experience in Shopify Admin
2. Set up Shopify webhooks for real-time updates
3. Configure email notifications for orders
4. Add analytics tracking for conversion rates
5. Implement refund/cancellation handling

---

**Last Updated:** January 2025
**Version:** 1.0.0
