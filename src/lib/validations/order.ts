import { z } from 'zod';

export const orderCreationSchema = z.object({
  buyerUserId: z.string().min(1),
  sellerId: z.string().min(1),
  deliveryMode: z.enum(['aosell', 'seller']),
  currency: z.literal('EUR'),
});
