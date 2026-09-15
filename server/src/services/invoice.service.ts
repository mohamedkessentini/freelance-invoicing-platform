import { Types } from 'mongoose';
import { Invoice, InvoiceDocument, InvoiceLineItem, InvoiceStatus } from '../models/Invoice';
import { TimeEntry } from '../models/TimeEntry';
import { Project } from '../models/Project';
import { ApiError } from '../utils/ApiError';
import { GenerateInvoiceInput } from '../validators/invoice.validators';
import { getClientById } from './client.service';
import { Page } from './client.service';

const DEFAULT_DUE_IN_DAYS = 30;

export interface ListInvoicesOptions {
  userId: string;
  clientId?: string;
  status?: InvoiceStatus;
  page: number;
  limit: number;
}

/**
 * Generates an invoice from every billable, not-yet-invoiced time entry recorded against the
 * given client's projects within [periodStart, periodEnd]. Marking those entries as invoiced is
 * done with a single conditional updateMany (matching invoiced: false again) so two concurrent
 * invoice generations can never both bill the same time entry.
 */
export async function generateInvoice(userId: string, input: GenerateInvoiceInput): Promise<InvoiceDocument> {
  await getClientById(userId, input.clientId);

  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
    throw ApiError.badRequest('periodStart must be a valid date before periodEnd');
  }

  const clientProjects = await Project.find({ user: userId, client: input.clientId });
  if (clientProjects.length === 0) {
    throw ApiError.unprocessable('This client has no projects to invoice');
  }
  const projectIds = clientProjects.map((p) => p._id);

  const eligibleEntries = await TimeEntry.find({
    user: userId,
    project: { $in: projectIds },
    billable: true,
    invoiced: false,
    date: { $gte: periodStart, $lte: periodEnd },
  });

  if (eligibleEntries.length === 0) {
    throw ApiError.unprocessable('No unbilled time entries found for this client in the given period');
  }

  const currencies = new Set(clientProjects.map((p) => p.currency));
  if (currencies.size > 1) {
    throw ApiError.unprocessable(
      'This client has projects in different currencies - invoice each currency group separately',
    );
  }
  const currency = clientProjects[0]!.currency;

  const projectById = new Map(clientProjects.map((p) => [p._id.toString(), p]));
  const hoursByProject = new Map<string, number>();
  for (const entry of eligibleEntries) {
    const key = entry.project.toString();
    hoursByProject.set(key, (hoursByProject.get(key) ?? 0) + entry.hours);
  }

  const lineItems: InvoiceLineItem[] = Array.from(hoursByProject.entries()).map(([projectId, hours]) => {
    const project = projectById.get(projectId)!;
    const roundedHours = Math.round(hours * 100) / 100;
    const amount = Math.round(roundedHours * project.hourlyRate * 100) / 100;
    return {
      project: project._id,
      description: project.name,
      hours: roundedHours,
      rate: project.hourlyRate,
      amount,
    };
  });

  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const dueInDays = input.dueInDays ?? DEFAULT_DUE_IN_DAYS;
  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime() + dueInDays * 24 * 60 * 60 * 1000);

  const invoiceNumber = await nextInvoiceNumber(userId);
  const invoice = await Invoice.create({
    user: userId,
    client: input.clientId,
    invoiceNumber,
    status: 'DRAFT',
    currency,
    issueDate,
    dueDate,
    lineItems,
    subtotal,
    total: subtotal,
  });

  const entryIds = eligibleEntries.map((e) => e._id);
  const result = await TimeEntry.updateMany(
    { _id: { $in: entryIds }, invoiced: false },
    { $set: { invoiced: true, invoice: invoice._id } },
  );

  if (result.modifiedCount !== entryIds.length) {
    // Another concurrent request billed some of these entries first - roll back this invoice
    // rather than leave a partially-backed invoice on record.
    await invoice.deleteOne();
    throw ApiError.conflict('Some time entries were billed concurrently by another request - please retry');
  }

  return invoice;
}

export async function getInvoiceById(userId: string, id: string): Promise<InvoiceDocument> {
  const invoice = await Invoice.findOne({ _id: id, user: userId });
  if (!invoice) {
    throw ApiError.notFound('Invoice', id);
  }
  return withEffectiveStatus(invoice);
}

export async function listInvoices(options: ListInvoicesOptions): Promise<Page<InvoiceDocument>> {
  const filter: Record<string, unknown> = { user: options.userId };
  if (options.clientId) filter.client = options.clientId;

  const skip = (options.page - 1) * options.limit;
  const [rawContent, totalElements] = await Promise.all([
    Invoice.find(filter).sort({ invoiceNumber: -1 }).skip(skip).limit(options.limit),
    Invoice.countDocuments(filter),
  ]);

  let content = rawContent.map(withEffectiveStatus);
  if (options.status) {
    content = content.filter((invoice) => invoice.status === options.status);
  }

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}

export async function updateInvoiceStatus(
  userId: string,
  id: string,
  newStatus: 'SENT' | 'PAID',
): Promise<InvoiceDocument> {
  const invoice = await getInvoiceById(userId, id);

  if (newStatus === 'SENT' && invoice.status !== 'DRAFT') {
    throw ApiError.conflict(`Cannot mark as SENT: invoice is currently ${invoice.status}`);
  }
  if (newStatus === 'PAID' && invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
    throw ApiError.conflict(`Cannot mark as PAID: invoice is currently ${invoice.status}`);
  }

  invoice.status = newStatus;
  if (newStatus === 'PAID') {
    invoice.paidAt = new Date();
  }
  await invoice.save();
  return invoice;
}

/** An invoice past its due date is treated as OVERDUE for display purposes without a cron job. */
function withEffectiveStatus(invoice: InvoiceDocument): InvoiceDocument {
  if (invoice.status === 'SENT' && invoice.dueDate.getTime() < Date.now()) {
    invoice.status = 'OVERDUE';
  }
  return invoice;
}

async function nextInvoiceNumber(userId: string): Promise<number> {
  const last = await Invoice.findOne({ user: new Types.ObjectId(userId) }).sort({ invoiceNumber: -1 });
  return (last?.invoiceNumber ?? 0) + 1;
}
