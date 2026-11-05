import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';

import { db } from '../lib/firebase/config';
import { logFirestoreListenerError } from '../lib/firebase/listener-errors';
import { fromFirestoreNotificationDoc } from '../lib/firebase/mappers';
import type { Notification } from '../types';
import type { FirestoreNotificationDoc } from '../firestore_types';

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
      },
      (error) => {
        logFirestoreListenerError('notifications.user', error);
        onChange([]);
      }
    );
  },

  async markRead(userId: string, notificationId: string) {
    await updateDoc(doc(db, 'notifications', userId, 'items', notificationId), {
      isRead: true,
    });
  },
};
