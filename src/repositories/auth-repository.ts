import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

import { auth, db, functions } from '@/lib/firebase/config';
import { fromFirestoreUserDoc, toFirestoreUserDoc } from '@/lib/firebase/mappers';
import type { AppUser } from '@/types/domain';
import type { FirestoreUserDoc } from '@/types/firestore';

// Defined here (not in apple-sign-in.ts / google-sign-in.ts) so callers can
// import them unconditionally — those two files import native-only SDKs and
// must only ever be reached via dynamic import from inside a try block.
export class AppleSignInCanceledError extends Error {}
export class GoogleSignInCanceledError extends Error {}

const GOOGLE_POPUP_CANCEL_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

function fallbackEmail(uid: string) {
  return `${uid}@anonymous.aosell.app`;
}

type SubscribeReadyHandler = () => void;

async function ensureUserDocument(uid: string, email: string, role?: AppUser['role']) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists()
    ? fromFirestoreUserDoc(uid, snapshot.data() as FirestoreUserDoc)
    : null;
  const user: AppUser = {
    id: uid,
    email,
    role: existing?.role ?? role ?? 'buyer',
    isActive: true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, toFirestoreUserDoc(user), { merge: true });
  return user;
}

export const AuthRepository = {
  subscribe(onChange: (user: AppUser | null) => void, onReady?: SubscribeReadyHandler) {
    let didResolveInitialState = false;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          onChange(null);
          return;
        }

        const ref = doc(db, 'users', firebaseUser.uid);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          const nextUser = await ensureUserDocument(
            firebaseUser.uid,
            firebaseUser.email ?? fallbackEmail(firebaseUser.uid),
            'buyer'
          );
          onChange(nextUser);
          return;
        }

        onChange(fromFirestoreUserDoc(firebaseUser.uid, snapshot.data() as FirestoreUserDoc));
      } catch {
        onChange(null);
      } finally {
        if (!didResolveInitialState) {
          didResolveInitialState = true;
          onReady?.();
        }
      }
    });
  },

  async signUp(input: {
    email: string;
    password: string;
    role: Extract<AppUser['role'], 'buyer' | 'seller'>;
  }): Promise<AppUser> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email.trim().toLowerCase(),
      input.password
    );

    return ensureUserDocument(
      credential.user.uid,
      credential.user.email ?? input.email.trim().toLowerCase(),
      input.role
    );
  },

  async signIn(input: { email: string; password: string }): Promise<AppUser> {
    const credential = await signInWithEmailAndPassword(
      auth,
      input.email.trim().toLowerCase(),
      input.password
    );
    return ensureUserDocument(
      credential.user.uid,
      credential.user.email ?? input.email.trim().toLowerCase()
    );
  },

  async signInWithOAuthCredential(
    providerId: 'apple.com' | 'google.com',
    idToken: string,
    rawNonce?: string,
    role: Extract<AppUser['role'], 'buyer' | 'seller'> = 'buyer'
  ): Promise<AppUser> {
    const provider = new OAuthProvider(providerId);
    const credential = provider.credential({ idToken, rawNonce });
    const userCredential = await signInWithCredential(auth, credential);

    return ensureUserDocument(
      userCredential.user.uid,
      userCredential.user.email ?? fallbackEmail(userCredential.user.uid),
      role
    );
  },

  async signInWithGoogle(role: Extract<AppUser['role'], 'buyer' | 'seller'> = 'buyer'): Promise<AppUser> {
    if (Platform.OS === 'web') {
      try {
        const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());
        return ensureUserDocument(
          userCredential.user.uid,
          userCredential.user.email ?? fallbackEmail(userCredential.user.uid),
          role
        );
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
        if (GOOGLE_POPUP_CANCEL_CODES.has(code)) {
          throw new GoogleSignInCanceledError();
        }
        throw error;
      }
    }

    // Native-only: dynamically imported (inside this same async function, so
    // a missing native module on a stale dev client rejects this method's
    // own promise like any other error) so
    // @react-native-google-signin/google-signin (no web build) never reaches
    // the web bundle. It throws the same GoogleSignInCanceledError on cancel,
    // no translation needed here.
    const { performGoogleSignIn } = await import('@/lib/auth/google-sign-in');
    const { idToken } = await performGoogleSignIn();
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return ensureUserDocument(
      userCredential.user.uid,
      userCredential.user.email ?? fallbackEmail(userCredential.user.uid),
      role
    );
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  async deleteAccount(): Promise<void> {
    const call = httpsCallable(functions, 'deleteAccount');
    await call({});
    await firebaseSignOut(auth);
  },
};
