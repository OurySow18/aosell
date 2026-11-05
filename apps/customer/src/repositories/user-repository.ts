import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import {
  createTimestamp,
  fromFirestoreAddressDoc,
  fromFirestoreUserProfileDoc,
  toFirestoreAddressDoc,
  toFirestoreUserProfileDoc,
} from '@/lib/firebase/mappers';
import type { Address, AppUser, UserProfile } from '@/types/domain';
import type { FirestoreAddressDoc, FirestoreUserProfileDoc } from '@/types/firestore';
import { DEFAULT_CITY, DEFAULT_COUNTRY_CODE } from '@/constants/location';
import { translate, type Locale } from '@/lib/i18n';

export type UserProfileSeed = Partial<
  Pick<
    UserProfile,
    'bio' | 'city' | 'countryCode' | 'displayName' | 'firstName' | 'lastName' | 'preferredLanguage'
  >
>;

const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'de'];

// Placeholder names are translated, so detecting "still a placeholder" can't
// compare against one hardcoded English string — it checks every locale's
// buyer/seller + member combination instead.
const PLACEHOLDER_DISPLAY_NAMES = new Set(
  SUPPORTED_LOCALES.flatMap((locale) => {
    const lastName = translate('profileScreen.placeholderLastName', {}, locale);
    return [
      `${translate('profileScreen.placeholderFirstNameBuyer', {}, locale)} ${lastName}`,
      `${translate('profileScreen.placeholderFirstNameSeller', {}, locale)} ${lastName}`,
    ];
  })
);

export function isPlaceholderDisplayName(value?: string) {
  return !value || PLACEHOLDER_DISPLAY_NAMES.has(value);
}

function buildDefaultProfile(user: AppUser, seed: UserProfileSeed = {}): UserProfile {
  // No explicit locale: translate() defaults to the app's current locale, so
  // the placeholder name is written in whatever language the device/user has
  // selected at sign-up time, not hardcoded to English.
  const firstName =
    seed.firstName?.trim() ||
    translate(user.role === 'seller' ? 'profileScreen.placeholderFirstNameSeller' : 'profileScreen.placeholderFirstNameBuyer');
  const lastName = seed.lastName?.trim() || translate('profileScreen.placeholderLastName');
  const displayName = seed.displayName?.trim() || `${firstName} ${lastName}`.trim();
  return {
    userId: user.id,
    firstName,
    lastName,
    displayName,
    bio: seed.bio,
    countryCode: seed.countryCode?.trim() || DEFAULT_COUNTRY_CODE,
    city: seed.city?.trim() || DEFAULT_CITY,
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

  // Only the identity fields a person edits themselves — not city/country/bio,
  // which are set elsewhere (onboarding, addresses). avatarUrl uses
  // deleteField() rather than omission when cleared: updateDoc only touches
  // the keys given here, so an omitted key is left as-is, not removed.
  async updateProfile(userId: string, input: { displayName: string; avatarUrl?: string }) {
    await updateDoc(doc(db, 'user_profiles', userId), {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl ?? deleteField(),
      updatedAt: createTimestamp(),
    });
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
