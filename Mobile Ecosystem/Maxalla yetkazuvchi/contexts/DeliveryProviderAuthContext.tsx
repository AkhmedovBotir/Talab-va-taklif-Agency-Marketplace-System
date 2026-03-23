import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { apiService, DeliveryProvider, LoginResponse } from '../services/api';

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

const TOKEN_KEY = '@delivery_provider:token';
const PROFILE_KEY = '@delivery_provider:profile';

// Storage interface - works for both web and native
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // Silent fail
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Silent fail
    }
  },
};

interface DeliveryProviderAuthProviderProps {
  children: ReactNode;
}

export function DeliveryProviderAuthProvider({ children }: DeliveryProviderAuthProviderProps) {
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedProfile] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(PROFILE_KEY),
      ]);

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setDeliveryProvider(JSON.parse(storedProfile));
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await apiService.login(phone, password);

      if (response.success && response.data) {
        const { token: newToken, deliveryProvider: provider } = response.data;

        setToken(newToken);
        setDeliveryProvider(provider);

        await Promise.all([
          storage.setItem(TOKEN_KEY, newToken),
          storage.setItem(PROFILE_KEY, JSON.stringify(provider)),
        ]);
      } else {
        throw new Error(response.message || 'Login xatosi');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local state and storage
      setToken(null);
      setDeliveryProvider(null);

      await Promise.all([
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(PROFILE_KEY),
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;

    try {
      const response = await apiService.getMyProfile(token);
      if (response.success && response.data) {
        setDeliveryProvider(response.data);
        await storage.setItem(PROFILE_KEY, JSON.stringify(response.data));
      }
    } catch (error) {
      // Silent fail
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
    throw new Error('useDeliveryProviderAuth must be used within a DeliveryProviderAuthProvider');
  }
  return context;
}
