import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';

import { db } from '../lib/firebase/config';
import { logFirestoreListenerError } from '../lib/firebase/listener-errors';
import { createTimestamp, fromFirestoreSellerProfileDoc } from '../lib/firebase/mappers';
import type { SellerProfile, VerificationStatus } from '../types';
import type { FirestoreSellerProfileDoc } from '../firestore_types';

// Admin-facing subset of SellerRepository (apps/customer has its own fuller
// version with a demo-data fallback for the public marketplace shell, which
// doesn't apply here).
export const SellerRepository = {
  subscribeAll(onChange: (sellers: SellerProfile[]) => void) {
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
        logFirestoreListenerError('seller.all', error);
        onChange([]);
      }
    );
  },

  async setVerificationStatus(sellerId: string, status: VerificationStatus) {
    await updateDoc(doc(db, 'seller_profiles', sellerId), {
      verificationStatus: status,
      updatedAt: createTimestamp(),
    });
  },
};
