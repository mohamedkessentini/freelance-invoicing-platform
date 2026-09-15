import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as timeEntryService from '../services/timeEntry.service';
import { parsePagination } from '../utils/pagination';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const entry = await timeEntryService.createTimeEntry(req.userId!, req.body);
  res.status(201).json(entry);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await timeEntryService.deleteTimeEntry(req.userId!, req.params.id as string);
  res.status(204).send();
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const { projectId, invoiced, from, to } = req.query;
  const result = await timeEntryService.listTimeEntries({
    userId: req.userId!,
    projectId: typeof projectId === 'string' ? projectId : undefined,
    invoiced: invoiced === 'true' ? true : invoiced === 'false' ? false : undefined,
    from: typeof from === 'string' ? new Date(from) : undefined,
    to: typeof to === 'string' ? new Date(to) : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});
