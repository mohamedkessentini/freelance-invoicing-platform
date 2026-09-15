import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name is required').max(120),
    company: z.string().max(150).optional(),
    email: z.string().email().optional(),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
