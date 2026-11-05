import { AuthRepository, CourierRepository, auth, db, fromFirestoreUserDoc, toFirestoreUserDoc } from '@aosell/core';
import type { AppUser, CourierProfile, FirestoreUserDoc } from '@aosell/core';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

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

// Web-only popup sign-in, same trick as apps/admin — lets an existing
// account (e.g. the admin's own, which has no password) sign into this app
// too for testing, without needing the native Apple/Google SDKs this app
// doesn't carry. On native, email/password remains the only option for now.
async function ensureUserDocument(uid: string, email: string) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists() ? fromFirestoreUserDoc(uid, snapshot.data() as FirestoreUserDoc) : null;
  const user: AppUser = {
    id: uid,
    email,
    role: existing?.role ?? 'buyer',
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
    if (Platform.OS !== 'web') {
      throw new Error('Google sign-in is web-only in this app for now.');
    }
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserDocument(credential.user.uid, credential.user.email ?? '');
  }

  async function signInWithApple() {
    if (Platform.OS !== 'web') {
      throw new Error('Apple sign-in is web-only in this app for now.');
    }
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const credential = await signInWithPopup(auth, provider);
    await ensureUserDocument(credential.user.uid, credential.user.email ?? '');
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
