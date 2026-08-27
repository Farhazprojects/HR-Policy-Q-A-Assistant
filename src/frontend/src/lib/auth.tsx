'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from './api';
import type { Role, User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  login: async () => { throw new Error('not ready'); },
  logout: async () => {}, refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api.get<{ user: User }>('/auth/me');
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await api.post<{ user: User }>('/auth/login', { email, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* clearing locally regardless */ }
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const roleLabel = (r: Role): string =>
  r === 'HR_OFFICER' ? 'HR Officer' : r === 'ADMIN' ? 'Administrator' : 'Employee';

/** HR Officers inherit employee access; Admins inherit everything. */
export const canAccessHR = (r: Role): boolean => r === 'HR_OFFICER' || r === 'ADMIN';
export const canAccessAdmin = (r: Role): boolean => r === 'ADMIN';
