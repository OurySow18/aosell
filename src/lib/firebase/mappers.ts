import { Timestamp } from 'firebase/firestore';

import type {
  Address,
  AppUser,
  Cart,
  Condiment,
  Dish,
  Listing,
  Notification,
  Order,
  PartnerLead,
  Post,
  PostComment,
  SellerProfile,
  UserProfile,
} from '@/types/domain';
import type {
  FirestoreAddressDoc,
  FirestoreCartDoc,
  FirestoreCondimentDoc,
  FirestoreDishDoc,
  FirestoreListingDoc,
  FirestoreNotificationDoc,
  FirestoreOrderDoc,
  FirestorePartnerLeadDoc,
  FirestorePostCommentDoc,
  FirestorePostDoc,
  FirestoreSellerProfileDoc,
  FirestoreUserDoc,
  FirestoreUserProfileDoc,
} from '@/types/firestore';

function toIsoDate(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: number }).seconds === 'number'
  ) {
    return new Timestamp(
      (value as { seconds: number }).seconds,
      (value as { nanoseconds?: number }).nanoseconds ?? 0
    )
      .toDate()
      .toISOString();
  }

  return new Date().toISOString();
}

export function createTimestamp() {
  return Timestamp.now();
}

function toTimestamp(value?: string) {
  return value ? Timestamp.fromDate(new Date(value)) : createTimestamp();
}

export function fromFirestoreUserDoc(id: string, doc: FirestoreUserDoc): AppUser {
  return {
    id,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreUserDoc(user: AppUser): FirestoreUserDoc {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: toTimestamp(user.createdAt),
    updatedAt: toTimestamp(user.updatedAt),
  };
}

export function fromFirestoreUserProfileDoc(
  doc: FirestoreUserProfileDoc,
  addresses: Address[]
): UserProfile {
  return {
    userId: doc.userId,
    firstName: doc.firstName ?? '',
    lastName: doc.lastName ?? '',
    displayName: doc.displayName ?? '',
    avatarUrl: doc.avatarUrl,
    phoneNumber: doc.phoneNumber,
    bio: doc.bio,
    countryCode: doc.countryCode,
    city: doc.city,
    preferredLanguage: doc.preferredLanguage,
    addresses,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreUserProfileDoc(profile: UserProfile): FirestoreUserProfileDoc {
  // Firestore's setDoc() rejects any field whose value is literally undefined
  // (unlike null) — these are all optional on UserProfile, so a new profile
  // that hasn't set them yet must omit the key entirely, not pass undefined.
  return {
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: profile.displayName,
    ...(profile.avatarUrl !== undefined && { avatarUrl: profile.avatarUrl }),
    ...(profile.phoneNumber !== undefined && { phoneNumber: profile.phoneNumber }),
    ...(profile.bio !== undefined && { bio: profile.bio }),
    ...(profile.countryCode !== undefined && { countryCode: profile.countryCode }),
    ...(profile.city !== undefined && { city: profile.city }),
    ...(profile.preferredLanguage !== undefined && { preferredLanguage: profile.preferredLanguage }),
    createdAt: toTimestamp(profile.createdAt),
    updatedAt: toTimestamp(profile.updatedAt),
  };
}

export function fromFirestoreAddressDoc(id: string, doc: FirestoreAddressDoc): Address {
  return {
    id,
    fullName: doc.fullName,
    phoneNumber: doc.phoneNumber,
    line1: doc.line1,
    line2: doc.line2,
    postalCode: doc.postalCode,
    city: doc.city,
    state: doc.state,
    countryCode: doc.countryCode,
    instructions: doc.instructions,
    location: doc.location,
    isDefault: doc.isDefault,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreAddressDoc(address: Address, userId: string): FirestoreAddressDoc {
  return {
    ...address,
    userId,
    createdAt: toTimestamp(address.createdAt),
    updatedAt: toTimestamp(address.updatedAt),
  };
}

export function fromFirestoreSellerProfileDoc(
  id: string,
  doc: FirestoreSellerProfileDoc
): SellerProfile {
  return {
    id,
    ownerUserId: doc.ownerUserId,
    type: doc.type,
    brandName: doc.brandName ?? 'AoSell Seller',
    legalName: doc.legalName,
    description: doc.description,
    logoUrl: doc.logoUrl,
    coverImageUrl: doc.coverImageUrl,
    email: doc.email,
    phoneNumber: doc.phoneNumber,
    countryCode: doc.countryCode,
    city: doc.city,
    location: doc.location,
    deliveryModes: doc.deliveryModes ?? ['aosell'],
    verificationStatus: doc.verificationStatus,
    ratingAverage: doc.ratingAverage,
    ratingCount: doc.ratingCount,
    isOpen: doc.isOpen,
    tags: doc.tags ?? [],
    cuisineSpecialties: doc.cuisineSpecialties ?? [],
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreSellerProfileDoc(profile: SellerProfile): FirestoreSellerProfileDoc {
  // Firestore's setDoc() rejects a literal `undefined` field value (unlike
  // null) — address is optional and absent on most profiles (e.g. every
  // lazily-created "individual" seller profile), so addressId must be
  // omitted entirely rather than written as undefined.
  const { address, ...rest } = profile;
  return {
    ...rest,
    ...(address?.id !== undefined && { addressId: address.id }),
    createdAt: toTimestamp(profile.createdAt),
    updatedAt: toTimestamp(profile.updatedAt),
  };
}

export function fromFirestoreListingDoc(id: string, doc: FirestoreListingDoc): Listing {
  return {
    id,
    sellerId: doc.sellerId,
    type: doc.type,
    title: doc.title ?? 'Untitled listing',
    slug: doc.slug ?? id,
    shortDescription: doc.shortDescription,
    description: doc.description ?? '',
    price: doc.price ?? { amountCents: 0, currency: 'EUR' },
    compareAtPrice: doc.compareAtPrice,
    status: doc.status,
    deliveryMode: doc.deliveryMode,
    countryCode: doc.countryCode,
    city: doc.city,
    tags: doc.tags ?? [],
    categories: doc.categories ?? [],
    media: doc.media ?? [],
    attributes: doc.attributes ?? [],
    inventory: doc.inventory ?? { isUnlimited: true },
    dishId: doc.dishId,
    condiments: doc.condiments ?? [],
    averageRating: doc.averageRating,
    reviewCount: doc.reviewCount,
    linkedVideoUrl: doc.linkedVideoUrl,
    isFeatured: doc.isFeatured,
    publishedAt: doc.publishedAt ? toIsoDate(doc.publishedAt) : undefined,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreListingDoc(
  listing: Listing,
  searchTokens: string[]
): FirestoreListingDoc {
  // Several of these are routinely undefined in practice (no video, not yet
  // published, no dish linked, no photos) — setDoc() rejects a literal
  // undefined field value, so each one is only included when actually set.
  const { dishId, linkedVideoUrl, publishedAt, compareAtPrice, averageRating, reviewCount, ...rest } = listing;
  const primaryImageUrl = listing.media[0]?.url;
  return {
    ...rest,
    ...(dishId !== undefined && { dishId }),
    ...(linkedVideoUrl !== undefined && { linkedVideoUrl }),
    ...(compareAtPrice !== undefined && { compareAtPrice }),
    ...(averageRating !== undefined && { averageRating }),
    ...(reviewCount !== undefined && { reviewCount }),
    ...(primaryImageUrl !== undefined && { primaryImageUrl }),
    createdAt: toTimestamp(listing.createdAt),
    updatedAt: toTimestamp(listing.updatedAt),
    ...(publishedAt !== undefined && { publishedAt: toTimestamp(publishedAt) }),
    searchTokens,
    hasVideo: Boolean(listing.linkedVideoUrl),
  };
}

export function fromFirestoreCartDoc(id: string, doc: FirestoreCartDoc): Cart {
  return {
    id,
    buyerUserId: doc.buyerUserId,
    sellerId: doc.sellerId,
    items: doc.items.map((item) => ({
      listingId: item.listingId,
      titleSnapshot: item.titleSnapshot,
      quantity: item.quantity,
      unitPriceSnapshot: {
        amountCents: item.unitAmountCents,
        currency: item.currency,
      },
      imageUrl: item.imageUrl,
    })),
    subtotal: { amountCents: doc.subtotalAmountCents, currency: doc.currency },
    deliveryFee: { amountCents: doc.deliveryFeeAmountCents, currency: doc.currency },
    discount: { amountCents: doc.discountAmountCents ?? 0, currency: doc.currency },
    promoCode: doc.promoCode,
    total: { amountCents: doc.totalAmountCents, currency: doc.currency },
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreCartDoc(cart: Cart): FirestoreCartDoc {
  return {
    buyerUserId: cart.buyerUserId,
    sellerId: cart.sellerId,
    items: cart.items.map((item) => ({
      listingId: item.listingId,
      titleSnapshot: item.titleSnapshot,
      quantity: item.quantity,
      unitAmountCents: item.unitPriceSnapshot.amountCents,
      currency: item.unitPriceSnapshot.currency,
      imageUrl: item.imageUrl,
    })),
    subtotalAmountCents: cart.subtotal.amountCents,
    deliveryFeeAmountCents: cart.deliveryFee.amountCents,
    discountAmountCents: cart.discount.amountCents,
    promoCode: cart.promoCode,
    totalAmountCents: cart.total.amountCents,
    currency: cart.total.currency,
    createdAt: toTimestamp(cart.createdAt),
    updatedAt: toTimestamp(cart.updatedAt),
  };
}

export function fromFirestoreOrderDoc(id: string, doc: FirestoreOrderDoc): Order {
  return {
    id,
    buyerUserId: doc.buyerUserId,
    sellerId: doc.sellerId,
    status: doc.status,
    items: (doc.items ?? []).map((item) => ({
      id: item.id,
      listingId: item.listingId,
      titleSnapshot: item.titleSnapshot,
      quantity: item.quantity,
      unitPriceSnapshot: {
        amountCents: item.unitAmountCents,
        currency: item.currency,
      },
      imageUrl: item.imageUrl,
    })),
    subtotal: { amountCents: doc.subtotalAmountCents, currency: doc.currency },
    deliveryFee: { amountCents: doc.deliveryFeeAmountCents, currency: doc.currency },
    total: { amountCents: doc.totalAmountCents, currency: doc.currency },
    currency: doc.currency,
    deliveryMode: doc.deliveryMode,
    deliveryAddress: {
      id: `${id}-delivery`,
      fullName: doc.deliveryAddress.fullName,
      phoneNumber: doc.deliveryAddress.phoneNumber,
      line1: doc.deliveryAddress.line1,
      line2: doc.deliveryAddress.line2,
      postalCode: doc.deliveryAddress.postalCode,
      city: doc.deliveryAddress.city,
      state: doc.deliveryAddress.state,
      countryCode: doc.deliveryAddress.countryCode,
      instructions: doc.deliveryAddress.instructions,
      createdAt: toIsoDate(doc.createdAt),
      updatedAt: toIsoDate(doc.updatedAt),
    },
    timeline: (doc.timeline ?? []).map((entry) => ({
      status: entry.status,
      at: toIsoDate(entry.at),
      note: entry.note,
      actorUserId: entry.actorUserId,
    })),
    notes: doc.notes,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreOrderDoc(order: Order): FirestoreOrderDoc {
  // Several of these are routinely absent (no second address line, no
  // listing image, a fresh order's timeline entries have no note/actor yet)
  // — setDoc()/updateDoc() reject a literal undefined field value, so each
  // one is only included when actually set.
  return {
    buyerUserId: order.buyerUserId,
    sellerId: order.sellerId,
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      listingId: item.listingId,
      titleSnapshot: item.titleSnapshot,
      quantity: item.quantity,
      unitAmountCents: item.unitPriceSnapshot.amountCents,
      currency: item.unitPriceSnapshot.currency,
      ...(item.imageUrl !== undefined && { imageUrl: item.imageUrl }),
    })),
    subtotalAmountCents: order.subtotal.amountCents,
    deliveryFeeAmountCents: order.deliveryFee.amountCents,
    totalAmountCents: order.total.amountCents,
    currency: order.currency,
    deliveryMode: order.deliveryMode,
    deliveryAddress: {
      fullName: order.deliveryAddress.fullName,
      phoneNumber: order.deliveryAddress.phoneNumber,
      line1: order.deliveryAddress.line1,
      ...(order.deliveryAddress.line2 !== undefined && { line2: order.deliveryAddress.line2 }),
      postalCode: order.deliveryAddress.postalCode,
      city: order.deliveryAddress.city,
      ...(order.deliveryAddress.state !== undefined && { state: order.deliveryAddress.state }),
      countryCode: order.deliveryAddress.countryCode,
      ...(order.deliveryAddress.instructions !== undefined && { instructions: order.deliveryAddress.instructions }),
    },
    timeline: order.timeline.map((entry) => ({
      status: entry.status,
      at: toTimestamp(entry.at),
      ...(entry.note !== undefined && { note: entry.note }),
      ...(entry.actorUserId !== undefined && { actorUserId: entry.actorUserId }),
    })),
    ...(order.notes !== undefined && { notes: order.notes }),
    createdAt: toTimestamp(order.createdAt),
    updatedAt: toTimestamp(order.updatedAt),
  };
}

export function fromFirestoreNotificationDoc(
  id: string,
  doc: FirestoreNotificationDoc
): Notification {
  return {
    id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    body: doc.body,
    data: doc.data,
    isRead: doc.isRead,
    createdAt: toIsoDate(doc.createdAt),
  };
}

export function toFirestoreNotificationDoc(
  notification: Notification
): FirestoreNotificationDoc {
  return {
    ...notification,
    createdAt: toTimestamp(notification.createdAt),
  };
}

export function fromFirestorePartnerLeadDoc(id: string, doc: FirestorePartnerLeadDoc): PartnerLead {
  return {
    id,
    businessName: doc.businessName,
    businessType: doc.businessType,
    neighborhood: doc.neighborhood,
    phoneNumber: doc.phoneNumber,
    email: doc.email,
    city: doc.city,
    status: doc.status,
    createdAt: toIsoDate(doc.createdAt),
  };
}

export function toFirestorePartnerLeadDoc(lead: PartnerLead): FirestorePartnerLeadDoc {
  return {
    ...lead,
    createdAt: toTimestamp(lead.createdAt),
  };
}

export function fromFirestoreDishDoc(id: string, doc: FirestoreDishDoc): Dish {
  return {
    id,
    cuisine: doc.cuisine,
    name: doc.name ?? '',
    slug: doc.slug ?? id,
    description: doc.description ?? '',
    imageUrl: doc.imageUrl,
    defaultCondimentIds: doc.defaultCondimentIds ?? [],
    createdBySellerId: doc.createdBySellerId,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreDishDoc(dish: Dish, searchTokens: string[]): FirestoreDishDoc {
  // imageUrl is routinely absent (a brand-new dish created inline while
  // publishing a listing has no photo yet) — setDoc() rejects a literal
  // undefined field value.
  const { imageUrl, ...rest } = dish;
  return {
    ...rest,
    ...(imageUrl !== undefined && { imageUrl }),
    createdAt: toTimestamp(dish.createdAt),
    updatedAt: toTimestamp(dish.updatedAt),
    searchTokens,
  };
}

export function fromFirestoreCondimentDoc(id: string, doc: FirestoreCondimentDoc): Condiment {
  return {
    id,
    name: doc.name ?? '',
    normalizedName: doc.normalizedName ?? '',
    aliases: doc.aliases ?? [],
    category: doc.category,
    createdBySellerId: doc.createdBySellerId,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreCondimentDoc(
  condiment: Condiment,
  searchTokens: string[]
): FirestoreCondimentDoc {
  return {
    ...condiment,
    createdAt: toTimestamp(condiment.createdAt),
    updatedAt: toTimestamp(condiment.updatedAt),
    searchTokens,
  };
}

export function fromFirestorePostDoc(id: string, doc: FirestorePostDoc): Post {
  return {
    id,
    sellerId: doc.sellerId,
    mediaType: doc.mediaType,
    mediaUrl: doc.mediaUrl,
    mediaWidth: doc.mediaWidth,
    mediaHeight: doc.mediaHeight,
    mediaDurationSeconds: doc.mediaDurationSeconds,
    caption: doc.caption ?? '',
    linkTarget: doc.linkTarget,
    mediaProcessingStatus: doc.mediaProcessingStatus,
    likeCount: doc.likeCount ?? 0,
    commentCount: doc.commentCount ?? 0,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestorePostDoc(post: Post): FirestorePostDoc {
  // All of these are optional on Post and explicitly set to undefined when
  // not applicable (e.g. mediaDurationSeconds on an image post) — object
  // literal syntax still creates an own `undefined`-valued property for
  // them, which setDoc() rejects just like a missing linkTarget does.
  const { mediaUrl, mediaWidth, mediaHeight, mediaDurationSeconds, linkTarget, mediaProcessingStatus, ...rest } = post;
  return {
    ...rest,
    ...(mediaUrl !== undefined && { mediaUrl }),
    ...(mediaWidth !== undefined && { mediaWidth }),
    ...(mediaHeight !== undefined && { mediaHeight }),
    ...(mediaDurationSeconds !== undefined && { mediaDurationSeconds }),
    ...(linkTarget !== undefined && { linkTarget }),
    ...(mediaProcessingStatus !== undefined && { mediaProcessingStatus }),
    createdAt: toTimestamp(post.createdAt),
    updatedAt: toTimestamp(post.updatedAt),
  };
}

export function fromFirestorePostCommentDoc(id: string, doc: FirestorePostCommentDoc): PostComment {
  return {
    id,
    postId: doc.postId,
    authorUserId: doc.authorUserId,
    authorDisplayNameSnapshot: doc.authorDisplayNameSnapshot ?? '',
    body: doc.body ?? '',
    createdAt: toIsoDate(doc.createdAt),
  };
}

export function toFirestorePostCommentDoc(comment: PostComment): FirestorePostCommentDoc {
  return {
    ...comment,
    createdAt: toTimestamp(comment.createdAt),
  };
}
