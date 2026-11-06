import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase/config';
import { fromFirestoreUserDoc, toFirestoreUserDoc } from '../lib/firebase/mappers';
import type { AppUser } from '../types';
import type { FirestoreUserDoc } from '../firestore_types';

// Admin/courier-facing subset of AuthRepository — email/password only, no
// Apple/Google sign-in (apps/customer has its own fuller version for that;
// those methods dynamically import native-only SDKs apps/customer bundles
// that admin/courier have no reason to carry).
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
          onChange(null);
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

  async signUp(input: { email: string; password: string; role: 'courier' }): Promise<AppUser> {
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

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },
};
