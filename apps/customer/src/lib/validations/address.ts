import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().min(6),
  line1: z.string().min(3),
  postalCode: z.string().min(3),
  city: z.string().min(2),
  countryCode: z.string().length(2),
  instructions: z.string().optional(),
});
