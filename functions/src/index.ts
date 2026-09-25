import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';

initializeApp();

const db = getFirestore();

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return new Stripe(secretKey);
}

export const createPaymentIntent = onCall(async (request) => {
  const stripe = getStripeClient();
  const amount = Number(request.data?.amountCents ?? 0);

  if (!amount || amount < 0) {
    throw new Error('Invalid amountCents');
  }

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(request.data?.orderId ?? ''),
      sellerId: String(request.data?.sellerId ?? ''),
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
});

export const stripeWebhook = onRequest(async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
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
