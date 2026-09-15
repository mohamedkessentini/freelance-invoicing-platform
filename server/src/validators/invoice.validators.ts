import { z } from 'zod';

export const generateInvoiceSchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'clientId is required'),
    periodStart: z.string().min(1, 'periodStart is required'),
    periodEnd: z.string().min(1, 'periodEnd is required'),
    dueInDays: z.number().int().positive().optional(),
  }),
});

export const updateInvoiceStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SENT', 'PAID']),
  }),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>['body'];
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>['body'];
