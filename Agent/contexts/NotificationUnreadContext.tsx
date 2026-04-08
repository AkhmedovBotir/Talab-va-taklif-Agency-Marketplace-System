import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';

type NotificationUnreadContextValue = {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationUnreadContext = createContext<NotificationUnreadContextValue | null>(null);

export function NotificationUnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const n = await apiService.getAgentNotificationsUnreadCount();
      setUnreadCount(n);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({ unreadCount, setUnreadCount, refreshUnreadCount }),
    [unreadCount, refreshUnreadCount]
  );

  return (
    <NotificationUnreadContext.Provider value={value}>{children}</NotificationUnreadContext.Provider>
  );
}

export function useNotificationUnread(): NotificationUnreadContextValue {
  const ctx = useContext(NotificationUnreadContext);
  if (!ctx) {
    throw new Error('useNotificationUnread must be used within NotificationUnreadProvider');
  }
  return ctx;
}
