import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import { fromFirestoreCartDoc, toFirestoreCartDoc } from '@/lib/firebase/mappers';
import type { Cart } from '@/types/domain';
import type { FirestoreCartDoc } from '@/types/firestore';

export const CartRepository = {
  subscribeCurrent(userId: string, onChange: (cart: Cart | null) => void) {
    return onSnapshot(
      doc(db, 'carts', userId),
      (snapshot) => {
        if (!snapshot.exists()) {
          onChange(null);
          return;
        }

        onChange(fromFirestoreCartDoc(snapshot.id, snapshot.data() as FirestoreCartDoc));
      },
      (error) => {
        logFirestoreListenerError('cart.current', error);
        onChange(null);
      }
    );
  },

  async save(cart: Cart) {
    await setDoc(doc(db, 'carts', cart.id), toFirestoreCartDoc(cart));
    return cart;
  },

  async clear(userId: string) {
    await deleteDoc(doc(db, 'carts', userId));
  },
};
