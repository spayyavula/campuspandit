export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1Rdu48G0usgeCZqlMzirm1jc',
    name: 'Enterprise Plan',
    description: 'Enterprise Plan -whitelisting possible',
    mode: 'subscription'
  },
  {
    priceId: 'price_1Rdu2JG0usgeCZqlpwN7k1Vr',
    name: 'Premium Plan',
    description: 'Advanced Plan for induviduals',
    mode: 'payment'
  },
  {
    priceId: 'price_1RdtzkG0usgeCZqlJG0ADUZF',
    name: 'Sponsor Us',
    description: 'Sponsor our support team',
    mode: 'payment'
  },
  {
    priceId: 'price_1RdtxSG0usgeCZqldPwtqD6m',
    name: 'Support Us',
    description: 'Support Our Developer',
    mode: 'payment'
  },
  {
    priceId: 'price_1RdtvPG0usgeCZqlzSxblbCP',
    name: 'Buy me coffee',
    description: 'Buy me a coffee',
    mode: 'payment'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};