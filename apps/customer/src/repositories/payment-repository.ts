import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase/config';

type CreatePaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
};

export const PaymentRepository = {
  async createPaymentIntent(orderId: string) {
    const call = httpsCallable<{ orderId: string }, CreatePaymentIntentResponse>(functions, 'createPaymentIntent');
    const result = await call({ orderId });
    return result.data;
  },
};
