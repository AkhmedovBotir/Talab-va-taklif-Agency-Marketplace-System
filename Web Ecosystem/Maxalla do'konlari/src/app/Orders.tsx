import React, { useEffect, useState } from 'react';
import { IoReceiptOutline, IoCheckmarkCircle, IoCloseCircle, IoSend } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order, DeliveryProvider } from '../services/api';
import styles from './Orders.module.css';

type StatusFilter = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt' | undefined;

function formatCurrency(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getStatusText(s: string) {
  const map: Record<string, string> = {
    pending: 'Kutayotgan',
    accepted: 'Qabul qilingan',
    rejected: 'Rad etilgan',
    delivered_to_punkt: 'Punktga yetkazilgan',
  };
  return map[s] || s;
}

function getStatusColor(s: string) {
  const map: Record<string, string> = {
    pending: '#FF9500',
    accepted: '#34C759',
    rejected: '#FF3B30',
    delivered_to_punkt: '#007AFF',
  };
  return map[s] || '#8E8E93';
}

export function Orders() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedOrderForSend, setSelectedOrderForSend] = useState<Order | null>(null);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (token) loadOrders();
  }, [token, statusFilter]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiService.getOrders(token, { status: statusFilter, page: 1, limit: 50 });
      if (res.success && res.data) setOrders(res.data);
    } catch {}
    setLoading(false);
  };

  const openDetail = async (order: Order) => {
    setDetailOrder(order);
    setDetailLoading(true);
    if (token) {
      try {
        const res = await apiService.getOrderById(token, order._id);
        if (res.success && res.data) setDetailOrder(res.data);
      } catch {}
    }
    setDetailLoading(false);
  };

  const loadProviders = () => {
    if (!token) return;
    apiService.getDeliveryProviders(token, 'active').then((res) => {
      if (res.success && res.data) setProviders(res.data);
    });
  };

  const handleRespond = async (orderId: string, response: 'accepted' | 'rejected') => {
    if (!token) return;
    setResponding(true);
    try {
      const res = await apiService.respondToOrderRequest(token, orderId, response);
      if (res.success) {
        setDetailOrder(null);
        loadOrders();
      }
    } catch {}
    setResponding(false);
  };

  const openSendModal = (order: Order) => {
    setSelectedOrderForSend(order);
    setShowProviderModal(true);
    loadProviders();
  };

  const handleSendToProvider = async (providerId: string) => {
    if (!token || !selectedOrderForSend) return;
    setSending(true);
    try {
      const res = await apiService.sendOrderToDeliveryProvider(token, selectedOrderForSend._id, { deliveryProviderId: providerId });
      if (res.success) {
        setShowProviderModal(false);
        setSelectedOrderForSend(null);
        setDetailOrder(null);
        loadOrders();
      }
    } catch {}
    setSending(false);
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: undefined, label: 'Hammasi' },
    { value: 'pending', label: 'Kutayotgan' },
    { value: 'accepted', label: 'Qabul qilingan' },
    { value: 'rejected', label: 'Rad etilgan' },
    { value: 'delivered_to_punkt', label: 'Yetkazilgan' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Buyurtmalar</h1>
      </div>
      <div className={styles.filters}>
        {filters.map((f) => (
          <button
            key={String(f.value)}
            type="button"
            className={[styles.filterBtn, statusFilter === f.value && styles.filterBtnActive].filter(Boolean).join(' ')}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className={styles.centerContent}>
          <div className={styles.spinner} />
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <IoReceiptOutline size={64} color="#C7C7CC" />
          <p className={styles.emptyText}>Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => {
            const req = order.contragentRequests[0];
            const status = req?.status || 'pending';
            const isAccepted = status === 'accepted';
            const isSent = req?.deliveryProvider != null;
            return (
              <div key={order._id} className={styles.card} onClick={() => openDetail(order)}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.orderNumber}>{order.orderNumber}</p>
                    <p className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                  <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(status) + '20', color: getStatusColor(status) }}>
                    {getStatusText(status)}
                  </span>
                </div>
                <p className={styles.customerName}>
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className={styles.customerPhone}>{order.user.phone}</p>
                <div className={styles.orderFooter}>
                  <span>{order.itemCount} ta mahsulot</span>
                  <span className={styles.totalPrice}>{formatCurrency(order.totalPrice)} so'm</span>
                </div>
                {isAccepted && !isSent && (
                  <button
                    type="button"
                    className={styles.sendBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSendModal(order);
                    }}
                  >
                    <IoSend size={16} /> Yetkazib Beruvchiga Yuborish
                  </button>
                )}
                {isSent && req?.deliveryProvider && (
                  <div className={styles.sentInfo}>
                    <span className={styles.sentText}>Yetkazib beruvchiga yuborilgan: {req.deliveryProvider.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {detailOrder && (
        <div className={styles.modalOverlay} onClick={() => setDetailOrder(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Buyurtma batafsil</h2>
              <button type="button" className={styles.modalClose} onClick={() => setDetailOrder(null)}>×</button>
            </div>
            {detailLoading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : (
              <>
                <p className={styles.detailLabel}>Buyurtma raqami</p>
                <p className={styles.detailValue}>{detailOrder.orderNumber}</p>
                <p className={styles.detailLabel}>Mijoz</p>
                <p className={styles.detailValue}>{detailOrder.user.firstName} {detailOrder.user.lastName} — {detailOrder.user.phone}</p>
                <p className={styles.detailLabel}>Mahsulotlar ({detailOrder.items.length} ta)</p>
                {detailOrder.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span>{typeof item.product === 'object' && item.product ? item.product.name : 'Mahsulot'}</span>
                    <span>{item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)} so'm</span>
                  </div>
                ))}
                <p className={styles.detailTotal}>Jami: {formatCurrency(detailOrder.totalPrice)} so'm</p>
                {detailOrder.contragentRequests[0]?.status === 'pending' && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.acceptBtn} onClick={() => handleRespond(detailOrder._id, 'accepted')} disabled={responding}>
                      <IoCheckmarkCircle size={18} /> Qabul Qilish
                    </button>
                    <button type="button" className={styles.rejectBtn} onClick={() => handleRespond(detailOrder._id, 'rejected')} disabled={responding}>
                      <IoCloseCircle size={18} /> Rad Etish
                    </button>
                  </div>
                )}
                {detailOrder.contragentRequests[0]?.status === 'accepted' && !detailOrder.contragentRequests[0]?.deliveryProvider && (
                  <button type="button" className={styles.sendBtn} onClick={() => { setDetailOrder(null); openSendModal(detailOrder); }}>
                    <IoSend size={18} /> Yetkazib Beruvchiga Yuborish
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showProviderModal && (
        <div className={styles.modalOverlay} onClick={() => !sending && (setShowProviderModal(false), setSelectedOrderForSend(null))}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Yetkazib Beruvchini Tanlang</h2>
            {providers.length === 0 ? (
              <p className={styles.emptyText}>Faol yetkazib beruvchilar topilmadi</p>
            ) : (
              <div className={styles.providerList}>
                {providers.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className={styles.providerItem}
                    onClick={() => handleSendToProvider(p._id)}
                    disabled={sending}
                  >
                    <span className={styles.providerName}>{p.name}</span>
                    <span className={styles.providerPhone}>{p.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
