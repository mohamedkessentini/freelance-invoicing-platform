import { Client, ClientDocument } from '../models/Client';
import { ApiError } from '../utils/ApiError';
import { CreateClientInput } from '../validators/client.validators';

export interface ListClientsOptions {
  userId: string;
  search?: string;
  page: number;
  limit: number;
}

export interface Page<T> {
  content: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
}

export async function createClient(userId: string, input: CreateClientInput): Promise<ClientDocument> {
  return Client.create({ user: userId, ...input });
}

export async function getClientById(userId: string, id: string): Promise<ClientDocument> {
  const client = await Client.findOne({ _id: id, user: userId });
  if (!client) {
    throw ApiError.notFound('Client', id);
  }
  return client;
}

export async function listClients(options: ListClientsOptions): Promise<Page<ClientDocument>> {
  const filter: Record<string, unknown> = { user: options.userId };
  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { company: { $regex: options.search, $options: 'i' } },
    ];
  }

  const skip = (options.page - 1) * options.limit;
  const [content, totalElements] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    Client.countDocuments(filter),
  ]);

  return {
    content,
    page: options.page,
    limit: options.limit,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / options.limit)),
  };
}
