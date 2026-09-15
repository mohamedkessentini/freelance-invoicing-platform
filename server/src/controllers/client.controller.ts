import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as clientService from '../services/client.service';
import { parsePagination } from '../utils/pagination';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.createClient(req.userId!, req.body);
  res.status(201).json(client);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.getClientById(req.userId!, req.params.id as string);
  res.status(200).json(client);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await clientService.listClients({
    userId: req.userId!,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});
