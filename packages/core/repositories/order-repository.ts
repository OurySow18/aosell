import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../lib/firebase/config';
import { logFirestoreListenerError } from '../lib/firebase/listener-errors';
import { createTimestamp, fromFirestoreOrderDoc } from '../lib/firebase/mappers';
import type { Order } from '../types';
import type { FirestoreOrderDoc } from '../firestore_types';

// Admin/courier-facing subset of OrderRepository (apps/customer has its own
// fuller version with buyer/seller-scoped subscriptions and order creation).
export const OrderRepository = {
  subscribeAll(onChange: (orders: Order[]) => void) {
    return onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => fromFirestoreOrderDoc(item.id, item.data() as FirestoreOrderDoc)));
      },
      (error) => {
        logFirestoreListenerError('orders.all', error);
        onChange([]);
      }
    );
  },

  subscribeForCourier(courierId: string, onChange: (orders: Order[]) => void) {
    return onSnapshot(
      query(collection(db, 'orders'), where('courierId', '==', courierId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => fromFirestoreOrderDoc(item.id, item.data() as FirestoreOrderDoc)));
      },
      (error) => {
        logFirestoreListenerError('orders.courier', error);
        onChange([]);
      }
    );
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
        ...(entry.note !== undefined && { note: entry.note }),
        ...(entry.actorUserId !== undefined && { actorUserId: entry.actorUserId }),
      })),
    });

    return nextOrder;
  },

  // The courier accepting/declining a delivery offer — doesn't touch
  // order.status itself, only the assignment side-channel. Declining adds
  // this courier to declinedCourierIds so the Cloud Function doesn't re-offer
  // it to them when it looks for the next-nearest courier.
  async respondToAssignment(order: Order, accept: boolean) {
    await updateDoc(doc(db, 'orders', order.id), {
      courierAssignmentStatus: accept ? 'accepted' : 'declined',
      updatedAt: createTimestamp(),
      ...(!accept && order.courierId !== undefined && {
        declinedCourierIds: [...(order.declinedCourierIds ?? []), order.courierId],
      }),
    });
  },
};
