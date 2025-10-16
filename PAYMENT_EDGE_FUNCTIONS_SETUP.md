# Payment Gateway Edge Functions Setup Guide

This guide explains how to deploy and configure the secure Supabase Edge Functions for Razorpay, PayU, and Shopify payment gateways.

## 🔒 Security Overview

**IMPORTANT:** All payment gateway secrets (API keys, merchant salts) are now handled **server-side only** via Supabase Edge Functions. Never expose these credentials in client-side code.

### What Changed:
- ✅ **Before:** Secrets exposed in client-side environment variables (INSECURE)
- ✅ **After:** Secrets stored in Supabase Edge Function environment variables (SECURE)
- ✅ Payment hash generation and signature verification now happen server-side
- ✅ Client code only receives public keys and verified responses

---

## 📋 Prerequisites

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
2. **Supabase CLI** - Install via:
   ```bash
   npm install -g supabase
   ```
3. **Payment Gateway Accounts:**
   - **Razorpay:** Sign up at [razorpay.com](https://razorpay.com)
   - **PayU:** Sign up at [payu.in](https://payu.in)
   - **Shopify:** Sign up at [shopify.com](https://shopify.com) and create a store

---

## 🚀 Deployment Steps

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link Your Supabase Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in the Supabase Dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF`

### Step 4: Set Edge Function Secrets

#### For Razorpay:

```bash
# Test Mode (recommended for development)
supabase secrets set RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

# Production Mode (when ready for live payments)
supabase secrets set RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
supabase secrets set RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

#### For PayU:

```bash
# Test Mode
supabase secrets set PAYU_MERCHANT_KEY=YOUR_TEST_MERCHANT_KEY
supabase secrets set PAYU_MERCHANT_SALT=YOUR_TEST_MERCHANT_SALT

# Production Mode
supabase secrets set PAYU_MERCHANT_KEY=YOUR_LIVE_MERCHANT_KEY
supabase secrets set PAYU_MERCHANT_SALT=YOUR_LIVE_MERCHANT_SALT
```

#### For Shopify:

```bash
# Get these from your Shopify store admin
supabase secrets set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
supabase secrets set SHOPIFY_STOREFRONT_ACCESS_TOKEN=YOUR_STOREFRONT_ACCESS_TOKEN

# Optional: Set a default product variant ID for generic payments
supabase secrets set SHOPIFY_PRODUCT_ID=gid://shopify/ProductVariant/YOUR_VARIANT_ID
```

**How to get Shopify credentials:**
1. Go to your Shopify Admin Dashboard
2. Navigate to **Apps** → **Develop apps** (or **Manage private apps** for older stores)
3. Create a new app or private app
4. Enable **Storefront API** access
5. Configure permissions:
   - `unauthenticated_read_checkouts` (read checkouts)
   - `unauthenticated_write_checkouts` (create checkouts)
   - `unauthenticated_read_product_listings` (read products)
6. Copy the **Storefront Access Token**
7. Your store domain is `your-store-name.myshopify.com`

#### Verify Secrets:

```bash
supabase secrets list
```

### Step 5: Deploy Edge Functions

Deploy all payment-related Edge Functions:

```bash
# Deploy Razorpay functions
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment

# Deploy PayU functions
supabase functions deploy create-payu-hash
supabase functions deploy verify-payu-payment

# Deploy Shopify functions
supabase functions deploy create-shopify-checkout
supabase functions deploy verify-shopify-order
```

Or deploy all at once:
```bash
supabase functions deploy
```

### Step 6: Run Database Migrations

Ensure the payment_transactions table exists:

```bash
supabase db push
```

Or manually run the migration:
```bash
psql YOUR_DATABASE_URL -f supabase/migrations/20251014000000_create_payment_transactions.sql
```

### Step 7: Update Client Environment Variables

Update your `.env` file (or `.env.production` for production):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Payment Gateway Modes
VITE_RAZORPAY_MODE=test  # or 'live' for production
VITE_PAYU_MODE=test      # or 'live' for production
VITE_PAYU_BASE_URL=https://test.payu.in  # or https://secure.payu.in for production
VITE_SHOPIFY_MODE=test   # or 'live' for production
```

**IMPORTANT:** Do NOT include the following in `.env` anymore (they're now server-side only):
- ❌ `VITE_RAZORPAY_KEY_ID`
- ❌ `VITE_RAZORPAY_KEY_SECRET`
- ❌ `VITE_PAYU_MERCHANT_KEY`
- ❌ `VITE_PAYU_MERCHANT_SALT`
- ❌ `SHOPIFY_STORE_DOMAIN`
- ❌ `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- ❌ `SHOPIFY_PRODUCT_ID`

---

## 🧪 Testing the Setup

### Test Razorpay Integration:

1. Use Razorpay test credentials (keys starting with `rzp_test_`)
2. Test card numbers:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test PayU Integration:

1. Use PayU test credentials
2. Test card numbers provided by PayU documentation
3. Success URL: `http://localhost:5173/payment/success`
4. Failure URL: `http://localhost:5173/payment/failure`

### Test Shopify Integration:

1. Use Shopify test mode (development store)
2. Create a test product in your Shopify store
3. Use Shopify's test payment gateway (Bogus Gateway)
4. Test checkout flow end-to-end
5. Verify order creation in Shopify admin

**Enable Shopify Bogus Gateway (for testing):**
1. Go to **Settings** → **Payments** in Shopify Admin
2. Scroll to **Test mode**
3. Enable **Shopify Payments test mode** or use **Bogus Gateway**
4. Test cards will work in this mode

### Verify Edge Functions:

Check Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions section
2. Select a function
3. View logs for any errors

Or via CLI:
```bash
supabase functions logs create-razorpay-order
```

---

## 🔍 Troubleshooting

### Error: "Payment gateway not configured"

**Cause:** Edge Function secrets not set properly.

**Solution:**
```bash
supabase secrets list
# Ensure RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT are present
```

### Error: "Failed to create order"

**Cause:** Edge Function not deployed or incorrect credentials.

**Solutions:**
1. Check if functions are deployed: `supabase functions list`
2. Verify credentials with payment gateway dashboard
3. Check Edge Function logs: `supabase functions logs create-razorpay-order`

### Error: "User not authenticated"

**Cause:** Supabase auth token not present or expired.

**Solution:**
- Ensure user is logged in
- Check if `Authorization` header is being sent with requests
- Verify Supabase client is initialized correctly

### Error: "Database table not found"

**Cause:** Migration not run.

**Solution:**
```bash
supabase db push
```

### CORS Errors

**Cause:** Edge Function CORS headers not configured for your domain.

**Solution:** Edge Functions already include wildcard CORS (`Access-Control-Allow-Origin: *`). If issues persist, check browser console for specific error.

---

## 📊 Monitoring

### View Payment Transactions:

Via Supabase Dashboard:
1. Go to Table Editor
2. Select `payment_transactions` table
3. View all payment records

Via SQL:
```sql
SELECT * FROM payment_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

### Monitor Edge Function Performance:

```bash
# View recent logs
supabase functions logs create-razorpay-order --tail

# View logs from last hour
supabase functions logs create-razorpay-order --since 1h
```

---

## 🔐 Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use different credentials** for test and production
3. ✅ **Rotate secrets regularly** (every 90 days)
4. ✅ **Monitor failed payment attempts** for suspicious activity
5. ✅ **Enable Razorpay/PayU webhooks** for real-time payment status updates
6. ✅ **Use HTTPS only** in production
7. ✅ **Implement rate limiting** on payment endpoints (via Supabase RLS or middleware)

---

## 🌐 Production Deployment Checklist

Before going live:

- [ ] Set production credentials in Supabase secrets
- [ ] Update `VITE_RAZORPAY_MODE` and `VITE_PAYU_MODE` to `'live'`
- [ ] Update `VITE_PAYU_BASE_URL` to `https://secure.payu.in`
- [ ] Test payments with real cards (small amounts)
- [ ] Configure webhooks for payment status updates
- [ ] Set up monitoring and alerts
- [ ] Review Supabase Edge Function logs regularly
- [ ] Enable database backups
- [ ] Document payment flow for team

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Razorpay API Docs](https://razorpay.com/docs/api/)
- [PayU Integration Guide](https://devguide.payu.in/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

## 🆘 Support

If you encounter issues:

1. Check Edge Function logs: `supabase functions logs FUNCTION_NAME`
2. Verify secrets are set: `supabase secrets list`
3. Test with payment gateway dashboards
4. Review this documentation
5. Contact payment gateway support if credential issues persist

---

## 📝 Edge Functions Architecture

### Razorpay Flow:
```
Client Request
    ↓
[create-razorpay-order] → Creates order with Razorpay API
    ↓                      → Saves transaction to DB
Returns: { orderId, keyId, amount }
    ↓
Client shows Razorpay UI
    ↓
User completes payment
    ↓
[verify-razorpay-payment] → Verifies signature with secret key
    ↓                       → Updates transaction status
Returns: { verified: true/false }
```

### PayU Flow:
```
Client Request
    ↓
[create-payu-hash] → Generates SHA512 hash with merchant salt
    ↓               → Saves transaction to DB
Returns: { hash, key, paymentData }
    ↓
Client submits form to PayU
    ↓
User completes payment on PayU
    ↓
PayU redirects to success/failure URL
    ↓
[verify-payu-payment] → Verifies response hash
    ↓                  → Updates transaction status
Returns: { verified: true/false }
```

### Shopify Flow:
```
Client Request
    ↓
[create-shopify-checkout] → Creates checkout via Storefront API
    ↓                       → Saves transaction to DB
Returns: { checkoutUrl, checkoutId }
    ↓
Client redirects to Shopify checkout
    ↓
User completes payment on Shopify
    ↓
Shopify redirects back to your app
    ↓
[verify-shopify-order] → Queries checkout/order status
    ↓                   → Updates transaction status
Returns: { verified: true/false, orderId, orderNumber }
```

---

**Last Updated:** October 2024
**Version:** 1.0.0
