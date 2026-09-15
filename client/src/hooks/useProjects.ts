import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';

export function useProjects(params: { clientId?: string; page: number; limit?: number }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.listProjects(params),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
