import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Notification } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import styles from './Notifications.module.css';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  info: { icon: 'ℹ️', color: '#007AFF' },
  warning: { icon: '⚠️', color: '#FF9500' },
  success: { icon: '✅', color: '#34C759' },
  error: { icon: '❌', color: '#FF3B30' },
  announcement: { icon: '📢', color: '#5856D6' },
};

export function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const res = await apiService.getNotifications({ page: pageNum, limit: 20 });
      if (res.success) {
        if (reset) setList(res.data || []);
        else setList((prev) => [...prev, ...(res.data || [])]);
        setTotalPages(res.totalPages || 1);
        setPage(res.page || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading && list.length === 0) return <LoadingSpinner />;

  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Xabarlar</h1>
        {unreadCount > 0 && (
          <button type="button" className={styles.markAllBtn} onClick={markAllRead}>
            Barchasini o'qish
          </button>
        )}
      </div>
      <div className={styles.list}>
        {list.map((n) => {
          const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
          return (
            <div
              key={n._id}
              className={`${styles.card} ${!n.isRead ? styles.unread : ''}`}
              style={{ borderLeftColor: config.color }}
              onClick={() => !n.isRead && markRead(n._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !n.isRead && markRead(n._id)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{n.title}</span>
                {!n.isRead && <span className={styles.unreadDot} style={{ backgroundColor: config.color }} />}
              </div>
              <p className={styles.cardMessage}>{n.message}</p>
              <span className={styles.cardDate}>{formatDate(n.createdAt)}</span>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Xabarlar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
