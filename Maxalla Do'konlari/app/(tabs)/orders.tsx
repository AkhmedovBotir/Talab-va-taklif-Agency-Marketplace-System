import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DeliveryProvider, Order } from '../../services/api';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt';

export default function OrdersScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [showDeliveryProviderModal, setShowDeliveryProviderModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, statusFilter]);

  const loadOrders = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await apiService.getOrders(token, {
        status: statusFilter,
        page: 1,
        limit: 50,
      });
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error: any) {
      if (!isRefresh) {
        Alert.alert('Xatolik', error.message || 'Buyurtmalarni yuklashda xatolik');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadOrders(true);
  };

  const loadDeliveryProviders = async () => {
    if (!token) return;
    setLoadingProviders(true);
    try {
      const response = await apiService.getDeliveryProviders(token, 'active');
      if (response.success && response.data) {
        setDeliveryProviders(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Yetkazib beruvchilarni yuklashda xatolik');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleRespondToOrder = async (orderId: string, response: 'accepted' | 'rejected') => {
    if (!token) return;

    setAcceptingOrder(true);
    try {
      const result = await apiService.respondToOrderRequest(token, orderId, response);
      
      if (result.success) {
        Alert.alert(
          'Muvaffaqiyatli',
          response === 'accepted' ? 'Buyurtma qabul qilindi' : 'Buyurtma rad etildi'
        );
        setShowOrderDetailModal(false);
        setSelectedOrderDetail(null);
        loadOrders();
      }
    } catch (error: any) {
      Alert.alert(
        'Xatolik',
        error.message || (response === 'accepted' ? 'Buyurtmani qabul qilishda xatolik' : 'Buyurtmani rad etishda xatolik')
      );
    } finally {
      setAcceptingOrder(false);
    }
  };

  const handleSendToDeliveryProvider = async (deliveryProviderId: string) => {
    if (!token || !selectedOrder) return;

    setSendingOrder(true);
    try {
      const response = await apiService.sendOrderToDeliveryProvider(
        token,
        selectedOrder._id,
        { deliveryProviderId }
      );
      
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Buyurtma yetkazib beruvchiga yuborildi');
        setShowDeliveryProviderModal(false);
        setSelectedOrder(null);
        setShowOrderDetailModal(false);
        setSelectedOrderDetail(null);
        loadOrders();
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Yetkazib beruvchiga yuborishda xatolik');
    } finally {
      setSendingOrder(false);
    }
  };

  const openOrderDetailModal = async (order: Order) => {
    setSelectedOrderDetail(order);
    setShowOrderDetailModal(true);
    
    // Load full order details
    if (token) {
      setLoadingOrderDetail(true);
      try {
        const response = await apiService.getOrderById(token, order._id);
        if (response.success && response.data) {
          const orderDetail = response.data;
          
          // Load product details if product is just an ID
          const productPromises: Promise<void>[] = [];
          const newProductsMap: Record<string, any> = {};
          
          orderDetail.items.forEach((item) => {
            if (typeof item.product === 'string' && item.productType === 'maxalla') {
              const productId = item.product;
              if (!newProductsMap[productId]) {
                productPromises.push(
                  apiService.getMaxallaProductById(token, productId)
                    .then((productResponse) => {
                      if (productResponse.success && productResponse.data) {
                        newProductsMap[productId] = productResponse.data.baseProduct;
                      }
                    })
                    .catch(() => {
                      // Ignore errors for individual products
                    })
                );
              }
            }
          });
          
          await Promise.all(productPromises);
          setProductsMap(newProductsMap);
          
          // Merge product data into order items
          const enrichedItems = orderDetail.items.map((item) => {
            if (typeof item.product === 'string' && newProductsMap[item.product]) {
              return {
                ...item,
                product: newProductsMap[item.product],
              };
            }
            return item;
          });
          
          setSelectedOrderDetail({
            ...orderDetail,
            items: enrichedItems,
          });
        }
      } catch (error: any) {
        Alert.alert('Xatolik', error.message || 'Buyurtma ma\'lumotlarini yuklashda xatolik');
      } finally {
        setLoadingOrderDetail(false);
      }
    }
  };

  const openDeliveryProviderModal = (order: Order) => {
    const request = order.contragentRequests[0];
    if (request?.status === 'accepted' && !request.deliveryProvider) {
      setSelectedOrder(order);
      setShowDeliveryProviderModal(true);
      loadDeliveryProviders();
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutayotgan';
      case 'accepted':
        return 'Qabul qilingan';
      case 'rejected':
        return 'Rad etilgan';
      case 'delivered_to_punkt':
        return 'Punktga yetkazilgan';
      default:
        return status;
    }
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

  const renderOrder = ({ item }: { item: Order }) => {
    const request = item.contragentRequests[0];
    const isPending = request?.status === 'pending';
    const isAccepted = request?.status === 'accepted';
    const isSent = request?.deliveryProvider !== null;

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => openOrderDetailModal(item)}
        activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request?.status || 'pending') + '20' },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(request?.status || 'pending') },
              ]}>
              {getStatusText(request?.status || 'pending')}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.customerPhone}>{item.user.phone}</Text>
        </View>

        <View style={styles.orderItems}>
          <Text style={styles.itemsCount}>{item.itemCount} ta mahsulot</Text>
          <Text style={styles.totalPrice}>{formatCurrency(item.totalPrice)} so'm</Text>
        </View>

        {item.deliveryNote && (
          <View style={styles.deliveryNote}>
            <Text style={styles.deliveryNoteLabel}>Yetkazib berish eslatmasi:</Text>
            <Text style={styles.deliveryNoteText}>{item.deliveryNote}</Text>
          </View>
        )}

        {isAccepted && !isSent && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => openDeliveryProviderModal(item)}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Yetkazib Beruvchiga Yuborish</Text>
          </TouchableOpacity>
        )}

        {isSent && request.deliveryProvider && (
          <View style={styles.sentInfo}>
            <View style={styles.sentInfoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.sentText}>Yetkazib beruvchiga yuborilgan</Text>
            </View>
            <Text style={styles.deliveryProviderName}>
              {request.deliveryProvider.name} ({request.deliveryProvider.phone})
            </Text>
            {request.sentToDeliveryProviderAt && (
              <Text style={styles.sentDate}>
                {new Date(request.sentToDeliveryProviderAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buyurtmalar</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === undefined && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(undefined)}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === undefined && styles.filterButtonTextActive,
              ]}>
              Hammasi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'pending' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('pending')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'pending' && styles.filterButtonTextActive,
              ]}>
              Kutayotgan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'accepted' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('accepted')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'accepted' && styles.filterButtonTextActive,
              ]}>
              Qabul qilingan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'rejected' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('rejected')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'rejected' && styles.filterButtonTextActive,
              ]}>
              Rad etilgan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'delivered_to_punkt' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('delivered_to_punkt')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'delivered_to_punkt' && styles.filterButtonTextActive,
              ]}>
              Yetkazilgan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal
        visible={showOrderDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowOrderDetailModal(false);
          setSelectedOrderDetail(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buyurtma batafsil</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowOrderDetailModal(false);
                  setSelectedOrderDetail(null);
                }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {loadingOrderDetail ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : selectedOrderDetail ? (
              <ScrollView 
                contentContainerStyle={styles.orderDetailContent}
                showsVerticalScrollIndicator={true}>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Buyurtma raqami</Text>
                  <Text style={styles.orderDetailValue}>{selectedOrderDetail.orderNumber}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Mijoz</Text>
                  <Text style={styles.orderDetailValue}>
                    {selectedOrderDetail.user.firstName} {selectedOrderDetail.user.lastName}
                  </Text>
                  <Text style={styles.orderDetailValue}>{selectedOrderDetail.user.phone}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Mahsulotlar ({selectedOrderDetail.items.length} ta)</Text>
                  {selectedOrderDetail.items.map((item, index) => {
                    const product = typeof item.product === 'string' ? null : item.product;
                    return (
                      <View key={index} style={styles.orderItemDetail}>
                        {product ? (
                          <>
                            <Text style={styles.orderItemName}>{product.name}</Text>
                            <View style={styles.orderItemDetailsRow}>
                              <Text style={styles.orderItemInfo}>
                                Miqdor: {item.quantity} {product.unit || 'dona'}
                              </Text>
                              <Text style={styles.orderItemInfo}>
                                Narx: {formatCurrency(item.price)} so'm
                              </Text>
                            </View>
                            {product.category && (
                              <Text style={styles.orderItemCategory}>
                                {product.category.name}
                                {product.subcategory && ` / ${product.subcategory.name}`}
                              </Text>
                            )}
                          </>
                        ) : (
                          <>
                            <Text style={styles.orderItemName}>Mahsulot</Text>
                            <View style={styles.orderItemDetailsRow}>
                              <Text style={styles.orderItemInfo}>
                                Miqdor: {item.quantity}
                              </Text>
                              <Text style={styles.orderItemInfo}>
                                Narx: {formatCurrency(item.price)} so'm
                              </Text>
                            </View>
                          </>
                        )}
                        <Text style={styles.orderItemTotal}>
                          Jami: {formatCurrency(item.price * item.quantity)} so'm
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Jami narx</Text>
                  <Text style={styles.orderDetailTotalPrice}>
                    {formatCurrency(selectedOrderDetail.totalPrice)} so'm
                  </Text>
                </View>

                {selectedOrderDetail.deliveryNote && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailLabel}>Yetkazib berish eslatmasi</Text>
                    <Text style={styles.orderDetailValue}>{selectedOrderDetail.deliveryNote}</Text>
                  </View>
                )}

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Yetkazib berish manzili</Text>
                  <Text style={styles.orderDetailValue}>
                    {selectedOrderDetail.deliveryViloyat.name}
                    {selectedOrderDetail.deliveryTuman && `, ${selectedOrderDetail.deliveryTuman.name}`}
                    {selectedOrderDetail.deliveryMfy && `, ${selectedOrderDetail.deliveryMfy.name}`}
                  </Text>
                </View>

                {selectedOrderDetail.contragentRequests[0] && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailLabel}>Holati</Text>
                    <View
                      style={[
                        styles.statusBadgeInline,
                        { backgroundColor: getStatusColor(selectedOrderDetail.contragentRequests[0].status) + '20' },
                      ]}>
                      <Text
                        style={[
                          styles.statusTextInline,
                          { color: getStatusColor(selectedOrderDetail.contragentRequests[0].status) },
                        ]}>
                        {getStatusText(selectedOrderDetail.contragentRequests[0].status)}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedOrderDetail.contragentRequests[0]?.deliveryProvider && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailLabel}>Yetkazib beruvchi</Text>
                    <Text style={styles.orderDetailValue}>
                      {selectedOrderDetail.contragentRequests[0].deliveryProvider.name}
                    </Text>
                    <Text style={styles.orderDetailValue}>
                      {selectedOrderDetail.contragentRequests[0].deliveryProvider.phone}
                    </Text>
                  </View>
                )}

                {selectedOrderDetail.contragentRequests[0]?.status === 'pending' && (
                  <View style={styles.orderDetailSection}>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.sendButtonModal, styles.acceptButton, { flex: 1 }]}
                        onPress={() => handleRespondToOrder(selectedOrderDetail._id, 'accepted')}
                        disabled={acceptingOrder}
                        activeOpacity={0.8}>
                        {acceptingOrder ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.sendButtonModalText}>Qabul Qilish</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sendButtonModal, styles.rejectButton, { flex: 1 }]}
                        onPress={() => handleRespondToOrder(selectedOrderDetail._id, 'rejected')}
                        disabled={acceptingOrder}
                        activeOpacity={0.8}>
                        <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.sendButtonModalText}>Rad Etish</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedOrderDetail.contragentRequests[0]?.status === 'accepted' && 
                 !selectedOrderDetail.contragentRequests[0]?.deliveryProvider && (
                  <View style={styles.orderDetailSection}>
                    <TouchableOpacity
                      style={styles.sendButtonModal}
                      onPress={() => {
                        setShowOrderDetailModal(false);
                        setSelectedOrder(selectedOrderDetail);
                        setShowDeliveryProviderModal(true);
                        loadDeliveryProviders();
                      }}
                      activeOpacity={0.8}>
                      <Ionicons name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.sendButtonModalText}>Yetkazib Beruvchiga Yuborish</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Delivery Provider Selection Modal */}
      <Modal
        visible={showDeliveryProviderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowDeliveryProviderModal(false);
          setSelectedOrder(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yetkazib Beruvchini Tanlang</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDeliveryProviderModal(false);
                  setSelectedOrder(null);
                }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {loadingProviders ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              <FlatList
                data={deliveryProviders}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.providerItem}
                    onPress={() => handleSendToDeliveryProvider(item._id)}
                    disabled={sendingOrder}>
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{item.name}</Text>
                      <Text style={styles.providerPhone}>{item.phone}</Text>
                    </View>
                    {sendingOrder && (
                      <ActivityIndicator size="small" color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      Faol yetkazib beruvchilar topilmadi
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  itemsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  deliveryNote: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  deliveryNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  deliveryNoteText: {
    fontSize: 14,
    color: '#000',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sentInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F9F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  sentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
  },
  deliveryProviderName: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  sentDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modalLoading: {
    padding: 32,
    alignItems: 'center',
  },
  providerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  providerPhone: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  orderDetailContent: {
    paddingBottom: 20,
  },
  orderDetailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  orderDetailValue: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  orderDetailTotalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  orderItemDetail: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  orderItemDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  orderItemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderItemInfo: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
    marginBottom: 4,
  },
  orderItemCategory: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  statusBadgeInline: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextInline: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  sendButtonModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    marginLeft: 5,
  },
});
