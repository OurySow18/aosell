import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { googleConfig } from '@/lib/google';
import { GoogleSignInCanceledError } from '@/repositories/auth-repository';

let isConfigured = false;
function ensureConfigured() {
  if (!isConfigured) {
    GoogleSignin.configure({ webClientId: googleConfig.webClientId });
    isConfigured = true;
  }
}

// Only ever imported dynamically from auth-repository.ts (native branch) so
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
