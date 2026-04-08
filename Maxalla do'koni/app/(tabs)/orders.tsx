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
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DeliveryProvider, Order, OrderAnalytics } from '../../services/api';

type OrderStatus = 'pending' | 'approved' | 'cancelled';
type OrdersTab = 'orders' | 'analytics';

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
  const [marketplaceUsersById, setMarketplaceUsersById] = useState<Record<string, { firstName: string; lastName: string }>>({});
  const [activeTab, setActiveTab] = useState<OrdersTab>('orders');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [analyticsFrom, setAnalyticsFrom] = useState('');
  const [analyticsTo, setAnalyticsTo] = useState('');
  const [acceptingPayment, setAcceptingPayment] = useState(false);

  const enrichOrdersWithMarketplaceUsers = async (sourceOrders: Order[]): Promise<Order[]> => {
    const userIds = Array.from(
      new Set(
        sourceOrders
          .map((item) => item.user?._id)
          .filter((id) => Boolean(id && !marketplaceUsersById[id]))
      )
    );

    if (userIds.length === 0) {
      return sourceOrders.map((order) => {
        const userFallback = marketplaceUsersById[order.user._id];
        if (!userFallback) return order;
        return {
          ...order,
          user: {
            ...order.user,
            firstName: order.user.firstName || userFallback.firstName,
            lastName: order.user.lastName || userFallback.lastName,
          },
        };
      });
    }

    let page = 1;
    const fetchedMap: Record<string, { firstName: string; lastName: string }> = {};

    while (page <= 20) {
      const usersResponse = await apiService.getNoAuthMarketplaceUsers({ page, limit: 100 });
      const users = usersResponse.data || [];
      users.forEach((u) => {
        if (u.id) {
          fetchedMap[String(u.id)] = {
            firstName: u.first_name || '',
            lastName: u.last_name || '',
          };
        }
      });

      const allFound = userIds.every((id) => fetchedMap[id] || marketplaceUsersById[id]);
      if (allFound || page >= (usersResponse.pagination?.pages || 1) || users.length === 0) {
        break;
      }
      page += 1;
    }

    if (Object.keys(fetchedMap).length > 0) {
      setMarketplaceUsersById((prev) => ({ ...prev, ...fetchedMap }));
    }

    return sourceOrders.map((order) => {
      const userFallback = fetchedMap[order.user._id] || marketplaceUsersById[order.user._id];
      if (!userFallback) return order;
      return {
        ...order,
        user: {
          ...order.user,
          firstName: order.user.firstName || userFallback.firstName,
          lastName: order.user.lastName || userFallback.lastName,
        },
      };
    });
  };

  const hydrateOrdersWithBuyerDetails = async (sourceOrders: Order[]): Promise<Order[]> => {
    if (!token || sourceOrders.length === 0) return sourceOrders;

    const needHydration = sourceOrders.filter((order) => {
      const hasName = Boolean(order.user.firstName || order.user.lastName);
      return !hasName;
    });

    if (needHydration.length === 0) return sourceOrders;

    const detailMap: Record<string, Order> = {};
    await Promise.all(
      needHydration.map(async (order) => {
        try {
          const detailResponse = await apiService.getOrderById(token, order._id);
          if (detailResponse.success && detailResponse.data) {
            detailMap[order._id] = detailResponse.data;
          }
        } catch {
          // Ignore per-item errors and keep current card data
        }
      })
    );

    return sourceOrders.map((order) => {
      const detail = detailMap[order._id];
      if (!detail) return order;
      return {
        ...order,
        userId: detail.userId ?? order.userId,
        user: {
          ...order.user,
          firstName: detail.user.firstName || order.user.firstName,
          lastName: detail.user.lastName || order.user.lastName,
          phone: detail.user.phone || order.user.phone || order.phoneNumber,
        },
        phoneNumber: detail.phoneNumber || order.phoneNumber,
      };
    });
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'orders') {
        loadOrders();
      } else {
        loadAnalytics();
      }
    }
  }, [token, statusFilter, activeTab]);

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
        const data = response.data || [];
        const hydratedOrders = await hydrateOrdersWithBuyerDetails(data);
        const enrichedOrders = await enrichOrdersWithMarketplaceUsers(hydratedOrders);
        setOrders(enrichedOrders);
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
    if (activeTab === 'orders') {
      loadOrders(true);
    } else {
      loadAnalytics(true);
    }
  };

  const loadAnalytics = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setAnalyticsLoading(true);
    }
    try {
      const response = await apiService.getOrdersAnalytics(token, {
        from: analyticsFrom || undefined,
        to: analyticsTo || undefined,
      });
      if (response.success) {
        setAnalytics(response.data || null);
      }
    } catch (error: any) {
      if (!isRefresh) {
        Alert.alert('Xatolik', error.message || 'Analitikani yuklashda xatolik');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setAnalyticsLoading(false);
      }
    }
  };

  const loadDeliveryProviders = async () => {
    if (!token) return;
    setLoadingProviders(true);
    try {
      const response = await apiService.getDeliveryProviders(token);
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

  const handleAcceptPayment = async (orderId: string) => {
    if (!token) return;
    setAcceptingPayment(true);
    try {
      const response = await apiService.acceptOrderPayment(token, orderId);
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', "To'lov qabul qilindi");
        setShowOrderDetailModal(false);
        setSelectedOrderDetail(null);
        loadOrders();
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || "To'lovni qabul qilishda xatolik");
    } finally {
      setAcceptingPayment(false);
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
          let orderDetail = response.data;
          const [enrichedDetail] = await enrichOrdersWithMarketplaceUsers([orderDetail]);
          if (enrichedDetail) {
            orderDetail = enrichedDetail;
          }
          
          // Load product details if product is just an ID
          const newProductsMap: Record<string, any> = {};
          const missingProductIds: string[] = [];
          
          orderDetail.items.forEach((item) => {
            if (typeof item.product === 'string' && item.productType === 'maxalla') {
              const productId = item.product;
              if (!newProductsMap[productId]) {
                missingProductIds.push(productId);
              }
            }
          });

          if (missingProductIds.length > 0) {
            try {
              const noAuthProducts = await apiService.getNoAuthLocalShopProducts({
                local_shop_id: orderDetail.localShopId,
                page: 1,
                limit: 100,
              });
              if (noAuthProducts.success && noAuthProducts.data) {
                noAuthProducts.data.forEach((product) => {
                  const key = String(product.id ?? product._id ?? '');
                  if (key) {
                    newProductsMap[key] = product.baseProduct;
                  }
                });
              }
            } catch {
              // Ignore list-level errors and fallback to item fetch
            }
          }

          const unresolvedIds = missingProductIds.filter((id) => !newProductsMap[id]);
          if (unresolvedIds.length > 0) {
            await Promise.all(
              unresolvedIds.map(async (productId) => {
                try {
                  const productResponse = await apiService.getMaxallaProductById(token, productId);
                  if (productResponse.success && productResponse.data) {
                    newProductsMap[productId] = productResponse.data.baseProduct;
                  }
                } catch {
                  // Ignore errors for individual products
                }
              })
            );
          }

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
    const isApproved = order.status === 'approved';
    const alreadyAssigned = Boolean(order.assignedCourierId || order.courierAssignedAt);
    if (isApproved && !alreadyAssigned) {
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
      case 'approved':
        return 'Qabul qilingan';
      case 'cancelled':
        return 'Rad etilgan';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'approved':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const isApproved = item.status === 'approved';
    const isSent = Boolean(item.assignedCourierId || item.courierAssignedAt);
    const assignedCourier = item.contragentRequests[0]?.deliveryProvider;

    const customerFullName = `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim();
    const customerPhone = item.user.phone || item.phoneNumber || '';

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
              { backgroundColor: getStatusColor(item.status || 'pending') + '20' },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status || 'pending') },
              ]}>
              {getStatusText(item.status || 'pending')}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {customerFullName || 'Mijoz nomi mavjud emas'}
          </Text>
          <Text style={styles.customerPhone}>{customerPhone || 'Telefon raqami yo‘q'}</Text>
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

        {isApproved && !isSent && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => openDeliveryProviderModal(item)}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Yetkazib Beruvchiga Yuborish</Text>
          </TouchableOpacity>
        )}

        {isSent && assignedCourier && (
          <View style={styles.sentInfo}>
            <View style={styles.sentInfoRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.sentText}>Yetkazib beruvchiga yuborilgan</Text>
            </View>
            <Text style={styles.deliveryProviderName}>
              {assignedCourier.name} ({assignedCourier.phone})
            </Text>
            {(item.courierAssignedAt || item.contragentRequests[0]?.sentToDeliveryProviderAt) && (
              <Text style={styles.sentDate}>
                {new Date(item.courierAssignedAt || item.contragentRequests[0]?.sentToDeliveryProviderAt || '').toLocaleDateString('uz-UZ', {
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

      <View style={styles.mainTabRow}>
        <TouchableOpacity
          style={[styles.mainTabButton, activeTab === 'orders' && styles.mainTabButtonActive]}
          onPress={() => setActiveTab('orders')}>
          <Text style={[styles.mainTabText, activeTab === 'orders' && styles.mainTabTextActive]}>
            Buyurtmalar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabButton, activeTab === 'analytics' && styles.mainTabButtonActive]}
          onPress={() => setActiveTab('analytics')}>
          <Text style={[styles.mainTabText, activeTab === 'analytics' && styles.mainTabTextActive]}>
            Analitika
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'analytics' ? (
        <ScrollView
          contentContainerStyle={styles.analyticsContainer}>
          <View style={styles.analyticsFilterRow}>
            <TextInput
              value={analyticsFrom}
              onChangeText={setAnalyticsFrom}
              placeholder="from YYYY-MM-DD"
              style={styles.analyticsInput}
            />
            <TextInput
              value={analyticsTo}
              onChangeText={setAnalyticsTo}
              placeholder="to YYYY-MM-DD"
              style={styles.analyticsInput}
            />
            <TouchableOpacity style={styles.analyticsApplyButton} onPress={() => loadAnalytics()}>
              <Text style={styles.analyticsApplyText}>Qo'llash</Text>
            </TouchableOpacity>
          </View>

          {analyticsLoading ? (
            <View style={styles.analyticsLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : analytics ? (
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Davr: {analytics.from} - {analytics.to}</Text>
              <Text style={styles.analyticsItem}>Jami buyurtmalar: {analytics.total_orders}</Text>
              <Text style={styles.analyticsItem}>Jami summa: {formatCurrency(analytics.total_amount)} so'm</Text>
              <Text style={styles.analyticsItem}>Yetkazilgan summa: {formatCurrency(analytics.delivered_amount)} so'm</Text>
              <Text style={styles.analyticsItem}>Yetkazilmagan summa: {formatCurrency(analytics.undelivered_amount)} so'm</Text>
              <Text style={styles.analyticsItem}>Topshirilgan summa: {formatCurrency(analytics.transferred_amount)} so'm</Text>
              <Text style={styles.analyticsItem}>Topshirilmagan summa: {formatCurrency(analytics.untransferred_amount)} so'm</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Analitika topilmadi</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <>

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
              statusFilter === 'approved' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('approved')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'approved' && styles.filterButtonTextActive,
              ]}>
              Qabul qilingan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'cancelled' && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter('cancelled')}>
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === 'cancelled' && styles.filterButtonTextActive,
              ]}>
              Bekor qilingan
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
        </>
      )}

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
                {(() => {
                  const detailName = `${selectedOrderDetail.user.firstName || ''} ${selectedOrderDetail.user.lastName || ''}`.trim();
                  const detailPhone = selectedOrderDetail.user.phone || selectedOrderDetail.phoneNumber || '';
                  return (
                    <>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Buyurtma raqami</Text>
                  <Text style={styles.orderDetailValue}>{selectedOrderDetail.orderNumber}</Text>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Mijoz</Text>
                  <Text style={styles.orderDetailValue}>
                    {detailName || 'Mijoz nomi mavjud emas'}
                  </Text>
                  <Text style={styles.orderDetailValue}>{detailPhone || 'Telefon raqami yo‘q'}</Text>
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
                            <Text style={styles.orderItemName}>
                              {typeof item.product === 'string' && item.product
                                ? `Mahsulot #${item.product}`
                                : 'Mahsulot'}
                            </Text>
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
                    {[
                      selectedOrderDetail.deliveryViloyat?.name,
                      selectedOrderDetail.deliveryTuman?.name,
                      selectedOrderDetail.deliveryMfy?.name,
                    ]
                      .filter(Boolean)
                      .join(', ') || selectedOrderDetail.deliveryNote || 'Manzil ko‘rsatilmagan'}
                  </Text>
                </View>

                {selectedOrderDetail.status && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailLabel}>Holati</Text>
                    <View
                      style={[
                        styles.statusBadgeInline,
                        { backgroundColor: getStatusColor(selectedOrderDetail.status) + '20' },
                      ]}>
                      <Text
                        style={[
                          styles.statusTextInline,
                          { color: getStatusColor(selectedOrderDetail.status) },
                        ]}>
                        {getStatusText(selectedOrderDetail.status)}
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

                {selectedOrderDetail.canApprove && (
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
                        <Text style={styles.sendButtonModalText}>Bekor Qilish</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedOrderDetail.canCancel && !selectedOrderDetail.canApprove && (
                  <View style={styles.orderDetailSection}>
                    <TouchableOpacity
                      style={[styles.sendButtonModal, styles.rejectButton]}
                      onPress={() => handleRespondToOrder(selectedOrderDetail._id, 'rejected')}
                      disabled={acceptingOrder}
                      activeOpacity={0.8}>
                      <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.sendButtonModalText}>Buyurtmani Bekor Qilish</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedOrderDetail.canAssignCourier && (
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

                {selectedOrderDetail.paymentTransferredToShopAt &&
                  !selectedOrderDetail.shopPaymentAcceptedAt && (
                  <View style={styles.orderDetailSection}>
                    <TouchableOpacity
                      style={[styles.sendButtonModal, styles.acceptButton]}
                      onPress={() => handleAcceptPayment(selectedOrderDetail._id)}
                      disabled={acceptingPayment}
                      activeOpacity={0.8}>
                      {acceptingPayment ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.sendButtonModalText}>To'lovni Qabul Qilish</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                    </>
                  );
                })()}
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
  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  mainTabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F1F5',
  },
  mainTabButtonActive: {
    backgroundColor: '#007AFF',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B72',
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },
  analyticsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  analyticsFilterRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
    marginBottom: 12,
  },
  analyticsInput: {
    flex: Platform.OS === 'web' ? 1 : undefined,
    borderWidth: 1,
    borderColor: '#D8D8DE',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  analyticsApplyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  analyticsApplyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  analyticsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  analyticsItem: {
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 8,
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
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Platform.OS === 'web' ? 16 : 20,
    borderTopRightRadius: Platform.OS === 'web' ? 16 : 20,
    borderBottomLeftRadius: Platform.OS === 'web' ? 16 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 16 : 0,
    maxHeight: '80%',
    width: Platform.OS === 'web' ? '92%' : '100%',
    maxWidth: Platform.OS === 'web' ? 920 : undefined,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    overflow: 'hidden',
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
