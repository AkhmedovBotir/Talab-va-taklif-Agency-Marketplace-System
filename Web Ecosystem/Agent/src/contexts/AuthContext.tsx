import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, getDeviceInfo } from '../services/api';
import type { Agent, LoginRequest, LoginResponse } from '../types/api';

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest, deviceInfo?: ReturnType<typeof getDeviceInfo>) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const t = apiService.getToken();
      if (t) {
        setToken(t);
        const res = await apiService.getAgentProfile();
        if (res.success && res.data) {
          setAgent(res.data);
        } else {
          apiService.logout();
          setToken(null);
          setAgent(null);
        }
      } else {
        setToken(null);
        setAgent(null);
      }
    } catch {
      apiService.logout();
      setToken(null);
      setAgent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest, deviceInfo?: ReturnType<typeof getDeviceInfo>) => {
    const res: LoginResponse = await apiService.login(credentials, deviceInfo);
    if (res.success && res.data) {
      setAgent(res.data.agent);
      setToken(res.data.token);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const logout = async () => {
    apiService.logout();
    setAgent(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        agent,
        token,
        isLoading,
        isAuthenticated: !!token && !!agent,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
