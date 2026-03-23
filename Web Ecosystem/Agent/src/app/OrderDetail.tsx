import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack, IoLocationOutline, IoCashOutline, IoPersonOutline } from 'react-icons/io5';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Order } from '../types/api';
import { AlertModal } from '../components/AlertModal';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './OrderDetail.module.css';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [paying, setPaying] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; message: string; onCloseExtra?: () => void }>({ open: false, message: '' });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const navigate = useNavigate();
  const { agent } = useAuth();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await apiService.getOrderById(id);
        if (res.success) setOrder(res.data);
      } catch (e) {
        console.error(e);
        setAlertState({ open: true, message: 'Buyurtma yuklanmadi', onCloseExtra: () => navigate(-1) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const reload = () => id && apiService.getOrderById(id).then((res) => res.success && setOrder(res.data));

  const canConfirm = () => {
    if (!order || !agent) return false;
    const hasPayment = (order as unknown as { paymentTransaction?: unknown }).paymentTransaction != null;
    return (
      order.status === 'assigned_to_agent' &&
      order.assignedToAgent?._id === agent._id &&
      !order.agentConfirmedAt &&
      hasPayment
    );
  };

  const canPayToPunkt = () => {
    if (!order || !agent) return false;
    if (order.agentConfirmedAt) return false;
    const hasPayment = (order as unknown as { paymentTransaction?: unknown }).paymentTransaction != null;
    if (hasPayment) return false;
    return (
      (order.status === 'assigned_to_agent' || order.status === 'confirmed_by_agent') &&
      order.assignedToAgent?._id === agent._id &&
      order.assignedByPunkt
    );
  };

  const handleConfirm = async () => {
    if (!id) return;
    setConfirmState({
      open: true,
      message: 'Buyurtmani tasdiqlaysizmi?',
      onConfirm: async () => {
        setConfirmState(null);
        setConfirming(true);
        try {
          const res = await apiService.confirmOrder(id);
          if (res.success) {
            setAlertState({ open: true, message: res.message || 'Tasdiqlandi' });
            reload();
          }
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          setAlertState({ open: true, message: ax.response?.data?.message || 'Xatolik' });
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  const handleMarkDelivered = async () => {
    if (!id) return;
    setConfirmState({
      open: true,
      message: 'Yetkazilgan deb belgilaysizmi?',
      onConfirm: async () => {
        setConfirmState(null);
        setMarkingDelivered(true);
        try {
          const res = await apiService.markOrderAsDelivered(id);
          if (res.success) {
            setAlertState({ open: true, message: res.message || 'Belgilandi' });
            reload();
          }
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          setAlertState({ open: true, message: ax.response?.data?.message || 'Xatolik' });
        } finally {
          setMarkingDelivered(false);
        }
      },
    });
  };

  const handlePayToPunkt = async () => {
    if (!id || !order) return;
    const message = `Punktga ${(order.totalPrice || 0).toLocaleString()} so'm to'lov qilmoqchimisiz?`;
    setConfirmState({
      open: true,
      message,
      onConfirm: async () => {
        setConfirmState(null);
        setPaying(true);
        try {
          const res = await apiService.payToPunkt(id);
          if (res.success) {
            try {
              await apiService.confirmOrder(id);
            } catch {}
            setAlertState({ open: true, message: res.message || "To'lov muvaffaqiyatli" });
            reload();
          }
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { message?: string } } };
          setAlertState({ open: true, message: ax.response?.data?.message || "To'lovda xatolik" });
        } finally {
          setPaying(false);
        }
      },
    });
  };

  if (loading || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Orqaga">
          <IoArrowBack size={24} />
        </button>
        <h1 className={styles.headerTitle}>#{order.orderNumber}</h1>
      </header>

      <div className={styles.card}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mijoz</h2>
          <p className={styles.text}>{order.user?.name || 'Mijoz'}</p>
          <p className={styles.textSecondary}>{order.phoneNumber || order.user?.phone}</p>
        </div>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manzil</h2>
          <div className={styles.infoRow}>
            <IoLocationOutline size={18} color="#666" />
            <span>
              {order.deliveryViloyat?.name}
              {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
              {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
            </span>
          </div>
          {order.deliveryNote && <p className={styles.note}>{order.deliveryNote}</p>}
        </div>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mahsulotlar</h2>
          {order.items?.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemName}>
                {typeof item.product === 'object' && item.product?.name
                  ? item.product.name
                  : `Mahsulot ${i + 1}`}
              </span>
              <span className={styles.itemQty}>x{item.quantity}</span>
              <span className={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()} so'm</span>
            </div>
          ))}
        </div>
        <div className={styles.section}>
          <div className={styles.totalRow}>
            <span>Jami</span>
            <span className={styles.totalSum}>{(order.totalPrice || 0).toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {canConfirm() && (
          <button type="button" className={styles.primaryBtn} onClick={handleConfirm} disabled={confirming}>
            {confirming ? 'Kutilmoqda...' : 'Tasdiqlash'}
          </button>
        )}
        {canPayToPunkt() && (
          <button type="button" className={styles.primaryBtn} onClick={handlePayToPunkt} disabled={paying}>
            {paying ? 'Kutilmoqda...' : "Punktga to'lov"}
          </button>
        )}
        {order.status === 'confirmed_by_agent' && !order.deliveredAt && (
          <button type="button" className={styles.primaryBtn} onClick={handleMarkDelivered} disabled={markingDelivered}>
            {markingDelivered ? 'Kutilmoqda...' : "Yetkazilgan deb belgilash"}
          </button>
        )}
      </div>

      <AlertModal
        open={alertState.open}
        message={alertState.message}
        onClose={() => {
          const extra = alertState.onCloseExtra;
          setAlertState((s) => ({ ...s, open: false, onCloseExtra: undefined }));
          extra?.();
        }}
      />
      {confirmState && (
        <ConfirmModal
          open={confirmState.open}
          message={confirmState.message}
          onConfirm={() => confirmState.onConfirm()}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
