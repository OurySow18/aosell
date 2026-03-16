import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { createTimestamp, fromFirestoreOrderDoc, toFirestoreOrderDoc } from '@/lib/firebase/mappers';
import type { Order } from '@/types/domain';
import type { FirestoreOrderDoc } from '@/types/firestore';

export const OrderRepository = {
  subscribeForBuyer(userId: string, onChange: (orders: Order[]) => void) {
    return onSnapshot(
      query(collection(db, 'orders'), where('buyerUserId', '==', userId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestoreOrderDoc(item.id, item.data() as FirestoreOrderDoc))
        );
      }
    );
  },

  subscribeForSeller(sellerId: string, onChange: (orders: Order[]) => void) {
    return onSnapshot(
      query(collection(db, 'orders'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestoreOrderDoc(item.id, item.data() as FirestoreOrderDoc))
        );
      }
    );
  },

  async create(order: Order) {
    const ref = doc(collection(db, 'orders'));
    const nextOrder = { ...order, id: ref.id };
    await setDoc(ref, toFirestoreOrderDoc(nextOrder));
    return nextOrder;
  },

  async advanceStatus(order: Order, nextStatus: Order['status']) {
    const nextOrder: Order = {
      ...order,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      timeline: [...order.timeline, { status: nextStatus, at: new Date().toISOString() }],
    };

    await updateDoc(doc(db, 'orders', order.id), {
      status: nextStatus,
      updatedAt: createTimestamp(),
      timeline: nextOrder.timeline.map((entry) => ({
        status: entry.status,
        at: Timestamp.fromDate(new Date(entry.at)),
        note: entry.note,
        actorUserId: entry.actorUserId,
      })),
    });

    return nextOrder;
  },
};
