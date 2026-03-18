import { collection, doc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';

import { buildSearchTokens } from '@/lib/firebase/search-tokens';
import { db } from '@/lib/firebase/config';
import { logFirestoreListenerError } from '@/lib/firebase/listener-errors';
import { fromFirestoreListingDoc, toFirestoreListingDoc } from '@/lib/firebase/mappers';
import { demoListings } from '@/services/mock-data';
import type { Listing, SellerProfile } from '@/types/domain';
import type { FirestoreListingDoc } from '@/types/firestore';

export const ListingRepository = {
  subscribePublicActive(onChange: (listings: Listing[]) => void) {
    return onSnapshot(
      query(collection(db, 'listings'), where('status', '==', 'active'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestoreListingDoc(item.id, item.data() as FirestoreListingDoc))
        );
      },
      (error) => {
        logFirestoreListenerError('listing.publicActive', error);
        onChange(demoListings.filter((item) => item.status === 'active'));
      }
    );
  },

  subscribeBySeller(sellerId: string, onChange: (listings: Listing[]) => void) {
    return onSnapshot(
      query(collection(db, 'listings'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc')),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) => fromFirestoreListingDoc(item.id, item.data() as FirestoreListingDoc))
        );
      },
      (error) => {
        logFirestoreListenerError('listing.bySeller', error);
        onChange([]);
      }
    );
  },

  async save(
    seller: SellerProfile,
    input: {
      id?: string;
      title: string;
      slug: string;
      description: string;
      amountCents: number;
      type: Listing['type'];
      deliveryMode: Listing['deliveryMode'];
      city: string;
      countryCode: string;
      status: Listing['status'];
      tags: string[];
      categories: string[];
      hasVideo: boolean;
    },
    existing?: Listing
  ) {
    const ref = input.id ? doc(db, 'listings', input.id) : doc(collection(db, 'listings'));
    const listing: Listing = {
      id: ref.id,
      sellerId: seller.id,
      type: input.type,
      title: input.title,
      slug: input.slug,
      description: input.description,
      price: { amountCents: input.amountCents, currency: 'EUR' },
      status: input.status,
      deliveryMode: input.deliveryMode,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city,
      tags: input.tags,
      categories: input.categories,
      media: existing?.media ?? [],
      attributes: existing?.attributes ?? [],
      inventory: existing?.inventory ?? { isUnlimited: input.type === 'service', quantity: input.type === 'service' ? undefined : 10 },
      linkedVideoUrl: input.hasVideo ? existing?.linkedVideoUrl ?? 'https://example.com/listing-video.mp4' : undefined,
      isFeatured: existing?.isFeatured ?? false,
      publishedAt: input.status === 'active' ? existing?.publishedAt ?? new Date().toISOString() : undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const searchTokens = buildSearchTokens(
      listing.title,
      listing.slug,
      listing.tags,
      listing.categories,
      listing.city
    );

    await setDoc(ref, toFirestoreListingDoc(listing, searchTokens), { merge: true });
    return listing;
  },
};
