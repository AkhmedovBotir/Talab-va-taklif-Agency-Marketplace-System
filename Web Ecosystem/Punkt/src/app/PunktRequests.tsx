import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Order } from '../types/api';
import { OrderCard } from '../components/OrderCard';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertModal, ConfirmModal } from '../components/Modal';
import styles from './PunktRequests.module.css';

export function PunktRequests() {
  const [requests, setRequests] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ order: Order; action: 'respond' | 'receive'; response?: 'accepted' | 'rejected' } | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success');
  const { punkt } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const res = await apiService.getPunktToPunktRequests({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
      });
      if (res.success) setRequests(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const getRequestStatus = (order: Order) => {
    const req = order.punktToPunktRequests?.find(
      (r) => r.toPunktId && typeof r.toPunktId === 'object' && r.toPunktId._id === punkt?._id
    );
    return req?.status || null;
  };

  const handleRespondClick = (order: Order, response: 'accepted' | 'rejected') => {
    setConfirmPayload({ order, action: 'respond', response });
    setConfirmOpen(true);
  };

  const handleReceiveClick = (order: Order) => {
    setConfirmPayload({ order, action: 'receive' });
    setConfirmOpen(true);
  };

  const confirmMessage = confirmPayload
    ? confirmPayload.action === 'respond'
      ? confirmPayload.response === 'accepted'
        ? "Punkt so'rovini qabul qilishni xohlaysizmi?"
        : "Punkt so'rovini rad etishni xohlaysizmi?"
      : "Punktdan buyurtmani qabul qilishni xohlaysizmi?"
    : '';

  const handleConfirmAction = async () => {
    if (!confirmPayload) return;
    const { order, action, response } = confirmPayload;
    setConfirmOpen(false);
    setConfirmPayload(null);
    setActionLoading(order._id);
    try {
      if (action === 'respond' && response) {
        await apiService.respondToPunktRequest(order._id, { response });
        setAlertMessage('Javob yuborildi');
      } else if (action === 'receive') {
        await apiService.receiveFromPunkt(order._id);
        setAlertMessage('Buyurtma qabul qilindi');
      }
      setAlertVariant('success');
      setAlertOpen(true);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setAlertMessage(ax.response?.data?.message || 'Xatolik');
      setAlertVariant('error');
      setAlertOpen(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setConfirmPayload(null);
  };

  if (loading && requests.length === 0) return <LoadingSpinner />;

  const statusOptions = [
    { value: '', label: 'Barchasi' },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'accepted', label: 'Qabul qilindi' },
    { value: 'rejected', label: 'Rad etilgan' },
    { value: 'delivered', label: 'Yetkazildi' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={statusFilter === opt.value ? styles.filterActive : styles.filterBtn}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {requests.map((order) => {
          const status = getRequestStatus(order);
          const fromPunkt = order.punktToPunktRequests?.find(
            (r) => r.toPunktId && typeof r.toPunktId === 'object' && r.toPunktId._id === punkt?._id
          );
          const from = fromPunkt && typeof fromPunkt.fromPunktId === 'object' ? fromPunkt.fromPunktId : null;
          return (
            <div key={order._id} className={styles.cardWrap}>
              <OrderCard order={order} onPress={() => navigate(`/order/${order._id}`)} />
              {from && (
                <div className={styles.fromPunkt}>
                  <span className={styles.fromPunktText}>{from.name} punktidan</span>
                  {status && <span className={styles.statusBadge}>{status}</span>}
                </div>
              )}
              {status === 'pending' && (
                <div className={styles.actions}>
                  <Button title="Qabul qilish" onPress={() => handleReceiveClick(order)} loading={actionLoading === order._id} />
                  <Button title="Rad etish" onPress={() => handleRespondClick(order, 'rejected')} variant="outline" loading={actionLoading === order._id} />
                </div>
              )}
              {status === 'accepted' && (
                <div className={styles.actions}>
                  <Button title="Qabul qilish" onPress={() => handleReceiveClick(order)} loading={actionLoading === order._id} />
                </div>
              )}
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Punkt so'rovlari topilmadi</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Tasdiqlash"
        message={confirmMessage}
        confirmLabel="Ha"
        cancelLabel="Bekor qilish"
        onConfirm={handleConfirmAction}
        onCancel={handleConfirmClose}
      />
      <AlertModal
        open={alertOpen}
        variant={alertVariant}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
