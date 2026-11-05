import { TranscoderServiceClient } from '@google-cloud/video-transcoder';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, projectID } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import Stripe from 'stripe';

initializeApp();

const db = getFirestore();

// Firebase Functions v2 only injects a secret into process.env for a given
// function when that function's options list it in `secrets: [...]` — these
// params are how that declaration ties back to the value set via
// `firebase functions:secrets:set`.
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

function getStripeClient() {
  const secretKey = stripeSecretKey.value();
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return new Stripe(secretKey);
}

export const createPaymentIntent = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new Error('Must be signed in.');
  }

  const orderId = String(request.data?.orderId ?? '');
  if (!orderId) {
    throw new Error('Missing orderId');
  }

  // The amount and seller are read from the order document itself, never
  // trusted from the client — a caller could otherwise request a PaymentIntent
  // for any amount by passing a different amountCents.
  const orderSnap = await db.collection('orders').doc(orderId).get();
  const order = orderSnap.data();
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.buyerUserId !== request.auth.uid) {
    throw new Error('This order does not belong to you.');
  }
  if (order.status !== 'created' && order.status !== 'pending_payment') {
    throw new Error('This order is not payable.');
  }

  const amount = Number(order.totalAmountCents ?? 0);
  if (!amount || amount < 0) {
    throw new Error('Invalid order total');
  }

  const stripe = getStripeClient();
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId,
      sellerId: String(order.sellerId ?? ''),
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
});

export const stripeWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
  const secret = stripeWebhookSecret.value();
  if (!secret) {
    res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
    return;
  }

  const stripe = getStripeClient();
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, signature, secret);
  } catch (error) {
    res.status(400).send(`Webhook error: ${(error as Error).message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await db.collection('orders').doc(orderId).set(
        {
          status: 'paid',
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await db.collection('orders').doc(orderId).set(
        {
          status: 'pending_payment',
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }
  }

  res.status(200).send('ok');
});

export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('Must be signed in.');
  }
  const uid = request.auth.uid;

  // Delete subcollections first (Firestore doesn't cascade-delete them when
  // their parent document is deleted).
  const addressesSnap = await db.collection('user_profiles').doc(uid).collection('addresses').get();
  const followsSnap = await db.collection('user_profiles').doc(uid).collection('follows').get();
  const notificationsSnap = await db.collection('notifications').doc(uid).collection('items').get();

  const batch = db.batch();
  addressesSnap.forEach((doc) => batch.delete(doc.ref));
  followsSnap.forEach((doc) => batch.delete(doc.ref));
  notificationsSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection('user_profiles').doc(uid));
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('carts').doc(uid));
  await batch.commit();

  // Seller profiles, listings and past orders are intentionally left
  // untouched: deleting them would also erase other users' (buyers',
  // sellers') own order history and break the marketplace's integrity.
  // A seller wanting a full data wipe is handled as a manual request for now.

  await getAuth().deleteUser(uid);

  return { ok: true };
});

export const sendOrderNotification = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!after || before?.status === after.status) {
    return;
  }

  const buyerUserId = String(after.buyerUserId ?? '');
  if (!buyerUserId) {
    return;
  }

  await db.collection('notifications').doc(buyerUserId).collection('items').add({
    userId: buyerUserId,
    type: 'order_status_changed',
    title: 'Order updated',
    body: `Your order is now ${String(after.status).replaceAll('_', ' ')}.`,
    isRead: false,
    createdAt: new Date(),
  });
});

export const onPostLikeWritten = onDocumentWritten('posts/{postId}/likes/{userId}', async (event) => {
  const postId = event.params.postId;
  const existedBefore = event.data?.before.exists ?? false;
  const existsAfter = event.data?.after.exists ?? false;

  if (existedBefore === existsAfter) {
    return;
  }

  const delta = existsAfter ? 1 : -1;
  await db.collection('posts').doc(postId).set(
    { likeCount: FieldValue.increment(delta) },
    { merge: true }
  );
});

export const onPostCommentWritten = onDocumentWritten('posts/{postId}/comments/{commentId}', async (event) => {
  const postId = event.params.postId;
  const existedBefore = event.data?.before.exists ?? false;
  const existsAfter = event.data?.after.exists ?? false;

  if (existedBefore === existsAfter) {
    return;
  }

  const delta = existsAfter ? 1 : -1;
  await db.collection('posts').doc(postId).set(
    { commentCount: FieldValue.increment(delta) },
    { merge: true }
  );
});

// Follows are stored per-follower, at user_profiles/{userId}/follows/{sellerId}
// (there's no reverse index on the seller side), so the seller's own
// follower count has to be kept as a denormalized counter here instead.
export const onSellerFollowWritten = onDocumentWritten('user_profiles/{userId}/follows/{sellerId}', async (event) => {
  const sellerId = event.params.sellerId;
  const existedBefore = event.data?.before.exists ?? false;
  const existsAfter = event.data?.after.exists ?? false;

  if (existedBefore === existsAfter) {
    return;
  }

  const delta = existsAfter ? 1 : -1;
  await db.collection('seller_profiles').doc(sellerId).set(
    { followerCount: FieldValue.increment(delta) },
    { merge: true }
  );
});

// Google Cloud's supported Transcoder API regions include us-central1, which
// is also this project's default Functions region — no cross-region calls.
const TRANSCODER_LOCATION = 'us-central1';
const transcoderClient = new TranscoderServiceClient();

// post/create.tsx uploads raw, untranscoded video to post-media/{uid}/{postId}.{ext}
// (phone footage is usually .mov/HEVC, not the mp4/H.264 most players expect).
// This fires on every object finalized in the whole default bucket — not just
// video uploads — so it bails out early for anything outside that path/type.
export const onPostVideoUploaded = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  if (!filePath.startsWith('post-media/') || !contentType?.startsWith('video/')) {
    return;
  }

  const segments = filePath.split('/');
  const ownerUserId = segments[1];
  const postId = segments[2]?.replace(/\.[^.]+$/, '');
  if (!ownerUserId || !postId) {
    return;
  }

  // A single-file MP4 mux (H.264/AAC) via an ad-hoc config, not a templateId
  // preset: built-in presets like "preset/web-hd" produce segmented DASH
  // output (a manifest plus separate video-only/audio-only .m4s chunks meant
  // for an adaptive-streaming player), not one playable file. Resolution is
  // left unset so Transcoder keeps the source's own dimensions — phone
  // footage is usually portrait, and a fixed landscape size would stretch it.
  // fileName is fixed ("output.mp4") so onPostVideoTranscoded below can match
  // on it instead of treating any video that lands in the output folder as
  // the ready file.
  await transcoderClient.createJob({
    parent: transcoderClient.locationPath(projectID.value(), TRANSCODER_LOCATION),
    job: {
      inputUri: `gs://${event.data.bucket}/${filePath}`,
      outputUri: `gs://${event.data.bucket}/post-media-transcoded/${ownerUserId}/${postId}/`,
      config: {
        elementaryStreams: [
          {
            key: 'video-stream0',
            videoStream: { h264: { bitrateBps: 2_500_000, frameRate: 30 } },
          },
          {
            key: 'audio-stream0',
            audioStream: { codec: 'aac', bitrateBps: 128_000 },
          },
        ],
        muxStreams: [
          {
            key: 'output',
            fileName: 'output.mp4',
            container: 'mp4',
            elementaryStreams: ['video-stream0', 'audio-stream0'],
          },
        ],
      },
    },
  });
});

// Reacts once the job started above finishes and writes its output — updates
// the post so the feed swaps the raw upload for the standardized version.
export const onPostVideoTranscoded = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  if (!filePath.startsWith('post-media-transcoded/') || !filePath.endsWith('/output.mp4') || !contentType?.startsWith('video/')) {
    return;
  }

  const segments = filePath.split('/');
  const postId = segments[2];
  if (!postId) {
    return;
  }

  // storage.googleapis.com serves objects per GCS IAM/bucket ACLs, which
  // ignore storage.rules entirely — using it 403s unless the bucket grants
  // allUsers read at the IAM level. firebasestorage.googleapis.com is the
  // endpoint that actually enforces storage.rules, which already allows
  // public read on this path.
  const mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${event.data.bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
  await db.collection('posts').doc(postId).set(
    { mediaUrl, mediaProcessingStatus: 'ready' },
    { merge: true }
  );
});

// Placeholder rate — the real commission structure hasn't been decided yet;
// this just needs to exist so the rest of the courier flow has a number to
// compute with. Change this one constant once the real rate is set.
const COURIER_COMMISSION_RATE = 0.15;

function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

// Picks the closest available, verified courier to a pickup point (the
// seller's own location — no live courier GPS tracking in this v1, just
// whatever location a courier last reported when going "available").
// Straight-line distance, not road distance — fine at this scale.
async function findNearestAvailableCourier(
  sellerLocation: { lat: number; lng: number },
  countryCode: string,
  excludeCourierIds: string[]
): Promise<{ id: string; ownerUserId: string } | null> {
  const candidates = await db
    .collection('courier_profiles')
    .where('countryCode', '==', countryCode)
    .where('availability', '==', 'available')
    .where('verificationStatus', '==', 'verified')
    .get();

  let nearest: { id: string; ownerUserId: string; distanceKm: number } | null = null;

  candidates.forEach((candidate) => {
    if (excludeCourierIds.includes(candidate.id)) {
      return;
    }

    const location = candidate.data().location;
    if (!location) {
      return;
    }

    const distanceKm = haversineDistanceKm(sellerLocation, location);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { id: candidate.id, ownerUserId: candidate.data().ownerUserId, distanceKm };
    }
  });

  return nearest;
}

// Assigns (or re-assigns, after a decline) the nearest available courier to
// an "aosell"-delivery order once it's ready to be picked up. Triggered by
// either the order entering 'preparing', or a courier declining their offer.
export const onOrderReadyForDelivery = onDocumentUpdated('orders/{orderId}', async (event) => {
  const orderId = event.params.orderId;
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!after || after.deliveryMode !== 'aosell') {
    return;
  }

  const justEnteredPreparing = after.status === 'preparing' && before?.status !== 'preparing' && !after.courierId;
  const courierJustDeclined =
    after.courierAssignmentStatus === 'declined' && before?.courierAssignmentStatus !== 'declined';

  if (!justEnteredPreparing && !courierJustDeclined) {
    return;
  }

  const sellerSnap = await db.collection('seller_profiles').doc(String(after.sellerId)).get();
  const seller = sellerSnap.data();
  if (!seller?.location || !seller?.countryCode) {
    return;
  }

  const declinedCourierIds: string[] = after.declinedCourierIds ?? [];
  const nearest = await findNearestAvailableCourier(seller.location, seller.countryCode, declinedCourierIds);

  if (!nearest) {
    return;
  }

  await db.collection('orders').doc(orderId).set(
    { courierId: nearest.id, courierAssignmentStatus: 'offered' },
    { merge: true }
  );

  await db.collection('notifications').doc(nearest.ownerUserId).collection('items').add({
    userId: nearest.ownerUserId,
    type: 'delivery_offered',
    title: 'New delivery available',
    body: 'A nearby order is ready for pickup.',
    isRead: false,
    createdAt: new Date(),
  });
});

// Computes the courier's cut once an "aosell"-delivery order is marked
// delivered, and credits it to their running (denormalized) total — the
// actual payout itself is handled manually/outside the app for now.
export const onOrderDelivered = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!after || after.deliveryMode !== 'aosell' || !after.courierId) {
    return;
  }
  if (after.status !== 'delivered' || before?.status === 'delivered') {
    return;
  }

  const commissionCents = Math.round(Number(after.totalAmountCents ?? 0) * COURIER_COMMISSION_RATE);

  await db.collection('orders').doc(event.params.orderId).set(
    { courierCommissionAmountCents: commissionCents },
    { merge: true }
  );
  await db.collection('courier_profiles').doc(String(after.courierId)).set(
    { totalEarnedCents: FieldValue.increment(commissionCents) },
    { merge: true }
  );
});
