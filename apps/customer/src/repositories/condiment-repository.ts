import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';

import { buildSearchTokens } from '@/lib/firebase/search-tokens';
import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import { fromFirestoreCondimentDoc, toFirestoreCondimentDoc } from '@/lib/firebase/mappers';
import { demoCondiments } from '@/services/mock-data';
import type { Condiment, SellerProfile } from '@/types/domain';
import type { FirestoreCondimentDoc } from '@/types/firestore';

export const CondimentRepository = {
  subscribeCatalog(onChange: (condiments: Condiment[]) => void) {
    return onSnapshot(
      collection(db, 'condiments'),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestoreCondimentDoc(item.id, item.data() as FirestoreCondimentDoc))
        );
      },
      (error) => {
        logFirestoreListenerError('condiment.catalog', error);
        onChange(demoCondiments);
      }
    );
  },

  async createMany(
    seller: SellerProfile,
    entries: { normalizedName: string; displayName: string }[]
  ): Promise<Condiment[]> {
    const created: Condiment[] = [];

    for (const entry of entries) {
      const ref = doc(collection(db, 'condiments'));
      const condiment: Condiment = {
        id: ref.id,
        name: entry.displayName,
        normalizedName: entry.normalizedName,
        aliases: [],
        createdBySellerId: seller.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const searchTokens = buildSearchTokens(condiment.name, condiment.normalizedName);
      await setDoc(ref, toFirestoreCondimentDoc(condiment, searchTokens));
      created.push(condiment);
    }

    return created;
  },
};
