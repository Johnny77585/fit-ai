import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { initCsrf } from '../api/client';
import type { ApiUser } from '../api/types';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u = await authApi.fetchUser();
    setUser(u);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initCsrf();
        await refreshUser();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      const token = params.get('token');
      if (token) {
        authApi.saveTokenFromOAuth(token);
      }
      window.history.replaceState({}, '', window.location.pathname);
      refreshUser();
    }
    if (params.get('auth_error')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    const u = await authApi.register(name, email, password, passwordConfirmation);
    setUser(u);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
