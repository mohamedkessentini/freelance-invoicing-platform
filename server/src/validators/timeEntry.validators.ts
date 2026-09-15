import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'projectId is required'),
    date: z.string().datetime({ offset: true }).or(z.string().min(1)),
    hours: z.number().positive('hours must be positive').max(24, 'hours cannot exceed 24 in a day'),
    description: z.string().min(1, 'description is required').max(500),
    billable: z.boolean().optional(),
  }),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>['body'];
