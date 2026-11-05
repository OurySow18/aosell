import { z } from 'zod';

export const authSignInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const authSignUpSchema = authSignInSchema.extend({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  role: z.enum(['buyer', 'seller']),
});
