import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { apiService, DeviceInfo, LoginResponse } from '../services/api';
import { getDeviceId } from '../utils/deviceId';

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

const TOKEN_KEY = '@maxalla:token';
const USER_KEY = '@maxalla:user';

// Storage interface - works for both web and native
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    // For native, use AsyncStorage
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    // For native, use AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    // For native, use AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse['contragent'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string, deviceInfo: DeviceInfo) => {
    try {
      const response = await apiService.login({ phone, password }, deviceInfo);

      if (response.success && response.data) {
        const { token: newToken, contragent } = response.data;

        setToken(newToken);
        setUser(contragent);

        await Promise.all([
          storage.setItem(TOKEN_KEY, newToken),
          storage.setItem(USER_KEY, JSON.stringify(contragent)),
        ]);
      } else {
        throw new Error(response.message || 'Login xatosi');
      }
    } catch (error: any) {
      // Re-throw to let the caller handle it
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if token exists
      if (token) {
        try {
          const deviceId = getDeviceId();
          await apiService.logout(token, deviceId);
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Error calling logout API:', error);
        }
      }

      // Clear local state and storage
      setToken(null);
      setUser(null);

      await Promise.all([
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await apiService.getMyProfile(token);
      if (response.success && response.data) {
        setUser(response.data);
        await storage.setItem(USER_KEY, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
