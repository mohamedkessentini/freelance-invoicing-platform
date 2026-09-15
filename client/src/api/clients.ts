import { apiClient } from './client';
import type { Client, Page } from '../types';

export function listClients(params: { search?: string; page?: number; limit?: number }) {
  return apiClient.get<Page<Client>>('/clients', { params }).then((res) => res.data);
}

export function getClient(id: string) {
  return apiClient.get<Client>(`/clients/${id}`).then((res) => res.data);
}

export function createClient(input: { name: string; company?: string; email?: string }) {
  return apiClient.post<Client>('/clients', input).then((res) => res.data);
}
