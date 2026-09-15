import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as clientsApi from '../api/clients';

export function useClients(params: { search?: string; page: number; limit?: number }) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.listClients(params),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getClient(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
