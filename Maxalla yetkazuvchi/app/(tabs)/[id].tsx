import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, Order } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { useSnackbar } from '../../components/SnackbarProvider';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { token } = useDeliveryProviderAuth();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadOrder();
  }, [id, token]);

  const loadOrder = async () => {
    if (!token || !id) return;
    try {
      const response = await apiService.getOrderById(token, id);
      if (response.data) setOrder(response.data);
    } catch (error: any) {
      showSnackbar(error.message || 'Buyurtma yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `${new Intl.NumberFormat('uz-UZ').format(price)} so'm`;

  const getNextAction = () => {
    if (!order) return null;
    if (order.courier_accepted_at && order.delivered_at && order.payment_collected_at && order.payment_transferred_to_shop_at) {
      return null;
    }

    // API turli status nomlari qaytarishi mumkin, vaqt maydonlari bo'yicha ham tekshiramiz
    if (!order.courier_accepted_at && (order.status === 'approved' || order.status === 'pending' || order.status === 'new')) {
      return { key: 'accept', label: 'Buyurtmani qabul qilish' };
    }
    if (order.courier_accepted_at && !order.delivered_at) {
      return { key: 'deliver', label: 'Yetkazib berildi deb belgilash' };
    }
    if (order.delivered_at && !order.payment_collected_at) {
      return { key: 'collect', label: 'To\'lovni qabul qilish' };
    }
    if (order.payment_collected_at && !order.payment_transferred_to_shop_at) {
      return { key: 'transfer', label: 'To\'lovni do\'konga topshirish' };
    }

    if (order.status === 'accepted') return { key: 'deliver', label: 'Yetkazib berildi deb belgilash' };
    if (order.status === 'delivered') return { key: 'collect', label: 'To\'lovni qabul qilish' };
    if (order.status === 'payment_collected') return { key: 'transfer', label: 'To\'lovni do\'konga topshirish' };
    return null;
  };

  const runAction = async () => {
    if (!token || !id || !order) return;
    const action = getNextAction();
    if (!action) return;

    const execute = async () => {
      setActionLoading(true);
      try {
        let response;
        if (action.key === 'accept') response = await apiService.acceptOrder(token, id);
        else if (action.key === 'deliver') response = await apiService.deliverOrder(token, id);
        else if (action.key === 'collect') response = await apiService.collectPayment(token, id);
        else response = await apiService.transferPaymentToShop(token, id);

        if (response.data) setOrder(response.data);
        await loadOrder();
        showSnackbar(response.message || 'Amal bajarildi', 'success');
      } catch (error: any) {
        showSnackbar(error.message || 'Amal bajarilmadi', 'error');
      } finally {
        setActionLoading(false);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`${action.label}?`)) await execute();
      return;
    }

    // Mobileda actionlarni tez va barqaror ishlashi uchun to'g'ridan-to'g'ri ishga tushiramiz.
    await execute();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Buyurtma' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Buyurtma topilmadi' }} />
        <View style={styles.center}>
          <Text style={styles.error}>Buyurtma topilmadi</Text>
        </View>
      </>
    );
  }

  const action = getNextAction();

  return (
    <>
      <Stack.Screen options={{ title: `Buyurtma #${order.id || order._id}` }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        <View style={styles.section}>
          <Text style={styles.title}>Buyurtma #{order.id || order._id}</Text>
          <Text style={styles.meta}>Status: {order.status}</Text>
          <Text style={styles.meta}>Yaratilgan: {new Date(order.createdAt).toLocaleString('uz-UZ')}</Text>
          <Text style={styles.meta}>Jami: {formatPrice(order.totalPrice || 0)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
          {order.items.map((item, idx) => (
            <View key={`${item.local_shop_product_id || idx}`} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product_name || item.product?.name || 'Mahsulot'}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} {item.unit || 'dona'}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.line_total || item.price * item.quantity || 0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bosqichlar</Text>
          <Text style={styles.meta}>Qabul qilingan: {order.courier_accepted_at ? 'Ha' : 'Yo\'q'}</Text>
          <Text style={styles.meta}>Yetkazilgan: {order.delivered_at ? 'Ha' : 'Yo\'q'}</Text>
          <Text style={styles.meta}>To&apos;lov olingan: {order.payment_collected_at ? 'Ha' : 'Yo\'q'}</Text>
          <Text style={styles.meta}>
            Do&apos;konga topshirilgan: {order.payment_transferred_to_shop_at ? 'Ha' : 'Yo\'q'}
          </Text>
        </View>

        {action ? (
          <TouchableOpacity
            style={[styles.actionButton, actionLoading && { opacity: 0.6 }]}
            disabled={actionLoading}
            onPress={runAction}
          >
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{action.label}</Text>}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  error: { fontSize: 16, color: '#DC2626' },
  section: {
    width: '100%',
    maxWidth: 980,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  meta: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: { fontSize: 15, color: '#111827', fontWeight: '600' },
  itemMeta: { fontSize: 13, color: '#6B7280' },
  itemTotal: { fontSize: 14, color: '#007AFF', fontWeight: '700' },
  actionButton: {
    width: '100%',
    maxWidth: 980,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
