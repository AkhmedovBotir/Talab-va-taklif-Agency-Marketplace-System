import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiService, ContragentPayment } from '../../../services/api';
import { formatNumberDisplay } from '../../../utils/formatNumber';

export default function PaymentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<ContragentPayment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (num: number): string => {
    return formatNumberDisplay(num) + ' so\'m';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchPayment = async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPaymentById(paymentId);
      setPayment(response.data);
    } catch (err: any) {
      setError(err.message || 'To\'lov ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayment();
    }, [paymentId])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  if (error || !payment) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'To\'lov topilmadi'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPayment}>
          <Text style={styles.retryButtonText}>Qayta urinish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To'lov ma'lumotlari</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>To'lov summasi</Text>
          <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
          <View style={styles.statusContainer}>
            {payment.status === 'paid' ? (
              <View style={[styles.statusBadge, styles.statusPaid]}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.statusText}>To'langan</Text>
              </View>
            ) : payment.isOverdue ? (
              <View style={[styles.statusBadge, styles.statusOverdue]}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.statusText}>Muddati o'tgan</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusPending]}>
                <Ionicons name="time" size={16} color="#FF9500" />
                <Text style={styles.statusText}>Kutilmoqda</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To'lov ma'lumotlari</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Holat</Text>
            <Text style={styles.detailValue}>
              {payment.status === 'paid' ? 'To\'langan' : 
               payment.status === 'cancelled' ? 'Bekor qilingan' : 'Kutilmoqda'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Muddat</Text>
            <Text style={styles.detailValue}>{formatDate(payment.dueDate)}</Text>
          </View>

          {payment.paidAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To'langan sana</Text>
              <Text style={styles.detailValue}>{formatDateTime(payment.paidAt)}</Text>
            </View>
          )}

          {payment.paidBy && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To'lov qilgan</Text>
              <View style={styles.paidByContainer}>
                <Text style={styles.detailValue}>{payment.paidBy.name}</Text>
                <Text style={styles.detailSubtext}>{payment.paidBy.phone}</Text>
              </View>
            </View>
          )}

          {payment.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Izoh</Text>
              <Text style={styles.detailValue}>{payment.notes}</Text>
            </View>
          )}
        </View>

        {/* Orders */}
        {payment.orders && payment.orders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Buyurtmalar ({payment.orders.length} ta)
            </Text>
            {payment.orders.map((order, index) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Jami summa</Text>
                    <Text style={styles.orderDetailValue}>
                      {formatCurrency(order.totalPrice)}
                    </Text>
                  </View>
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>KPI bonus</Text>
                    <Text style={styles.orderDetailValue}>
                      {formatCurrency(order.totalKpiPrice)}
                    </Text>
                  </View>
                  <View style={[styles.orderDetailRow, styles.orderDetailRowTotal]}>
                    <Text style={styles.orderDetailLabelTotal}>To'lov summasi</Text>
                    <Text style={styles.orderDetailValueTotal}>
                      {formatCurrency(order.totalPrice - order.totalKpiPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sana ma'lumotlari</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Yaratilgan</Text>
            <Text style={styles.detailValue}>{formatDateTime(payment.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Yangilangan</Text>
            <Text style={styles.detailValue}>{formatDateTime(payment.updatedAt)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  marginLeft: -4,
  marginRight: 8,
  width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  paidByContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderDetails: {
    gap: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  orderDetailLabelTotal: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  orderDetailValueTotal: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



