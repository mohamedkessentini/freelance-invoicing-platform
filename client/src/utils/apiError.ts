import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

export function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.fieldErrors?.length) {
      return data.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(', ');
    }
    if (data?.message) {
      return data.message;
    }
  }
  return 'Something went wrong. Please try again.';
}
