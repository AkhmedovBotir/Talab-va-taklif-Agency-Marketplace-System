import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { apiService } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import type { ContragentPayment } from '../types/api';
import styles from './OrderDetail.module.css';

export function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<ContragentPayment | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiService.getPaymentById(id);
      if (res.success && res.data) setPayment(res.data);
    } catch {
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !payment) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} /> Orqaga
        </button>
        <p className={styles.error}>To'lov topilmadi</p>
      </div>
    );
  }

  const formatDate = (s: string | null) => {
    if (!s) return '-';
    return new Date(s).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <IoArrowBack size={24} />
        </button>
        <h1 className={styles.title}>To'lov #{payment._id.slice(-6)}</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Summa</span>
            <span className={styles.value} style={{ color: '#34C759', fontWeight: 600 }}>
              {formatNumberDisplay(payment.amount)} so'm
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Holat</span>
            <span className={styles.value}>
              {payment.status === 'paid' ? 'To\'langan' : payment.status === 'pending' ? 'Kutilmoqda' : payment.status}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Muddat</span>
            <span className={styles.value}>{formatDate(payment.dueDate)}</span>
          </div>
          {payment.paidAt && (
            <div className={styles.row}>
              <span className={styles.label}>To'langan sana</span>
              <span className={styles.value}>{formatDate(payment.paidAt)}</span>
            </div>
          )}
          {payment.paidBy && (
            <div className={styles.row}>
              <span className={styles.label}>To'lovchi</span>
              <span className={styles.value}>
                {payment.paidBy.name}
                {payment.paidBy.phone && ` (${payment.paidBy.phone})`}
              </span>
            </div>
          )}
        </div>

        {payment.orders && payment.orders.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Buyurtmalar</h3>
            {payment.orders.map((o, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.label}>{o.orderNumber}</span>
                <span className={styles.value}>
                  {formatNumberDisplay(o.totalPrice)} so'm
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
