import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReviewModal from '../../components/ReviewModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { Order } from '../../services/api';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ productId: string; productName: string } | null>(null);

  const loadOrder = useCallback(async (isRefresh: boolean = false) => {
    if (!id || !token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiService.getOrderById(id, token);
      if (response.success && response.data) {
        setOrder(response.data);
        console.log("order", response.data);
      }
    } catch (error: any) {
      showError(error.message || 'Buyurtmani yuklashda xatolik yuz berdi');
      router.push('/order' as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id && token) {
      loadOrder(false);
    }
  }, [id, token, loadOrder]);

  // Auto refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (id && token) {
        loadOrder(false);
      }
    }, [id, token, loadOrder])
  );

  const handleRefresh = useCallback(() => {
    if (id && token) {
      loadOrder(true);
    }
  }, [id, token, loadOrder]);

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Buyurtmani bekor qilish',
      'Buyurtmani bekor qilmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Ha, bekor qilish',
          style: 'destructive',
          onPress: async () => {
            if (!id || !token) return;
            try {
              setCancelling(true);
              const response = await apiService.cancelOrder(id, token);
              if (response.success) {
                setOrder(response.data);
                showSuccess('Buyurtma bekor qilindi');
              }
            } catch (error: any) {
              showError(error.message || 'Buyurtmani bekor qilishda xatolik yuz berdi');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmDelivery = () => {
    if (!order) return;

    Alert.alert(
      'Buyurtmani tasdiqlash',
      'Buyurtmani olganingizni tasdiqlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Ha, tasdiqlash',
          onPress: async () => {
            if (!id || !token) return;
            try {
              setConfirming(true);
              const response = await apiService.confirmDelivery(id, token);
              if (response.success && response.data) {
                setOrder(response.data);
                showSuccess('Buyurtma muvaffaqiyatli tasdiqlandi');
              }
            } catch (error: any) {
              showError(error.message || 'Buyurtmani tasdiqlashda xatolik yuz berdi');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewPress = (productId: string, productName: string) => {
    setSelectedProduct({ productId, productName });
    setReviewModalVisible(true);
  };

  const handleReviewSuccess = () => {
    if (id && token) {
      loadOrder();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed_by_punkt':
        return '#007AFF';
      case 'requested_to_contragent':
        return '#5856D6';
      case 'accepted_by_contragent':
        return '#5AC8FA';
      case 'delivered_to_punkt':
        return '#AF52DE';
      case 'assigned_to_agent':
        return '#FF2D55';
      case 'confirmed_by_agent':
        return '#34C759';
      case 'confirmed_by_customer':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'confirmed_by_punkt':
        return 'Punkt tomonidan tasdiqlandi';
      case 'requested_to_contragent':
        return 'Kontragentga so\'rov yuborildi';
      case 'accepted_by_contragent':
        return 'Kontragent tomonidan qabul qilindi';
      case 'delivered_to_punkt':
        return 'Punktga yetkazildi';
      case 'assigned_to_agent':
        return 'Agentga tayinlandi';
      case 'confirmed_by_agent':
        return 'Agent tomonidan tasdiqlandi';
      case 'confirmed_by_customer':
        return 'Mijoz tomonidan tasdiqlandi';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.push('/order' as any)}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtma</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.push('/order' as any)}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtma</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Buyurtma topilmadi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.push('/order' as any)}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma #{order.orderNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Holat</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
          {(order.paymentStatus === 'paid' || order.customerConfirmed || order.paymentStatus === 'pending') && (
            <View style={styles.statusIndicators}>
              {order.paymentStatus === 'paid' ? (
                <View style={styles.paidIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.paidText}>To'lov qilingan</Text>
                </View>
              ) : order.paymentStatus === 'pending' ? (
                <View style={styles.paymentPendingIndicator}>
                  <Ionicons name="time-outline" size={20} color="#FF9500" />
                  <Text style={styles.paymentPendingText}>To'lov kutilmoqda</Text>
                </View>
              ) : null}
              {order.confirmedByAgent && order.agentConfirmedAt && (
                <View style={styles.agentConfirmedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  <Text style={styles.agentConfirmedText}>Agent tomonidan tasdiqlandi</Text>
                  <Text style={styles.agentConfirmedDate}>
                    {formatDate(order.agentConfirmedAt)}
                  </Text>
                </View>
              )}
              {order.customerConfirmed && (
                <View style={styles.confirmedIndicator}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#34C759" />
                  <Text style={styles.confirmedText}>Mijoz tomonidan tasdiqlandi</Text>
                  {order.customerConfirmedAt && (
                    <Text style={styles.confirmedDate}>
                      {formatDate(order.customerConfirmedAt)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
          {order.items.map((item, index) => {
            const imageUri = item.product.images && item.product.images.length > 0
              ? item.product.images[0]
              : undefined;
            const canReview = order.status === 'confirmed_by_customer';

            return (
              <View key={index} style={styles.orderItem}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#ccc" />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} ta × {formatPrice(item.price)}
                  </Text>
                  <Text style={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                  {canReview && (
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => handleReviewPress(item.product._id, item.product.name)}
                    >
                      <Ionicons name="star-outline" size={18} color="#007AFF" />
                      <Text style={styles.reviewButtonText}>Baholash</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma ma'lumotlari</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buyurtma raqami</Text>
              <Text style={styles.infoValue}>#{order.orderNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sana</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>To'lov usuli</Text>
              <Text style={styles.infoValue}>
                {order.paymentMethod === 'cash' ? 'Naqd pul' : 'Karta'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{order.phoneNumber}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
          <View style={styles.infoCard}>
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Viloyat:</Text>
              <Text style={styles.addressText}>{order.deliveryViloyat?.name || 'N/A'}</Text>
            </View>
            {order.deliveryTuman && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Tuman:</Text>
                <Text style={styles.addressText}>{order.deliveryTuman.name}</Text>
              </View>
            )}
            {order.deliveryMfy && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>MFY:</Text>
                <Text style={styles.addressText}>{order.deliveryMfy.name}</Text>
              </View>
            )}
            {order.deliveryNote && (
              <>
                <View style={styles.divider} />
                <View>
                  <Text style={styles.noteLabel}>Eslatma:</Text>
                  <Text style={styles.noteText}>{order.deliveryNote}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jami</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Mahsulotlar ({order.itemCount} ta)</Text>
              <Text style={styles.priceValue}>
                {formatPrice(order.totalOriginalPrice)}
              </Text>
            </View>
            {order.totalOriginalPrice > order.totalPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Chegirma</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{formatPrice(order.totalOriginalPrice - order.totalPrice)}
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Umumiy</Text>
              <Text style={styles.totalValue}>
                {formatPrice(order.totalPrice)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {order.status === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
                  <Text style={styles.cancelButtonText}>Buyurtmani bekor qilish</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {order.status === 'confirmed_by_agent' && !order.customerConfirmed && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmDelivery}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={24} color="#34C759" />
                  <Text style={styles.confirmButtonText}>Buyurtmani tasdiqlash</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      {selectedProduct && token && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedProduct(null);
          }}
          orderId={id || ''}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          token={token}
          onSuccess={handleReviewSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicators: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  confirmedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  confirmedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  confirmedDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  agentConfirmedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  agentConfirmedText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  agentConfirmedDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  paymentPendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentPendingText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    minWidth: 60,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e7',
    marginVertical: 12,
  },
  noteLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountValue: {
    color: '#34C759',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#e5e5e7',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#34C759',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});

