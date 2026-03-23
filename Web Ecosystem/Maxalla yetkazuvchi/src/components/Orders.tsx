import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoReceipt, IoPerson, IoCall, IoCube, IoLocation, IoChevronForward, IoDocumentTextOutline, IoRefresh } from 'react-icons/io5';
import { apiService, Order } from '../services/api';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import { formatPhoneForDisplay } from '../utils/phoneFormatter';
import styles from './Orders.module.css';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed_by_customer': return '#34C759';
    case 'accepted_by_contragent': return '#007AFF';
    case 'requested_to_contragent': return '#FF9500';
    default: return '#8E8E93';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed_by_customer': return 'Yetkazib berilgan';
    case 'accepted_by_contragent': return 'Qabul qilingan';
    case 'requested_to_contragent': return "So'rov yuborilgan";
    default: return status;
  }
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [error, setError] = useState('');
  const { token } = useDeliveryProviderAuth();
  const navigate = useNavigate();

  const loadOrders = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await apiService.getOrders(token, { status: statusFilter, page: 1, limit: 50 });
      if (response.success) {
        const ordersData = Array.isArray(response.data)
          ? response.data
          : (response.data && typeof response.data === 'object' && Array.isArray((response.data as { data?: Order[] }).data))
            ? (response.data as { data: Order[] }).data
            : [];
        setOrders(ordersData);
      } else {
        setOrders([]);
      }
      setError('');
    } catch (err) {
      setOrders([]);
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('Network')) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Buyurtmalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.filterContainer}>
        <button
          type="button"
          className={[styles.filterButton, !statusFilter && styles.filterButtonActive].filter(Boolean).join(' ')}
          onClick={() => setStatusFilter(undefined)}
        >
          Barchasi
        </button>
        <button
          type="button"
          className={[styles.filterButton, statusFilter === 'accepted_by_contragent' && styles.filterButtonActive].filter(Boolean).join(' ')}
          onClick={() => setStatusFilter('accepted_by_contragent')}
        >
          Qabul qilingan
        </button>
        <button
          type="button"
          className={[styles.filterButton, statusFilter === 'confirmed_by_customer' && styles.filterButtonActive].filter(Boolean).join(' ')}
          onClick={() => setStatusFilter('confirmed_by_customer')}
        >
          Yetkazib berilgan
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {orders.length === 0 ? (
        <div className={styles.emptyContainer}>
          <IoDocumentTextOutline size={64} color="#D1D5DB" />
          <h2 className={styles.emptyTitle}>Buyurtmalar topilmadi</h2>
          <p className={styles.emptyText}>
            {statusFilter ? "Bu holatdagi buyurtmalar hozircha yo'q" : "Sizga hali buyurtmalar yuborilmagan"}
          </p>
          <button type="button" className={styles.refreshButton} onClick={onRefresh} disabled={refreshing}>
            <IoRefresh size={20} />
            <span>Yangilash</span>
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((item) => (
            <button
              key={item._id}
              type="button"
              className={styles.orderCard}
              onClick={() => navigate(`/order/${item._id}`)}
            >
              <div className={styles.orderHeader}>
                <div className={styles.orderNumberContainer}>
                  <IoReceipt size={18} color="#007AFF" />
                  <span className={styles.orderNumber}>{item.orderNumber}</span>
                </div>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(item.status) }}
                >
                  {getStatusText(item.status)}
                </span>
              </div>
              <div className={styles.orderInfo}>
                <div className={styles.customerInfo}>
                  <IoPerson size={16} color="#6B7280" />
                  <span className={styles.customerName}>
                    {item.user.firstName} {item.user.lastName}
                  </span>
                </div>
                <div className={styles.customerInfo}>
                  <IoCall size={16} color="#6B7280" />
                  <span className={styles.customerPhone}>{formatPhoneForDisplay(item.user.phone)}</span>
                </div>
              </div>
              <div className={styles.orderDetails}>
                <div className={styles.detailItem}>
                  <IoCube size={16} color="#6B7280" />
                  <span>{item.items.length} ta mahsulot</span>
                </div>
                <span className={styles.totalPrice}>{formatPrice(item.totalPrice)}</span>
              </div>
              <div className={styles.deliveryInfo}>
                <IoLocation size={14} color="#9CA3AF" />
                <span className={styles.deliveryAddress}>
                  {item.deliveryViloyat.name}
                  {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
                  {item.deliveryMfy && `, ${item.deliveryMfy.name}`}
                </span>
              </div>
              <div className={styles.arrowContainer}>
                <IoChevronForward size={20} color="#9CA3AF" />
              </div>
            </button>
          ))}
          <button
            type="button"
            className={styles.refreshButtonBottom}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Yuklanmoqda...' : 'Yangilash'}
          </button>
        </div>
      )}
    </div>
  );
}
