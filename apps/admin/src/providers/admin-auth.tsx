import { AuthRepository, auth } from '@aosell/core';
import type { AppUser } from '@aosell/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AdminAuthStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

type AdminAuthValue = {
  status: AdminAuthStatus;
  currentUser: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

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

  async function signOut() {
    await AuthRepository.signOut();
  }

  return (
    <AdminAuthContext.Provider value={{ status, currentUser, signIn, signOut }}>
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
