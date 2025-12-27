import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, Punkt } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  punkt: Punkt | null;
  isLoading: boolean;
  login: (phone: string, password: string, deviceId?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@punkt_token';
const PUNKT_KEY = '@punkt_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [punkt, setPunkt] = useState<Punkt | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedPunkt] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(PUNKT_KEY),
      ]);

      if (storedToken && storedPunkt) {
        setToken(storedToken);
        setPunkt(JSON.parse(storedPunkt));
        apiService.setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string, deviceId?: string) => {
    try {
      const response = await apiService.login({ phone, password }, deviceId);
      
      // Check if device verification is required
      if ('requiresDeviceVerification' in response && response.requiresDeviceVerification) {
        const error: any = new Error(response.message || 'Qurilma tasdiqlash kerak');
        error.status = 403;
        error.requiresDeviceVerification = true;
        throw error;
      }

      // Check if response has data with token and punkt
      if (response.data && 'token' in response.data && 'punkt' in response.data) {
        const { token: newToken, punkt: newPunkt } = response.data;

        if (newToken && newPunkt) {
          setToken(newToken);
          setPunkt(newPunkt);
          apiService.setToken(newToken);

          await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, newToken),
            AsyncStorage.setItem(PUNKT_KEY, JSON.stringify(newPunkt)),
          ]);
        } else {
          throw new Error('Invalid login response: missing token or punkt');
        }
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      console.log('🔴 Logging out...');
      // Clear state immediately so navigation can happen
      setToken(null);
      setPunkt(null);
      apiService.setToken(null);

      // Clear storage in background
      Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(PUNKT_KEY),
      ]).catch((error) => {
        console.error('Error clearing storage:', error);
      });
      
      console.log('✅ Logout completed, user will be redirected to login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, clear the state
      setToken(null);
      setPunkt(null);
      apiService.setToken(null);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
    
    // Set device error callback to logout user
    apiService.setOnDeviceError(() => {
      logout();
    });
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        punkt,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
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



