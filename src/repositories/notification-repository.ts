import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import {
  fromFirestoreNotificationDoc,
  toFirestoreNotificationDoc,
} from '@/lib/firebase/mappers';
import type { Notification } from '@/types/domain';
import type { FirestoreNotificationDoc } from '@/types/firestore';

export const NotificationRepository = {
  subscribeForUser(userId: string, onChange: (notifications: Notification[]) => void) {
    return onSnapshot(
      query(collection(db, 'notifications', userId, 'items'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) =>
            fromFirestoreNotificationDoc(item.id, item.data() as FirestoreNotificationDoc)
          )
        );
      }
    );
  },

  async create(
    userId: string,
    input: Omit<Notification, 'id' | 'createdAt' | 'userId'>
  ) {
    const ref = doc(collection(db, 'notifications', userId, 'items'));
    const notification: Notification = {
      id: ref.id,
      userId,
      createdAt: new Date().toISOString(),
      ...input,
    };

    await setDoc(ref, toFirestoreNotificationDoc(notification));
    return notification;
  },

  async markRead(userId: string, notificationId: string) {
    await updateDoc(doc(db, 'notifications', userId, 'items', notificationId), {
      isRead: true,
    });
  },
};
