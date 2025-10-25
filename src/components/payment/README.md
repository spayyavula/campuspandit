# Payment Components

This directory contains all payment-related UI components for CampusPandit.

## Components

### 1. StripePaymentButton

Main payment component that handles Stripe payments including cards, PayPal, Apple Pay, and Google Pay.

**Usage:**

```tsx
import StripePaymentButton from '@/components/payment/StripePaymentButton'

<StripePaymentButton
  amount={100.00}
  productInfo="Premium Course"
  userId={user.id}
  firstName={user.firstName}
  email={user.email}
  phone={user.phone}
  currency="usd"
  onSuccess={(transactionId) => console.log('Success!', transactionId)}
  onError={(error) => console.error(error)}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | Yes | Amount to charge (e.g., 100.00 for $100) |
| `productInfo` | string | Yes | Description of product/service |
| `userId` | string | Yes | User ID from auth |
| `firstName` | string | Yes | Customer's first name |
| `email` | string | Yes | Customer's email |
| `phone` | string | Yes | Customer's phone |
| `currency` | string | No | Currency code (default: 'usd') |
| `metadata` | object | No | Additional data to store |
| `onSuccess` | function | No | Callback on success |
| `onError` | function | No | Callback on error |
| `testMode` | boolean | No | Enable test mode (no charges) |
| `className` | string | No | Additional CSS classes |
| `disabled` | boolean | No | Disable payment button |
| `children` | ReactNode | No | Custom button text |

**Features:**
- ✅ Card payments (Visa, Mastercard, Amex, etc.)
- ✅ PayPal integration
- ✅ Apple Pay support
- ✅ Google Pay support
- ✅ Multi-currency support
- ✅ Test mode for development
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

---

### 2. PayPalHelpInfo

Informational component that helps customers understand how to pay with PayPal.

**Usage:**

```tsx
import PayPalHelpInfo from '@/components/payment/PayPalHelpInfo'

// Basic usage (collapsible)
<PayPalHelpInfo />

// Always expanded
<PayPalHelpInfo collapsible={false} />

// Expanded by default
<PayPalHelpInfo defaultExpanded={true} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | '' | Additional CSS classes |
| `collapsible` | boolean | true | Allow expanding/collapsing |
| `defaultExpanded` | boolean | false | Start expanded |

**Features:**
- ✅ Step-by-step PayPal payment guide
- ✅ Benefits of using PayPal
- ✅ FAQ section
- ✅ Security information
- ✅ Collapsible/expandable
- ✅ Responsive design

---

### 3. PaymentSuccess

Success page component shown after successful payment.

**Usage:**

```tsx
import PaymentSuccess from '@/components/payment/PaymentSuccess'

<PaymentSuccess />
```

Shows transaction details and success message.

---

### 4. PaymentFailure

Failure page component shown when payment fails.

**Usage:**

```tsx
import PaymentFailure from '@/components/payment/PaymentFailure'

<PaymentFailure />
```

Shows error details and retry option.

---

### 5. PaymentHistory

Component to display user's payment transaction history.

**Usage:**

```tsx
import PaymentHistory from '@/components/payment/PaymentHistory'

<PaymentHistory userId={user.id} />
```

Shows list of all transactions with filtering and search.

---

## Complete Checkout Page Example

Here's a complete example of a checkout page with PayPal support:

```tsx
import React from 'react';
import StripePaymentButton from '@/components/payment/StripePaymentButton';
import PayPalHelpInfo from '@/components/payment/PayPalHelpInfo';

const CheckoutPage = () => {
  const user = useUser(); // Your auth hook
  const booking = useBooking(); // Your booking data

  const handleSuccess = (transactionId: string) => {
    console.log('Payment successful!', transactionId);
    // Redirect to success page
    window.location.href = `/payment/success?transaction_id=${transactionId}`;
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
    // Show error to user
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Item:</span>
            <span>{booking.productInfo}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-semibold">${booking.amount}</span>
          </div>
        </div>
      </div>

      {/* PayPal Help Info */}
      <PayPalHelpInfo className="mb-6" />

      {/* Payment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
        <StripePaymentButton
          amount={booking.amount}
          productInfo={booking.productInfo}
          userId={user.id}
          firstName={user.firstName}
          email={user.email}
          phone={user.phone}
          currency="usd"
          metadata={{
            bookingId: booking.id,
            sessionId: booking.sessionId,
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Need help? Contact us at{' '}
          <a href="mailto:support@campuspandit.com" className="text-primary-600">
            support@campuspandit.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;
```

---

## Payment Flow

### Card Payment Flow
```
1. Customer enters card details
2. Clicks "Pay" button
3. Stripe validates card
4. 3D Secure authentication (if needed)
5. Payment processed
6. Success page shown
```

### PayPal Payment Flow
```
1. Customer selects PayPal
2. Clicks "Continue with PayPal"
3. Redirects to PayPal.com
4. Customer logs into PayPal
5. Confirms payment
6. Returns to your site
7. Success page shown
```

---

## Styling

All components use Tailwind CSS classes and can be customized:

```tsx
// Custom styling
<StripePaymentButton
  className="my-custom-class"
  {...props}
/>

<PayPalHelpInfo
  className="mb-8 shadow-lg"
/>
```

---

## Testing

### Test Mode

Enable test mode for development:

```tsx
<StripePaymentButton
  testMode={true}
  {...props}
/>
```

### Test Cards

Use these test cards in Stripe test mode:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Visa (Success) |
| 5555 5555 5555 4444 | Mastercard (Success) |
| 4000 0025 0000 3155 | Visa (3D Secure) |
| 4000 0000 0000 9995 | Declined |

**All test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### Test PayPal

In test mode, click PayPal and use Stripe's test PayPal credentials.

---

## Error Handling

All components include built-in error handling:

```tsx
<StripePaymentButton
  onError={(error) => {
    // Handle error
    console.error('Payment failed:', error);

    // Show to user
    toast.error(`Payment failed: ${error}`);

    // Log to analytics
    analytics.track('Payment Failed', { error });
  }}
  {...props}
/>
```

---

## Security

All components follow security best practices:

- ✅ No sensitive data in client code
- ✅ PCI DSS compliant (handled by Stripe)
- ✅ HTTPS only in production
- ✅ Secrets stored server-side
- ✅ Input validation and sanitization
- ✅ CSRF protection via Supabase auth

---

## Accessibility

Components are accessible:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast compliance

---

## Mobile Support

All components are fully responsive:

- ✅ Mobile-optimized Stripe Elements
- ✅ Touch-friendly buttons
- ✅ Responsive layouts
- ✅ Apple Pay / Google Pay integration

---

## Browser Support

Supported browsers:

- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## Troubleshooting

### Issue: Payment button not appearing

**Check:**
1. Stripe publishable key is set in `.env`
2. Component is wrapped in proper auth context
3. User data is available
4. No console errors

### Issue: PayPal not showing

**Check:**
1. PayPal enabled in Stripe Dashboard
2. Using correct Stripe mode (test/live)
3. Customer's country supports PayPal
4. Browser cache cleared

### Issue: Payment fails

**Common causes:**
1. Insufficient funds
2. Card declined by issuer
3. 3D Secure failed
4. Network error

**Solutions:**
- Ask customer to try different card
- Check Stripe Dashboard for error details
- Verify Edge Functions are deployed

---

## Resources

- [Stripe Payment Integration Guide](../../../STRIPE_INTEGRATION_GUIDE.md)
- [PayPal Setup Guide](../../../PAYPAL_SETUP_GUIDE.md)
- [Payment Migration Guide](../../../PAYMENT_MIGRATION_GUIDE.md)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Docs](https://stripe.com/docs/stripe-js/react)

---

## Support

For issues or questions:
- Check documentation in `/docs`
- Review Stripe Dashboard logs
- Contact development team
- Create issue in repository

---

**Last Updated**: 2025-01-24
