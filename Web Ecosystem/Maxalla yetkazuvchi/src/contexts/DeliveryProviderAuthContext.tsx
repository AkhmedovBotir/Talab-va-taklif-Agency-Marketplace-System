import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, DeliveryProvider } from '../services/api';

const TOKEN_KEY = '@delivery_provider:token';
const PROFILE_KEY = '@delivery_provider:profile';

const storage = {
  getItem: (key: string): string | null => (typeof window !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  },
};

interface DeliveryProviderAuthContextType {
  deliveryProvider: DeliveryProvider | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const DeliveryProviderAuthContext = createContext<DeliveryProviderAuthContextType | undefined>(undefined);

export function DeliveryProviderAuthProvider({ children }: { children: ReactNode }) {
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = storage.getItem(TOKEN_KEY);
    const storedProfile = storage.getItem(PROFILE_KEY);
    if (storedToken && storedProfile) {
      setToken(storedToken);
      try {
        setDeliveryProvider(JSON.parse(storedProfile));
      } catch {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(PROFILE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const response = await apiService.login(phone, password);
    if (response.success && response.data) {
      const { token: newToken, deliveryProvider: provider } = response.data;
      setToken(newToken);
      setDeliveryProvider(provider);
      storage.setItem(TOKEN_KEY, newToken);
      storage.setItem(PROFILE_KEY, JSON.stringify(provider));
    } else {
      throw new Error(response.message || 'Login xatosi');
    }
  };

  const logout = async () => {
    setToken(null);
    setDeliveryProvider(null);
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(PROFILE_KEY);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const response = await apiService.getMyProfile(token);
    if (response.success && response.data) {
      setDeliveryProvider(response.data);
      storage.setItem(PROFILE_KEY, JSON.stringify(response.data));
    }
  };

  const value: DeliveryProviderAuthContextType = {
    deliveryProvider,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!deliveryProvider,
    refreshProfile,
  };

  return (
    <DeliveryProviderAuthContext.Provider value={value}>
      {children}
    </DeliveryProviderAuthContext.Provider>
  );
}

export function useDeliveryProviderAuth() {
  const context = useContext(DeliveryProviderAuthContext);
  if (context === undefined) {
    throw new Error('useDeliveryProviderAuth must be used within DeliveryProviderAuthProvider');
  }
  return context;
}
