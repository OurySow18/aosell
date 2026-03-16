import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(4),
  slug: z.string().min(4),
  description: z.string().min(20),
  type: z.enum(['product', 'meal', 'service']),
  deliveryMode: z.enum(['aosell', 'seller']),
  city: z.string().min(2),
  countryCode: z.string().length(2),
  amountCents: z.number().int().min(0),
  status: z.enum(['draft', 'active', 'paused', 'hidden', 'archived']),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  hasVideo: z.boolean(),
});
