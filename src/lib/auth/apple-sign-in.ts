import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

export class AppleSignInCanceledError extends Error {}

function randomNonce(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

// Only ever imported dynamically (Platform.OS === 'ios' call sites) so this
// native-only module never reaches the Android or web bundles.
export async function performAppleSignIn() {
  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      throw new AppleSignInCanceledError();
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  return {
    idToken: credential.identityToken,
    rawNonce,
    fullName: credential.fullName,
    email: credential.email,
  };
}
