import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
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
