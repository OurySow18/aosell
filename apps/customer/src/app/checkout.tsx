import { Redirect } from 'expo-router';

// Cart and checkout were merged into a single "Panier et paiement" screen
// (src/app/cart.tsx) per the Mangue design handoff. Kept as a redirect so
// existing links to /checkout still land somewhere sensible.
export default function CheckoutRedirectScreen() {
  return <Redirect href="/cart" />;
}
