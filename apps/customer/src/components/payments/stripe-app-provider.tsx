import { StripeProvider } from '@stripe/stripe-react-native';
import type { ReactElement } from 'react';

import { stripeConfig } from '@/lib/stripe';

// Native-only: @stripe/stripe-react-native ships no web build, so this file
// is loaded via React.lazy() from _layout.tsx and never touches the web bundle.
export default function StripeAppProvider({ children }: { children: ReactElement }) {
  return (
    <StripeProvider publishableKey={stripeConfig.publishableKey} merchantIdentifier={stripeConfig.merchantIdentifier}>
      {children}
    </StripeProvider>
  );
}
