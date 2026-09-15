import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateInvoiceSchema, updateInvoiceStatusSchema } from '../validators/invoice.validators';

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);
invoiceRouter.post('/', validate(generateInvoiceSchema), invoiceController.generate);
invoiceRouter.get('/', invoiceController.list);
invoiceRouter.get('/:id', invoiceController.getById);
invoiceRouter.patch('/:id/status', validate(updateInvoiceStatusSchema), invoiceController.updateStatus);
