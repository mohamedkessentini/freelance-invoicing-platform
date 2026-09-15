import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectSchema } from '../validators/project.validators';

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.post('/', validate(createProjectSchema), projectController.create);
projectRouter.get('/', projectController.list);
projectRouter.get('/:id', projectController.getById);
