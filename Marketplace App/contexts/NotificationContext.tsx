import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

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
      const response = await api.getUnreadNotificationCount(token);
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error: any) {
      // Don't log 401 errors - they're handled by API service
      if (error?.status !== 401) {
      console.error('Error fetching unread count:', error);
      }
      // Set unread count to 0 on any error
      setUnreadCount(0);
    }
  }, [token]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Refresh every 1 second
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(refreshUnreadCount, 1000);
    return () => clearInterval(interval);
  }, [token, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount, resetUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}






