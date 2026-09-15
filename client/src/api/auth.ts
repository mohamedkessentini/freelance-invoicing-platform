import { apiClient } from './client';
import type { User } from '../types';

export interface AuthResult {
  token: string;
  user: User;
}

export function register(input: { name: string; email: string; password: string }) {
  return apiClient.post<AuthResult>('/auth/register', input).then((res) => res.data);
}

export function login(input: { email: string; password: string }) {
  return apiClient.post<AuthResult>('/auth/login', input).then((res) => res.data);
}
