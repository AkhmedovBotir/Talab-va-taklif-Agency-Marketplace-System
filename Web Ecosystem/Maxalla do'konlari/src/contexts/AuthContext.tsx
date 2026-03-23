import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, DeviceInfo, LoginResponse } from '../services/api';
import { getDeviceId } from '../utils/deviceId';
import { clearAuthStorage, emitForceLogout, FORCE_LOGOUT_EVENT, TOKEN_KEY, USER_KEY } from './authStorage';

interface AuthContextType {
  user: LoginResponse['contragent'] | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string, deviceInfo: DeviceInfo) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['contragent'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = () => {
      setToken(null);
      setUser(null);
      clearAuthStorage();
    };
    window.addEventListener(FORCE_LOGOUT_EVENT, handler as EventListener);
    return () => window.removeEventListener(FORCE_LOGOUT_EVENT, handler as EventListener);
  }, []);

  const login = async (phone: string, password: string, deviceInfo: DeviceInfo) => {
    const response = await apiService.login({ phone, password }, deviceInfo);
    if (response.success && response.data) {
      const { token: newToken, contragent } = response.data;
      setToken(newToken);
      setUser(contragent);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(contragent));
    } else {
      throw new Error(response.message || 'Login xatosi');
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await apiService.logout(token, getDeviceId());
      } catch {}
    }
    emitForceLogout('manual-logout');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await apiService.getMyProfile(token);
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
