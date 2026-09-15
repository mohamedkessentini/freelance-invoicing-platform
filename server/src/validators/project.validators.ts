import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'clientId is required'),
    name: z.string().min(1, 'name is required').max(150),
    hourlyRate: z.number().positive('hourlyRate must be positive'),
    currency: z.string().length(3, 'currency must be a 3-letter ISO code'),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
