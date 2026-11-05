import { AuthRepository, auth, db, fromFirestoreUserDoc, toFirestoreUserDoc } from '@aosell/core';
import type { AppUser, FirestoreUserDoc } from '@aosell/core';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminAuthStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

type AdminAuthValue = {
  status: AdminAuthStatus;
  currentUser: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Admin is web-only, so popup sign-in is all this needs — none of the
// native-SDK complexity apps/customer's Apple/Google methods have to handle.
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

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    return AuthRepository.subscribe(async (user) => {
      if (!user) {
        setCurrentUser(null);
        setStatus('signed-out');
        return;
      }

      // The real gate is firestore.rules' isAdmin() (a custom claim on the
      // Firebase ID token) — this is only a UI convenience so a non-admin
      // sees a clear message instead of a wall of permission-denied errors.
      const tokenResult = await auth.currentUser?.getIdTokenResult();
      setCurrentUser(user);
      setStatus(tokenResult?.claims.admin === true ? 'admin' : 'not-admin');
    });
  }, []);

  async function signIn(email: string, password: string) {
    await AuthRepository.signIn({ email, password });
  }

  async function signInWithGoogle() {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserDocument(credential.user.uid, credential.user.email ?? '');
  }

  async function signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    const credential = await signInWithPopup(auth, provider);
    await ensureUserDocument(credential.user.uid, credential.user.email ?? '');
  }

  async function signOut() {
    await AuthRepository.signOut();
  }

  return (
    <AdminAuthContext.Provider value={{ status, currentUser, signIn, signInWithGoogle, signInWithApple, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return value;
}
