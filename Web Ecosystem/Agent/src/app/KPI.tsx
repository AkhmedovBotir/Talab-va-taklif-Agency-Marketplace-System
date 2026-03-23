import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoWalletOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import { DatePickerField } from '../components/DatePickerField';
import type { KPITransaction, GetKPIParams } from '../types/api';
import styles from './KPI.module.css';

export function KPI() {
  const [transactions, setTransactions] = useState<KPITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const load = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: GetKPIParams = {
          page,
          limit: 20,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        };
        const res = await apiService.getKPITransactions(params);
        if (res.success) {
          setTransactions(res.data || []);
          setTotalPages(res.totalPages || 1);
          setCurrentPage(res.page || 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Orqaga">
          <IoArrowBack size={24} />
        </button>
        <h1 className={styles.headerTitle}>KPI</h1>
      </header>

      <div className={styles.filterWrap}>
        <div className={styles.filterRow}>
          <DatePickerField value={startDate} onChange={setStartDate} max={endDate || undefined} />
          <DatePickerField value={endDate} onChange={setEndDate} min={startDate || undefined} max={new Date()} />
        </div>
      </div>

      <div className={styles.list}>
        {loading && transactions.length === 0 ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.empty}>
            <IoWalletOutline size={64} color="#ccc" />
            <p>KPI transaksiyalari topilmadi</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div key={t._id} className={styles.card}>
              <div className={styles.cardLeft}>
                <span className={styles.orderNum}>#{t.order?.orderNumber}</span>
                <span className={styles.date}>{new Date(t.createdAt).toLocaleDateString('uz-UZ')}</span>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.amount}>
                  {(t.agentAmount ?? t.totalKpiAmount ?? 0).toLocaleString()} so'm
                </span>
                <span className={t.isPaid ? styles.paid : styles.unpaid}>
                  {t.isPaid ? "To'langan" : "To'lanmagan"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" className={styles.pageBtn} disabled={currentPage === 1} onClick={() => load(currentPage - 1)}>
            Oldingi
          </button>
          <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
          <button type="button" className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => load(currentPage + 1)}>
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
