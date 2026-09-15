import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): User | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  function persist(token: string, nextUser: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const result = await authApi.login({ email, password });
    persist(result.token, result.user);
  }

  async function register(name: string, email: string, password: string) {
    const result = await authApi.register({ name, email, password });
    persist(result.token, result.user);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
