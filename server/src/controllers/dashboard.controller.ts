import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardService from '../services/dashboard.service';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await dashboardService.getDashboardSummary(req.userId!);
  res.status(200).json(summary);
});
