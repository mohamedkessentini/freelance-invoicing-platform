import { Router } from 'express';
import * as timeEntryController from '../controllers/timeEntry.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTimeEntrySchema } from '../validators/timeEntry.validators';

export const timeEntryRouter = Router();

timeEntryRouter.use(requireAuth);
timeEntryRouter.post('/', validate(createTimeEntrySchema), timeEntryController.create);
timeEntryRouter.get('/', timeEntryController.list);
timeEntryRouter.delete('/:id', timeEntryController.remove);
