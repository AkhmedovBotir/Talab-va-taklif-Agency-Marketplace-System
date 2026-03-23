import React, { useCallback, useEffect, useState } from 'react';
import {
  IoInformationCircle,
  IoWarning,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoMegaphone,
  IoGift,
  IoRefreshCircle,
  IoNotificationsOffOutline,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import styles from './Notifications.module.css';

type NotifType = 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'promotion' | 'update';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotifType;
  createdAt: string;
  isRead: boolean;
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: IoInformationCircle, color: '#007AFF', bg: '#E3F2FD' },
  warning: { icon: IoWarning, color: '#FF9500', bg: '#FFF3E0' },
  success: { icon: IoCheckmarkCircle, color: '#34C759', bg: '#E8F5E9' },
  error: { icon: IoCloseCircle, color: '#FF3B30', bg: '#FFEBEE' },
  announcement: { icon: IoMegaphone, color: '#5856D6', bg: '#EDE7F6' },
  promotion: { icon: IoGift, color: '#FF2D55', bg: '#FCE4EC' },
  update: { icon: IoRefreshCircle, color: '#00BCD4', bg: '#E0F7FA' },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  return d.toLocaleDateString('uz-UZ');
}

export function Notifications() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getNotifications({ page: 1, limit: 50 });
      if (res?.success && Array.isArray(res?.data)) {
        setList(res.data);
        setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpen = async (n: Notification) => {
    setSelected(n);
    if (!n.isRead) {
      try {
        await apiService.markNotificationRead(n._id);
        setList((prev) => prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Habarlar</h1>
        </header>
        <div className={styles.loading}>Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Habarlar</h1>
      </header>
      {unreadCount > 0 && (
        <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
          Barchasini o'qilgan deb belgilash
        </button>
      )}
      <div className={styles.list}>
        {list.length === 0 ? (
          <div className={styles.empty}>
            <IoNotificationsOffOutline size={64} color="#ccc" />
            <p>Habarlar yo'q</p>
          </div>
        ) : (
          list.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const Icon = config.icon;
            return (
              <button
                key={item._id}
                type="button"
                className={`${styles.card} ${!item.isRead ? styles.unread : ''}`}
                onClick={() => handleOpen(item)}
              >
                <div className={styles.iconWrap} style={{ background: config.bg }}>
                  <Icon size={24} color={config.color} />
                </div>
                <div className={styles.body}>
                  <div className={styles.row}>
                    <span className={styles.title}>{item.title}</span>
                    {!item.isRead && <span className={styles.dot} />}
                  </div>
                  <p className={styles.message}>{item.message}</p>
                  <div className={styles.footer}>
                    <span className={styles.time}>{formatTime(item.createdAt)}</span>
                    <span className={styles.openText} style={{ color: config.color }}>Ochish</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)} role="presentation">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{selected.title}</h2>
            <p className={styles.modalMessage}>{selected.message}</p>
            <p className={styles.modalTime}>{formatTime(selected.createdAt)}</p>
            <button type="button" className={styles.modalClose} onClick={() => setSelected(null)}>
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
