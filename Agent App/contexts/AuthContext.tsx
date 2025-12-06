// Authentication Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Agent, AgentRole, LoginRequest, LoginResponse } from '../types/api';

interface AuthContextType {
  agent: Agent | null;
  role: AgentRole | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
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
  const [role, setRole] = useState<AgentRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = await apiService.getToken();
      if (storedToken) {
        setToken(storedToken);
        // Optionally verify token by making a test request
        // For now, we'll just set the token
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response: LoginResponse = await apiService.login(credentials);
      if (response.success && response.data) {
        setAgent(response.data.agent);
        setRole(response.data.role);
        setToken(response.data.token);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setAgent(null);
      setRole(null);
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
    role,
    token,
    isLoading,
    isAuthenticated: !!token && !!agent,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



