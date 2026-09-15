import { Project, ProjectDocument, ProjectStatus } from '../models/Project';
import { ApiError } from '../utils/ApiError';
import { CreateProjectInput } from '../validators/project.validators';
import { getClientById } from './client.service';
import { Page } from './client.service';

export interface ListProjectsOptions {
  userId: string;
  clientId?: string;
  status?: ProjectStatus;
  page: number;
  limit: number;
}

export async function createProject(userId: string, input: CreateProjectInput): Promise<ProjectDocument> {
  await getClientById(userId, input.clientId); // ensures the client exists and belongs to this user

  return Project.create({
    user: userId,
    client: input.clientId,
    name: input.name,
    hourlyRate: input.hourlyRate,
    currency: input.currency.toUpperCase(),
  });
}

export async function getProjectById(userId: string, id: string): Promise<ProjectDocument> {
  const project = await Project.findOne({ _id: id, user: userId });
  if (!project) {
    throw ApiError.notFound('Project', id);
  }
  return project;
}

export async function listProjects(options: ListProjectsOptions): Promise<Page<ProjectDocument>> {
  const filter: Record<string, unknown> = { user: options.userId };
  if (options.clientId) filter.client = options.clientId;
  if (options.status) filter.status = options.status;

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    Project.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}
