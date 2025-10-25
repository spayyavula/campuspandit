# Stripe Payment Integration Guide

Complete guide for integrating Stripe payments in CampusPandit.

## Table of Contents
1. [Overview](#overview)
2. [Why Stripe?](#why-stripe)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [PayPal Integration](#paypal-integration)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

CampusPandit uses Stripe as its sole payment gateway for accepting payments from users. Stripe provides:

- **Low fees for international payments**: ~2.9% + $0.30 per transaction
- **Wide payment method support**: Cards, PayPal, Apple Pay, Google Pay, and more
- **Excellent developer experience**: Clean API, great documentation
- **Secure by design**: PCI DSS Level 1 compliant
- **Global reach**: Supports 135+ currencies

### PayPal Support
✅ **PayPal is fully integrated!** Customers can pay using their PayPal account through Stripe's unified payment interface. No separate PayPal integration needed!

---

## Why Stripe?

We migrated from multiple payment gateways (Razorpay, PayU, Instamojo, Shopify) to Stripe for:

1. **Better international support**: Lower fees for international transactions
2. **Simplified codebase**: One gateway instead of four
3. **Industry standard**: Trusted by millions of businesses worldwide
4. **Better UX**: Stripe Elements provides a modern, responsive payment UI
5. **Comprehensive features**: Subscriptions, refunds, disputes, analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │       StripePaymentButton Component                │    │
│  │  - Initializes payment                              │    │
│  │  - Uses Stripe Elements UI                         │    │
│  │  - Confirms payment                                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                 │
│  ┌──────────────────────────┐  ┌──────────────────────┐   │
│  │ create-payment-intent    │  │ verify-payment       │   │
│  │ - Creates Payment Intent │  │ - Verifies payment   │   │
│  │ - Returns client secret  │  │ - Updates DB         │   │
│  └──────────────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Stripe API                                │
│  - Payment processing                                        │
│  - Card validation                                           │
│  - Fraud detection                                           │
│  - 3D Secure authentication                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               Supabase PostgreSQL Database                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         payment_transactions table                 │    │
│  │  - transaction_id                                  │    │
│  │  - user_id                                         │    │
│  │  - amount, currency                                │    │
│  │  - stripe_payment_intent_id                        │    │
│  │  - stripe_charge_id                                │    │
│  │  - status (pending/success/failed)                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Security Model

- **Frontend**: Only has publishable key (safe to expose)
- **Backend (Edge Functions)**: Holds secret key (never exposed to client)
- **Database**: Row-level security ensures users only see their own transactions

---

## Setup Instructions

### Step 1: Get Stripe API Keys

1. Sign up at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete business verification (for live mode)
3. Get your API keys from [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)

You'll need:
- **Publishable Key** (starts with `pk_test_` or `pk_live_`)
- **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 3: Configure Environment Variables

#### Client-side (.env or .env.local)

```bash
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
VITE_STRIPE_MODE="test"
```

#### Server-side (Supabase Secrets)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### Step 4: Deploy Edge Functions

```bash
# Deploy create-payment-intent function
supabase functions deploy create-stripe-payment-intent

# Deploy verify-payment function
supabase functions deploy verify-stripe-payment
```

### Step 5: Run Database Migration

```bash
# Run the migration to add Stripe fields and remove old gateway fields
supabase db push
```

Or manually run the migration:
```sql
-- Run: supabase/migrations/20251024000000_migrate_to_stripe_only.sql
```

---

## PayPal Integration

### Overview

✅ **PayPal is built into Stripe!** Your customers can pay with PayPal through the same payment interface, with no additional integration needed.

### Why PayPal via Stripe?

- **No separate integration** - Already works with StripePaymentButton
- **Single dashboard** - View all payments (cards + PayPal) in Stripe
- **Same fees** - 2.9% + $0.30 per transaction
- **Unified experience** - Customers choose PayPal from payment options
- **Better conversion** - More payment options = 10-15% higher conversion

### How to Enable PayPal

#### Step 1: Enable in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Settings** → **Payment methods**
3. Find **PayPal** in the list of payment methods
4. Click **Turn on** or **Enable**
5. Follow the prompts to connect your PayPal business account

**Important:** You need a PayPal Business account to receive payments. If you don't have one:
- Sign up at [PayPal Business](https://www.paypal.com/business)
- Complete business verification
- Link it to your Stripe account

#### Step 2: Configure PayPal Settings

In Stripe Dashboard → Settings → Payment methods → PayPal:

1. **Onboarding**: Complete PayPal business account connection
2. **Branding**: Customize how your business appears in PayPal checkout
3. **Statement descriptor**: Set what appears on customer statements
4. **Countries**: Select countries where PayPal should be available

#### Step 3: Test PayPal Integration

1. Set `VITE_STRIPE_MODE="test"` in your `.env` file
2. Use Stripe's test mode
3. At checkout, PayPal will appear as a payment option
4. Click PayPal and use Stripe's test PayPal credentials:
   - Test PayPal Sandbox account provided by Stripe
   - Or connect your own PayPal Sandbox account

#### Step 4: Go Live

1. Complete PayPal business verification
2. Enable PayPal in Stripe live mode
3. Set `VITE_STRIPE_MODE="live"` in production
4. Test with small real payment

### Customer Experience with PayPal

When a customer chooses PayPal:

1. **Payment page loads** - Shows Stripe payment form
2. **Customer sees options** - Card, PayPal, Apple Pay, etc.
3. **Customer clicks PayPal** - PayPal button appears
4. **Redirects to PayPal** - Secure PayPal login
5. **Customer authorizes** - Confirms payment in PayPal
6. **Returns to your site** - Payment complete
7. **Order confirmed** - Success page shown

### PayPal Payment Flow

```
Customer → Selects PayPal → Redirects to PayPal.com → Logs in
    ↓
Authorizes payment → Returns to your site → Payment confirmed
    ↓
Transaction recorded in database → Success page
```

### Customer-Facing PayPal Features

The `StripePaymentButton` component automatically displays:

✅ **Multiple payment method badges** - Shows "PayPal" as available
✅ **Secure payment notice** - Mentions PayPal security
✅ **Clear instructions** - Guides customers to choose PayPal
✅ **Seamless experience** - Embedded in payment flow

### PayPal Testing

#### Test Mode

In test mode (Stripe Dashboard → Developers → Test mode):

1. PayPal test button will appear at checkout
2. Click PayPal to test the flow
3. Use Stripe's test PayPal account or connect your PayPal Sandbox

#### Test Scenarios

Test these scenarios:

- ✅ Successful PayPal payment
- ✅ Customer cancels PayPal payment
- ✅ Insufficient funds in PayPal
- ✅ PayPal account verification required
- ✅ Multiple currency payments

### PayPal Fees

| Payment Type | Fee |
|-------------|-----|
| Domestic PayPal payment | 2.9% + $0.30 |
| International PayPal payment | 2.9% + $0.30 + 1% currency conversion |
| Same as card payments | Yes |

**Note:** Stripe charges the same fee for PayPal as for cards. No additional PayPal fees!

### PayPal Availability

PayPal is available in **200+ countries** including:
- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇪🇺 European Union
- 🇨🇦 Canada
- 🇦🇺 Australia
- 🇮🇳 India (limited - international accounts only)

### Troubleshooting PayPal

#### Issue: "PayPal not showing at checkout"

**Solution:**
1. Check PayPal is enabled in Stripe Dashboard
2. Verify you're using live mode (not test) or test credentials are set
3. Clear browser cache
4. Check customer's country is supported

#### Issue: "PayPal payment failed"

**Possible causes:**
- Customer cancelled payment
- Insufficient PayPal balance
- PayPal account needs verification
- Transaction blocked by PayPal fraud detection

**Solution:**
- Ask customer to try again
- Suggest using different payment method
- Contact PayPal support for account issues

#### Issue: "Can't connect PayPal to Stripe"

**Solution:**
1. Ensure you have a PayPal Business account (not personal)
2. Complete PayPal business verification
3. Check you're logged into correct PayPal account
4. Try disconnecting and reconnecting

### PayPal for Customers - Quick Guide

**How to Pay with PayPal:**

1. 📱 On the payment page, you'll see multiple payment options
2. 🔘 Click or select "PayPal"
3. 🔐 You'll be redirected to PayPal.com (secure)
4. ✅ Log in to your PayPal account
5. 👀 Review the payment details
6. ✔️ Click "Confirm" to authorize payment
7. ↩️ You'll return to our site automatically
8. 🎉 Payment complete!

**Benefits of Using PayPal:**
- ✅ Don't need to enter card details
- ✅ Use your PayPal balance or linked cards
- ✅ PayPal Buyer Protection
- ✅ Secure and encrypted
- ✅ No fees for customers

### PayPal vs Credit Card

| Feature | PayPal | Credit Card |
|---------|--------|-------------|
| **Speed** | Fast (if logged in) | Fast |
| **Security** | High (PayPal protection) | High (Stripe encryption) |
| **Buyer Protection** | ✅ Yes | ✅ Yes (via card issuer) |
| **International** | ✅ 200+ countries | ✅ Global |
| **Fees to customer** | Free | Free |
| **Requires account** | Yes (PayPal) | No |

### PayPal Refunds

Refunds work the same as card refunds:

1. Go to Stripe Dashboard → Payments
2. Find the PayPal transaction
3. Click "Refund"
4. Customer receives refund to PayPal account (2-5 days)

### Additional Resources

- **Stripe PayPal Docs**: [https://stripe.com/docs/payments/paypal](https://stripe.com/docs/payments/paypal)
- **PayPal Business**: [https://www.paypal.com/business](https://www.paypal.com/business)
- **Testing PayPal**: [https://stripe.com/docs/payments/paypal/accept-a-payment#test](https://stripe.com/docs/payments/paypal/accept-a-payment#test)

---

## Configuration

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side publishable key | `pk_test_xxx` | Yes |
| `VITE_STRIPE_MODE` | Mode: test or live | `test` | Yes |
| `STRIPE_SECRET_KEY` | Server-side secret key (Supabase secret) | `sk_test_xxx` | Yes |

### Stripe Dashboard Configuration

1. **Enable Payment Methods**:
   - Go to Settings → Payment methods
   - Enable: Cards, Apple Pay, Google Pay, etc.

2. **Configure Webhooks** (optional, for advanced features):
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

3. **Set up Business Information**:
   - Go to Settings → Public business information
   - Add business name, support email, etc.

---

## Usage

### Basic Payment Flow

```tsx
import StripePaymentButton from '@/components/payment/StripePaymentButton'

function CheckoutPage() {
  const handleSuccess = (transactionId: string) => {
    console.log('Payment successful!', transactionId)
    // Redirect or show success message
  }

  const handleError = (error: string) => {
    console.error('Payment failed:', error)
    // Show error to user
  }

  return (
    <StripePaymentButton
      amount={100.00}
      productInfo="Premium Course"
      userId={user.id}
      firstName={user.firstName}
      email={user.email}
      phone={user.phone}
      currency="usd"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | Yes | Amount in major currency unit (e.g., 100.00 for $100) |
| `productInfo` | string | Yes | Description of product/service |
| `userId` | string | Yes | User ID from authentication |
| `firstName` | string | Yes | Customer's first name |
| `email` | string | Yes | Customer's email |
| `phone` | string | Yes | Customer's phone number |
| `currency` | string | No | Currency code (default: 'usd') |
| `metadata` | object | No | Additional data to store |
| `onSuccess` | function | No | Callback on successful payment |
| `onError` | function | No | Callback on payment error |
| `testMode` | boolean | No | Use test payment mode (no real charges) |

### Test Mode

For development/testing without real charges:

```tsx
<StripePaymentButton
  {...props}
  testMode={true}
/>
```

---

## Testing

### Test Card Numbers

Use these test cards in test mode:

| Card Number | Description | Result |
|-------------|-------------|--------|
| `4242 4242 4242 4242` | Visa | Success |
| `5555 5555 5555 4444` | Mastercard | Success |
| `4000 0025 0000 3155` | Visa (3D Secure) | Requires authentication |
| `4000 0000 0000 9995` | Visa | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Visa | Declined (generic) |

**Details for all test cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Testing Checklist

- [ ] Test successful payment
- [ ] Test declined card
- [ ] Test 3D Secure authentication
- [ ] Test with insufficient funds
- [ ] Test error handling (network errors, etc.)
- [ ] Verify transaction appears in database
- [ ] Check payment appears in Stripe Dashboard
- [ ] Test different currencies (USD, EUR, GBP, etc.)

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Complete Stripe business verification
- [ ] Get live API keys (pk_live_xxx, sk_live_xxx)
- [ ] Update environment variables to use live keys
- [ ] Test with small real amounts
- [ ] Set up webhook endpoints (if using)
- [ ] Enable fraud detection settings in Stripe Dashboard
- [ ] Configure payout schedule (Settings → Payouts)
- [ ] Set up tax collection (if applicable)
- [ ] Add terms of service and refund policy links
- [ ] Test refund process

### Deployment Steps

1. **Update Production Environment Variables**:

```bash
# In .env.production or Vercel/Netlify dashboard
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
VITE_STRIPE_MODE="live"
```

2. **Update Supabase Secrets**:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_secret_key
```

3. **Deploy Edge Functions**:

```bash
supabase functions deploy create-stripe-payment-intent
supabase functions deploy verify-stripe-payment
```

4. **Run Database Migration** (if not already run):

```bash
supabase db push
```

5. **Monitor First Transactions**:
   - Watch Stripe Dashboard for first payments
   - Check database for transaction records
   - Verify webhook events (if configured)

---

## Troubleshooting

### Common Issues

#### Issue: "Invalid API Key provided"

**Solution**: Check that:
- Publishable key is set in `.env` file
- Secret key is set in Supabase secrets
- Keys match the mode (test keys for test mode, live keys for live mode)

```bash
# Check Supabase secrets
supabase secrets list
```

#### Issue: "Payment Intent creation failed"

**Solution**:
- Check Edge Function logs: `supabase functions logs create-stripe-payment-intent`
- Verify amount is positive and in correct format
- Ensure currency is supported by Stripe

#### Issue: "Card declined"

**Possible causes**:
- Insufficient funds
- Card expired
- CVC incorrect
- Fraud detection flagged transaction

**Solution**: Ask customer to:
- Try different card
- Contact their bank
- Use different payment method

#### Issue: "CORS errors"

**Solution**: Verify CORS headers in Edge Functions:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

#### Issue: "Elements not loading"

**Solution**:
- Check Stripe publishable key is correct
- Verify `@stripe/stripe-js` is installed
- Check browser console for errors
- Ensure no ad blockers interfering

### Debug Mode

Enable debug logging in development:

```tsx
// In stripePayment.ts
console.log('Payment Intent created:', paymentIntent)
console.log('Transaction ID:', transactionId)
```

### Support Resources

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## Migration from Old Payment Gateways

If you had transactions with old payment gateways (Razorpay, PayU, Instamojo, Shopify), they are backed up in the `payment_transactions_backup` table.

### Accessing Old Transaction Data

```sql
SELECT * FROM payment_transactions_backup
WHERE user_id = 'user_id_here'
ORDER BY created_at DESC;
```

### Notes

- Old payment gateway columns have been removed from `payment_transactions`
- All new payments will use Stripe
- Historical data is preserved in backup table
- Consider exporting backup data for archival purposes

---

## Next Steps

1. ✅ Complete Stripe account verification
2. ✅ Test payments in test mode
3. ✅ Deploy to staging environment
4. ✅ Test with real small amounts
5. ✅ Deploy to production
6. ✅ Monitor first production transactions
7. ✅ Set up automated testing for payment flows
8. ✅ Configure webhook endpoints for advanced features

---

## FAQ

**Q: What currencies does Stripe support?**
A: Stripe supports 135+ currencies. Common ones: USD, EUR, GBP, INR, CAD, AUD, etc.

**Q: How long does it take to receive payments?**
A: Typically 2-7 business days depending on country and payout schedule.

**Q: What are the fees?**
A: Standard: 2.9% + $0.30 per transaction. International cards: +1% currency conversion.

**Q: Can I refund payments?**
A: Yes, full and partial refunds are supported via Stripe Dashboard or API.

**Q: Is PCI compliance required?**
A: No, Stripe handles PCI compliance. You never touch card data directly.

**Q: Can I accept subscriptions?**
A: Yes, Stripe supports subscriptions. Additional integration needed.

---

## License

This integration is part of CampusPandit and follows the project's license.

## Support

For issues or questions:
- Create an issue in the project repository
- Contact the development team
- Check Stripe documentation

---

**Last Updated**: 2025-01-24
**Version**: 1.0.0
