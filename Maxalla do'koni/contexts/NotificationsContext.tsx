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
import {
  apiService,
  getLocalShopNotificationsWebSocketUrl,
} from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isSocketConnected: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const INTEGRATION_EVENT = 'integration_notification_created';

function parseSocketPayload(raw: string): { event?: string } | null {
  try {
    const msg = JSON.parse(raw);
    if (msg && typeof msg === 'object') {
      const inner = (msg as any).data;
      const event =
        typeof msg.event === 'string'
          ? msg.event
          : typeof msg.type === 'string'
            ? msg.type
            : typeof msg.name === 'string'
              ? msg.name
              : typeof inner?.event === 'string'
                ? inner.event
                : typeof inner?.type === 'string'
                  ? inner.type
                  : undefined;
      return { event };
    }
  } catch {
    // ignore
  }
  return null;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await apiService.getNotificationsUnreadCount(token);
      const n = res.data?.unread_count;
      setUnreadCount(typeof n === 'number' ? n : 0);
    } catch {
      // keep previous count on transient errors
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setIsSocketConnected(false);
      return;
    }
    refreshUnreadCount();
  }, [isAuthenticated, token, refreshUnreadCount]);

  useEffect(() => {
    if (!token) {
      return;
    }

    stoppedRef.current = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const clearReconnect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    const connect = () => {
      if (stoppedRef.current || !token) return;

      clearReconnect();
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }

      let ws: WebSocket;
      try {
        ws = new WebSocket(getLocalShopNotificationsWebSocketUrl(token));
      } catch {
        reconnectRef.current = setTimeout(connect, 4000);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        setIsSocketConnected(true);
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      };

      ws.onclose = () => {
        setIsSocketConnected(false);
        wsRef.current = null;
        if (!stoppedRef.current) {
          reconnectRef.current = setTimeout(connect, 3500);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // ignore
        }
      };

      ws.onmessage = (ev) => {
        const data = typeof ev.data === 'string' ? ev.data : '';
        const parsed = parseSocketPayload(data);
        if (parsed?.event === INTEGRATION_EVENT) {
          refreshUnreadCount();
          return;
        }
        if (data.includes(INTEGRATION_EVENT)) {
          refreshUnreadCount();
        }
      };
    };

    connect();

    pollId = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        refreshUnreadCount();
      }
    }, 120_000);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        refreshUnreadCount();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      stoppedRef.current = true;
      clearReconnect();
      if (pollId) clearInterval(pollId);
      sub.remove();
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
      setIsSocketConnected(false);
    };
  }, [token, refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{ unreadCount, refreshUnreadCount, isSocketConnected }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
