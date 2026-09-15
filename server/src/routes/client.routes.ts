import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClientSchema } from '../validators/client.validators';

export const clientRouter = Router();

clientRouter.use(requireAuth);
clientRouter.post('/', validate(createClientSchema), clientController.create);
clientRouter.get('/', clientController.list);
clientRouter.get('/:id', clientController.getById);
