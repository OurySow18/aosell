import type { ReactElement } from 'react';

// Web build of stripe-app-provider.tsx. @stripe/stripe-react-native pulls in
// react-native internals (codegenNativeComponent) that Metro cannot even
// bundle for web, regardless of lazy-loading — this platform-specific file
// keeps that import out of the web bundle entirely. PaymentsProvider in
// _layout.tsx never renders this on web anyway (Platform.OS check), so it's
// a pure passthrough kept only so the web bundle has something to resolve to.
export default function StripeAppProvider({ children }: { children: ReactElement }) {
  return children;
}
