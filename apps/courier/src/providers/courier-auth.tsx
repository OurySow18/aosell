import { AuthRepository, CourierRepository, auth, db, fromFirestoreUserDoc, toFirestoreUserDoc } from '@aosell/core';
import type { AppUser, CourierProfile, FirestoreUserDoc } from '@aosell/core';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

// Defined here (not in the lib/auth/*-sign-in.ts native helpers) so those
// files — which import native-only SDKs — are only ever reached via dynamic
// import, while callers can still catch these classes unconditionally.
export class AppleSignInCanceledError extends Error {}
export class GoogleSignInCanceledError extends Error {}

const POPUP_CANCEL_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

type CourierAuthValue = {
  isLoading: boolean;
  currentUser: AppUser | null;
  courierProfile: CourierProfile | null;
  signUp: (input: { email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

const CourierAuthContext = createContext<CourierAuthValue | null>(null);

function fallbackEmail(uid: string) {
  return `${uid}@anonymous.aosell.app`;
}

async function ensureUserDocument(uid: string, email: string) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists() ? fromFirestoreUserDoc(uid, snapshot.data() as FirestoreUserDoc) : null;
  const user: AppUser = {
    id: uid,
    email,
    role: existing?.role ?? 'courier',
    isActive: true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, toFirestoreUserDoc(user), { merge: true });
}

export function CourierAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null);

  useEffect(() => {
    return AuthRepository.subscribe(
      (user) => {
        setCurrentUser(user);
        if (!user) {
          setCourierProfile(null);
        }
      },
      () => setIsLoading(false)
    );
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    return CourierRepository.subscribeOwned(currentUser.id, setCourierProfile);
  }, [currentUser?.id]);

  async function signUp(input: { email: string; password: string }) {
    await AuthRepository.signUp({ ...input, role: 'courier' });
  }

  async function signIn(input: { email: string; password: string }) {
    await AuthRepository.signIn(input);
  }

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      try {
        const credential = await signInWithPopup(auth, new GoogleAuthProvider());
        await ensureUserDocument(credential.user.uid, credential.user.email ?? fallbackEmail(credential.user.uid));
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
        if (POPUP_CANCEL_CODES.has(code)) {
          throw new GoogleSignInCanceledError();
        }
        throw error;
      }
      return;
    }

    // Native-only: dynamically imported so @react-native-google-signin's
    // native module (no web build) never reaches the web bundle.
    const { performGoogleSignIn } = await import('@/lib/auth/google-sign-in');
    const { idToken } = await performGoogleSignIn();
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    await ensureUserDocument(userCredential.user.uid, userCredential.user.email ?? fallbackEmail(userCredential.user.uid));
  }

  async function signInWithApple() {
    if (Platform.OS === 'web') {
      try {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        const credential = await signInWithPopup(auth, provider);
        await ensureUserDocument(credential.user.uid, credential.user.email ?? fallbackEmail(credential.user.uid));
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
        if (POPUP_CANCEL_CODES.has(code)) {
          throw new AppleSignInCanceledError();
        }
        throw error;
      }
      return;
    }

    // Native-only (iOS — expo-apple-authentication has no Android build);
    // dynamically imported for the same reason as signInWithGoogle above.
    const { performAppleSignIn } = await import('@/lib/auth/apple-sign-in');
    const { idToken, rawNonce } = await performAppleSignIn();
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken, rawNonce });
    const userCredential = await signInWithCredential(auth, credential);
    await ensureUserDocument(userCredential.user.uid, userCredential.user.email ?? fallbackEmail(userCredential.user.uid));
  }

  async function signOut() {
    await AuthRepository.signOut();
  }

  return (
    <CourierAuthContext.Provider value={{ isLoading, currentUser, courierProfile, signUp, signIn, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </CourierAuthContext.Provider>
  );
}

export function useCourierAuth() {
  const value = useContext(CourierAuthContext);
  if (!value) {
    throw new Error('useCourierAuth must be used within CourierAuthProvider');
  }
  return value;
}
