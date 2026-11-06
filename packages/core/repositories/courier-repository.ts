import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from '../lib/firebase/config';
import { logFirestoreListenerError } from '../lib/firebase/listener-errors';
import {
  createTimestamp,
  fromFirestoreCourierProfileDoc,
  toFirestoreCourierProfileDoc,
} from '../lib/firebase/mappers';
import type { AppUser, CourierAvailability, CourierProfile, GeoPoint, VerificationStatus } from '../types';
import type { FirestoreCourierProfileDoc } from '../firestore_types';

export const CourierRepository = {
  subscribeAll(onChange: (couriers: CourierProfile[]) => void) {
    return onSnapshot(
      collection(db, 'courier_profiles'),
      (snapshot) => {
        onChange(
          snapshot.docs.map((item) =>
            fromFirestoreCourierProfileDoc(item.id, item.data() as FirestoreCourierProfileDoc)
          )
        );
      },
      (error) => {
        logFirestoreListenerError('courier.all', error);
        onChange([]);
      }
    );
  },

  subscribeOwned(ownerUserId: string, onChange: (courier: CourierProfile | null) => void) {
    return onSnapshot(
      query(collection(db, 'courier_profiles'), where('ownerUserId', '==', ownerUserId)),
      (snapshot) => {
        if (!snapshot.docs.length) {
          onChange(null);
          return;
        }

        onChange(
          fromFirestoreCourierProfileDoc(
            snapshot.docs[0].id,
            snapshot.docs[0].data() as FirestoreCourierProfileDoc
          )
        );
      },
      (error) => {
        logFirestoreListenerError('courier.owned', error);
        onChange(null);
      }
    );
  },

  async create(
    user: AppUser,
    input: { displayName: string; phoneNumber: string; countryCode: string; city: string; vehicleType?: string }
  ): Promise<CourierProfile> {
    const ref = doc(collection(db, 'courier_profiles'));
    const profile: CourierProfile = {
      id: ref.id,
      ownerUserId: user.id,
      displayName: input.displayName,
      phoneNumber: input.phoneNumber,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city,
      vehicleType: input.vehicleType,
      availability: 'offline',
      verificationStatus: 'pending',
      totalEarnedCents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, toFirestoreCourierProfileDoc(profile));
    return profile;
  },

  async setAvailability(courierId: string, availability: CourierAvailability, location?: GeoPoint) {
    await updateDoc(doc(db, 'courier_profiles', courierId), {
      availability,
      updatedAt: createTimestamp(),
      ...(location !== undefined && { location }),
    });
  },

  async setVerificationStatus(courierId: string, status: VerificationStatus) {
    await updateDoc(doc(db, 'courier_profiles', courierId), {
      verificationStatus: status,
      updatedAt: createTimestamp(),
    });
  },

  async setPlannedAvailability(courierId: string, dates: string[]) {
    await updateDoc(doc(db, 'courier_profiles', courierId), {
      plannedAvailabilityDates: dates,
      updatedAt: createTimestamp(),
    });
  },

  async updateProfile(
    courierId: string,
    input: { displayName: string; phoneNumber: string; countryCode: string; city: string; vehicleType?: string }
  ) {
    await updateDoc(doc(db, 'courier_profiles', courierId), {
      displayName: input.displayName,
      phoneNumber: input.phoneNumber,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city,
      ...(input.vehicleType !== undefined && { vehicleType: input.vehicleType }),
      updatedAt: createTimestamp(),
    });
  },
};
