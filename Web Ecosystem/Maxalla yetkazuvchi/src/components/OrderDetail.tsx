import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  IoReceipt,
  IoPersonOutline,
  IoLocation,
  IoLocationOutline,
  IoCubeOutline,
  IoCheckmarkCircle,
  IoInformationCircle,
} from 'react-icons/io5';
import { apiService, Order, OrderItem } from '../services/api';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import { formatPhoneForDisplay } from '../utils/phoneFormatter';
import { AlertModal } from './AlertModal';
import { ConfirmModal } from './ConfirmModal';
import styles from './OrderDetail.module.css';

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

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [confirmDeliverOpen, setConfirmDeliverOpen] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const { token } = useDeliveryProviderAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.getOrderById(token, id);
        if (cancelled) return;
        if (response.success && response.data) {
          const data = response.data as unknown;
          let normalizedOrder: Order | null = null;
          if (Array.isArray(data) && data.length > 0) {
            normalizedOrder = data[0] as Order;
          } else if (data && typeof data === 'object' && 'order' in data) {
            normalizedOrder = (data as { order: Order }).order;
          } else {
            normalizedOrder = data as Order;
          }
          setOrder(normalizedOrder);
        }
      } catch {
        if (!cancelled) navigate(-1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, token, navigate]);

  const openConfirmDeliver = () => setConfirmDeliverOpen(true);

  const handleConfirmMarkDelivered = async () => {
    setConfirmDeliverOpen(false);
    if (!token || !id || !order) return;
    setMarkingDelivered(true);
    try {
      const response = await apiService.markOrderAsDelivered(token, id);
      if (response.success && response.data) {
        setOrder({
          ...order,
          status: 'confirmed_by_customer',
          customerConfirmed: true,
          customerConfirmedAt: (response.data as Order).customerConfirmedAt || new Date().toISOString(),
          deliveredAt: (response.data as Order).deliveredAt || new Date().toISOString(),
        });
        setAlertState({ open: true, title: 'Muvaffaqiyatli', message: 'Buyurtma yetkazib berildi deb belgilandi' });
      }
    } catch (err) {
      setAlertState({
        open: true,
        title: 'Xatolik',
        message: err instanceof Error ? err.message : 'Xatolik yuz berdi',
      });
    } finally {
      setMarkingDelivered(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.centerContainer}>
        <p className={styles.errorText}>Buyurtma topilmadi</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.orderNumberContainer}>
          <IoReceipt size={24} color="#007AFF" />
          <span className={styles.orderNumber}>{order.orderNumber}</span>
        </div>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {getStatusText(order.status)}
        </span>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoPersonOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Mijoz ma'lumotlari</h2>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Ism:</span>
          <span className={styles.infoValue}>
            {order.user.firstName} {order.user.lastName}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Telefon:</span>
          <span className={styles.infoValue}>{formatPhoneForDisplay(order.user.phone)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Yetkazib berish telefon:</span>
          <span className={styles.infoValue}>{formatPhoneForDisplay(order.phoneNumber)}</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoLocationOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Yetkazib berish manzili</h2>
        </div>
        <div className={styles.addressContainer}>
          <IoLocation size={18} color="#6B7280" />
          <span className={styles.addressText}>
            {order.deliveryViloyat.name}
            {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
            {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
          </span>
        </div>
        {order.deliveryNote && (
          <div className={styles.noteContainer}>
            <IoInformationCircle size={18} color="#FF9500" />
            <span className={styles.noteText}>Eslatma: {order.deliveryNote}</span>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoCubeOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Mahsulotlar</h2>
        </div>
        {order.items && order.items.length > 0 ? (
          order.items.map((item: OrderItem, index: number) => {
            const product = item.product && typeof item.product === 'object' ? item.product : null;
            const productName = product?.name ?? (item as { name?: string }).name ?? (item as { productName?: string }).productName ?? 'Mahsulot';
            const quantity = item.quantity ?? (item as { count?: number }).count ?? 1;
            const unitPrice = item.price ?? product?.price ?? 0;
            return (
              <div key={index} className={styles.itemCard}>
                <span className={styles.itemName}>{productName}</span>
                <div className={styles.itemDetails}>
                  <span className={styles.itemQuantity}>Miqdor: {quantity}</span>
                  <span className={styles.itemPrice}>
                    {formatPrice(unitPrice)} x {quantity} = {formatPrice(unitPrice * quantity)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.emptyItemsText}>Mahsulotlar topilmadi yoki yuklanmadi</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Jami:</span>
          <span className={styles.totalPrice}>{formatPrice(order.totalPrice)}</span>
        </div>
      </section>

      <ConfirmModal
        open={confirmDeliverOpen}
        title="Tasdiqlash"
        message="Buyurtmani yetkazib berildi deb belgilamoqchimisiz?"
        confirmLabel="Tasdiqlash"
        cancelLabel="Bekor qilish"
        onConfirm={handleConfirmMarkDelivered}
        onCancel={() => setConfirmDeliverOpen(false)}
      />
      <AlertModal
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
      />
      {order.status !== 'confirmed_by_customer' && !order.customerConfirmed && (
        <button
          type="button"
          className={[styles.deliverButton, markingDelivered && styles.buttonDisabled].filter(Boolean).join(' ')}
          onClick={openConfirmDeliver}
          disabled={markingDelivered}
        >
          {markingDelivered ? (
            <span className={styles.spinnerSmall} />
          ) : (
            <>
              <IoCheckmarkCircle size={22} color="#fff" />
              <span>Yetkazib berildi deb belgilash</span>
            </>
          )}
        </button>
      )}

      {order.deliveredAt && (
        <section className={styles.section}>
          <p className={styles.deliveredText}>
            Yetkazib berilgan sana: {new Date(order.deliveredAt).toLocaleString('uz-UZ')}
          </p>
        </section>
      )}
    </div>
  );
}
