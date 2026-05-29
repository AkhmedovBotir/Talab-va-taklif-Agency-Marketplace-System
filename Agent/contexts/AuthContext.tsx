// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { onUnauthorized } from '../services/authSession';
import type { Agent, LoginRequest, LoginResponse } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  /** Token allaqachon saqlangan bo‘lsa, state ni `set-password` javobidan to‘ldirish */
  applySession: (token: string, agent: Agent) => void;
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

  const applySession = (newToken: string, newAgent: Agent) => {
    setToken(newToken);
    setAgent(newAgent);
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response: LoginResponse = await apiService.login(credentials);
      if (response.success && response.data?.token && response.data?.agent) {
        setAgent(response.data.agent);
        setToken(response.data.token);
      } else {
        throw new Error(response.message || 'Kirish muvaffaqiyatsiz');
      }
    } catch (error: any) {
      const responseData = error.response?.data || {};
      const statusCode = error.response?.status || error.status;
      const errorMessage = getApiErrorMessage(error, 'Kirish muvaffaqiyatsiz');
      const enhancedError: any = {
        ...error,
        response: error.response,
        status: statusCode,
        message: errorMessage,
        data: responseData,
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

  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      setAgent(null);
    });
  }, []);

  const value: AuthContextType = {
    agent,
    token,
    isLoading,
    isAuthenticated: !!token && !!agent,
    login,
    applySession,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



