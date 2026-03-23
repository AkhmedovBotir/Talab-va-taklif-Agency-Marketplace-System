import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch, IoLocationOutline, IoCashOutline, IoPersonOutline, IoCheckmarkCircle, IoChevronForward } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { GetOrdersParams, Order, KPISummary } from '../types/api';
import styles from './Orders.module.css';

const STATUS_COLOR: Record<string, string> = {
  pending: '#FF9500',
  processing: '#007AFF',
  shipped: '#5856D6',
  delivered: '#34C759',
  cancelled: '#FF3B30',
  confirmed_by_punkt: '#34C759',
  requested_to_contragent: '#FF9500',
  accepted_by_contragent: '#007AFF',
  delivered_to_punkt: '#5856D6',
  assigned_to_agent: '#007AFF',
  confirmed_by_agent: '#34C759',
  confirmed_by_customer: '#34C759',
};

const STATUS_TEXT: Record<string, string> = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  shipped: 'Yuborilgan',
  delivered: 'Yetkazilgan',
  cancelled: 'Bekor qilingan',
  confirmed_by_punkt: 'Punkt tomonidan tasdiqlangan',
  requested_to_contragent: "Kontragentga so'rov yuborilgan",
  accepted_by_contragent: 'Kontragent tomonidan qabul qilingan',
  delivered_to_punkt: "Punktga yetkazilgan",
  assigned_to_agent: 'Agentga tayinlangan',
  confirmed_by_agent: 'Agent tomonidan tasdiqlangan',
  confirmed_by_customer: 'Mijoz tomonidan tasdiqlangan',
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GetOrdersParams>({ page: 1, limit: 20 });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [kpiBalance, setKpiBalance] = useState<KPISummary | null>(null);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const [alertState, setAlertState] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  useAuth();

  const loadOrders = useCallback(
    async (params?: GetOrdersParams) => {
      try {
        const q: GetOrdersParams = {
          ...filters,
          ...params,
          search: searchQuery || undefined,
          page: params?.page ?? filters.page ?? 1,
          limit: params?.limit ?? 20,
        };
        const res = await apiService.getOrders(q);
        if (res.success) {
          setOrders(res.data || []);
          setTotalPages(res.totalPages || 1);
          setCurrentPage(res.page || 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, searchQuery]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadKPI = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiService.getKPISummary({ date: today });
      if (res.success) setKpiBalance(res.data);
    } catch {}
    finally { setLoadingKPI(false); }
  };

  useEffect(() => {
    loadKPI();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setLoadingKPI(true);
    loadOrders({ page: 1 });
    loadKPI();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders({ page: 1, search: searchQuery || undefined });
  };

  const handleConfirm = (orderId: string) => {
    setConfirmOrderId(orderId);
  };

  const doConfirmOrder = async () => {
    if (!confirmOrderId) return;
    const orderId = confirmOrderId;
    setConfirmOrderId(null);
    try {
      const res = await apiService.confirmOrder(orderId);
      if (res.success) {
        setAlertState({ open: true, message: res.message || 'Tasdiqlandi' });
        loadOrders({ page: currentPage });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setAlertState({ open: true, message: ax.response?.data?.message || 'Xatolik' });
    }
  };

  const kpiData = kpiBalance?.summary ?? kpiBalance;

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
        <h1 className={styles.headerTitle}>Buyurtmalar</h1>
      </header>

      {!loadingKPI && kpiData && (
        <button type="button" className={styles.kpiCard} onClick={() => navigate('/kpi')}>
          <div className={styles.kpiHeader}>
            <IoCashOutline size={20} color="#007AFF" />
            <span className={styles.kpiTitle}>Kunlik KPI balansi</span>
            <IoChevronForward size={20} color="#666" className={styles.kpiArrow} />
          </div>
          <div className={styles.kpiRow}>
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>Jami</span>
              <span className={styles.kpiValue}>
                {(kpiData.totalAmount ?? 0).toLocaleString()} so'm
              </span>
            </div>
            <div className={styles.kpiDivider} />
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>To'langan</span>
              <span className={`${styles.kpiValue} ${styles.kpiPaid}`}>
                {(kpiData.paidAmount ?? 0).toLocaleString()} so'm
              </span>
            </div>
            <div className={styles.kpiDivider} />
            <div className={styles.kpiItem}>
              <span className={styles.kpiLabel}>To'lanmagan</span>
              <span className={`${styles.kpiValue} ${styles.kpiUnpaid}`}>
                {(kpiData.unpaidAmount ?? 0).toLocaleString()} so'm
              </span>
            </div>
          </div>
        </button>
      )}

      <form className={styles.searchWrap} onSubmit={handleSearchSubmit}>
        <IoSearch size={20} color="#666" className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Buyurtma raqami yoki telefon bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => {
              setSearchQuery('');
              loadOrders({ page: 1 });
            }}
          >
            ×
          </button>
        )}
      </form>

      <div className={styles.list}>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <p>Buyurtmalar topilmadi</p>
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
                  <IoLocationOutline size={16} color="#666" />
                  <span>
                    {item.deliveryViloyat?.name}
                    {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <IoCashOutline size={16} color="#666" />
                  <span>{(item.totalPrice || 0).toLocaleString()} so'm</span>
                </div>
                {item.assignedToAgent && (
                  <div className={styles.infoRow}>
                    <IoPersonOutline size={16} color="#666" />
                    <span>Agent: {item.assignedToAgent.name}</span>
                  </div>
                )}
              </div>
              {item.agentConfirmedAt && (
                <div className={styles.confirmedRow}>
                  <IoCheckmarkCircle size={16} color="#34C759" />
                  <span>Agent tasdiqladi: {new Date(item.agentConfirmedAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              )}
              {item.status === 'assigned_to_agent' && !item.agentConfirmedAt && (
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm(item._id);
                  }}
                >
                  <IoCheckmarkCircle size={20} color="#fff" />
                  Tasdiqlash
                </button>
              )}
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
            onClick={() => loadOrders({ page: currentPage - 1 })}
          >
            Oldingi
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => loadOrders({ page: currentPage + 1 })}
          >
            Keyingi
          </button>
        </div>
      )}

      <AlertModal
        open={alertState.open}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
      />
      <ConfirmModal
        open={!!confirmOrderId}
        message="Haqiqatan ham bu buyurtmani tasdiqlaysizmi?"
        onConfirm={doConfirmOrder}
        onCancel={() => setConfirmOrderId(null)}
      />
    </div>
  );
}
