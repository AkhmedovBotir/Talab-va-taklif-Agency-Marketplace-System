import { useCallback, useEffect, useState } from 'react';
import {
  IoInformationCircle,
  IoWarning,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoMegaphone,
  IoGift,
  IoRefreshCircle,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import type { Notification } from '../types/api';
import styles from './Notifications.module.css';

const TYPE_CONFIG: Record<
  string,
  { icon: typeof IoInformationCircle; color: string; bgColor: string }
> = {
  info: { icon: IoInformationCircle, color: '#007AFF', bgColor: '#E3F2FD' },
  warning: { icon: IoWarning, color: '#FF9500', bgColor: '#FFF3E0' },
  success: { icon: IoCheckmarkCircle, color: '#34C759', bgColor: '#E8F5E9' },
  error: { icon: IoCloseCircle, color: '#FF3B30', bgColor: '#FFEBEE' },
  announcement: { icon: IoMegaphone, color: '#5856D6', bgColor: '#EDE7F6' },
  promotion: { icon: IoGift, color: '#FF2D55', bgColor: '#FCE4EC' },
  update: { icon: IoRefreshCircle, color: '#00C7BE', bgColor: '#E0F7FA' },
};

export function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (pageNum = 1) => {
    try {
      const res = await apiService.getNotifications({ page: pageNum, limit: 20 });
      const data = res.data || [];
      const pages = (res as { pagination?: { pages?: number } }).pagination?.pages ?? 1;
      if (pageNum === 1) setList(data);
      else setList((prev) => [...prev, ...data]);
      setHasMore(pageNum < pages);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await apiService.markNotificationRead(n._id);
        setList((prev) =>
          prev.map((x) =>
            x._id === n._id ? { ...x, isRead: true } : x
          )
        );
      } catch {
        /* ignore */
      }
    }
  };

  const cfg = (type: string) =>
    TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Habarlar</h1>
      </header>
      <div className={styles.list}>
        {loading && list.length === 0 ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <p className={styles.empty}>Habarlar mavjud emas</p>
        ) : (
          list.map((n) => {
            const { icon: Icon, color, bgColor } = cfg(n.type || 'info');
            return (
              <div
                key={n._id}
                className={`${styles.card} ${!n.isRead ? styles.unread : ''}`}
                onClick={() => handlePress(n)}
              >
                <div
                  className={styles.iconWrap}
                  style={{ backgroundColor: bgColor, color }}
                >
                  <Icon size={24} />
                </div>
                <div className={styles.cardContent}>
                  <p className={styles.cardTitle}>{n.title}</p>
                  <p className={styles.cardMessage}>{n.message}</p>
                  <p className={styles.cardDate}>
                    {new Date(n.createdAt).toLocaleDateString('uz-UZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
