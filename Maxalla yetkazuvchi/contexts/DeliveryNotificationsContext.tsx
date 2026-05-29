import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiService, getDeliveryNotificationsWebSocketUrl } from '../services/api';
import { useDeliveryProviderAuth } from './DeliveryProviderAuthContext';

interface DeliveryNotificationsContextType {
  unreadCount: number;
  listVersion: number;
  refreshUnreadCount: () => Promise<void>;
  bumpListRefresh: () => void;
  setUnreadCount: (n: number) => void;
}

const DeliveryNotificationsContext = createContext<DeliveryNotificationsContextType | undefined>(
  undefined
);

export function DeliveryNotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useDeliveryProviderAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [listVersion, setListVersion] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpListRefresh = useCallback(() => {
    setListVersion((v) => v + 1);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiService.getNotificationsUnreadCount(token);
      setUnreadCount(res.data.unread_count);
    } catch {
      // 401 handled globally
    }
  }, [token]);

  const connectSocket = useCallback(() => {
    if (!token) return;
    if (typeof WebSocket === 'undefined') return;

    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }

    const url = getDeliveryNotificationsWebSocketUrl(token);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string);
        if (data?.event === 'integration_notification_created' && data?.notification) {
          void refreshUnreadCount();
          bumpListRefresh();
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // onclose will reconnect
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!token) return;
      reconnectTimerRef.current = setTimeout(() => {
        connectSocket();
      }, 4000);
    };

    wsRef.current = ws;
  }, [token, bumpListRefresh, refreshUnreadCount]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!token) {
      wsRef.current?.close();
      wsRef.current = null;
      setUnreadCount(0);
      return;
    }
    connectSocket();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token, connectSocket]);

  useEffect(() => {
    const sub = (state: AppStateStatus) => {
      if (state === 'active' && token) {
        refreshUnreadCount();
      }
    };
    const subId = AppState.addEventListener('change', sub);
    return () => subId.remove();
  }, [token, refreshUnreadCount]);

  const value: DeliveryNotificationsContextType = {
    unreadCount,
    listVersion,
    refreshUnreadCount,
    bumpListRefresh,
    setUnreadCount,
  };

  return (
    <DeliveryNotificationsContext.Provider value={value}>
      {children}
    </DeliveryNotificationsContext.Provider>
  );
}

export function useDeliveryNotifications() {
  const ctx = useContext(DeliveryNotificationsContext);
  if (!ctx) {
    throw new Error('useDeliveryNotifications must be used within DeliveryNotificationsProvider');
  }
  return ctx;
}
