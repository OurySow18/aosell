import { AuthRepository, CourierRepository } from '@aosell/core';
import type { AppUser, CourierProfile } from '@aosell/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type CourierAuthValue = {
  isLoading: boolean;
  currentUser: AppUser | null;
  courierProfile: CourierProfile | null;
  signUp: (input: { email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const CourierAuthContext = createContext<CourierAuthValue | null>(null);

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

  async function signOut() {
    await AuthRepository.signOut();
  }

  return (
    <CourierAuthContext.Provider value={{ isLoading, currentUser, courierProfile, signUp, signIn, signOut }}>
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
