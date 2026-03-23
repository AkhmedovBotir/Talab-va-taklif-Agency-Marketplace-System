import { useCallback, useEffect, useState } from 'react';
import { IoWalletOutline, IoArrowDownOutline, IoArrowUpOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import styles from './StatistikaFinance.module.css';

interface Transaction {
  _id: string;
  amount: number;
  type?: string;
  category?: string;
  createdAt?: string;
}

export function StatistikaFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getFinanceTransactions({ limit: 50 });
      const raw = (res as { data?: Transaction[] | { transactions?: Transaction[] } }).data;
      const data = Array.isArray(raw) ? raw : raw?.transactions ?? [];
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getCategoryLabel = (cat?: string) => {
    const m: Record<string, string> = {
      contragent_received_zaklad: 'Zaklad',
      contragent_received_final_payment: 'Qolgan asl narx',
      contragent_received_profit: 'Sof foyda',
      contragent_received_full_payment: "To'liq to'lov",
    };
    return m[cat || ''] || cat || 'Boshqa';
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : transactions.length === 0 ? (
          <p className={styles.empty}>Tranzaksiyalar mavjud emas</p>
        ) : (
          transactions.map((t) => {
            const isIncome = (t.type || '').toLowerCase().includes('income') || t.amount > 0;
            return (
              <div key={t._id} className={styles.card}>
                <div
                  className={styles.iconWrap}
                  style={{
                    backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE',
                    color: isIncome ? '#34C759' : '#FF3B30',
                  }}
                >
                  {isIncome ? (
                    <IoArrowDownOutline size={22} />
                  ) : (
                    <IoArrowUpOutline size={22} />
                  )}
                </div>
                <div className={styles.content}>
                  <p className={styles.label}>{getCategoryLabel(t.category)}</p>
                  <p className={styles.date}>{t.createdAt && formatDate(t.createdAt)}</p>
                </div>
                <p
                  className={styles.amount}
                  style={{ color: isIncome ? '#34C759' : '#FF3B30' }}
                >
                  {isIncome ? '+' : '-'}
                  {formatNumberDisplay(Math.abs(t.amount))} so'm
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
