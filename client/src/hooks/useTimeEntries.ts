import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as timeEntriesApi from '../api/timeEntries';

export function useTimeEntries(params: { projectId?: string; invoiced?: boolean; page: number; limit?: number }) {
  return useQuery({
    queryKey: ['time-entries', params],
    queryFn: () => timeEntriesApi.listTimeEntries(params),
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeEntriesApi.createTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeEntriesApi.deleteTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}
