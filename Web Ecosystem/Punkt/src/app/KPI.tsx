import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { KpiTransaction } from '../types/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import styles from './KPI.module.css';

export function KPI() {
  const [list, setList] = useState<KpiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const load = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params: Record<string, string | number | boolean> = { page: pageNum, limit: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (paymentFilter !== 'all') params.isPaid = paymentFilter === 'paid';
      const res = await apiService.getKpiTransactions(params);
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
  }, [startDate, endDate, paymentFilter]);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
  const formatDate = (s: string) => new Date(s).toLocaleDateString('uz-UZ');

  if (loading && list.length === 0) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <div className={styles.chips}>
          <button type="button" className={paymentFilter === 'all' ? styles.chipActive : styles.chip} onClick={() => setPaymentFilter('all')}>Barchasi</button>
          <button type="button" className={paymentFilter === 'paid' ? styles.chipActive : styles.chip} onClick={() => setPaymentFilter('paid')}>To'langan</button>
          <button type="button" className={paymentFilter === 'unpaid' ? styles.chipActive : styles.chip} onClick={() => setPaymentFilter('unpaid')}>To'lanmagan</button>
        </div>
      </div>
      <div className={styles.list}>
        {list.map((item) => {
          const product = item.orderItem?.product;
          const productName = typeof product === 'object' && product && 'name' in product ? product.name : 'Mahsulot';
          const punktSum = (item.amounts?.punkt ?? item.punktAmount ?? 0);
          return (
            <div key={item._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.orderNum}>#{item.order?.orderNumber ?? '-'}</span>
                <span className={item.isPaid ? styles.amountPaid : styles.amountUnpaid}>
                  {formatPrice(punktSum)}
                </span>
              </div>
              <p className={styles.productName}>{productName}</p>
              <div className={styles.meta}>
                <span>Miqdor: {item.orderItem?.quantity ?? 0} dona</span>
                <span>KPI: %{item.orderItem?.kpiBonusPercent ?? 0}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <span className={item.isPaid ? styles.badgePaid : styles.badgeUnpaid}>
                {item.isPaid ? "To'langan" : "To'lanmagan"}
              </span>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>KPI transaksiyalari topilmadi</p>
          </div>
        )}
        {page < totalPages && (
          <button type="button" className={styles.loadMore} onClick={() => load(page + 1, false)} disabled={loading}>
            Ko'proq yuklash
          </button>
        )}
      </div>
    </div>
  );
}
