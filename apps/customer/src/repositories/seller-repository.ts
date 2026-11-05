import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import {
  fromFirestoreSellerProfileDoc,
  toFirestoreSellerProfileDoc,
} from '@/lib/firebase/mappers';
import { demoSellers } from '@/services/mock-data';
import type { AppUser, Cuisine, SellerProfile } from '@/types/domain';
import type { FirestoreSellerProfileDoc } from '@/types/firestore';

export const SellerRepository = {
  subscribePublic(onChange: (sellers: SellerProfile[]) => void) {
    return onSnapshot(
      collection(db, 'seller_profiles'),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) =>
            fromFirestoreSellerProfileDoc(item.id, item.data() as FirestoreSellerProfileDoc)
          )
        );
      },
      (error) => {
        logFirestoreListenerError('seller.public', error);
        onChange(demoSellers);
      }
    );
  },

  subscribeOwned(ownerUserId: string, onChange: (seller: SellerProfile | null) => void) {
    return onSnapshot(
      query(collection(db, 'seller_profiles'), where('ownerUserId', '==', ownerUserId)),
      (snapshot) => {
        if (!snapshot.docs.length) {
          onChange(null);
          return;
        }

        onChange(
          fromFirestoreSellerProfileDoc(
            snapshot.docs[0].id,
            snapshot.docs[0].data() as FirestoreSellerProfileDoc
          )
        );
      },
      (error) => {
        logFirestoreListenerError('seller.owned', error);
        onChange(null);
      }
    );
  },

  async create(
    user: AppUser,
    input: {
      type: SellerProfile['type'];
      brandName: string;
      description: string;
      city: string;
      countryCode: string;
      deliveryModes: SellerProfile['deliveryModes'];
      cuisineSpecialties: Cuisine[];
    }
  ): Promise<SellerProfile> {
    const ref = doc(collection(db, 'seller_profiles'));
    const profile: SellerProfile = {
      id: ref.id,
      ownerUserId: user.id,
      type: input.type,
      brandName: input.brandName,
      description: input.description,
      email: user.email,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city,
      deliveryModes: input.deliveryModes,
      verificationStatus: 'pending',
      tags: [input.type, input.city.toLowerCase()],
      cuisineSpecialties: input.cuisineSpecialties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, toFirestoreSellerProfileDoc(profile));
    return profile;
  },

  async setOpenStatus(sellerId: string, isOpen: boolean) {
    await updateDoc(doc(db, 'seller_profiles', sellerId), { isOpen });
  },
};
