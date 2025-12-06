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
    } catch (error) {
      console.error('Error fetching unread count:', error);
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

  // Refresh every 30 seconds
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(refreshUnreadCount, 30000);
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






