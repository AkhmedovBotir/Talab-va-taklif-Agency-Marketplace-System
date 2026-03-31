import { useCallback, useEffect, useState } from 'react';
import { FEATURE_NOTIFICATIONS_ENABLED } from '../config/features';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!FEATURE_NOTIFICATIONS_ENABLED || !isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.getUnreadNotificationsCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error: any) {
      if (error?.message !== 'Logging out...') {
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

    if (!isAuthenticated) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, isAuthenticated]);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}






