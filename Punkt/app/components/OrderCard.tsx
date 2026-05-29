import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '../services/api';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#5856D6';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      case 'confirmed_by_punkt':
        return '#34C759';
      case 'requested_to_contragent':
        return '#FF9500';
      case 'accepted_by_contragent':
        return '#007AFF';
      case 'delivered_to_punkt':
        return '#5856D6';
      case 'assigned_to_agent':
        return '#007AFF';
      case 'confirmed_by_agent':
        return '#34C759';
      case 'confirmed_by_customer':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'processing':
        return 'Jarayonda';
      case 'shipped':
        return 'Yuborilgan';
      case 'delivered':
        return 'Yetkazilgan';
      case 'cancelled':
        return 'Bekor qilingan';
      case 'confirmed_by_punkt':
        return 'Punkt tasdiqladi';
      case 'requested_to_contragent':
        return 'Contragentga so\'rov';
      case 'accepted_by_contragent':
        return 'Contragent qabul qildi';
      case 'delivered_to_punkt':
        return 'Punktga yetkazildi';
      case 'assigned_to_agent':
        return 'Agentga yuborildi';
      case 'confirmed_by_agent':
        return 'Agent tasdiqladi';
      case 'confirmed_by_customer':
        return 'Mijoz tasdiqladi';
      default:
        return status;
    }
  };

  const getPunktStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'requested':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Mijoz:</Text>
        <Text style={styles.value}>{order.user.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Telefon:</Text>
        <Text style={styles.value}>{order.phoneNumber}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Manzil:</Text>
        <Text style={styles.value}>
          {order.deliveryViloyat.name}
          {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
          {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Mahsulotlar:</Text>
        <Text style={styles.value}>{order.itemCount} ta</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Jami:</Text>
        <Text style={[styles.value, styles.price]}>{formatPrice(order.totalPrice)}</Text>
      </View>

      {order.assignedToAgent && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Agent:</Text>
          <Text style={[styles.value, styles.agentValue]}>
            {order.assignedToAgent.name}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.punktStatusBadge, { backgroundColor: getPunktStatusColor(order.punktStatus) + '20' }]}>
            <Text style={[styles.punktStatusText, { color: getPunktStatusColor(order.punktStatus) }]}>
              {order.punktStatus === 'pending' && 'Kutilmoqda'}
              {order.punktStatus === 'confirmed' && 'Tasdiqlandi'}
              {order.punktStatus === 'rejected' && 'Rad etildi'}
              {order.punktStatus === 'requested' && 'So\'rov yuborildi'}
            </Text>
          </View>
          {order.assignedToAgent && (
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>Agentga yuborilgan</Text>
            </View>
          )}
        </View>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  agentValue: {
    color: '#5856D6',
    fontWeight: '600',
  },
  agentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#5856D620',
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5856D6',
  },
  punktStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  punktStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});

