import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import {
  fromFirestoreAddressDoc,
  fromFirestoreUserProfileDoc,
  toFirestoreAddressDoc,
  toFirestoreUserProfileDoc,
} from '@/lib/firebase/mappers';
import type { Address, AppUser, UserProfile } from '@/types/domain';
import type { FirestoreAddressDoc, FirestoreUserProfileDoc } from '@/types/firestore';

function buildDefaultProfile(user: AppUser): UserProfile {
  const displayName = user.role === 'seller' ? 'Seller Member' : 'Buyer Member';
  return {
    userId: user.id,
    firstName: user.role === 'seller' ? 'Seller' : 'Buyer',
    lastName: 'Member',
    displayName,
    countryCode: 'DE',
    city: 'Berlin',
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const UserRepository = {
  async ensureProfile(user: AppUser) {
    const ref = doc(db, 'user_profiles', user.id);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      return fromFirestoreUserProfileDoc(snapshot.data() as FirestoreUserProfileDoc, []);
    }

    const profile = buildDefaultProfile(user);
    await setDoc(ref, toFirestoreUserProfileDoc(profile));
    return profile;
  },

  subscribeProfile(userId: string, onChange: (profile: UserProfile | null) => void) {
    return onSnapshot(doc(db, 'user_profiles', userId), (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      onChange(fromFirestoreUserProfileDoc(snapshot.data() as FirestoreUserProfileDoc, []));
    });
  },

  subscribeAddresses(userId: string, onChange: (addresses: Address[]) => void) {
    return onSnapshot(
      query(collection(db, 'user_profiles', userId, 'addresses'), orderBy('updatedAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) =>
            fromFirestoreAddressDoc(item.id, item.data() as FirestoreAddressDoc)
          )
        );
      }
    );
  },

  async addAddress(
    userId: string,
    address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Address> {
    const ref = doc(collection(db, 'user_profiles', userId, 'addresses'));
    const nextAddress: Address = {
      ...address,
      id: ref.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, toFirestoreAddressDoc(nextAddress, userId));
    return nextAddress;
  },
};
