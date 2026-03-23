import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiService.getUnreadNotificationCount(token);
      if (res.success && res.data) setUnreadCount(res.data.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(refreshUnreadCount, 1000);
    return () => clearInterval(id);
  }, [token, refreshUnreadCount]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((n) => Math.max(0, n - 1));
  }, []);

  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refreshUnreadCount, decrementUnreadCount, resetUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
