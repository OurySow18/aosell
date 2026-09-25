import { z } from 'zod';

export const cuisineOptions = [
  'senegalese',
  'guinean',
  'ivorian',
  'malian',
  'cameroonian',
  'congolese',
  'nigerian',
  'ghanaian',
  'beninese',
  'togolese',
] as const;

export const sellerProfileSchema = z.object({
  type: z.enum(['shop', 'restaurant', 'individual']),
  brandName: z.string().min(2),
  description: z.string().min(10),
  city: z.string().min(2),
  countryCode: z.string().length(2),
  deliveryModes: z.array(z.enum(['aosell', 'seller'])).min(1),
  cuisineSpecialties: z.array(z.enum(cuisineOptions)).default([]),
});
