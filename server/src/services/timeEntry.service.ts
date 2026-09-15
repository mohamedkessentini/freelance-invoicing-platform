import { TimeEntry, TimeEntryDocument } from '../models/TimeEntry';
import { ApiError } from '../utils/ApiError';
import { CreateTimeEntryInput } from '../validators/timeEntry.validators';
import { getProjectById } from './project.service';
import { Page } from './client.service';

export interface ListTimeEntriesOptions {
  userId: string;
  projectId?: string;
  invoiced?: boolean;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export async function createTimeEntry(userId: string, input: CreateTimeEntryInput): Promise<TimeEntryDocument> {
  await getProjectById(userId, input.projectId); // ensures the project exists and belongs to this user

  return TimeEntry.create({
    user: userId,
    project: input.projectId,
    date: new Date(input.date),
    hours: input.hours,
    description: input.description,
    billable: input.billable ?? true,
  });
}

export async function getTimeEntryById(userId: string, id: string): Promise<TimeEntryDocument> {
  const entry = await TimeEntry.findOne({ _id: id, user: userId });
  if (!entry) {
    throw ApiError.notFound('TimeEntry', id);
  }
  return entry;
}

export async function deleteTimeEntry(userId: string, id: string): Promise<void> {
  const entry = await getTimeEntryById(userId, id);
  if (entry.invoiced) {
    throw ApiError.unprocessable('Cannot delete a time entry that has already been invoiced');
  }
  await entry.deleteOne();
}

export async function listTimeEntries(options: ListTimeEntriesOptions): Promise<Page<TimeEntryDocument>> {
  const filter: Record<string, unknown> = { user: options.userId };
  if (options.projectId) filter.project = options.projectId;
  if (options.invoiced !== undefined) filter.invoiced = options.invoiced;
  if (options.from || options.to) {
    filter.date = {
      ...(options.from ? { $gte: options.from } : {}),
      ...(options.to ? { $lte: options.to } : {}),
    };
  }

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    TimeEntry.find(filter).sort({ date: -1 }).skip(skip).limit(options.limit),
    TimeEntry.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}
