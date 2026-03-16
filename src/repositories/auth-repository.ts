import { onAuthStateChanged, signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase/config';
import { fromFirestoreUserDoc, toFirestoreUserDoc } from '@/lib/firebase/mappers';
import type { AppUser } from '@/types/domain';
import type { FirestoreUserDoc } from '@/types/firestore';

function fallbackEmail(uid: string) {
  return `${uid}@anonymous.aosell.app`;
}

async function ensureUserDocument(uid: string, email: string, role: AppUser['role']) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  const existing = snapshot.exists()
    ? fromFirestoreUserDoc(uid, snapshot.data() as FirestoreUserDoc)
    : null;
  const user: AppUser = {
    id: uid,
    email,
    role,
    isActive: true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, toFirestoreUserDoc(user), { merge: true });
  return user;
}

export const AuthRepository = {
  subscribe(onChange: (user: AppUser | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
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
    });
  },

  async signIn(role: Extract<AppUser['role'], 'buyer' | 'seller'>): Promise<AppUser> {
    const credential = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
    return ensureUserDocument(
      credential.user.uid,
      credential.user.email ?? fallbackEmail(credential.user.uid),
      role
    );
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },
};
