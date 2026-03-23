import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Order } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { formatPhoneForDisplay } from '../../utils/phoneFormatter';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const { token } = useDeliveryProviderAuth();
  const router = useRouter();

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!token || !id) return;

    try {
      const response = await apiService.getOrderById(token, id);
      if (response.success && response.data) {
        const data: any = response.data;

        // Backend turlicha format qaytarishi mumkin, shu joyda bir xillashtiramiz
        let normalizedOrder: Order | null = null;

        if (Array.isArray(data) && data.length > 0) {
          normalizedOrder = data[0] as Order;
        } else if (data.order) {
          normalizedOrder = data.order as Order;
        } else {
          normalizedOrder = data as Order;
        }

        setOrder(normalizedOrder);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Buyurtma ma\'lumotlarini yuklashda xatolik');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!token || !id) return;

    Alert.alert(
      'Tasdiqlash',
      'Buyurtmani yetkazib berildi deb belgilamoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          onPress: async () => {
            setMarkingDelivered(true);
            try {
              const response = await apiService.markOrderAsDelivered(token, id);
              if (response.success && response.data) {
                // Statusni yangilash
                setOrder({
                  ...order!,
                  status: 'confirmed_by_customer',
                  customerConfirmed: true,
                  customerConfirmedAt: response.data.customerConfirmedAt || new Date().toISOString(),
                  deliveredAt: response.data.deliveredAt || new Date().toISOString(),
                });
                Alert.alert('Muvaffaqiyatli', 'Buyurtma yetkazib berildi deb belgilandi');
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Xatolik yuz berdi');
            } finally {
              setMarkingDelivered(false);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed_by_customer':
        return '#34C759';
      case 'accepted_by_contragent':
        return '#007AFF';
      case 'requested_to_contragent':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed_by_customer':
        return 'Yetkazib berilgan';
      case 'accepted_by_contragent':
        return 'Qabul qilingan';
      case 'requested_to_contragent':
        return 'So\'rov yuborilgan';
      default:
        return status;
    }
  };

  const title = order?.orderNumber || 'Buyurtma';

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Buyurtma topilmadi' }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Buyurtma topilmadi</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <View style={styles.orderNumberContainer}>
          <Ionicons name="receipt" size={24} color="#007AFF" />
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Ionicons
            name={
              order.status === 'confirmed_by_customer'
                ? 'checkmark-circle'
                : order.status === 'accepted_by_contragent'
                ? 'checkmark'
                : 'time'
            }
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Ionicons name="person" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Ism:</Text>
          </View>
          <Text style={styles.infoValue}>
            {order.user.firstName} {order.user.lastName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Ionicons name="call" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Telefon:</Text>
          </View>
          <Text style={styles.infoValue}>
            {formatPhoneForDisplay(order.user.phone)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Yetkazib berish telefon:</Text>
          </View>
          <Text style={styles.infoValue}>
            {formatPhoneForDisplay(order.phoneNumber)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
        </View>
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={18} color="#6B7280" />
          <Text style={styles.addressText}>
            {order.deliveryViloyat.name}
            {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
            {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
          </Text>
        </View>
        {order.deliveryNote && (
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle" size={18} color="#FF9500" />
            <Text style={styles.noteText}>Eslatma: {order.deliveryNote}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
        </View>
        {order.items && order.items.length > 0 ? (
          order.items.map((item: any, index: number) => {
            const productName =
              item.product?.name ??
              item.name ??
              item.productName ??
              'Mahsulot';

            const quantity =
              item.quantity ?? item.count ?? 1;

            const unitPrice =
              item.price ??
              item.product?.price ??
              0;

            return (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemName}>{productName}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>Miqdor: {quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(unitPrice)} x {quantity} = {formatPrice(unitPrice * quantity)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyItemsText}>Mahsulotlar topilmadi yoki yuklanmadi</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Jami:</Text>
          <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
        </View>
      </View>

      {order.status !== 'confirmed_by_customer' && !order.customerConfirmed && (
        <TouchableOpacity
          style={[styles.deliverButton, markingDelivered && styles.buttonDisabled]}
          onPress={handleMarkDelivered}
          disabled={markingDelivered}
          activeOpacity={0.8}
        >
          {markingDelivered ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.deliverButtonText}>Yetkazib berildi deb belgilash</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {order.deliveredAt && (
        <View style={styles.section}>
          <Text style={styles.deliveredText}>
            Yetkazib berilgan sana: {new Date(order.deliveredAt).toLocaleString('uz-UZ')}
          </Text>
        </View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'right',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 24,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20,
  },
  itemCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -0.5,
  },
  deliverButton: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deliverButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deliveredText: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
