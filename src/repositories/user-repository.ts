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
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import {
  fromFirestoreAddressDoc,
  fromFirestoreUserProfileDoc,
  toFirestoreAddressDoc,
  toFirestoreUserProfileDoc,
} from '@/lib/firebase/mappers';
import type { Address, AppUser, UserProfile } from '@/types/domain';
import type { FirestoreAddressDoc, FirestoreUserProfileDoc } from '@/types/firestore';

export type UserProfileSeed = Partial<
  Pick<
    UserProfile,
    'bio' | 'city' | 'countryCode' | 'displayName' | 'firstName' | 'lastName' | 'preferredLanguage'
  >
>;

function isPlaceholderDisplayName(value?: string) {
  return !value || value === 'Buyer Member' || value === 'Seller Member';
}

function buildDefaultProfile(user: AppUser, seed: UserProfileSeed = {}): UserProfile {
  const firstName = seed.firstName?.trim() || (user.role === 'seller' ? 'Seller' : 'Buyer');
  const lastName = seed.lastName?.trim() || 'Member';
  const displayName = seed.displayName?.trim() || `${firstName} ${lastName}`.trim();
  return {
    userId: user.id,
    firstName,
    lastName,
    displayName,
    bio: seed.bio,
    countryCode: seed.countryCode?.trim() || 'DE',
    city: seed.city?.trim() || 'Berlin',
    preferredLanguage: seed.preferredLanguage,
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildMergedProfile(user: AppUser, current: UserProfile, seed: UserProfileSeed): UserProfile {
  const fallback = buildDefaultProfile(user, seed);
  const shouldHydrateIdentity =
    isPlaceholderDisplayName(current.displayName) ||
    (!current.firstName.trim() && !current.lastName.trim());

  return {
    ...current,
    firstName: shouldHydrateIdentity ? fallback.firstName : current.firstName,
    lastName: shouldHydrateIdentity ? fallback.lastName : current.lastName,
    displayName: shouldHydrateIdentity ? fallback.displayName : current.displayName,
    bio: current.bio || seed.bio,
    city: current.city || seed.city || fallback.city,
    countryCode: current.countryCode || seed.countryCode || fallback.countryCode,
    preferredLanguage: current.preferredLanguage ?? seed.preferredLanguage,
    updatedAt: new Date().toISOString(),
  };
}

export const UserRepository = {
  async ensureProfile(user: AppUser, seed: UserProfileSeed = {}) {
    const ref = doc(db, 'user_profiles', user.id);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const profile = fromFirestoreUserProfileDoc(snapshot.data() as FirestoreUserProfileDoc, []);

      if (Object.keys(seed).length === 0) {
        return profile;
      }

      const nextProfile = buildMergedProfile(user, profile, seed);
      await setDoc(ref, toFirestoreUserProfileDoc(nextProfile), { merge: true });
      return nextProfile;
    }

    const profile = buildDefaultProfile(user, seed);
    await setDoc(ref, toFirestoreUserProfileDoc(profile));
    return profile;
  },

  subscribeProfile(userId: string, onChange: (profile: UserProfile | null) => void) {
    return onSnapshot(
      doc(db, 'user_profiles', userId),
      (snapshot) => {
        if (!snapshot.exists()) {
          onChange(null);
          return;
        }

        onChange(fromFirestoreUserProfileDoc(snapshot.data() as FirestoreUserProfileDoc, []));
      },
      (error) => {
        logFirestoreListenerError('user.profile', error);
        onChange(null);
      }
    );
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
      },
      (error) => {
        logFirestoreListenerError('user.addresses', error);
        onChange([]);
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
