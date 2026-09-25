import type {
    Address,
    AppUser,
    Condiment,
    Delivery,
    Dish,
    ISODateString,
    Listing,
    Notification,
    Order,
    Payment,
    Post,
    PostComment,
    Review,
    SellerProfile,
    UserProfile,
    UUID,
} from "./types";

/**
 * Firestore primitive conventions used in the app layer.
 * Replace FirestoreTimestamp with the real Firebase Timestamp type in the app.
 */
export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type FirestoreDate = FirestoreTimestamp | ISODateString;

export interface FirestoreMeta {
  id: string;
  path: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

/**
 * Top-level collection names.
 */
export const COLLECTIONS = {
  users: "users",
  userProfiles: "user_profiles",
  sellerProfiles: "seller_profiles",
  listings: "listings",
  carts: "carts",
  orders: "orders",
  payments: "payments",
  deliveries: "deliveries",
  reviews: "reviews",
  notifications: "notifications",
  dishes: "dishes",
  condiments: "condiments",
  posts: "posts",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Firestore document shapes.
 * These are the exact persisted shapes, not UI view models.
 */

export interface FirestoreUserDoc extends Omit<
  AppUser,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface FirestoreUserProfileDoc extends Omit<
  UserProfile,
  "createdAt" | "updatedAt" | "addresses"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  defaultAddressId?: UUID;
}

export interface FirestoreAddressDoc extends Omit<
  Address,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  userId: UUID;
}

export interface FirestoreSellerProfileDoc extends Omit<
  SellerProfile,
  "createdAt" | "updatedAt" | "address"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  addressId?: UUID;
}

export interface FirestoreListingDoc extends Omit<
  Listing,
  "createdAt" | "updatedAt" | "publishedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  publishedAt?: FirestoreDate;
  searchTokens: string[];
  primaryImageUrl?: string;
  hasVideo: boolean;
}

export interface FirestoreCartItemDoc {
  listingId: UUID;
  titleSnapshot: string;
  quantity: number;
  unitAmountCents: number;
  currency: "EUR";
  imageUrl?: string;
}

export interface FirestoreCartDoc {
  buyerUserId: UUID;
  sellerId: UUID;
  items: FirestoreCartItemDoc[];
  subtotalAmountCents: number;
  deliveryFeeAmountCents: number;
  discountAmountCents: number;
  promoCode?: string;
  totalAmountCents: number;
  currency: "EUR";
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface FirestoreOrderItemDoc {
  id: UUID;
  listingId: UUID;
  titleSnapshot: string;
  quantity: number;
  unitAmountCents: number;
  currency: "EUR";
  imageUrl?: string;
}

export interface FirestoreOrderTimelineEntryDoc {
  status: Order["status"];
  at: FirestoreDate;
  note?: string;
  actorUserId?: UUID;
}

export interface FirestoreOrderAddressSnapshot {
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  state?: string;
  countryCode: string;
  instructions?: string;
}

export interface FirestoreOrderDoc {
  buyerUserId: UUID;
  sellerId: UUID;
  status: Order["status"];
  items: FirestoreOrderItemDoc[];
  subtotalAmountCents: number;
  deliveryFeeAmountCents: number;
  totalAmountCents: number;
  currency: "EUR";
  deliveryMode: Order["deliveryMode"];
  deliveryAddress: FirestoreOrderAddressSnapshot;
  timeline: FirestoreOrderTimelineEntryDoc[];
  notes?: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface FirestorePaymentDoc extends Omit<
  Payment,
  "createdAt" | "updatedAt" | "paidAt" | "refundedAt" | "amount"
> {
  amountCents: number;
  currency: "EUR";
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  paidAt?: FirestoreDate;
  refundedAt?: FirestoreDate;
}

export interface FirestoreDeliveryDoc extends Omit<
  Delivery,
  "createdAt" | "updatedAt" | "estimatedDeliveryAt" | "deliveredAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  estimatedDeliveryAt?: FirestoreDate;
  deliveredAt?: FirestoreDate;
}

export interface FirestoreReviewDoc extends Omit<
  Review,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface FirestoreNotificationDoc extends Omit<
  Notification,
  "createdAt"
> {
  createdAt: FirestoreDate;
}

export interface FirestoreDishDoc extends Omit<
  Dish,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  searchTokens: string[];
}

export interface FirestoreCondimentDoc extends Omit<
  Condiment,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  searchTokens: string[];
}

export interface FirestorePostDoc extends Omit<
  Post,
  "createdAt" | "updatedAt"
> {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface FirestorePostCommentDoc extends Omit<
  PostComment,
  "createdAt"
> {
  createdAt: FirestoreDate;
}

/**
 * Suggested document paths.
 */
export type UserDocPath = `users/${string}`;
export type UserProfileDocPath = `user_profiles/${string}`;
export type UserAddressDocPath = `user_profiles/${string}/addresses/${string}`;
export type SellerProfileDocPath = `seller_profiles/${string}`;
export type ListingDocPath = `listings/${string}`;
export type OrderDocPath = `orders/${string}`;
export type PaymentDocPath = `payments/${string}`;
export type DeliveryDocPath = `deliveries/${string}`;
export type ReviewDocPath = `reviews/${string}`;
export type UserNotificationDocPath = `notifications/${string}/items/${string}`;
export type CartDocPath = `carts/${string}`;
export type DishDocPath = `dishes/${string}`;
export type CondimentDocPath = `condiments/${string}`;
export type PostDocPath = `posts/${string}`;
export type PostLikeDocPath = `posts/${string}/likes/${string}`;
export type PostCommentDocPath = `posts/${string}/comments/${string}`;

/**
 * Collection map for repository typing.
 */
export interface FirestoreCollectionMap {
  users: FirestoreUserDoc;
  user_profiles: FirestoreUserProfileDoc;
  seller_profiles: FirestoreSellerProfileDoc;
  listings: FirestoreListingDoc;
  carts: FirestoreCartDoc;
  orders: FirestoreOrderDoc;
  payments: FirestorePaymentDoc;
  deliveries: FirestoreDeliveryDoc;
  reviews: FirestoreReviewDoc;
  notifications: FirestoreNotificationDoc;
  dishes: FirestoreDishDoc;
  condiments: FirestoreCondimentDoc;
  posts: FirestorePostDoc;
}

export type FirestoreCollectionKey = keyof FirestoreCollectionMap;
export type FirestoreDocument<K extends FirestoreCollectionKey> =
  FirestoreCollectionMap[K];

/**
 * Query helper types.
 */
export interface ListingQuery {
  sellerId?: UUID;
  type?: Listing["type"];
  status?: Listing["status"];
  countryCode?: string;
  city?: string;
  hasVideo?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  limit?: number;
  startAfterCreatedAt?: FirestoreDate;
}

export interface OrderQuery {
  buyerUserId?: UUID;
  sellerId?: UUID;
  status?: Order["status"];
  limit?: number;
  startAfterCreatedAt?: FirestoreDate;
}

/**
 * Repository contracts.
 */
export interface FirestoreRepository<K extends FirestoreCollectionKey> {
  getById(id: string): Promise<(FirestoreDocument<K> & { id: string }) | null>;
  create(id: string, data: FirestoreDocument<K>): Promise<void>;
  update(id: string, data: Partial<FirestoreDocument<K>>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Normalizers between domain and Firestore.
 */
export interface FirestoreNormalizer<Domain, Doc> {
  toFirestore(domain: Domain): Doc;
  fromFirestore(id: string, doc: Doc): Domain & { id: string };
}

/**
 * Example: listing normalizer shape.
 */
export type ListingNormalizer = FirestoreNormalizer<
  Listing,
  FirestoreListingDoc
>;
export type OrderNormalizer = FirestoreNormalizer<Order, FirestoreOrderDoc>;
export type SellerNormalizer = FirestoreNormalizer<
  SellerProfile,
  FirestoreSellerProfileDoc
>;

/**
 * Subcollection recommendations.
 */
export interface FirestoreSubcollections {
  "user_profiles/{userId}/addresses": FirestoreAddressDoc;
  "notifications/{userId}/items": FirestoreNotificationDoc;
  "posts/{postId}/comments": FirestorePostCommentDoc;
}

/**
 * Index recommendations to create manually in Firestore.
 */
export const FIRESTORE_INDEX_HINTS = {
  listingsByStatusAndCreatedAt: ["status", "createdAt"],
  listingsByCountryAndCreatedAt: ["countryCode", "createdAt"],
  listingsBySellerAndCreatedAt: ["sellerId", "createdAt"],
  ordersByBuyerAndCreatedAt: ["buyerUserId", "createdAt"],
  ordersBySellerAndCreatedAt: ["sellerId", "createdAt"],
  ordersByStatusAndCreatedAt: ["status", "createdAt"],
} as const;
