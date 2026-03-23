import React from 'react';
import type { Order } from '../types/api';
import styles from './OrderCard.module.css';

const STATUS_COLOR: Record<string, string> = {
  pending: '#FF9500',
  confirmed_by_punkt: '#34C759',
  requested_to_contragent: '#FF9500',
  accepted_by_contragent: '#007AFF',
  delivered_to_punkt: '#5856D6',
  assigned_to_agent: '#007AFF',
  confirmed_by_agent: '#34C759',
  confirmed_by_customer: '#34C759',
  cancelled: '#FF3B30',
};

const STATUS_TEXT: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed_by_punkt: 'Punkt tasdiqladi',
  requested_to_contragent: "Contragentga so'rov",
  accepted_by_contragent: 'Contragent qabul qildi',
  delivered_to_punkt: "Punktga yetkazildi",
  assigned_to_agent: 'Agentga yuborildi',
  confirmed_by_agent: 'Agent tasdiqladi',
  confirmed_by_customer: 'Mijoz tasdiqladi',
  cancelled: 'Bekor qilingan',
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const color = STATUS_COLOR[order.status] || '#8E8E93';
  const label = STATUS_TEXT[order.status] || order.status;

  const formatDate = (s: string) => {
    return new Date(s).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  return (
    <div className={styles.card} onClick={onPress} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onPress()}>
      <div className={styles.header}>
        <span className={styles.orderNumber}>#{order.orderNumber}</span>
        <span className={styles.statusBadge} style={{ backgroundColor: color + '20', color }}>{label}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Mijoz:</span>
        <span className={styles.value}>{order.user.name}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Telefon:</span>
        <span className={styles.value}>{order.phoneNumber}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Manzil:</span>
        <span className={styles.value}>
          {order.deliveryViloyat.name}
          {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
          {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Jami:</span>
        <span className={styles.price}>{formatPrice(order.totalPrice)}</span>
      </div>
      <div className={styles.footer}>
        <span className={styles.punktStatus}>
          {order.punktStatus === 'pending' && 'Kutilmoqda'}
          {order.punktStatus === 'confirmed' && 'Tasdiqlandi'}
          {order.punktStatus === 'rejected' && 'Rad etildi'}
          {order.punktStatus === 'requested' && "So'rov yuborildi"}
        </span>
        <span className={styles.date}>{formatDate(order.createdAt)}</span>
      </div>
    </div>
  );
}
