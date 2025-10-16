/**
 * Test Payment Gateway
 * Simple mock payment for testing/demo purposes without real payment gateway credentials
 */

export interface TestPaymentRequest {
  amount: number;
  productInfo: string;
  userId: string;
  firstName: string;
  email: string;
  phone: string;
  metadata?: Record<string, any>;
}

export const generateTestTransactionId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10);
  return `TEST${timestamp}${random}`.toUpperCase();
};

/**
 * Initiate test payment (simulates payment gateway)
 */
export const initiateTestPayment = async (
  paymentRequest: TestPaymentRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const transactionId = generateTestTransactionId();

    // Simulate payment modal with a confirmation dialog
    const confirmed = window.confirm(
      `🧪 TEST MODE PAYMENT\n\n` +
      `Amount: ₹${paymentRequest.amount}\n` +
      `Product: ${paymentRequest.productInfo}\n` +
      `Payer: ${paymentRequest.firstName} (${paymentRequest.email})\n\n` +
      `This is a test payment. No real money will be charged.\n\n` +
      `Click OK to simulate successful payment\n` +
      `Click Cancel to simulate payment failure`
    );

    if (confirmed) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to success page
      window.location.href = `/payment/success?txnid=${transactionId}&status=success&amount=${paymentRequest.amount}&mode=test&payment_gateway=test`;

      return {
        success: true,
        transactionId
      };
    } else {
      // User cancelled - redirect to failure page
      window.location.href = `/payment/failure?txnid=${transactionId}&status=cancelled&error=User cancelled the payment`;

      return {
        success: false,
        error: 'Payment cancelled by user'
      };
    }
  } catch (error: any) {
    console.error('Error in test payment:', error);
    return {
      success: false,
      error: error.message || 'Test payment failed'
    };
  }
};

/**
 * Advanced test payment with custom UI (optional - for future enhancement)
 */
export const initiateTestPaymentWithUI = async (
  paymentRequest: TestPaymentRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const transactionId = generateTestTransactionId();

    // Create a custom modal for better UX
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 32px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🧪</div>
          <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">
            Test Payment Mode
          </h2>
          <p style="color: #6b7280; margin: 0;">
            This is a simulated payment for testing purposes
          </p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Amount:</span>
            <span style="font-weight: bold; color: #1f2937;">₹${paymentRequest.amount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Product:</span>
            <span style="font-weight: 500; color: #1f2937; text-align: right; max-width: 60%;">
              ${paymentRequest.productInfo}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #6b7280;">Payer:</span>
            <span style="font-weight: 500; color: #1f2937;">${paymentRequest.firstName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Email:</span>
            <span style="font-weight: 500; color: #1f2937;">${paymentRequest.email}</span>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⚠️ <strong>Test Mode:</strong> No real money will be charged. This simulates the payment flow for development/testing.
          </p>
        </div>

        <div style="display: flex; gap: 12px;">
          <button id="testPaymentSuccess" style="
            flex: 1;
            padding: 12px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
          ">
            ✓ Simulate Success
          </button>
          <button id="testPaymentFail" style="
            flex: 1;
            padding: 12px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
          ">
            ✗ Simulate Failure
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const successBtn = modal.querySelector('#testPaymentSuccess') as HTMLButtonElement;
      const failBtn = modal.querySelector('#testPaymentFail') as HTMLButtonElement;

      successBtn.onclick = () => {
        document.body.removeChild(modal);
        window.location.href = `/payment/success?txnid=${transactionId}&status=success&amount=${paymentRequest.amount}&mode=test&payment_gateway=test`;
        resolve({ success: true, transactionId });
      };

      failBtn.onclick = () => {
        document.body.removeChild(modal);
        window.location.href = `/payment/failure?txnid=${transactionId}&status=failed&error=Simulated payment failure`;
        resolve({ success: false, error: 'Simulated payment failure' });
      };
    });
  } catch (error: any) {
    console.error('Error in test payment with UI:', error);
    return {
      success: false,
      error: error.message || 'Test payment failed'
    };
  }
};

export default {
  initiateTestPayment,
  initiateTestPaymentWithUI,
  generateTestTransactionId
};
