import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getToken, getManagerProfile, logout as apiLogout } from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      const storedUser = getCurrentUser();

      if (token && storedUser) {
        setUser(storedUser);
        try {
          const response = await getManagerProfile();
          const freshUser = response?.manager || response?.data?.manager || response?.data || null;
          if (freshUser) {
            setUser(freshUser);
          }
        } catch {
          apiLogout();
          setUser(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const refreshProfile = async () => {
    const response = await getManagerProfile();
    const freshUser = response?.manager || response?.data?.manager || response?.data || null;
    if (freshUser) {
      setUser(freshUser);
    }
    return response;
  };

  const value = {
    user,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
