import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { createTimestamp } from '@/lib/firebase/mappers';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';

export const FollowRepository = {
  subscribeFollowedSellerIds(userId: string, onChange: (sellerIds: string[]) => void) {
    return onSnapshot(
      collection(db, 'user_profiles', userId, 'follows'),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => item.id));
      },
      (error) => {
        logFirestoreListenerError('follow.list', error);
        onChange([]);
      }
    );
  },

  async setFollowing(userId: string, sellerId: string, following: boolean) {
    const ref = doc(db, 'user_profiles', userId, 'follows', sellerId);

    if (following) {
      await setDoc(ref, { sellerId, createdAt: createTimestamp() });
    } else {
      await deleteDoc(ref);
    }
  },
};
