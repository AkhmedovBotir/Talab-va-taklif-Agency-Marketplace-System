import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoTimeOutline, IoSearchOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import type { Order } from '../types/api';
import { KpiBalanceCard } from '../components/KpiBalanceCard';
import { OrderCard } from '../components/OrderCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import styles from './Orders.module.css';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [kpiTrigger, setKpiTrigger] = useState(0);
  const navigate = useNavigate();

  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const res = await apiService.getTodayOrders({
        page: pageNum,
        limit: 20,
        search: search || undefined,
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
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadOrders(1, true);
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    setKpiTrigger((t) => t + 1);
    loadOrders(1, true);
  };

  const loadMore = () => {
    if (!loading && page < totalPages) loadOrders(page + 1, false);
  };

  if (loading && orders.length === 0) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <KpiBalanceCard onPress={() => navigate('/kpi')} refreshTrigger={kpiTrigger} />
        <div className={styles.headerRow}>
          <div className={styles.searchWrap}>
            <IoSearchOutline size={20} color="#666" />
            <input
              className={styles.searchInput}
              placeholder="Qidirish (buyurtma raqami, telefon)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className={styles.historyBtn} onClick={() => navigate('/orders-history')}>
            <IoTimeOutline size={24} color="#007AFF" />
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {(orders || []).map((order) => (
          <OrderCard key={order._id} order={order} onPress={() => navigate(`/order/${order._id}`)} />
        ))}
        {orders.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Buyurtmalar topilmadi</p>
          </div>
        )}
        {page < totalPages && (
          <button type="button" className={styles.loadMore} onClick={loadMore} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Ko\'proq yuklash'}
          </button>
        )}
      </div>
    </div>
  );
}
