import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';

import { buildSearchTokens } from '@/lib/firebase/search-tokens';
import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import { fromFirestoreDishDoc, toFirestoreDishDoc } from '@/lib/firebase/mappers';
import { demoDishes } from '@/services/mock-data';
import type { Cuisine, Dish, SellerProfile } from '@/types/domain';
import type { FirestoreDishDoc } from '@/types/firestore';

export const DishRepository = {
  subscribeCatalog(onChange: (dishes: Dish[]) => void) {
    return onSnapshot(
      collection(db, 'dishes'),
      (snapshot) => {
        onChange(snapshot.docs.map((item) => fromFirestoreDishDoc(item.id, item.data() as FirestoreDishDoc)));
      },
      (error) => {
        logFirestoreListenerError('dish.catalog', error);
        onChange(demoDishes);
      }
    );
  },

  async create(
    seller: SellerProfile,
    input: {
      cuisine: Cuisine;
      name: string;
      slug: string;
      description: string;
      imageUrl?: string;
      defaultCondimentIds: string[];
    }
  ): Promise<Dish> {
    const ref = doc(collection(db, 'dishes'));
    const dish: Dish = {
      id: ref.id,
      cuisine: input.cuisine,
      name: input.name,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl,
      defaultCondimentIds: input.defaultCondimentIds,
      createdBySellerId: seller.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const searchTokens = buildSearchTokens(dish.name, dish.cuisine, dish.description);

    await setDoc(ref, toFirestoreDishDoc(dish, searchTokens));
    return dish;
  },
};
