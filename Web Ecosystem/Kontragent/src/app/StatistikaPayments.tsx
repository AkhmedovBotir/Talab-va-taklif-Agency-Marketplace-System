import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import type { ContragentPayment } from '../types/api';
import styles from './StatistikaPayments.module.css';

type Tab = 'paid' | 'unpaid';

export function StatistikaPayments() {
  const [activeTab, setActiveTab] = useState<Tab>('unpaid');
  const [list, setList] = useState<ContragentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async (tab: Tab, pageNum = 1) => {
    setLoading(true);
    try {
      const res =
        tab === 'paid'
          ? await apiService.getPaidPayments({ page: pageNum, limit: 20 })
          : await apiService.getUnpaidPayments({ page: pageNum, limit: 20 });
      const data = res.data || [];
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(activeTab, 1);
  }, [activeTab, load]);

  const formatDate = (s: string | null) => {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, activeTab === 'unpaid' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('unpaid')}
        >
          To'lanmagan
        </button>
        <button
          type="button"
          className={[styles.tab, activeTab === 'paid' && styles.tabActive].filter(Boolean).join(' ')}
          onClick={() => setActiveTab('paid')}
        >
          To'langan
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : list.length === 0 ? (
          <p className={styles.empty}>To'lovlar mavjud emas</p>
        ) : (
          list.map((p) => (
            <Link
              key={p._id}
              to={`/statistika/payment/${p._id}`}
              className={styles.card}
            >
              <div className={styles.cardIcon}>
                {activeTab === 'paid' ? (
                  <IoCheckmarkCircle size={24} color="#34C759" />
                ) : (
                  <IoTimeOutline size={24} color="#FF9500" />
                )}
              </div>
              <div className={styles.cardContent}>
                <p className={styles.cardAmount}>
                  {formatNumberDisplay(p.amount)} so'm
                </p>
                <p className={styles.cardDate}>
                  Muddat: {formatDate(p.dueDate)}
                  {p.paidAt && ` • To'langan: ${formatDate(p.paidAt)}`}
                </p>
                {p.orders && p.orders.length > 0 && (
                  <p className={styles.cardOrders}>
                    {p.orders.length} ta buyurtma
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
