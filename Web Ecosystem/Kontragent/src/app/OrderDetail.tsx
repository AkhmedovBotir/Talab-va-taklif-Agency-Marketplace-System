import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoCubeOutline,
  IoStorefront,
  IoTime,
  IoCash,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import type { Order, OrderItem } from '../types/api';
import styles from './OrderDetail.module.css';

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

function getRequestedItems(order: Order): OrderItem[] {
  const request = order.contragentRequests[0];
  if (!request) return order.items || [];
  if (request.itemIds && request.itemIds.length > 0) {
    const items = order.items || [];
    if (items.length === request.itemIds.length) return items;
    return items.filter((_, i) => request.itemIds!.includes(i));
  }
  return order.items || [];
}

function calculateTotal(items: OrderItem[]) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getContragentOrderById(id);
      if (res.success && res.data) setOrder(res.data);
      else setError('Buyurtma topilmadi');
    } catch {
      setError('Yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleRespond = async (response: 'accepted' | 'rejected') => {
    if (!id || !order) return;
    setProcessing(true);
    setError('');
    try {
      await apiService.respondToOrder(id, { response });
      await loadOrder();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || 'Amalni bajarishda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeliver = async () => {
    if (!id || !order) return;
    setProcessing(true);
    setError('');
    try {
      await apiService.deliverOrderToPunkt(id);
      await loadOrder();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      setError(ax.response?.data?.message || 'Yetkazishda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} /> Orqaga
        </button>
        <p className={styles.error}>{error || 'Buyurtma topilmadi'}</p>
      </div>
    );
  }

  const request = order.contragentRequests[0];
  const items = getRequestedItems(order);
  const total = calculateTotal(items);
  const statusColor = getStatusColor(request.status);
  const punktName =
    typeof order.currentPunkt === 'string'
      ? 'Punkt'
      : (order.currentPunkt?.name || 'Punkt');

  const isPending = request.status === 'pending';
  const isAccepted = request.status === 'accepted';
  const canDeliver = isAccepted;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          <IoArrowBack size={24} />
        </button>
        <h1 className={styles.title}>Buyurtma {order.orderNumber}</h1>
      </header>

      <div className={styles.content}>
        <div
          className={styles.statusBadge}
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {getStatusText(request.status)}
        </div>

        <div className={styles.card}>
          <div className={styles.row}>
            <IoStorefront size={20} color="#007AFF" />
            <div>
              <p className={styles.label}>Punkt</p>
              <p className={styles.value}>{punktName}</p>
            </div>
          </div>
          <div className={styles.row}>
            <IoTime size={20} color="#FF9500" />
            <div>
              <p className={styles.label}>Sana</p>
              <p className={styles.value}>
                {new Date(request.requestedAt).toLocaleDateString('uz-UZ', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Mahsulotlar</h3>
          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <IoCubeOutline size={18} color="#666" />
              <div className={styles.itemContent}>
                <p className={styles.itemName}>
                  {item.product?.name || 'Mahsulot'}
                </p>
                <p className={styles.itemMeta}>
                  {item.quantity} x {formatNumberDisplay(item.price)} so'm
                </p>
              </div>
              <p className={styles.itemTotal}>
                {formatNumberDisplay(item.price * item.quantity)} so'm
              </p>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Jami</span>
            <span className={styles.totalValue}>
              {formatNumberDisplay(total)} so'm
            </span>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {isPending && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnAccept}
              disabled={processing}
              onClick={() => handleRespond('accepted')}
            >
              <IoCheckmarkCircle size={22} />
              Qabul qilish
            </button>
            <button
              type="button"
              className={styles.btnReject}
              disabled={processing}
              onClick={() => handleRespond('rejected')}
            >
              <IoCloseCircle size={22} />
              Rad etish
            </button>
          </div>
        )}

        {canDeliver && (
          <button
            type="button"
            className={styles.btnDeliver}
            disabled={processing}
            onClick={handleDeliver}
          >
            <IoCheckmarkCircle size={22} />
            Yetkazildi (punktga)
          </button>
        )}
      </div>
    </div>
  );
}
