import Constants from 'expo-constants';

const extraStripe = (Constants.expoConfig?.extra?.stripe ?? {}) as Partial<{
  merchantIdentifier: string;
  publishableKey: string;
}>;

export const stripeConfig = {
  publishableKey: extraStripe.publishableKey ?? 'pk_test_replace_me',
  merchantIdentifier: extraStripe.merchantIdentifier ?? 'merchant.com.amasow.aosell',
};

export function getStripePublishableKey() {
  return stripeConfig.publishableKey;
}
