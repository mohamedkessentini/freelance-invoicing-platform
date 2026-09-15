import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as projectService from '../services/project.service';
import { parsePagination } from '../utils/pagination';
import { ProjectStatus } from '../models/Project';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.userId!, req.body);
  res.status(201).json(project);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.userId!, req.params.id as string);
  res.status(200).json(project);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await projectService.listProjects({
    userId: req.userId!,
    clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as ProjectStatus) : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});
