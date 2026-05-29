import { useCallback, useEffect, useState } from 'react';
import { FEATURE_NOTIFICATIONS_ENABLED } from '../config/features';
import { apiService } from '../services/api';
import { subscribePunktNotificationRealtime } from '../services/punktNotificationRealtime';
import { subscribeNotificationInboxSync } from '../services/notificationInboxSync';
import { useAuth } from '../contexts/AuthContext';

const POLL_FALLBACK_MS = 90_000;

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!FEATURE_NOTIFICATIONS_ENABLED || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.getPunktMeNotificationsUnreadCount();
      setUnreadCount(response.data?.unread_count ?? 0);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err?.message !== 'Logging out...') {
        console.error('Error fetching unread count:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!FEATURE_NOTIFICATIONS_ENABLED) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    void fetchUnreadCount();

    const unsubSocket = subscribePunktNotificationRealtime(token, true, {
      onUnread: () => {
        void fetchUnreadCount();
      },
    });

    const unsubManual = subscribeNotificationInboxSync(() => {
      void fetchUnreadCount();
    });

    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, POLL_FALLBACK_MS);

    return () => {
      unsubSocket();
      unsubManual();
      clearInterval(interval);
    };
  }, [fetchUnreadCount, isAuthenticated, token]);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}
