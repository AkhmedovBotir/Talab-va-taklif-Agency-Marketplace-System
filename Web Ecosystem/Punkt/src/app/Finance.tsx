import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { BalanceResponse, PaymentTransaction } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import styles from './Finance.module.css';


export function Finance() {
  const [balance, setBalance] = useState<BalanceResponse['data'] | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        apiService.getBalance(),
        apiService.getTransactions({ page: 1, limit: 20 }),
      ]);
      if (balRes.success && balRes.data) setBalance(balRes.data);
      if (txRes.success) {
        setTransactions(txRes.data || []);
        setTotalPages(txRes.totalPages || 1);
        setPage(1);
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

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
  const formatDate = (s: string) => {
    const d = new Date(s);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  };

  if (loading && !balance) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      {balance && (
        <div className={styles.balanceSection}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>JORIY BALANS</span>
            <span className={balance.balance >= 0 ? styles.balancePositive : styles.balanceNegative}>
              {formatPrice(balance.balance)}
            </span>
            {(balance.haq > 0 || balance.qarz > 0) && (
              <div className={styles.balanceSub}>
                {balance.haq > 0 && (
                  <span className={styles.haq}>Haq: {formatPrice(balance.haq)}</span>
                )}
                {balance.qarz > 0 && (
                  <span className={styles.qarz}>Qarz: {formatPrice(balance.qarz)}</span>
                )}
              </div>
            )}
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Kirim</span>
              <span className={styles.statIncome}>{formatPrice(balance.totalIncome)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Chiqim</span>
              <span className={styles.statExpense}>{formatPrice(balance.totalExpense)}</span>
            </div>
          </div>
        </div>
      )}

      <h2 className={styles.sectionTitle}>Tranzaksiyalar</h2>
      <div className={styles.list}>
        {transactions.map((tx) => {
          const isIncome = tx.type === 'income';
          return (
            <div key={tx._id} className={styles.txCard}>
              <p className={styles.txDesc}>{tx.description || 'Tranzaksiya'}</p>
              <p className={styles.txCode}>{tx.category}</p>
              <div className={styles.txRow}>
                <span className={isIncome ? styles.txAmountIncome : styles.txAmountExpense}>
                  {isIncome ? '+' : '-'} {formatPrice(tx.amount)}
                </span>
                <span className={styles.txDate}>{formatDate(tx.createdAt)}</span>
              </div>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Tranzaksiyalar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
