export type UUID = string;
export type ISODateString = string;
export type CurrencyCode = "EUR";
export type CountryCode = string;
export type LanguageCode = string;

export type UserRole = "buyer" | "seller" | "admin";
export type SellerType = "shop" | "restaurant" | "individual";
export type ListingType = "product" | "meal" | "service";
export type DeliveryMode = "aosell" | "seller";
export type ListingStatus =
  | "draft"
  | "active"
  | "paused"
  | "hidden"
  | "archived";
export type OrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "refunded";
export type PaymentStatus =
  | "requires_payment"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded";
export type NotificationType =
  | "order_created"
  | "order_paid"
  | "order_confirmed"
  | "order_status_changed"
  | "listing_published"
  | "listing_rejected"
  | "payout_sent"
  | "system_message";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type MediaType = "image" | "video";

export interface Money {
  amountCents: number;
  currency: CurrencyCode;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  id: UUID;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  state?: string;
  countryCode: CountryCode;
  location?: GeoPoint;
  instructions?: string;
  isDefault?: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AppUser {
  id: UUID;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserProfile {
  userId: UUID;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  countryCode?: CountryCode;
  city?: string;
  preferredLanguage?: LanguageCode;
  addresses: Address[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SellerProfile {
  id: UUID;
  ownerUserId: UUID;
  type: SellerType;
  brandName: string;
  legalName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  email?: string;
  phoneNumber?: string;
  countryCode: CountryCode;
  city: string;
  address?: Address;
  location?: GeoPoint;
  deliveryModes: DeliveryMode[];
  verificationStatus: VerificationStatus;
  ratingAverage?: number;
  ratingCount?: number;
  isOpen?: boolean;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ListingMedia {
  id: UUID;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sortOrder: number;
}

export interface ListingAttribute {
  key: string;
  label: string;
  value: string | number | boolean;
}

export interface Inventory {
  quantity?: number;
  isUnlimited: boolean;
  sku?: string;
}

export interface Listing {
  id: UUID;
  sellerId: UUID;
  type: ListingType;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  price: Money;
  compareAtPrice?: Money;
  status: ListingStatus;
  deliveryMode: DeliveryMode;
  countryCode: CountryCode;
  city: string;
  tags: string[];
  categories: string[];
  media: ListingMedia[];
  attributes: ListingAttribute[];
  inventory: Inventory;
  averageRating?: number;
  reviewCount?: number;
  linkedVideoUrl?: string;
  isFeatured: boolean;
  publishedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CartItem {
  listingId: UUID;
  titleSnapshot: string;
  unitPriceSnapshot: Money;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  id: UUID;
  buyerUserId: UUID;
  sellerId: UUID;
  items: CartItem[];
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrderItem {
  id: UUID;
  listingId: UUID;
  titleSnapshot: string;
  unitPriceSnapshot: Money;
  quantity: number;
  imageUrl?: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  at: ISODateString;
  note?: string;
  actorUserId?: UUID;
}

export interface Order {
  id: UUID;
  buyerUserId: UUID;
  sellerId: UUID;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  currency: CurrencyCode;
  deliveryMode: DeliveryMode;
  deliveryAddress: Address;
  timeline: OrderTimelineEntry[];
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Payment {
  id: UUID;
  orderId: UUID;
  provider: "stripe";
  providerPaymentIntentId?: string;
  status: PaymentStatus;
  amount: Money;
  paidAt?: ISODateString;
  refundedAt?: ISODateString;
  failureReason?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Delivery {
  id: UUID;
  orderId: UUID;
  mode: DeliveryMode;
  status: Extract<
    OrderStatus,
    "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "canceled"
  >;
  courierName?: string;
  trackingNumber?: string;
  estimatedDeliveryAt?: ISODateString;
  deliveredAt?: ISODateString;
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Review {
  id: UUID;
  orderId: UUID;
  listingId?: UUID;
  sellerId: UUID;
  buyerUserId: UUID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: ISODateString;
}

export interface SellerProductImportRow {
  externalId?: string;
  title: string;
  description?: string;
  type: ListingType;
  priceAmount: number;
  currency: CurrencyCode;
  quantity?: number;
  sku?: string;
  city?: string;
  countryCode?: CountryCode;
  deliveryMode?: DeliveryMode;
  imageUrls?: string[];
  videoUrl?: string;
  tags?: string[];
  categories?: string[];
}

export interface AuditFields {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BaseEntity extends AuditFields {
  id: UUID;
}

export interface DatabaseSchema {
  users: AppUser;
  user_profiles: UserProfile;
  seller_profiles: SellerProfile;
  listings: Listing;
  carts: Cart;
  orders: Order;
  payments: Payment;
  deliveries: Delivery;
  reviews: Review;
  notifications: Notification;
}
