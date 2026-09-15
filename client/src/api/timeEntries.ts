import { apiClient } from './client';
import type { Page, TimeEntry } from '../types';

export function listTimeEntries(params: { projectId?: string; invoiced?: boolean; page?: number; limit?: number }) {
  return apiClient.get<Page<TimeEntry>>('/time-entries', { params }).then((res) => res.data);
}

export function createTimeEntry(input: {
  projectId: string;
  date: string;
  hours: number;
  description: string;
  billable?: boolean;
}) {
  return apiClient.post<TimeEntry>('/time-entries', input).then((res) => res.data);
}

export function deleteTimeEntry(id: string) {
  return apiClient.delete(`/time-entries/${id}`);
}
