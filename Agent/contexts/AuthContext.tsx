// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Agent, LoginRequest, LoginResponse } from '../types/api';

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginRequest,
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
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = await apiService.getToken();
      if (storedToken) {
        setToken(storedToken);
        // Load agent profile to verify token and get agent data
        try {
          const profileResponse = await apiService.getAgentProfile();
          if (profileResponse.success && profileResponse.data) {
            setAgent(profileResponse.data);
          } else {
            // Token invalid, clear it
            await apiService.logout();
            setToken(null);
            setAgent(null);
          }
        } catch (profileError: any) {
          // If profile fetch fails (401, etc.), token is invalid
          console.error('Profile fetch failed:', profileError);
          await apiService.logout();
          setToken(null);
          setAgent(null);
        }
      } else {
        setToken(null);
        setAgent(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setToken(null);
      setAgent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    credentials: LoginRequest,
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
      const response: LoginResponse = await apiService.login(credentials, deviceInfo);
      if (response.success && response.data) {
        setAgent(response.data.agent);
        setToken(response.data.token);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // Preserve full error object for device verification check
      const responseData = error.response?.data || {};
      const statusCode = error.response?.status || error.status;
      const errorMessage = responseData.message || error.message || 'Login failed';
      
      // Check if device not found error
      const isDeviceNotFound = errorMessage.toLowerCase().includes('qurilma topilmadi') ||
                               errorMessage.toLowerCase().includes('device not found') ||
                               (errorMessage.toLowerCase().includes('qurilma') && errorMessage.toLowerCase().includes('topilmadi')) ||
                               statusCode === 404;
      
      // Enhanced error object with all necessary information
      const enhancedError: any = {
        ...error,
        response: error.response,
        status: statusCode,
        message: errorMessage,
        data: responseData,
        requiresDeviceVerification: responseData.requiresDeviceVerification === true || 
                                   responseData.requiresDeviceVerification === 'true' ||
                                   (statusCode === 403 && (
                                     errorMessage.toLowerCase().includes('qurilma') ||
                                     errorMessage.toLowerCase().includes('device') ||
                                     errorMessage.toLowerCase().includes('tasdiqlash') ||
                                     errorMessage.toLowerCase().includes('verification')
                                   )),
        isDeviceNotFound,
      };
      
      throw enhancedError;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setAgent(null);
      setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    agent,
    token,
    isLoading,
    isAuthenticated: !!token && !!agent,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



