import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IoTimeOutline, IoReceiptOutline, IoStorefront, IoTime, IoCash, IoChevronForward } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import type { Order } from '../types/api';
import styles from './Orders.module.css';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt' | 'all';

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return '#FF9500';
    case 'accepted': return '#34C759';
    case 'rejected': return '#FF3B30';
    case 'delivered_to_punkt': return '#007AFF';
    default: return '#8E8E93';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending': return 'Kutilmoqda';
    case 'accepted': return 'Qabul qilindi';
    case 'rejected': return 'Rad etildi';
    case 'delivered_to_punkt': return 'Yetkazildi';
    default: return status;
  }
}

function getCurrentRequest(order: Order) {
  return order.contragentRequests[0];
}

function getRequestedItems(order: Order) {
  const request = getCurrentRequest(order);
  if (!request) return order.items || [];
  if (request.itemIds && request.itemIds.length > 0) {
    const items = order.items || [];
    if (items.length === request.itemIds.length) return items;
    return items.filter((_, i) => request.itemIds!.includes(i));
  }
  return order.items || [];
}

function calculateRequestedTotalPrice(order: Order) {
  return getRequestedItems(order).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();

  const loadOrders = useCallback(
    async (pageNum = 1, status?: OrderStatus) => {
      try {
        const res = await apiService.getTodayOrders({
          page: pageNum,
          limit: 20,
          status: status && status !== 'all' ? status : undefined,
        });
        const list = res.data || [];
        if (pageNum === 1) setOrders(list);
        else setOrders((prev) => [...prev, ...list]);
        setHasMore((res.page ?? 1) < (res.totalPages ?? 1));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadOrders(1, selectedStatus);
  }, [loadOrders, selectedStatus]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1, selectedStatus);
  }, [loadOrders, selectedStatus]);

  const handleStatusFilter = (status: OrderStatus) => {
    setSelectedStatus(status);
    setPage(1);
    setLoading(true);
    loadOrders(1, status);
  };

  const statuses: OrderStatus[] = ['all', 'pending', 'accepted', 'rejected', 'delivered_to_punkt'];

  if (loading && orders.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Bugungi buyurtmalar</h1>
          <Link to="/buyurtmalar/history" className={styles.historyButton}>
            <IoTimeOutline size={18} color="#007AFF" />
            <span>Tarix</span>
          </Link>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Bugungi buyurtmalar</h1>
        <Link to="/buyurtmalar/history" className={styles.historyButton}>
          <IoTimeOutline size={18} color="#007AFF" />
          <span>Tarix</span>
        </Link>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.filterScroll}>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              className={[styles.filterChip, selectedStatus === s && styles.filterChipActive].filter(Boolean).join(' ')}
              onClick={() => handleStatusFilter(s)}
            >
              {s === 'all' ? 'Barchasi' : getStatusText(s)}
            </button>
          ))}
        </div>
      </div>

      <div
        className={styles.list}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100 && !loading && hasMore) {
            const next = page + 1;
            setPage(next);
            loadOrders(next, selectedStatus);
          }
        }}
      >
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <IoReceiptOutline size={64} color="#ccc" />
            <p>Buyurtmalar mavjud emas</p>
          </div>
        ) : (
          orders.map((order) => {
            const request = getCurrentRequest(order);
            const statusColor = getStatusColor(request.status);
            const requestedTotal = calculateRequestedTotalPrice(order);
            const punktName =
              typeof order.currentPunkt === 'string'
                ? 'Punkt'
                : (order.currentPunkt?.name || 'Punkt topilmadi');

            return (
              <Link
                key={order._id}
                to={`/buyurtmalar/order/${order._id}`}
                className={styles.orderCard}
              >
                <div className={styles.orderHeader}>
                  <div className={styles.orderNumberContainer}>
                    <div
                      className={styles.orderIconContainer}
                      style={{ backgroundColor: `${statusColor}20` }}
                    >
                      <IoReceiptOutline size={22} color={statusColor} />
                    </div>
                    <div>
                      <p className={styles.orderNumberLabel}>Buyurtma</p>
                      <p className={styles.orderNumber}>{order.orderNumber}</p>
                    </div>
                  </div>
                  <div
                    className={styles.statusBadge}
                    style={{ backgroundColor: `${statusColor}20` }}
                  >
                    <span
                      className={styles.statusDot}
                      style={{ backgroundColor: statusColor }}
                    />
                    <span style={{ color: statusColor }}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>
                <div className={styles.divider} />
                <div className={styles.orderInfo}>
                  <div className={styles.infoRow}>
                    <IoStorefront size={18} color="#007AFF" />
                    <div>
                      <p className={styles.infoLabel}>Punkt</p>
                      <p className={styles.infoText}>{punktName}</p>
                    </div>
                  </div>
                  <div className={styles.infoRow}>
                    <IoTime size={18} color="#FF9500" />
                    <div>
                      <p className={styles.infoLabel}>Vaqt</p>
                      <p className={styles.infoText}>
                        {new Date(request.requestedAt).toLocaleDateString(
                          'uz-UZ',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  {requestedTotal > 0 && (
                    <div className={styles.infoRow}>
                      <IoCash size={18} color="#34C759" />
                      <div>
                        <p className={styles.infoLabel}>Jami summa</p>
                        <p className={styles.priceText}>
                          {formatNumberDisplay(requestedTotal)} so'm
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <IoChevronForward size={20} color="#C7C7CC" className={styles.arrow} />
              </Link>
            );
          })
        )}
        {hasMore && orders.length > 0 && (
          <div className={styles.footerLoader}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  );
}
