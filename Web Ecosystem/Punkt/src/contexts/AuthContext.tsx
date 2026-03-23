import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, getDeviceInfo } from '../services/api';
import type { Punkt } from '../types/api';

interface AuthContextType {
  token: string | null;
  punkt: Punkt | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { phone: string; password: string }, deviceInfo?: ReturnType<typeof getDeviceInfo>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [punkt, setPunkt] = useState<Punkt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStored = useCallback(() => {
    const t = apiService.getToken();
    const p = localStorage.getItem('@punkt_data');
    if (t && p) {
      try {
        setToken(t);
        setPunkt(JSON.parse(p));
      } catch {
        apiService.logout();
        setToken(null);
        setPunkt(null);
      }
    } else {
      setToken(null);
      setPunkt(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = async (
    credentials: { phone: string; password: string },
    deviceInfo?: ReturnType<typeof getDeviceInfo>
  ) => {
    const dev = deviceInfo || getDeviceInfo();
    const res = await apiService.login(credentials, dev.deviceId);
    if (res.success && res.data?.token && res.data?.punkt) {
      setToken(res.data.token);
      setPunkt(res.data.punkt);
    } else {
      throw new Error((res as { message?: string }).message || 'Login failed');
    }
  };

  const logout = async () => {
    apiService.logout();
    setToken(null);
    setPunkt(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        punkt,
        isLoading,
        isAuthenticated: !!token && !!punkt,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
