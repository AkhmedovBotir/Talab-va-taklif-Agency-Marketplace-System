import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, getDeviceInfo } from '../services/api';
import type { Contragent, LoginRequest, LoginResponse } from '../types/api';

interface AuthContextType {
  contragent: Contragent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginRequest,
    deviceInfo?: ReturnType<typeof getDeviceInfo>
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshContragent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [contragent, setContragent] = useState<Contragent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const t = apiService.getToken();
      if (t) {
        setToken(t);
        const res = await apiService.getMe();
        if (res.success && res.data) {
          setContragent(res.data);
        } else {
          apiService.logout();
          setToken(null);
          setContragent(null);
        }
      } else {
        setToken(null);
        setContragent(null);
      }
    } catch {
      apiService.logout();
      setToken(null);
      setContragent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshContragent = useCallback(async () => {
    const t = apiService.getToken();
    if (!t) return;
    const res = await apiService.getMe();
    if (res.success && res.data) {
      setContragent(res.data);
    }
  }, []);

  const login = async (
    credentials: LoginRequest,
    deviceInfo?: ReturnType<typeof getDeviceInfo>
  ) => {
    const res: LoginResponse = await apiService.login(
      credentials,
      deviceInfo?.deviceId
    );
    if (res.requiresDeviceVerification) {
      const err = new Error(res.message || 'Qurilma tasdiqlanishi kerak') as Error & {
        response?: { data?: { requiresDeviceVerification?: boolean } };
      };
      err.response = { data: { requiresDeviceVerification: true } };
      throw err;
    }
    if (res.success && res.data?.token && res.data?.contragent) {
      setContragent(res.data.contragent);
      setToken(res.data.token);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const logout = async () => {
    apiService.logout();
    setContragent(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        contragent,
        token,
        isLoading,
        isAuthenticated: !!token && !!contragent,
        login,
        logout,
        refreshContragent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
