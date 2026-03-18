import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase/config';
import { fromFirestoreUserDoc, toFirestoreUserDoc } from '@/lib/firebase/mappers';
import type { AppUser } from '@/types/domain';
import type { FirestoreUserDoc } from '@/types/firestore';

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

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },
};
