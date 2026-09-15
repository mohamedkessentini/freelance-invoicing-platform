import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as invoiceService from '../services/invoice.service';
import { parsePagination } from '../utils/pagination';
import { InvoiceStatus } from '../models/Invoice';

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.generateInvoice(req.userId!, req.body);
  res.status(201).json(invoice);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.userId!, req.params.id as string);
  res.status(200).json(invoice);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const result = await invoiceService.listInvoices({
    userId: req.userId!,
    clientId: typeof req.query.clientId === 'string' ? req.query.clientId : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as InvoiceStatus) : undefined,
    page,
    limit,
  });
  res.status(200).json(result);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.updateInvoiceStatus(req.userId!, req.params.id as string, req.body.status);
  res.status(200).json(invoice);
});
