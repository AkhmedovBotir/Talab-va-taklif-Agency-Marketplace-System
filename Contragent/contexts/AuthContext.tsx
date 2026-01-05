import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, Contragent } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  contragent: Contragent | null;
  login: (
    phone: string,
    password: string,
    deviceInfo?: {
      deviceId: string;
      deviceName?: string;
      deviceType?: string;
      platform?: string;
      os?: string;
      browser?: string;
      userAgent?: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshContragent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@auth_token';
const CONTRAGENT_KEY = '@contragent_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [contragent, setContragent] = useState<Contragent | null>(null);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedContragent = await AsyncStorage.getItem(CONTRAGENT_KEY);

      if (storedToken && storedContragent) {
        setToken(storedToken);
        setContragent(JSON.parse(storedContragent));
        setIsAuthenticated(true);
        
        // Try to refresh contragent data from server
        try {
          const response = await apiService.getMe();
          const updatedContragent = response.data;
          setContragent(updatedContragent);
          await AsyncStorage.setItem(CONTRAGENT_KEY, JSON.stringify(updatedContragent));
        } catch (error: any) {
          // If token is invalid/expired, logout and redirect to login
          if (error.status === 401 || error.status === 403) {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(CONTRAGENT_KEY);
            setToken(null);
            setContragent(null);
            setIsAuthenticated(false);
            return;
          }
          // If other error, use stored data
          console.log('Could not refresh contragent data, using stored data');
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
      await AsyncStorage.setItem(CONTRAGENT_KEY, JSON.stringify(updatedContragent));
    } catch (error: any) {
      console.error('Error refreshing contragent:', error);
      // If token is invalid, logout
      if (error.status === 401 || error.status === 403) {
        await logout();
      }
      throw error;
    }
  };

  const login = async (
    phone: string,
    password: string,
    deviceInfo?: {
      deviceId: string;
      deviceName?: string;
      deviceType?: string;
      platform?: string;
      os?: string;
      browser?: string;
      userAgent?: string;
    }
  ) => {
    try {
      const deviceId = deviceInfo?.deviceId;
      const response = await apiService.login({ phone, password }, deviceId);
      
      // Check if device verification is required
      if (response.requiresDeviceVerification) {
        const enhancedError: any = {
          status: 403,
          message: response.message || 'Yangi qurilma aniqlandi. Qurilmani tasdiqlash kerak',
          requiresDeviceVerification: true,
          phone: response.data.phone,
          deviceId: response.data.deviceId,
          response: { data: response },
        };
        throw enhancedError;
      }
      
      if (!response.data.token || !response.data.contragent) {
        throw {
          status: 500,
          message: 'Login response is invalid',
        };
      }
      
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(CONTRAGENT_KEY, JSON.stringify(response.data.contragent));
      
      setToken(response.data.token);
      setContragent(response.data.contragent);
      setIsAuthenticated(true);
    } catch (error: any) {
      // Preserve full error object for device verification check
      const responseData = error.response?.data || error.response || {};
      const statusCode = error.response?.status || error.status || 0;
      const errorMessage = responseData.message || error.message || 'Login failed';
      
      // Check if device verification is required
      const requiresVerification = 
        responseData.requiresDeviceVerification === true || 
        responseData.requiresDeviceVerification === 'true' ||
        error.requiresDeviceVerification === true ||
        (statusCode === 403 && (
          errorMessage.toLowerCase().includes('qurilma') ||
          errorMessage.toLowerCase().includes('device') ||
          errorMessage.toLowerCase().includes('tasdiqlash') ||
          errorMessage.toLowerCase().includes('verification')
        ));
      
      // Enhanced error object with all necessary information
      const enhancedError: any = {
        ...error,
        response: error.response || { data: responseData, status: statusCode },
        status: statusCode,
        message: errorMessage,
        data: responseData,
        requiresDeviceVerification: requiresVerification,
        phone: responseData.data?.phone || responseData.phone || error.phone,
        deviceId: responseData.data?.deviceId || responseData.deviceId || error.deviceId,
      };
      
      throw enhancedError;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(CONTRAGENT_KEY);
      setToken(null);
      setContragent(null);
      setIsAuthenticated(false);
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

