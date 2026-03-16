export const stripeConfig = {
  publishableKey: 'pk_test_replace_me',
  merchantIdentifier: 'merchant.com.amasow.aosell',
};

export function getStripePublishableKey() {
  return stripeConfig.publishableKey;
}
