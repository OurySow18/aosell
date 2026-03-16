import Constants from 'expo-constants';
import { FirebaseOptions, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const extraFirebase = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<FirebaseOptions>;

export const firebaseConfig: FirebaseOptions = {
  apiKey: extraFirebase.apiKey ?? 'AIzaSyDEQUz1W4eSRx55vKaZDclPQi6TaZBaSn4',
  authDomain: extraFirebase.authDomain ?? 'aosell-3f431.firebaseapp.com',
  projectId: extraFirebase.projectId ?? 'aosell-3f431',
  storageBucket: extraFirebase.storageBucket ?? 'aosell-3f431.firebasestorage.app',
  messagingSenderId: extraFirebase.messagingSenderId ?? '938947493830',
  appId: extraFirebase.appId ?? '1:938947493830:web:eff3947eeecb42a274bcc7',
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
