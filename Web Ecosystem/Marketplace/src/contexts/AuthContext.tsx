import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '../services/api';
import { storage } from '../services/storage';
import { appEvents } from '../services/events';

const TOKEN_KEY = '@marketplace:token';
const USER_KEY = '@marketplace:user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuthData = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const allKeys = await storage.getAllKeys();
      const marketplaceKeys = allKeys.filter((key) => key.startsWith('@marketplace:'));
      if (marketplaceKeys.length > 0) await storage.multiRemove(marketplaceKeys);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
    }
  }, []);

  useEffect(() => {
    loadAuthData();
    const handle401 = () => {
      setToken(null);
      setUser(null);
      logout();
    };
    const sub = appEvents.addListener('marketplace:401-unauthorized', handle401);
    return () => sub.remove();
  }, [loadAuthData, logout]);

  const login = async (newToken: string, newUser: User) => {
    await storage.setItem(TOKEN_KEY, newToken);
    await storage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
