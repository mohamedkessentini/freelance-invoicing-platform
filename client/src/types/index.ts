export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Client {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  createdAt: string;
}

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  _id: string;
  client: string;
  name: string;
  hourlyRate: number;
  currency: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface TimeEntry {
  _id: string;
  project: string;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  invoiced: boolean;
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface InvoiceLineItem {
  project: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  client: string;
  invoiceNumber: number;
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  paidAt?: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardSummary {
  outstandingTotal: number;
  paidTotal: number;
  hoursLoggedThisMonth: number;
  revenueByMonth: { month: string; total: number }[];
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}
