# PayU Payment Gateway Integration

This document explains how to set up and use the PayU payment gateway integration in CampusPandit.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before integrating PayU, you need:

1. **PayU Merchant Account**
   - Sign up at [https://www.payu.in/](https://www.payu.in/)
   - Complete KYC verification
   - Get your Merchant Key and Salt

2. **Required NPM Packages** (Already installed)
   - `crypto-js` - For generating payment hashes
   - `@types/crypto-js` - TypeScript types

## Setup Instructions

### 1. Get PayU Credentials

**For Testing:**
- Visit [https://developer.payumoney.com/](https://developer.payumoney.com/)
- Sign up for a test account
- Get test Merchant Key and Salt

**For Production:**
- Visit [https://www.payu.in/](https://www.payu.in/)
- Complete merchant onboarding
- Get production Merchant Key and Salt

### 2. Configure Environment Variables

Copy your environment file:
```bash
cp .env.local.example .env.local
```

Update the PayU configuration in `.env.local`:

```env
# PayU Payment Gateway Configuration
VITE_PAYU_MERCHANT_KEY="your-merchant-key"
VITE_PAYU_MERCHANT_SALT="your-merchant-salt"
VITE_PAYU_BASE_URL="https://test.payu.in"  # Test environment
VITE_PAYU_MODE="test"
```

**Important:** Never commit actual credentials to git!

### 3. Database Migration

Apply the payment transactions migration to your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/20251014000000_create_payment_transactions.sql`

This creates:
- `payment_transactions` table
- `tutor_bookings` table
- RLS policies for secure access
- Helper functions for payment statistics

## Environment Configuration

### Development Environment

```env
VITE_PAYU_MERCHANT_KEY="your-test-merchant-key"
VITE_PAYU_MERCHANT_SALT="your-test-merchant-salt"
VITE_PAYU_BASE_URL="https://test.payu.in"
VITE_PAYU_MODE="test"
```

### Production Environment

```env
VITE_PAYU_MERCHANT_KEY="your-production-merchant-key"
VITE_PAYU_MERCHANT_SALT="your-production-merchant-salt"
VITE_PAYU_BASE_URL="https://secure.payu.in"
VITE_PAYU_MODE="live"
```

## Features

### 1. Payment Processing
- Secure payment form submission to PayU
- SHA512 hash generation for request validation
- Response hash verification for security

### 2. Payment Components

#### PaymentButton
```tsx
import PaymentButton from '../components/payment/PaymentButton';

<PaymentButton
  amount={1500}
  productInfo="Physics tutoring session"
  userId={user.id}
  firstName={user.name}
  email={user.email}
  phone={user.phone}
  metadata={{ sessionId: '123', tutorId: '456' }}
  onSuccess={() => console.log('Payment initiated')}
  onError={(error) => console.error('Payment error:', error)}
/>
```

#### PaymentHistory
View all user transactions with filtering and search:
```tsx
import PaymentHistory from '../components/payment/PaymentHistory';

<Route path="/payment/history" element={<PaymentHistory />} />
```

#### Payment Success/Failure Pages
Automatic redirect pages after payment:
- `/payment/success` - Success page with transaction details
- `/payment/failure` - Failure page with error information

### 3. Tutor Booking with Payment
Book tutoring sessions with integrated payment:
```tsx
import TutorBooking from '../components/tutoring/TutorBooking';

<Route path="/tutoring/tutor/:tutorId" element={<TutorBooking />} />
```

## Database Schema

### payment_transactions
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- amount (Decimal)
- currency (VARCHAR, default: 'INR')
- product_info (TEXT)
- transaction_id (VARCHAR, Unique)
- payment_gateway (VARCHAR, default: 'payu')
- status (ENUM: pending, success, failed, cancelled)
- payment_method (VARCHAR)
- payu_payment_id (VARCHAR)
- payu_bank_ref_num (VARCHAR)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### tutor_bookings
```sql
- id (UUID, Primary Key)
- student_id (UUID, Foreign Key)
- tutor_id (UUID, Foreign Key)
- session_date (TIMESTAMP)
- duration_hours (Decimal)
- hourly_rate (Decimal)
- total_amount (Decimal)
- payment_transaction_id (UUID, Foreign Key)
- status (ENUM: pending, confirmed, completed, cancelled)
- payment_status (ENUM: unpaid, paid, refunded, failed)
- subject (VARCHAR)
- notes (TEXT)
- meeting_link (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## API Functions

### Payment Utility Functions

Located in `src/utils/payuPayment.ts`:

1. **initiatePayUPayment(paymentRequest)**
   - Initiates payment and redirects to PayU

2. **handlePayUResponse(responseData)**
   - Verifies and processes PayU callback

3. **createPaymentTransaction(paymentData)**
   - Creates transaction record in database

4. **updatePaymentTransaction(transactionId, updates)**
   - Updates transaction status

5. **getUserPaymentHistory(userId)**
   - Fetches user's payment history

6. **getUserPaymentStats(userId)**
   - Gets payment statistics for user

## Testing

### Test Payment Flow

1. **Start Development Server**
```bash
npm run dev
```

2. **Navigate to Tutor Booking**
   - Go to `/tutors`
   - Click on any tutor
   - Fill in session details
   - Click "Proceed to Payment"

3. **Test PayU Credentials**
   Use PayU test credentials for testing:
   - Test Merchant Key: (provided by PayU)
   - Test Merchant Salt: (provided by PayU)

4. **Test Cards** (Provided by PayU)
   - Success: 5123456789012346
   - Failure: 4111111111111111
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Scenarios

1. **Successful Payment**
   - Use test success card
   - Verify redirect to `/payment/success`
   - Check transaction in database

2. **Failed Payment**
   - Use test failure card
   - Verify redirect to `/payment/failure`
   - Check transaction status is 'failed'

3. **Payment History**
   - Navigate to `/payment/history`
   - Verify all transactions appear
   - Test filtering and search

## Production Deployment

### Pre-Deployment Checklist

- [ ] Replace test credentials with production credentials
- [ ] Update `VITE_PAYU_BASE_URL` to `https://secure.payu.in`
- [ ] Set `VITE_PAYU_MODE` to `live`
- [ ] Test with small amounts first
- [ ] Set up proper error logging
- [ ] Configure webhook for payment callbacks (if needed)
- [ ] Test refund functionality
- [ ] Verify success/failure redirect URLs

### Environment Variables for Production

```env
VITE_PAYU_MERCHANT_KEY="your-production-key"
VITE_PAYU_MERCHANT_SALT="your-production-salt"
VITE_PAYU_BASE_URL="https://secure.payu.in"
VITE_PAYU_MODE="live"
```

### Build for Production

```bash
npm run build
```

## Security Considerations

1. **Hash Verification**
   - All PayU responses are verified using SHA512 hash
   - Prevents tampering with transaction data

2. **Environment Variables**
   - Credentials stored in environment variables
   - Never hardcoded in source code
   - `.env.local` is gitignored

3. **RLS Policies**
   - Users can only view their own transactions
   - Secure database access at row level

4. **HTTPS Required**
   - PayU requires HTTPS for production
   - Ensure SSL certificate is properly configured

## Troubleshooting

### Common Issues

#### 1. "PayU credentials not configured"
**Solution:** Check environment variables are set correctly in `.env.local`

#### 2. "Invalid hash" error
**Solution:**
- Verify Merchant Salt is correct
- Check hash generation matches PayU format
- Ensure no extra spaces in credentials

#### 3. Payment not redirecting
**Solution:**
- Check success/failure URLs are accessible
- Verify domain is whitelisted in PayU dashboard
- Check browser console for errors

#### 4. Transaction not saving to database
**Solution:**
- Verify database migration was applied
- Check RLS policies are correct
- Ensure user is authenticated

#### 5. "Failed to initiate payment"
**Solution:**
- Check all required fields are provided
- Verify amount is greater than 0
- Check email and phone format

### Debug Mode

Enable detailed logging:
```javascript
// In payuPayment.ts
console.log('Payment Request:', paymentRequest);
console.log('Generated Hash:', hash);
```

### Support

For PayU-specific issues:
- PayU Documentation: [https://docs.payumoney.com/](https://docs.payumoney.com/)
- PayU Support: [https://www.payu.in/contact-us](https://www.payu.in/contact-us)

For integration issues:
- Check browser console for errors
- Review Supabase logs
- Verify database migrations applied correctly

## Payment Flow Diagram

```
User Selects Tutor
      ↓
Fills Booking Form
      ↓
Clicks "Proceed to Payment"
      ↓
Payment Transaction Created (status: pending)
      ↓
Redirected to PayU
      ↓
User Completes Payment
      ↓
PayU Redirects Back
      ↓
Hash Verification
      ↓
Transaction Updated
      ↓
Success/Failure Page
      ↓
Booking Confirmed (if successful)
```

## Additional Features

### Refund Handling
Refunds are handled through PayU dashboard. Update transaction status manually:
```sql
UPDATE payment_transactions
SET status = 'refunded'
WHERE transaction_id = 'TXN123';
```

### Payment Statistics
View user payment stats:
```tsx
import { getUserPaymentStats } from '../utils/payuPayment';

const stats = await getUserPaymentStats(userId);
console.log(`Total Spent: ₹${stats.totalSpent}`);
```

### Custom Metadata
Store custom data with transactions:
```tsx
<PaymentButton
  metadata={{
    sessionType: 'group',
    participants: 5,
    customField: 'value'
  }}
/>
```

## Changelog

### Version 1.0.0 (2025-01-14)
- Initial PayU integration
- Payment button component
- Success/failure pages
- Payment history
- Tutor booking integration
- Database migrations
- Documentation

## License

This integration is part of CampusPandit and follows the same license.

---

**Last Updated:** January 14, 2025
**Maintained By:** CampusPandit Development Team
