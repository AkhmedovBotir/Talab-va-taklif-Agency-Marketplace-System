import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, Order } from '../../../../services/api';

export default function OrderViewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await apiService.getContragentOrderById(orderId);
      setOrder(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Buyurtmani yuklashda xatolik');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const getCurrentRequest = (order: Order) => {
    return order.contragentRequests[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'delivered_to_punkt':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'delivered_to_punkt':
        return 'Yetkazildi';
      default:
        return status;
    }
  };

  const handleAccept = async () => {
    if (!order) return;

    Alert.alert(
      'Tasdiqlash',
      'Buyurtmani qabul qilmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            setProcessing(true);
            try {
              await apiService.respondToOrder(order._id, { response: 'accepted' });
              Alert.alert('Muvaffaqiyat', 'Buyurtma qabul qilindi', [
                {
                  text: 'OK',
                  onPress: () => {
                    loadOrder();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Buyurtmani qabul qilishda xatolik');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!order) return;

    Alert.alert(
      'Tasdiqlash',
      'Buyurtmani rad etmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Rad etish',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await apiService.respondToOrder(order._id, { response: 'rejected' });
              Alert.alert('Muvaffaqiyat', 'Buyurtma rad etildi', [
                {
                  text: 'OK',
                  onPress: () => {
                    loadOrder();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Buyurtmani rad etishda xatolik');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeliver = async () => {
    if (!order) return;

    Alert.alert(
      'Tasdiqlash',
      'Buyurtma punktga yetkazilganini tasdiqlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          onPress: async () => {
            setProcessing(true);
            try {
              await apiService.deliverOrderToPunkt(order._id);
              Alert.alert('Muvaffaqiyat', 'Buyurtma punktga yetkazildi', [
                {
                  text: 'OK',
                  onPress: () => {
                    loadOrder();
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Buyurtmani yetkazishda xatolik');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Buyurtma topilmadi</Text>
        </View>
      </View>
    );
  }

  const request = getCurrentRequest(order);
  const statusColor = getStatusColor(request.status);

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Naqd pul';
      case 'card':
        return 'Karta';
      case 'transfer':
        return 'O\'tkazma';
      default:
        return method;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'paid':
        return 'To\'langan';
      case 'refunded':
        return 'Qaytarilgan';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

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
        <Text style={styles.headerTitle}>Buyurtma ma'lumotlari</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Buyurtma ma'lumotlari</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(request.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyurtma raqami</Text>
            <Text style={styles.infoValue}>{order.orderNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Punkt</Text>
            <Text style={styles.infoValue}>{order.currentPunkt.name}</Text>
          </View>

          {order.currentPunkt.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Punkt telefon</Text>
              <Text style={styles.infoValue}>{order.currentPunkt.phone}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mijoz telefon</Text>
            <Text style={styles.infoValue}>{order.phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>So'rov vaqti</Text>
            <Text style={styles.infoValue}>
              {new Date(request.requestedAt).toLocaleString('uz-UZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {request.respondedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Javob vaqti</Text>
              <Text style={styles.infoValue}>
                {new Date(request.respondedAt).toLocaleString('uz-UZ', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {request.deliveredToPunktAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yetkazilgan vaqt</Text>
              <Text style={styles.infoValue}>
                {new Date(request.deliveredToPunktAt).toLocaleString('uz-UZ', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Address Card */}
        {(order.deliveryViloyat || order.deliveryTuman || order.deliveryMfy) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Yetkazib berish manzili</Text>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
            </View>

            {order.deliveryViloyat && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Viloyat</Text>
                <Text style={styles.infoValue}>{order.deliveryViloyat.name}</Text>
              </View>
            )}

            {order.deliveryTuman && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tuman</Text>
                <Text style={styles.infoValue}>{order.deliveryTuman.name}</Text>
              </View>
            )}

            {order.deliveryMfy && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MFY</Text>
                <Text style={styles.infoValue}>{order.deliveryMfy.name}</Text>
              </View>
            )}

            {order.deliveryNote && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Izoh</Text>
                <Text style={styles.infoValue}>{order.deliveryNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Items Card */}
        {order.items && order.items.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mahsulotlar ({order.itemCount || order.items.length})</Text>
              <Ionicons name="cube-outline" size={20} color="#007AFF" />
            </View>

            {order.items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  {item.product.images && item.product.images.length > 0 && (
                    <Image
                      source={{ uri: item.product.images[0] }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    {item.product.productCode && (
                      <Text style={styles.itemCode}>Kod: {item.product.productCode}</Text>
                    )}
                    <Text style={styles.itemQuantity}>
                      Miqdor: {item.quantity} dona
                    </Text>
                  </View>
                </View>

                <View style={styles.itemPrices}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Asl narx:</Text>
                    <Text style={styles.priceValue}>{formatPrice(item.originalPrice)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Sotuv narxi:</Text>
                    <Text style={styles.priceValueBold}>{formatPrice(item.price)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>KPI bonus:</Text>
                    <Text style={styles.priceValueKpi}>
                      {item.kpiBonusPercent}% ({formatPrice((item.price - item.originalPrice) * item.quantity)})
                    </Text>
                  </View>
                  <View style={[styles.priceRow, styles.itemTotalRow]}>
                    <Text style={styles.priceLabelBold}>Jami:</Text>
                    <Text style={styles.priceValueBold}>
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>To'lov ma'lumotlari</Text>
            <Ionicons name="card-outline" size={20} color="#007AFF" />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To'lov usuli</Text>
            <Text style={styles.infoValue}>{getPaymentMethodText(order.paymentMethod)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To'lov holati</Text>
            <Text
              style={[
                styles.infoValue,
                order.paymentStatus === 'paid' && styles.paidStatus,
                order.paymentStatus === 'pending' && styles.pendingStatus,
              ]}
            >
              {getPaymentStatusText(order.paymentStatus)}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Jami summa</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalPrice)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Qabul qilish</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Rad etish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'accepted' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={handleDeliver}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Punktga yetkazildi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  deliverButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  itemPrices: {
    gap: 6,
    paddingLeft: 72,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 13,
    color: '#666',
  },
  priceValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceValueKpi: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  itemTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  paidStatus: {
    color: '#34C759',
    fontWeight: '600',
  },
  pendingStatus: {
    color: '#FF9500',
    fontWeight: '600',
  },
});


