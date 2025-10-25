import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Shield, CreditCard, Lock } from 'lucide-react';

/**
 * PayPalHelpInfo Component
 *
 * Displays helpful information about PayPal payments for customers.
 * Can be placed on checkout pages to guide users on how to pay with PayPal.
 */

interface PayPalHelpInfoProps {
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const PayPalHelpInfo: React.FC<PayPalHelpInfoProps> = ({
  className = '',
  collapsible = true,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`p-4 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-blue-100' : ''
        }`}
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">How to Pay with PayPal</h3>
        </div>
        {collapsible && (
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800"
            aria-label="Toggle PayPal help"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {(!collapsible || isExpanded) && (
        <div className="px-4 pb-4 space-y-4 text-sm text-blue-900">
          {/* Steps */}
          <div className="space-y-2">
            <p className="font-medium">Quick Steps:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>On the payment form below, select <strong>"PayPal"</strong> as your payment method</li>
              <li>Click the <strong>"Continue with PayPal"</strong> button</li>
              <li>You'll be securely redirected to PayPal.com</li>
              <li>Log in to your PayPal account</li>
              <li>Review and confirm your payment</li>
              <li>You'll return here automatically</li>
              <li>Done! Payment complete</li>
            </ol>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded p-3 space-y-2">
            <p className="font-medium text-blue-900">Why Use PayPal?</p>
            <ul className="space-y-1 text-blue-800">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>Secure - Your payment details are protected by PayPal</span>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>Convenient - No need to enter card details</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>Trusted - PayPal Buyer Protection included</span>
              </li>
            </ul>
          </div>

          {/* FAQ */}
          <div className="space-y-2 border-t border-blue-200 pt-3">
            <p className="font-medium">Common Questions:</p>

            <div>
              <p className="font-medium text-blue-800">Do I need a PayPal account?</p>
              <p className="text-blue-700">
                Yes, you'll need to log in to your PayPal account to complete the payment.
                In some regions, PayPal allows guest checkout with a credit/debit card.
              </p>
            </div>

            <div>
              <p className="font-medium text-blue-800">Is it safe?</p>
              <p className="text-blue-700">
                Absolutely! Your payment is processed securely by PayPal. We never see or
                store your PayPal login details or payment information.
              </p>
            </div>

            <div>
              <p className="font-medium text-blue-800">Will I be charged extra fees?</p>
              <p className="text-blue-700">
                No! There are no additional fees for using PayPal. The amount shown is what
                you'll pay.
              </p>
            </div>

            <div>
              <p className="font-medium text-blue-800">What if I don't have PayPal?</p>
              <p className="text-blue-700">
                No problem! You can also pay with a credit or debit card. Just select "Card"
                as your payment method instead.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded p-3 flex items-start gap-2">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-green-900">
              <p className="font-medium mb-1">Your Security Matters</p>
              <p className="text-green-800">
                All payments are processed securely using industry-standard encryption.
                We are PCI DSS compliant and your data is always protected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayPalHelpInfo;
