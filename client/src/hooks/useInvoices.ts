import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as invoicesApi from '../api/invoices';
import type { InvoiceStatus } from '../types';

export function useInvoices(params: { clientId?: string; status?: InvoiceStatus; page: number; limit?: number }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.listInvoices(params),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getInvoice(id as string),
    enabled: Boolean(id),
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoicesApi.generateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SENT' | 'PAID' }) =>
      invoicesApi.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
