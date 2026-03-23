import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { KpiBalanceResponse } from '../types/api';
import styles from './KpiBalanceCard.module.css';

interface KpiBalanceCardProps {
  onPress?: () => void;
  refreshTrigger?: number;
}

export function KpiBalanceCard({ onPress, refreshTrigger }: KpiBalanceCardProps) {
  const [balance, setBalance] = useState<KpiBalanceResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiService.getKpiBalance();
      if (res.success && res.data) setBalance(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (refreshTrigger != null && refreshTrigger > 0) load();
  }, [refreshTrigger]);

  if (loading || !balance) return <div className={styles.placeholder} />;

  const Content = (
    <>
      <div className={styles.header}>
        <span className={styles.title}>Kunlik KPI balansi</span>
        {onPress && <span className={styles.arrow}>›</span>}
      </div>
      <div className={styles.row}>
        <div className={styles.item}>
          <span className={styles.label}>Jami</span>
          <span className={styles.value}>{balance.totals.totalAmount.toLocaleString()} so'm</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.item}>
          <span className={styles.label}>To'langan</span>
          <span className={styles.valuePaid}>{balance.totals.paidAmount.toLocaleString()} so'm</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.item}>
          <span className={styles.label}>To'lanmagan</span>
          <span className={styles.valueUnpaid}>{balance.totals.unpaidAmount.toLocaleString()} so'm</span>
        </div>
      </div>
    </>
  );

  if (onPress) {
    return (
      <div className={styles.card} onClick={onPress} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onPress()}>
        {Content}
      </div>
    );
  }
  return <div className={styles.card}>{Content}</div>;
}
