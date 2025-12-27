import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '@/services/notificationApi';

interface NotificationContextType {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
  decrementUnread: (amount?: number) => void;
  resetUnread: () => void;
  setUnreadCount: (value: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      // Token xatosi yoki avtorizatsiya xatosi bo'lsa, faqat 0 qo'yish, console.error qilmaslik
      if (error.message?.includes('Token') || error.message?.includes('Avtorizatsiya')) {
        setUnreadCount(0);
        return;
      }
      // Boshqa xatolar uchun console.error
      console.error('Unread count load error:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUnreadCount();

    // Har 1 sekunda unread count yangilash
    if (isAuthenticated) {
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [loadUnreadCount, isAuthenticated]);

  const decrementUnread = useCallback((amount = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        loading,
        refreshUnreadCount: loadUnreadCount,
        decrementUnread,
        resetUnread,
        setUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}


