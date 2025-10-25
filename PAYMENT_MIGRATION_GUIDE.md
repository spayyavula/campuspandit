# Payment Gateway Migration Guide

Quick reference for updating code from old payment gateways to Stripe.

## What Changed?

We've migrated from multiple payment gateways to Stripe-only:

**Removed:**
- Razorpay
- PayU
- Instamojo
- Shopify Payments

**Added:**
- Stripe (single payment gateway)

---

## Component Migration

### Old: MultiGatewayPaymentButton

```tsx
import MultiGatewayPaymentButton from '@/components/payment/MultiGatewayPaymentButton'

<MultiGatewayPaymentButton
  amount={100}
  productInfo="Premium Course"
  userId={user.id}
  firstName={user.firstName}
  email={user.email}
  phone={user.phone}
  metadata={{ sessionId: '123' }}
  onSuccess={() => console.log('Success')}
  onError={(error) => console.error(error)}
  defaultGateway="razorpay"
  allowGatewaySelection={true}
/>
```

### New: StripePaymentButton

```tsx
import StripePaymentButton from '@/components/payment/StripePaymentButton'

<StripePaymentButton
  amount={100}
  productInfo="Premium Course"
  userId={user.id}
  firstName={user.firstName}
  email={user.email}
  phone={user.phone}
  currency="usd"  // NEW: Specify currency
  metadata={{ sessionId: '123' }}
  onSuccess={(transactionId) => console.log('Success', transactionId)}
  onError={(error) => console.error(error)}
  testMode={false}  // NEW: Enable test mode if needed
/>
```

---

## Key Differences

| Feature | Old (MultiGateway) | New (Stripe) |
|---------|-------------------|--------------|
| Gateway selection | Multiple gateways via UI | Single gateway (Stripe) |
| Currency | INR only | Any supported currency |
| Amount format | Indian Rupees | Specified currency |
| Test mode | Per-gateway test mode | Single `testMode` prop |
| Payment UI | Redirects/popups | Embedded Stripe Elements |
| Props removed | `defaultGateway`, `allowGatewaySelection` | N/A |
| Props added | N/A | `currency`, `testMode` |

---

## Import Changes

### Remove These Imports

```tsx
// ❌ Remove
import { initiatePayUPayment } from '@/utils/payuPayment'
import { initiateRazorpayPayment } from '@/utils/razorpayPayment'
import { initiateInstamojoPayment } from '@/utils/instamojoPayment'
import { initiateShopifyPayment } from '@/utils/shopifyPayment'
import MultiGatewayPaymentButton from '@/components/payment/MultiGatewayPaymentButton'
```

### Add These Imports

```tsx
// ✅ Add
import StripePaymentButton from '@/components/payment/StripePaymentButton'
import { initiateStripePayment, handleStripePaymentConfirmation } from '@/utils/stripePayment'
```

---

## Programmatic Payment Initiation

If you're initiating payments programmatically (not using the component):

### Old: Razorpay Example

```tsx
import { initiateRazorpayPayment } from '@/utils/razorpayPayment'

const handlePayment = async () => {
  const result = await initiateRazorpayPayment({
    amount: 100,
    productInfo: 'Premium Course',
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
  })
}
```

### New: Stripe

```tsx
import { initiateStripePayment, handleStripePaymentConfirmation } from '@/utils/stripePayment'

const handlePayment = async () => {
  const result = await initiateStripePayment({
    amount: 100,
    productInfo: 'Premium Course',
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    currency: 'usd',
    onSuccess: (transactionId) => console.log('Success', transactionId),
    onError: (error) => console.error(error),
  })

  // result contains: clientSecret, paymentIntentId, transactionId, stripe
  // Use with Stripe Elements to complete payment
}
```

---

## Database Schema Changes

### Removed Columns

The following columns have been removed from `payment_transactions` table:

- `payu_payment_id`
- `payu_bank_ref_num`
- `razorpay_payment_id`
- `razorpay_order_id`
- `razorpay_signature`
- `instamojo_payment_id`
- `instamojo_payment_request_id`
- `shopify_checkout_id`
- `shopify_order_id`
- `shopify_order_number`

### Added Columns

- `stripe_payment_intent_id` - Stripe Payment Intent ID
- `stripe_charge_id` - Stripe Charge ID

### Accessing Old Data

Old payment data is backed up in `payment_transactions_backup` table:

```sql
SELECT * FROM payment_transactions_backup
WHERE payment_gateway IN ('payu', 'razorpay', 'instamojo', 'shopify');
```

---

## Environment Variables

### Remove

```bash
# ❌ Remove from .env files
VITE_PAYU_BASE_URL
VITE_PAYU_MODE
VITE_RAZORPAY_MODE
VITE_INSTAMOJO_BASE_URL
VITE_INSTAMOJO_MODE
VITE_SHOPIFY_MODE
```

### Add

```bash
# ✅ Add to .env files
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_key"
VITE_STRIPE_MODE="test"
```

### Supabase Secrets (Remove)

```bash
# Remove these secrets from Supabase
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
PAYU_MERCHANT_KEY
PAYU_MERCHANT_SALT
INSTAMOJO_API_KEY
INSTAMOJO_AUTH_TOKEN
SHOPIFY_STORE_DOMAIN
SHOPIFY_STOREFRONT_ACCESS_TOKEN
SHOPIFY_PRODUCT_ID
```

### Supabase Secrets (Add)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key
```

---

## Edge Functions

### Removed

- `create-razorpay-order`
- `verify-razorpay-payment`
- `create-payu-hash`
- `verify-payu-payment`
- `create-shopify-checkout`
- `verify-shopify-order`

### Added

- `create-stripe-payment-intent`
- `verify-stripe-payment`

### Deploy New Functions

```bash
supabase functions deploy create-stripe-payment-intent
supabase functions deploy verify-stripe-payment
```

---

## Testing

### Old: Test Mode (Per Gateway)

```tsx
// Different test modes for different gateways
VITE_RAZORPAY_MODE="test"
VITE_PAYU_MODE="test"
```

### New: Unified Test Mode

```tsx
// Single test mode
VITE_STRIPE_MODE="test"

// Or use testMode prop
<StripePaymentButton testMode={true} {...props} />
```

### Test Cards

Use Stripe test cards:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |

---

## Currency Support

### Old: INR Only

```tsx
// Amount was always in INR
<MultiGatewayPaymentButton amount={100} {...props} />
```

### New: Multi-Currency

```tsx
// Specify currency
<StripePaymentButton amount={100} currency="usd" {...props} />
<StripePaymentButton amount={7500} currency="inr" {...props} />
<StripePaymentButton amount={85} currency="eur" {...props} />
```

Supported currencies: USD, EUR, GBP, INR, CAD, AUD, and 130+ more.

---

## Payment Flow Comparison

### Old Flow (Razorpay Example)

```
1. User clicks "Pay"
2. Client calls create-razorpay-order Edge Function
3. Razorpay modal opens (popup)
4. User completes payment in modal
5. Modal closes, returns to app
6. Client calls verify-razorpay-payment Edge Function
7. Redirect to success page
```

### New Flow (Stripe)

```
1. Component mounts
2. Client calls create-stripe-payment-intent Edge Function
3. Stripe Elements renders (embedded in page)
4. User enters card details
5. User clicks "Pay"
6. Stripe confirms payment (3D Secure if needed)
7. Client calls verify-stripe-payment Edge Function
8. Redirect to success page
```

**Advantage**: No popups, smoother UX, embedded payment form.

---

## Common Migration Tasks

### Task 1: Update Booking Page

**Before:**
```tsx
import MultiGatewayPaymentButton from '@/components/payment/MultiGatewayPaymentButton'

<MultiGatewayPaymentButton
  amount={booking.totalAmount}
  productInfo={`Booking with ${tutor.name}`}
  userId={user.id}
  firstName={user.firstName}
  email={user.email}
  phone={user.phone}
  defaultGateway="razorpay"
/>
```

**After:**
```tsx
import StripePaymentButton from '@/components/payment/StripePaymentButton'

<StripePaymentButton
  amount={booking.totalAmount}
  productInfo={`Booking with ${tutor.name}`}
  userId={user.id}
  firstName={user.firstName}
  email={user.email}
  phone={user.phone}
  currency="usd"
  metadata={{ bookingId: booking.id }}
/>
```

### Task 2: Update Payment Success Page

**Before:**
```tsx
// Accessed Razorpay-specific data
const { razorpay_payment_id } = transaction
```

**After:**
```tsx
// Access Stripe-specific data
const { stripe_payment_intent_id, stripe_charge_id } = transaction
```

### Task 3: Update Payment History

**Before:**
```tsx
// Filtered by multiple gateways
const payments = await getPayments({
  gateway: ['razorpay', 'payu', 'shopify']
})
```

**After:**
```tsx
// Filter by stripe only
const payments = await getPayments({
  gateway: 'stripe'
})
```

---

## Rollback Plan (Emergency)

If you need to rollback:

1. **Restore old payment files from git history**:
```bash
git checkout HEAD~1 -- src/utils/razorpayPayment.ts
git checkout HEAD~1 -- src/components/payment/MultiGatewayPaymentButton.tsx
```

2. **Restore old Edge Functions**:
```bash
git checkout HEAD~1 -- supabase/functions/create-razorpay-order
git checkout HEAD~1 -- supabase/functions/verify-razorpay-payment
```

3. **Restore database schema**:
```sql
-- Re-add old columns
ALTER TABLE payment_transactions
ADD COLUMN razorpay_payment_id VARCHAR(255),
ADD COLUMN razorpay_order_id VARCHAR(255),
-- ... etc
```

4. **Restore environment variables**

---

## Getting Help

- Check `STRIPE_INTEGRATION_GUIDE.md` for detailed setup
- Review Stripe docs: https://stripe.com/docs
- Contact development team for support

---

## Checklist

Migration complete when:

- [ ] All components updated to use `StripePaymentButton`
- [ ] All imports updated (removed old gateway imports)
- [ ] Environment variables updated
- [ ] Supabase secrets updated
- [ ] Edge Functions deployed
- [ ] Database migration run
- [ ] Test payments working
- [ ] Production deployment complete
- [ ] Old gateway accounts closed/deactivated

---

**Last Updated**: 2025-01-24
