import { z } from 'zod';

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  sellerId: z.string().min(1),
});
