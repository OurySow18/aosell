import { Timestamp } from 'firebase/firestore';

import type { AppUser, CourierProfile, Notification, Order, SellerProfile } from '../../types';
import type {
  FirestoreCourierProfileDoc,
  FirestoreNotificationDoc,
  FirestoreOrderDoc,
  FirestoreSellerProfileDoc,
  FirestoreUserDoc,
} from '../../firestore_types';

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
    followerCount: doc.followerCount ?? 0,
    isOpen: doc.isOpen,
    tags: doc.tags ?? [],
    cuisineSpecialties: doc.cuisineSpecialties ?? [],
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function fromFirestoreCourierProfileDoc(
  id: string,
  doc: FirestoreCourierProfileDoc
): CourierProfile {
  return {
    id,
    ownerUserId: doc.ownerUserId,
    displayName: doc.displayName,
    phoneNumber: doc.phoneNumber,
    countryCode: doc.countryCode,
    city: doc.city,
    vehicleType: doc.vehicleType,
    location: doc.location,
    availability: doc.availability,
    verificationStatus: doc.verificationStatus,
    totalEarnedCents: doc.totalEarnedCents ?? 0,
    plannedAvailabilityDates: doc.plannedAvailabilityDates ?? [],
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreCourierProfileDoc(profile: CourierProfile): FirestoreCourierProfileDoc {
  const { vehicleType, location, ...rest } = profile;
  return {
    ...rest,
    ...(vehicleType !== undefined && { vehicleType }),
    ...(location !== undefined && { location }),
    createdAt: toTimestamp(profile.createdAt),
    updatedAt: toTimestamp(profile.updatedAt),
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
    courierId: doc.courierId,
    courierAssignmentStatus: doc.courierAssignmentStatus,
    declinedCourierIds: doc.declinedCourierIds,
    courierCommission:
      doc.courierCommissionAmountCents !== undefined
        ? { amountCents: doc.courierCommissionAmountCents, currency: doc.currency }
        : undefined,
    createdAt: toIsoDate(doc.createdAt),
    updatedAt: toIsoDate(doc.updatedAt),
  };
}

export function toFirestoreOrderDoc(order: Order): FirestoreOrderDoc {
  // Several of these are routinely absent (no courier assigned yet, a fresh
  // order's timeline entries have no note/actor yet) — setDoc()/updateDoc()
  // reject a literal undefined field value, so each is only included when set.
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
    ...(order.courierId !== undefined && { courierId: order.courierId }),
    ...(order.courierAssignmentStatus !== undefined && { courierAssignmentStatus: order.courierAssignmentStatus }),
    ...(order.declinedCourierIds !== undefined && { declinedCourierIds: order.declinedCourierIds }),
    ...(order.courierCommission !== undefined && { courierCommissionAmountCents: order.courierCommission.amountCents }),
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

export function toFirestoreNotificationDoc(notification: Notification): FirestoreNotificationDoc {
  return {
    ...notification,
    createdAt: toTimestamp(notification.createdAt),
  };
}
