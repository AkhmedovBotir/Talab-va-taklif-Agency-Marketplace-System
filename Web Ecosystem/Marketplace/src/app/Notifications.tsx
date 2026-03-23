import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Icon from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService, { Notification as NotifType } from '../services/api';

export default function Notifications() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { resetUnreadCount } = useNotification();
  const [list, setList] = useState<NotifType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiService
      .getNotifications({ page: 1, limit: 50 }, token)
      .then((res) => {
        if (res.data?.length) setList(res.data);
      })
      .finally(() => setLoading(false));
    resetUnreadCount();
  }, [token, resetUnreadCount]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const configByType = useMemo(
    () => ({
      info: { icon: 'information-circle', color: '#3B82F6', lightBg: '#EFF6FF' },
      warning: { icon: 'warning', color: '#F59E0B', lightBg: '#FFFBEB' },
      success: { icon: 'checkmark-circle', color: '#10B981', lightBg: '#ECFDF5' },
      error: { icon: 'close-circle', color: '#EF4444', lightBg: '#FEF2F2' },
      announcement: { icon: 'megaphone', color: '#8B5CF6', lightBg: '#F5F3FF' },
      promotion: { icon: 'pricetag', color: '#EC4899', lightBg: '#FDF2F8' },
      update: { icon: 'refresh-circle', color: '#06B6D4', lightBg: '#ECFEFF' },
    }),
    []
  );

  return (
    <>
      <Header showBackButton onBackPress={() => navigate(-1)} title="Bildirishnomalar" />
      <div className="page">
        {loading ? (
          <div className="loading-wrap"><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: 'var(--gray)' }}>Bildirishnomalar yo'q</p>
          </div>
        ) : (
          list.map((n) => {
            const cfg = configByType[n.type as keyof typeof configByType] || configByType.info;
            return (
              <div
                key={n._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'flex-start',
                  backgroundColor: n.isRead ? '#ffffff' : cfg.lightBg,
                  opacity: n.isRead ? 0.9 : 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cfg.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon name={cfg.icon} size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 600 }}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: cfg.color,
                          marginLeft: 6,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--gray)' }}>{n.message}</p>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: '#9CA3AF',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{formatRelativeTime(n.createdAt)}</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, color: cfg.color }}>
                      {n.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
