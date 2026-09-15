import { apiClient } from './client';
import type { Page, Project } from '../types';

export function listProjects(params: { clientId?: string; page?: number; limit?: number }) {
  return apiClient.get<Page<Project>>('/projects', { params }).then((res) => res.data);
}

export function createProject(input: { clientId: string; name: string; hourlyRate: number; currency: string }) {
  return apiClient.post<Project>('/projects', input).then((res) => res.data);
}
