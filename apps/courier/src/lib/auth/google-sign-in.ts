import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { googleConfig } from '@/lib/google';
import { GoogleSignInCanceledError } from '@/providers/courier-auth';

let isConfigured = false;
function ensureConfigured() {
  if (!isConfigured) {
    GoogleSignin.configure({ webClientId: googleConfig.webClientId, iosClientId: googleConfig.iosClientId });
    isConfigured = true;
  }
}

// Only ever imported dynamically from courier-auth.tsx (native branch) so
// this native-only module never reaches the web bundle.
export async function performGoogleSignIn() {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type === 'cancelled') {
    throw new GoogleSignInCanceledError();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }

  return { idToken };
}
