import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await apiService.getUnreadNotificationsCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error: any) {
      // Don't log errors if we're logging out
      if (error?.message !== 'Logging out...') {
        console.error('Error fetching unread count:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchUnreadCount();
    
    // Refresh every 1 second
    const interval = setInterval(fetchUnreadCount, 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, isAuthenticated]);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}






