export function logFirestoreListenerError(scope: string, error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : 'unknown';
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : 'Unknown Firestore listener error';

  console.warn(`[Firestore listener:${scope}] ${code} ${message}`);
}

