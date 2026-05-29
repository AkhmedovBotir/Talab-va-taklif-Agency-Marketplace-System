import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiService, Contragent } from '../services/api';
import { subscribeAuthUnauthorized } from '../services/authSessionEvents';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  contragent: Contragent | null;
  login: (phone: string, password: string) => Promise<void>;
  applySession: (token: string, contragent: Contragent) => Promise<void>;
  logout: () => Promise<void>;
  refreshContragent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@auth_token';
const CONTRAGENT_KEY = '@contragent_data';

function compactContragentForStorage(data: Contragent): Contragent {
  // Mobile AsyncStorage row limit muammosi bo'lmasligi uchun katta maydonlarni kesamiz.
  return {
    ...data,
    logo: undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [contragent, setContragent] = useState<Contragent | null>(null);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, CONTRAGENT_KEY]);
    setToken(null);
    setContragent(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    return subscribeAuthUnauthorized(() => {
      void clearSession();
    });
  }, [clearSession]);

  useEffect(() => {
    loadAuthData();
  }, []);

  const saveContragentToStorage = async (nextContragent: Contragent) => {
    const compact = compactContragentForStorage(nextContragent);
    try {
      await AsyncStorage.setItem(CONTRAGENT_KEY, JSON.stringify(compact));
    } catch {
      // Eski katta yozuv bo'lsa ham token ishlashda davom etsin.
      await AsyncStorage.removeItem(CONTRAGENT_KEY);
    }
  };

  const persistSession = async (nextToken: string, nextContragent: Contragent) => {
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await saveContragentToStorage(nextContragent);
    setToken(nextToken);
    setContragent(nextContragent);
    setIsAuthenticated(true);
  };

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        return;
      }

      setToken(storedToken);
      setIsAuthenticated(true);

      try {
        const storedContragentRaw = await AsyncStorage.getItem(CONTRAGENT_KEY);
        if (storedContragentRaw) {
          try {
            setContragent(JSON.parse(storedContragentRaw) as Contragent);
          } catch {
            // Broken local JSON should not invalidate valid token.
            setContragent(null);
          }
        }
      } catch {
        // "Row too big to fit..." holatida eski yozuvni tozalaymiz, tokenni saqlab qolamiz.
        await AsyncStorage.removeItem(CONTRAGENT_KEY);
        setContragent(null);
      }

      try {
        const response = await apiService.getMe();
        const updatedContragent = response.data;
        setContragent(updatedContragent);
        await saveContragentToStorage(updatedContragent);
      } catch (error: unknown) {
        const err = error as { status?: number };
        if (err.status === 401 || err.status === 403) {
          await clearSession();
          return;
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContragent = async () => {
    try {
      if (!token) {
        throw new Error('No token available');
      }

      const response = await apiService.getMe();
      const updatedContragent = response.data;
      setContragent(updatedContragent);
      await saveContragentToStorage(updatedContragent);
    } catch (error: unknown) {
      const err = error as { status?: number };
      console.error('Error refreshing contragent:', error);
      if (err.status === 401 || err.status === 403) {
        await clearSession();
      }
      throw error;
    }
  };

  const applySession = async (nextToken: string, nextContragent: Contragent) => {
    await persistSession(nextToken, nextContragent);
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await apiService.login({ phone, password });

      if (!response.data.token || !response.data.contragent) {
        throw {
          status: 500,
          message: 'Login response is invalid',
        };
      }

      await persistSession(response.data.token, response.data.contragent);
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        message?: string;
        errors?: Record<string, string[]>;
      };
      throw {
        ...err,
        status: err.status || 0,
        message: err.message || 'Login failed',
        errors: err.errors,
      };
    }
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        contragent,
        login,
        applySession,
        logout,
        refreshContragent,
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
