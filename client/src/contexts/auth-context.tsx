'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken } from '@/lib/api-client';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get<User>('/users/profile');
      setUser(userData);
    } catch {
      setUser(null);
      clearAccessToken();
    }
  }, []);

  // Try to restore session on mount by calling refresh endpoint
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Try to get a new access token using refresh token cookie
        const response = await api.post<{ accessToken: string }>('/auth/refresh');
        setAccessToken(response.accessToken);
        await refreshUser();
      } catch {
        // No valid refresh token, user needs to login
        clearAccessToken();
        setUser(null);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
