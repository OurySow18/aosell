import Constants from 'expo-constants';
import { FirebaseOptions, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const extraFirebase = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<FirebaseOptions>;

function readFirebaseValue(key: keyof FirebaseOptions) {
  const value = extraFirebase[key];

  if (!value || typeof value !== 'string') {
    throw new Error(
      `Missing Firebase config value: ${key}. Define it in Expo env and rebuild the app.`
    );
  }

  return value;
}

export const firebaseConfig: FirebaseOptions = {
  apiKey: readFirebaseValue('apiKey'),
  authDomain: readFirebaseValue('authDomain'),
  projectId: readFirebaseValue('projectId'),
  storageBucket: readFirebaseValue('storageBucket'),
  messagingSenderId: readFirebaseValue('messagingSenderId'),
  appId: readFirebaseValue('appId'),
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

function getNativeAsyncStorage(): AsyncStorageLike | null {
  try {
    const module = require('@react-native-async-storage/async-storage');
    const storage = (module?.default ?? module) as Partial<AsyncStorageLike> | undefined;

    if (
      storage &&
      typeof storage.getItem === 'function' &&
      typeof storage.setItem === 'function' &&
      typeof storage.removeItem === 'function'
    ) {
      return storage as AsyncStorageLike;
    }
  } catch {
    return null;
  }

  return null;
}

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  const storage = getNativeAsyncStorage();

  if (!storage) {
    throw new Error(
      'AsyncStorage native module is required for AoSell auth persistence. Rebuild the app with a dev build or production build; Expo Go is not sufficient for this setup.'
    );
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(storage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth: Auth = createAuth();
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
