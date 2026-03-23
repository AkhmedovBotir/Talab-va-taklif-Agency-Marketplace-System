import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoBusinessOutline, IoLocationOutline, IoLogOutOutline, IoNotificationsOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/Modal';
import styles from './Profile.module.css';

export function Profile() {
  const { punkt, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [kpiSummary, setKpiSummary] = React.useState<{ totalAmount: number; paidAmount: number; unpaidAmount: number; totalTransactions: number } | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [countRes, summaryRes] = await Promise.all([
          apiService.getUnreadNotificationsCount(),
          apiService.getKpiSummary(),
        ]);
        if (countRes?.success && countRes?.data?.unreadCount != null) setUnreadCount(countRes.data.unreadCount);
        if (summaryRes?.success && summaryRes?.data?.summary) setKpiSummary(summaryRes.data.summary);
      } catch {}
    };
    load();
  }, []);

  const handleLogoutClick = () => setLogoutConfirmOpen(true);

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  if (!punkt) return <LoadingSpinner />;

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <IoBusinessOutline size={48} color="#007AFF" />
        </div>
        <h1 className={styles.name}>{punkt.name}</h1>
        <p className={styles.phone}>{punkt.phone}</p>
      </div>

      {kpiSummary && (
        <div className={styles.kpiSection}>
          <h2 className={styles.sectionTitle}>KPI Bonus</h2>
          <div className={styles.kpiCard}>
            <div className={styles.kpiRow}>
              <span className={styles.kpiLabel}>Jami bonus</span>
              <span className={styles.kpiValue}>{formatPrice(kpiSummary.totalAmount)}</span>
            </div>
            <div className={styles.kpiRow}>
              <span className={styles.kpiLabel}>To'langan</span>
              <span className={styles.kpiPaid}>{formatPrice(kpiSummary.paidAmount)}</span>
            </div>
            <div className={styles.kpiRow}>
              <span className={styles.kpiLabel}>To'lanmagan</span>
              <span className={styles.kpiUnpaid}>{formatPrice(kpiSummary.unpaidAmount)}</span>
            </div>
            <p className={styles.kpiFooter}>Jami transaksiyalar: {kpiSummary.totalTransactions}</p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <button type="button" className={styles.menuItem} onClick={() => navigate('/notifications')}>
          <IoNotificationsOutline size={22} color="#007AFF" />
          <span className={styles.menuTitle}>Xabarlar</span>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
          <span className={styles.chevron}>›</span>
        </button>
        <div className={styles.menuItem}>
          <IoLocationOutline size={22} color="#666" />
          <div className={styles.menuContent}>
            <span className={styles.menuLabel}>Viloyat</span>
            <span className={styles.menuValue}>{punkt.viloyat?.name || '-'}</span>
          </div>
        </div>
        <div className={styles.menuItem}>
          <IoLocationOutline size={22} color="#666" />
          <div className={styles.menuContent}>
            <span className={styles.menuLabel}>Tuman</span>
            <span className={styles.menuValue}>{punkt.tuman?.name || '-'}</span>
          </div>
        </div>
        <div className={styles.menuItem}>
          <span className={styles.menuLabel}>Holat</span>
          <span className={punkt.status === 'active' ? styles.statusActive : ''}>{punkt.status === 'active' ? 'Faol' : 'Nofaol'}</span>
        </div>
      </div>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Chiqish"
        message="Hisobingizdan chiqmoqchimisiz?"
        confirmLabel="Ha, chiqish"
        cancelLabel="Bekor qilish"
        variant="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
      <button type="button" className={styles.logoutBtn} onClick={handleLogoutClick}>
        <IoLogOutOutline size={22} color="#FF3B30" />
        <span className={styles.logoutText}>Chiqish</span>
      </button>
    </div>
  );
}
