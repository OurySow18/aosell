import { z } from 'zod';

export const sellerProfileSchema = z.object({
  type: z.enum(['shop', 'restaurant', 'individual']),
  brandName: z.string().min(2),
  description: z.string().min(10),
  city: z.string().min(2),
  countryCode: z.string().length(2),
  deliveryModes: z.array(z.enum(['aosell', 'seller'])).min(1),
});
