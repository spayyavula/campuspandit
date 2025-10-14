# Payment Gateways Integration - CampusPandit

This document provides comprehensive information about the payment gateway integrations in CampusPandit. We support **three major payment gateways** to provide flexibility and redundancy.

## Table of Contents
1. [Overview](#overview)
2. [Supported Payment Gateways](#supported-payment-gateways)
3. [Quick Start](#quick-start)
4. [Gateway-Specific Setup](#gateway-specific-setup)
   - [Razorpay](#razorpay-recommended)
   - [PayU](#payu)
   - [Instamojo](#instamojo)
5. [Multi-Gateway Implementation](#multi-gateway-implementation)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

CampusPandit supports three payment gateways for processing tutoring session payments and other transactions:

| Gateway | Status | Recommended For | Features |
|---------|--------|-----------------|----------|
| **Razorpay** | ✅ Active | All users | Cards, UPI, Wallets, NetBanking, EMI |
| **PayU** | ✅ Active | Large transactions | Cards, UPI, EMI, Wallets, BNPL |
| **Instamojo** | 🔄 Backend Required | Small businesses | Cards, UPI, Wallets |

## Supported Payment Gateways

### 1. Razorpay (Recommended)
- **Best for**: All transaction sizes
- **Payment methods**: Credit/Debit Cards, UPI, Wallets, NetBanking, EMI
- **Fee**: 2% + GST per transaction
- **Settlement**: T+2 days
- **Integration**: Client-side (Razorpay Checkout)
- **Security**: PCI DSS compliant

### 2. PayU
- **Best for**: High-value transactions
- **Payment methods**: Cards, UPI, EMI, Wallets, BNPL
- **Fee**: 2-3% per transaction (negotiable)
- **Settlement**: T+1 to T+3 days
- **Integration**: Form-based redirect
- **Security**: SHA512 hash verification

### 3. Instamojo
- **Best for**: Small businesses, digital products
- **Payment methods**: Cards, UPI, Wallets
- **Fee**: 2% + ₹3 per transaction
- **Settlement**: T+7 days
- **Integration**: Server-side API required
- **Security**: API-based authentication

---

## Quick Start

### 1. Choose Your Gateway(s)

For most users, we recommend **Razorpay** as the primary gateway due to its:
- Best user experience
- Wide payment method support
- Client-side integration (no backend required)
- Excellent documentation and support

### 2. Get Credentials

#### Razorpay:
1. Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. Complete KYC (takes 1-2 days)
3. Get your Key ID and Key Secret from Settings > API Keys

#### PayU:
1. Sign up at [https://www.payu.in/](https://www.payu.in/)
2. Complete merchant onboarding
3. Get Merchant Key and Salt from dashboard

#### Instamojo:
1. Sign up at [https://www.instamojo.com/](https://www.instamojo.com/)
2. Get API Key and Auth Token from Settings > API & Plugins

### 3. Configure Environment

Copy `.env.local.example` to `.env.local` and add your credentials:

```env
# Razorpay (Recommended)
VITE_RAZORPAY_KEY_ID="rzp_test_..."
VITE_RAZORPAY_KEY_SECRET="your_secret"
VITE_RAZORPAY_MODE="test"

# PayU
VITE_PAYU_MERCHANT_KEY="your_key"
VITE_PAYU_MERCHANT_SALT="your_salt"
VITE_PAYU_BASE_URL="https://test.payu.in"
VITE_PAYU_MODE="test"

# Instamojo (Requires backend implementation)
VITE_INSTAMOJO_API_KEY="your_api_key"
VITE_INSTAMOJO_AUTH_TOKEN="your_auth_token"
VITE_INSTAMOJO_BASE_URL="https://test.instamojo.com"
VITE_INSTAMOJO_MODE="test"
```

### 4. Apply Database Migration

Run this in your Supabase SQL Editor:

```sql
-- Base payment tables (if not already applied)
\i supabase/migrations/20251014000000_create_payment_transactions.sql

-- Multi-gateway support
\i supabase/migrations/20251014010000_add_razorpay_instamojo_fields.sql
```

### 5. Start Development

```bash
npm install
npm run dev
```

---

## Gateway-Specific Setup

### Razorpay (Recommended)

#### Advantages:
- ✅ No backend server required
- ✅ Client-side SDK integration
- ✅ Automatic signature verification
- ✅ Wide payment method support
- ✅ Best UI/UX

#### Setup Steps:

1. **Create Account**:
   - Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Sign up and complete KYC

2. **Get Credentials**:
   - Go to Settings > API Keys
   - Generate test keys for development
   - Note: Live keys require KYC approval

3. **Environment Configuration**:
```env
VITE_RAZORPAY_KEY_ID="rzp_test_1234567890"
VITE_RAZORPAY_KEY_SECRET="your_secret_key_here"
VITE_RAZORPAY_MODE="test"
```

4. **Testing**:
   - Test cards: 4111 1111 1111 1111
   - Test UPI: success@razorpay
   - Any future expiry date and 3-digit CVV

5. **Integration Code**:
```tsx
import { initiateRazorpayPayment } from '../utils/razorpayPayment';

const handlePayment = async () => {
  const result = await initiateRazorpayPayment({
    amount: 1500,
    productInfo: "Physics tutoring session",
    userId: user.id,
    firstName: user.name,
    email: user.email,
    phone: user.phone,
    metadata: { sessionId: "123" }
  });
};
```

---

### PayU

#### Advantages:
- ✅ Wide payment method support
- ✅ EMI options available
- ✅ BNPL (Buy Now Pay Later)
- ✅ Good for high-value transactions

#### Setup Steps:

1. **Create Account**:
   - Visit [PayU India](https://www.payu.in/)
   - Complete merchant registration

2. **Get Credentials**:
   - Login to merchant dashboard
   - Get Merchant Key and Salt

3. **Environment Configuration**:
```env
VITE_PAYU_MERCHANT_KEY="your_merchant_key"
VITE_PAYU_MERCHANT_SALT="your_merchant_salt"
VITE_PAYU_BASE_URL="https://test.payu.in"
VITE_PAYU_MODE="test"
```

4. **Testing**:
   - Test cards: 5123456789012346 (Success)
   - Test card: 4111111111111111 (Failure)
   - Any future expiry and 3-digit CVV

5. **Integration Code**:
```tsx
import { initiatePayUPayment } from '../utils/payuPayment';

const handlePayment = async () => {
  const result = await initiatePayUPayment({
    amount: 1500,
    productInfo: "Physics tutoring session",
    firstName: user.name,
    email: user.email,
    phone: user.phone,
    userId: user.id,
    metadata: { sessionId: "123" }
  });
};
```

---

### Instamojo

#### Advantages:
- ✅ Easy setup for small businesses
- ✅ Digital product support
- ✅ Low transaction fees

#### Important Notes:
- ⚠️ **Requires backend server** for security
- ⚠️ Cannot create payment requests from frontend
- ⚠️ API keys must not be exposed in browser

#### Setup Steps:

1. **Create Account**:
   - Visit [Instamojo](https://www.instamojo.com/)
   - Complete registration

2. **Get Credentials**:
   - Go to Settings > API & Plugins
   - Generate API Key and Auth Token

3. **Backend Implementation Required**:

```javascript
// backend/routes/payment.js
app.post('/api/instamojo/create-payment-request', async (req, res) => {
  const { amount, purpose, buyer_name, email, phone } = req.body;

  try {
    const response = await fetch('https://test.instamojo.com/api/1.1/payment-requests/', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.INSTAMOJO_API_KEY,
        'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        purpose,
        buyer_name,
        email,
        phone,
        redirect_url: `${process.env.FRONTEND_URL}/payment/instamojo/callback`,
        webhook: `${process.env.BACKEND_URL}/api/instamojo/webhook`
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

4. **Frontend Integration**:
```tsx
// This will call your backend API
import { initiateInstamojoPayment } from '../utils/instamojoPayment';

const handlePayment = async () => {
  const result = await initiateInstamojoPayment({
    amount: 1500,
    productInfo: "Physics tutoring session",
    buyerName: user.name,
    email: user.email,
    phone: user.phone,
    userId: user.id,
    metadata: { sessionId: "123" }
  });
};
```

---

## Multi-Gateway Implementation

### Using MultiGatewayPaymentButton

The `MultiGatewayPaymentButton` component allows users to choose their preferred payment gateway:

```tsx
import MultiGatewayPaymentButton from '../components/payment/MultiGatewayPaymentButton';

<MultiGatewayPaymentButton
  amount={1500}
  productInfo="Physics tutoring session"
  userId={user.id}
  firstName={user.name}
  email={user.email}
  phone={user.phone}
  metadata={{ sessionId: "123", tutorId: "456" }}
  defaultGateway="razorpay"  // razorpay, payu, or instamojo
  allowGatewaySelection={true}  // Allow user to choose
  onSuccess={() => console.log('Payment initiated')}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

### Gateway Selection UI

The component displays available gateways with:
- Gateway logo and name
- Supported payment methods
- "Coming Soon" tag for unavailable gateways
- Selected gateway highlight

---

## Database Schema

### payment_transactions Table

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'INR',
  product_info TEXT,
  transaction_id VARCHAR(255) UNIQUE,
  payment_gateway VARCHAR(50), -- 'payu', 'razorpay', 'instamojo'
  status VARCHAR(20), -- 'pending', 'success', 'failed', 'cancelled'
  payment_method VARCHAR(50),

  -- PayU fields
  payu_payment_id VARCHAR(255),
  payu_bank_ref_num VARCHAR(255),

  -- Razorpay fields
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),

  -- Instamojo fields
  instamojo_payment_id VARCHAR(255),
  instamojo_payment_request_id VARCHAR(255),

  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing

### Test Environment Setup

1. **Use test credentials** for all gateways
2. **Enable test mode** in environment variables
3. **Use test payment methods** (cards, UPI IDs)

### Test Cards

#### Razorpay:
- Success: `4111 1111 1111 1111`
- Failure: `4012 0010 3714 1112`
- UPI Success: `success@razorpay`

#### PayU:
- Success: `5123456789012346`
- Failure: `4111111111111111`

#### Common for all:
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 123456 (in test mode)

### Testing Flow

1. **Select a tutor** and fill booking details
2. **Choose payment gateway** (Razorpay/PayU/Instamojo)
3. **Click "Proceed to Payment"**
4. **Complete test payment** using test cards
5. **Verify redirect** to success/failure page
6. **Check database** for transaction record

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Get production credentials for all gateways
- [ ] Complete KYC for all gateways
- [ ] Update environment variables
- [ ] Test with small amounts first
- [ ] Set up webhooks (if required)
- [ ] Configure proper error logging
- [ ] Test refund process
- [ ] Verify SSL certificate
- [ ] Update success/failure URLs
- [ ] Set up monitoring and alerts

### Production Configuration

```env
# Razorpay Production
VITE_RAZORPAY_KEY_ID="rzp_live_..."
VITE_RAZORPAY_KEY_SECRET="live_secret"
VITE_RAZORPAY_MODE="live"

# PayU Production
VITE_PAYU_MERCHANT_KEY="live_merchant_key"
VITE_PAYU_MERCHANT_SALT="live_salt"
VITE_PAYU_BASE_URL="https://secure.payu.in"
VITE_PAYU_MODE="live"

# Instamojo Production
VITE_INSTAMOJO_API_KEY="live_api_key"
VITE_INSTAMOJO_AUTH_TOKEN="live_auth_token"
VITE_INSTAMOJO_BASE_URL="https://www.instamojo.com"
VITE_INSTAMOJO_MODE="live"
```

### Build and Deploy

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

---

## Troubleshooting

### Common Issues

#### 1. "Gateway credentials not configured"
**Solution**: Check `.env.local` file for correct credentials

#### 2. "Failed to load Razorpay SDK"
**Solution**: Check internet connection and script loading

#### 3. "Invalid signature" (Razorpay/PayU)
**Solution**: Verify Key Secret/Salt is correct

#### 4. "Payment not redirecting"
**Solution**:
- Check success/failure URLs are accessible
- Verify domain is whitelisted in gateway dashboard

#### 5. "Transaction not saving"
**Solution**:
- Verify database migration applied
- Check RLS policies
- Ensure user is authenticated

### Debug Mode

Enable detailed logging:

```typescript
// In payment utility files
console.log('Payment Request:', request);
console.log('Generated Hash/Signature:', hash);
console.log('Gateway Response:', response);
```

### Gateway-Specific Support

- **Razorpay**: [https://razorpay.com/support/](https://razorpay.com/support/)
- **PayU**: [https://www.payu.in/contact-us](https://www.payu.in/contact-us)
- **Instamojo**: [https://support.instamojo.com/](https://support.instamojo.com/)

---

## Best Practices

1. **Always use HTTPS** in production
2. **Never commit credentials** to version control
3. **Implement proper error handling**
4. **Log all transactions** for audit trail
5. **Test thoroughly** before going live
6. **Monitor transaction success rates**
7. **Have a fallback gateway** ready
8. **Implement retry mechanism** for failures
9. **Send email confirmations** for successful payments
10. **Keep SDK/libraries updated**

---

## Security Considerations

1. **Credential Management**:
   - Store credentials in environment variables
   - Never expose in client-side code
   - Use different keys for test and production

2. **Signature Verification**:
   - Always verify payment signatures
   - Use constant-time comparison
   - Log verification failures

3. **HTTPS**:
   - Mandatory for production
   - Valid SSL certificate required
   - Configure proper redirects

4. **PCI Compliance**:
   - Never store card details
   - Use gateway-provided SDKs
   - Follow security best practices

---

## Changelog

### Version 2.0.0 (2025-01-14)
- Added Razorpay integration
- Added Instamojo integration
- Created MultiGatewayPaymentButton component
- Added gateway selection UI
- Updated database schema
- Enhanced documentation

### Version 1.0.0 (2025-01-14)
- Initial PayU integration
- Basic payment components
- Database schema
- Documentation

---

**Last Updated**: January 14, 2025
**Maintained By**: CampusPandit Development Team

For additional support, please visit our [GitHub repository](https://github.com/spayyavula/campuspandit) or contact the development team.
