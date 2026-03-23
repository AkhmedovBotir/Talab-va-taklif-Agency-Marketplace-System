import { useCallback, useEffect, useState } from 'react';
import {
  IoCartOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoWalletOutline,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import type { StatisticsData } from '../types/api';
import { StatistikaPayments } from './StatistikaPayments';
import { StatistikaFinance } from './StatistikaFinance';
import styles from './Statistika.module.css';

type TabType = 'statistics' | 'payments' | 'finance';

export function Statistika() {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getStatistics();
      setStatistics((res as { data: StatisticsData }).data);
    } catch {
      setError('Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'statistics') fetchData();
  }, [activeTab, fetchData]);

  const summary = statistics?.summary;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Statistika</h1>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, activeTab === 'statistics' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('statistics')}
        >
          Statistika
        </button>
        <button
          type="button"
          className={[styles.tab, activeTab === 'payments' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('payments')}
        >
          To'lovlarim
        </button>
        <button
          type="button"
          className={[styles.tab, activeTab === 'finance' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('finance')}
        >
          Moliya
        </button>
      </div>

      {activeTab === 'payments' ? (
        <StatistikaPayments />
      ) : activeTab === 'finance' ? (
        <StatistikaFinance />
      ) : (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Yuklanmoqda...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button type="button" className={styles.retryBtn} onClick={fetchData}>
                Qayta urinish
              </button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                <div className={[styles.card, styles.cardBlue].join(' ')}>
                  <IoCartOutline size={28} color="#007AFF" />
                  <p className={styles.cardValue}>
                    {formatNumberDisplay(summary?.totalOrders ?? 0)}
                  </p>
                  <p className={styles.cardLabel}>Jami buyurtmalar</p>
                </div>
                <div className={[styles.card, styles.cardGreen].join(' ')}>
                  <IoCheckmarkCircleOutline size={28} color="#34C759" />
                  <p className={styles.cardValue}>
                    {formatNumberDisplay(summary?.acceptedOrders ?? 0)}
                  </p>
                  <p className={styles.cardLabel}>Qabul qilingan</p>
                </div>
                <div className={[styles.card, styles.cardOrange].join(' ')}>
                  <IoTimeOutline size={28} color="#FF9500" />
                  <p className={styles.cardValue}>
                    {formatNumberDisplay(summary?.pendingOrders ?? 0)}
                  </p>
                  <p className={styles.cardLabel}>Kutilayotgan</p>
                </div>
                <div className={[styles.card, styles.cardRed].join(' ')}>
                  <IoCloseCircleOutline size={28} color="#FF3B30" />
                  <p className={styles.cardValue}>
                    {formatNumberDisplay(summary?.rejectedOrders ?? 0)}
                  </p>
                  <p className={styles.cardLabel}>Rad etilgan</p>
                </div>
              </div>

              <div className={styles.revenueCard}>
                <div className={styles.revenueHeader}>
                  <IoWalletOutline size={24} color="#007AFF" />
                  <span>Jami daromad</span>
                </div>
                <p className={styles.revenueValue}>
                  {formatNumberDisplay(summary?.totalRevenue ?? 0)} so'm
                </p>
                <div className={styles.revenueStats}>
                  <div>
                    <p className={styles.revenueStatValue}>
                      {formatNumberDisplay(summary?.totalItems ?? 0)}
                    </p>
                    <p className={styles.revenueStatLabel}>Jami mahsulotlar</p>
                  </div>
                  <div className={styles.revenueDivider} />
                  <div>
                    <p className={styles.revenueStatValue}>
                      {formatNumberDisplay(summary?.deliveredOrders ?? 0)}
                    </p>
                    <p className={styles.revenueStatLabel}>Yetkazilgan</p>
                  </div>
                  <div className={styles.revenueDivider} />
                  <div>
                    <p className={styles.revenueStatValue}>
                      {summary?.acceptanceRate ?? '0'}%
                    </p>
                    <p className={styles.revenueStatLabel}>Qabul foizi</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
