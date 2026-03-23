import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCalendarOutline, IoCloseCircle, IoDocumentTextOutline } from 'react-icons/io5';
import { apiService } from '../services/api';
import { DatePickerField } from '../components/DatePickerField';
import type { GetOrdersHistoryParams, Order } from '../types/api';
import styles from './OrdersHistory.module.css';

const STATUS_COLOR: Record<string, string> = {
  pending: '#FF9500',
  processing: '#007AFF',
  delivered: '#34C759',
  cancelled: '#FF3B30',
  assigned_to_agent: '#007AFF',
  confirmed_by_agent: '#34C759',
  confirmed_by_customer: '#34C759',
};

const STATUS_TEXT: Record<string, string> = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  delivered: 'Yetkazilgan',
  cancelled: 'Bekor qilingan',
  assigned_to_agent: 'Agentga tayinlangan',
  confirmed_by_agent: 'Agent tomonidan tasdiqlangan',
  confirmed_by_customer: 'Mijoz tomonidan tasdiqlangan',
};

export function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const loadOrders = useCallback(
    async (page = 1) => {
      try {
        const params: GetOrdersHistoryParams = {
          page,
          limit: 20,
          startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
          endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        };
        const res = await apiService.getOrdersHistory(params);
        if (res.success) {
          setOrders(res.data || []);
          setTotalPages(res.totalPages || 1);
          setCurrentPage(res.page || 1);
          setTotal(res.total ?? 0);
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
    loadOrders();
  }, [loadOrders]);

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading && orders.length === 0) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Buyurtmalar tarixi</h1>
      </header>

      <div className={styles.filterWrap}>
        <div className={styles.filterRow}>
          <DatePickerField
            value={startDate}
            onChange={setStartDate}
            max={endDate || undefined}
          />
          <span className={styles.filterArrow}>→</span>
          <DatePickerField
            value={endDate}
            onChange={setEndDate}
            min={startDate || undefined}
            max={new Date()}
          />
          {(startDate || endDate) && (
            <button type="button" className={styles.clearBtn} onClick={clearFilters} aria-label="Tozalash">
              <IoCloseCircle size={22} color="#FF3B30" />
            </button>
          )}
        </div>
        <p className={styles.totalText}>Jami: {total} ta buyurtma</p>
      </div>

      <div className={styles.list}>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <IoDocumentTextOutline size={64} color="#ccc" />
            <p>Buyurtmalar tarixi topilmadi</p>
          </div>
        ) : (
          orders.map((item) => (
            <article
              key={item._id}
              className={styles.card}
              onClick={() => navigate(`/order/${item._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/order/${item._id}`)}
            >
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.orderNumber}>#{item.orderNumber}</div>
                  <div className={styles.customerName}>{item.user?.name || 'Mijoz'}</div>
                  <div className={styles.phone}>{item.phoneNumber || item.user?.phone}</div>
                </div>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: STATUS_COLOR[item.status] || '#999' }}
                >
                  {STATUS_TEXT[item.status] || item.status}
                </span>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.infoRow}>
                  <IoCalendarOutline size={16} color="#666" />
                  <span>
                    {item.deliveryViloyat?.name}
                    {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
                  </span>
                </div>
                <span className={styles.infoRow}>
                  {(item.totalPrice || 0).toLocaleString()} so'm
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => loadOrders(currentPage - 1)}
          >
            Oldingi
          </button>
          <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => loadOrders(currentPage + 1)}
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
