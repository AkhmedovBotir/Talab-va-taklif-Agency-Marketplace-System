import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadNotificationsCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}






