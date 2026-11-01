import { translate } from '@/lib/i18n';

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
}

// Never falls back to a raw SDK/Firebase message: an unmapped code always
// resolves to the translated generic message, so the user never sees
// internal error text like "Firebase: Error (auth/...)" or a Firestore
// permission string.
export function getFriendlyAuthError(error: unknown): string {
  switch (errorCode(error)) {
    case 'auth/email-already-in-use':
      return translate('auth.errors.emailInUse');
    case 'auth/invalid-email':
      return translate('auth.errors.invalidEmail');
    case 'auth/operation-not-allowed':
      return translate('auth.errors.operationNotAllowed');
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return translate('auth.errors.wrongCredentials');
    case 'auth/network-request-failed':
      return translate('auth.errors.network');
    case 'auth/weak-password':
      return translate('auth.errors.weakPassword');
    case 'auth/too-many-requests':
      return translate('auth.errors.tooManyRequests');
    case 'auth/account-exists-with-different-credential':
      return translate('auth.errors.accountExistsDifferentCredential');
    case 'auth/credential-already-in-use':
      return translate('auth.errors.credentialAlreadyInUse');
    case 'auth/user-disabled':
      return translate('auth.errors.userDisabled');
    case 'auth/requires-recent-login':
      return translate('auth.errors.requiresRecentLogin');
    case 'permission-denied':
      return translate('auth.errors.permissionDenied');
    case 'unavailable':
    case 'deadline-exceeded':
      return translate('auth.errors.serviceUnavailable');
    default:
      return translate('auth.errors.generic');
  }
}

export function getFriendlyPaymentError(error: unknown): string {
  switch (errorCode(error)) {
    case 'card_declined':
    case 'Declined':
      return translate('payment.errors.cardDeclined');
    case 'expired_card':
      return translate('payment.errors.expiredCard');
    case 'incorrect_cvc':
    case 'invalid_cvc':
      return translate('payment.errors.incorrectCvc');
    case 'insufficient_funds':
      return translate('payment.errors.insufficientFunds');
    case 'processing_error':
      return translate('payment.errors.processingError');
    case 'Failed':
    case 'auth/network-request-failed':
      return translate('payment.errors.network');
    default:
      return translate('payment.errors.generic');
  }
}
