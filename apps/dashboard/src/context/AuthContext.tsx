'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { User, AuthState } from '../types';

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchUser = async () => {
    try {
      const { data } = await api.get<User>('/v1/auth/me');
      setState({ user: data, loading: false, isAuthenticated: true });
    } catch {
      setState({ user: null, loading: false, isAuthenticated: false });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    window.location.href = '/api/v1/auth/discord';
  };

  const logout = async () => {
    // Clear cookies server-side later
    setState({ user: null, loading: false, isAuthenticated: false });
    window.location.href = '/';
  };

  const refresh = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
