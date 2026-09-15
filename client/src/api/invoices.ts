import { apiClient } from './client';
import type { Invoice, InvoiceStatus, Page } from '../types';

export function listInvoices(params: { clientId?: string; status?: InvoiceStatus; page?: number; limit?: number }) {
  return apiClient.get<Page<Invoice>>('/invoices', { params }).then((res) => res.data);
}

export function getInvoice(id: string) {
  return apiClient.get<Invoice>(`/invoices/${id}`).then((res) => res.data);
}

export function generateInvoice(input: {
  clientId: string;
  periodStart: string;
  periodEnd: string;
  dueInDays?: number;
}) {
  return apiClient.post<Invoice>('/invoices', input).then((res) => res.data);
}

export function updateInvoiceStatus(id: string, status: 'SENT' | 'PAID') {
  return apiClient.patch<Invoice>(`/invoices/${id}/status`, { status }).then((res) => res.data);
}
