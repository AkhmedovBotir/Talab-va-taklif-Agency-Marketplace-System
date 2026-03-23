import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Order } from '../types/api';
import { OrderCard } from '../components/OrderCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import styles from './OrdersHistory.module.css';

export function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const res = await apiService.getOrdersHistory({
        page: pageNum,
        limit: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) {
        if (reset) setOrders(res.data || []);
        else setOrders((prev) => [...(prev || []), ...(res.data || [])]);
        setTotalPages(res.totalPages || 1);
        setPage(res.page || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadOrders(1, true);
  }, [loadOrders]);

  if (loading && orders.length === 0) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        <input
          type="date"
          className={styles.dateInput}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className={styles.dateInput}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div className={styles.list}>
        {(orders || []).map((order) => (
          <OrderCard key={order._id} order={order} onPress={() => navigate(`/order/${order._id}`)} />
        ))}
        {orders.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Tarixda buyurtmalar topilmadi</p>
          </div>
        )}
        {page < totalPages && (
          <button type="button" className={styles.loadMore} onClick={() => loadOrders(page + 1, false)} disabled={loading}>
            Ko'proq yuklash
          </button>
        )}
      </div>
    </div>
  );
}
