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
import { formatPrice } from '../../../../utils/formatNumber';

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
      
      // Check if products are populated or just IDs
      const order = response.data;
      
      // Helper function to shorten base64 images in console
      const shortenBase64Images = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) {
          return obj.map(shortenBase64Images);
        }
        const result: any = {};
        for (const key in obj) {
          if (typeof obj[key] === 'string' && obj[key].startsWith('data:image')) {
            // Shorten base64 images to first 50 chars + "..."
            result[key] = obj[key].substring(0, 50) + '... [base64 truncated]';
          } else if (typeof obj[key] === 'object') {
            result[key] = shortenBase64Images(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
        return result;
      };
      
      // Log order data with shortened base64 images
      console.log('=== ORDER BY ID ===');
      console.log('Order ID:', orderId);
      console.log('Full Order Data:', JSON.stringify(shortenBase64Images(order), null, 2));
      console.log('=== ORDER ITEMS DETAILS ===');
      order.items?.forEach((item: any, index: number) => {
        console.log(`Item ${index + 1}:`, {
          product: typeof item.product === 'string' ? item.product : {
            _id: item.product?._id,
            name: item.product?.name,
            productCode: item.product?.productCode,
            price: item.product?.price,
            images: item.product?.images?.map((img: string) => 
              typeof img === 'string' && img.startsWith('data:image') 
                ? img.substring(0, 50) + '... [base64 truncated]'
                : img
            )
          },
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          kpiBonusPercent: item.kpiBonusPercent,
          calculatedKpiAmount: item.originalPrice && item.price 
            ? (item.price - item.originalPrice) * item.quantity 
            : 0,
          itemTotal: item.price * item.quantity
        });
      });
      console.log('=== ORDER TOTALS ===');
      console.log('totalPrice:', order.totalPrice);
      console.log('totalOriginalPrice:', order.totalOriginalPrice);
      console.log('totalKpiPrice (KPI summa):', order.totalKpiPrice);
      
      // Calculate totals for console
      const requestedItemsForCalc = order.items || [];
      let totalGrossProfit = 0;
      requestedItemsForCalc.forEach((item: any) => {
        if (item.originalPrice && item.price) {
          totalGrossProfit += (item.price - item.originalPrice) * item.quantity;
        }
      });
      const netProfit = totalGrossProfit - (order.totalKpiPrice || 0);
      console.log('totalGrossProfit (Umumiy foyda):', totalGrossProfit);
      console.log('netProfit (Sof foyda = Umumiy foyda - KPI summa):', netProfit);
      
      // Check if any item has product as string (ID)
      const needsProductFetch = order.items?.some((item: any) => 
        typeof item.product === 'string'
      );
      
      if (needsProductFetch) {
        // Fetch products for items that only have IDs
        const productPromises = order.items.map(async (item: any) => {
          if (typeof item.product === 'string') {
            try {
              const productResponse = await apiService.getProductById(item.product);
              return {
                ...item,
                product: productResponse.data
              };
            } catch (error) {
              return {
                ...item,
                product: {
                  _id: item.product,
                  name: 'Maxsulot topilmadi',
                  images: [],
                  productCode: ''
                }
              };
            }
          }
          return item;
        });
        
        const itemsWithProducts = await Promise.all(productPromises);
        order.items = itemsWithProducts;
      }
      
      setOrder(order);
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

  // Get only items requested from this contragent
  // Backend already filters items, but we check itemIds for safety
  const getRequestedItems = (order: Order) => {
    const request = getCurrentRequest(order);
    if (!request) {
      return order.items || [];
    }
    
    // If backend already filtered (items length matches itemIds length), use items directly
    // Otherwise, filter by itemIds
    if (request.itemIds && request.itemIds.length > 0) {
      const items = order.items || [];
      // Check if backend already filtered
      if (items.length === request.itemIds.length) {
        return items;
      }
      // Filter items based on itemIds (indices in the original order)
      return items.filter((_, index) => request.itemIds!.includes(index));
    }
    
    return order.items || [];
  };

  // Calculate totals for requested items only
  const calculateRequestedTotals = (order: Order) => {
    const requestedItems = getRequestedItems(order);
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    let totalKpiPrice = 0;
    let totalGrossProfit = 0; // Umumiy foyda (price - originalPrice)

    requestedItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      totalPrice += itemTotal;
      
      if (item.originalPrice !== undefined) {
        totalOriginalPrice += item.originalPrice * item.quantity;
      }
      
      if (item.originalPrice !== undefined && item.price !== undefined) {
        const itemGrossProfit = (item.price - item.originalPrice) * item.quantity;
        totalGrossProfit += itemGrossProfit;
      }
    });

    // totalKpiPrice backend dan keladi
    totalKpiPrice = order.totalKpiPrice || 0;
    
    // Sof foyda = Umumiy foyda - KPI summa
    const netProfit = totalGrossProfit - totalKpiPrice;

    return { totalPrice, totalOriginalPrice, totalKpiPrice, totalGrossProfit, netProfit };
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

  // Get workflow steps for contragent
  const getWorkflowSteps = () => {
    const steps = [
      { 
        key: 'requested', 
        label: 'So\'rov yuborildi', 
        completed: true,
        date: request.requestedAt 
      },
      { 
        key: 'responded', 
        label: request.status === 'rejected' ? 'Rad etildi' : 'Qabul qilindi', 
        completed: request.status !== 'pending',
        date: request.respondedAt,
        isRejected: request.status === 'rejected'
      },
      { 
        key: 'delivered', 
        label: 'Punktga yetkazildi', 
        completed: request.status === 'delivered_to_punkt',
        date: request.deliveredToPunktAt,
        hidden: request.status === 'rejected'
      },
    ];
    return steps.filter(step => !step.hidden);
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
  const requestedItems = getRequestedItems(order);
  const { 
    totalPrice: requestedTotalPrice, 
    totalOriginalPrice: requestedTotalOriginalPrice, 
    totalKpiPrice: requestedTotalKpiPrice,
    totalGrossProfit: requestedTotalGrossProfit,
    netProfit: requestedNetProfit
  } = calculateRequestedTotals(order);

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

          <View style={styles.infoGrid}>
            <View style={styles.infoGridItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="receipt-outline" size={16} color="#007AFF" />
              </View>
              <View style={styles.infoGridContent}>
                <Text style={styles.infoGridLabel}>Buyurtma raqami</Text>
                <Text style={styles.infoGridValue}>{order.orderNumber}</Text>
              </View>
            </View>

            <View style={styles.infoGridItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="storefront-outline" size={16} color="#007AFF" />
              </View>
              <View style={styles.infoGridContent}>
                <Text style={styles.infoGridLabel}>Punkt</Text>
                <Text style={styles.infoGridValue}>{order.currentPunkt.name}</Text>
                {order.currentPunkt.phone && (
                  <Text style={styles.infoGridSubValue}>{order.currentPunkt.phone}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoGridItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call-outline" size={16} color="#007AFF" />
              </View>
              <View style={styles.infoGridContent}>
                <Text style={styles.infoGridLabel}>Mijoz telefon</Text>
                <Text style={styles.infoGridValue}>{order.phoneNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Workflow Steps */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ketma-ketlik</Text>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
          </View>
          <View style={styles.workflowContainer}>
            {getWorkflowSteps().map((step, index) => {
              const isLast = index === getWorkflowSteps().length - 1;
              const stepColor = step.isRejected ? '#FF3B30' : (step.completed ? '#34C759' : '#FF9500');
              
              return (
                <View key={step.key} style={styles.workflowStep}>
                  <View style={styles.workflowStepContent}>
                    <View style={[styles.workflowIcon, { backgroundColor: `${stepColor}20` }]}>
                      {step.completed ? (
                        <Ionicons 
                          name={step.isRejected ? "close-circle" : "checkmark-circle"} 
                          size={20} 
                          color={stepColor} 
                        />
                      ) : (
                        <View style={[styles.workflowIconPending, { borderColor: stepColor }]} />
                      )}
                    </View>
                    <View style={styles.workflowStepInfo}>
                      <Text style={[styles.workflowStepLabel, { color: step.completed ? '#333' : '#999' }]}>
                        {step.label}
                      </Text>
                      {step.date && (
                        <Text style={styles.workflowStepDate}>
                          {new Date(step.date).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                  {!isLast && (
                    <View style={[styles.workflowLine, { backgroundColor: step.completed ? '#34C759' : '#E0E0E0' }]} />
                  )}
                </View>
              );
            })}
          </View>
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
        {requestedItems && requestedItems.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mahsulotlar ({requestedItems.length})</Text>
              <Ionicons name="cube-outline" size={20} color="#007AFF" />
            </View>

            {requestedItems.map((item, index) => {
              // Handle case where product might be just an ID string
              const product = typeof item.product === 'string' 
                ? { _id: item.product, name: 'Maxsulot', images: [], productCode: '' }
                : item.product;
              
              const originalPrice = item.originalPrice ?? product.price ?? 0;
              const salePrice = item.price;
              const kpiBonus = item.kpiBonusPercent ?? 0;
              const grossProfit = originalPrice > 0 ? (salePrice - originalPrice) * item.quantity : 0;
              // Item uchun KPI summa = grossProfit * kpiBonusPercent / 100
              const itemKpiAmount = grossProfit > 0 && kpiBonus > 0 
                ? (grossProfit * kpiBonus) / 100 
                : 0;
              // Sof foyda = Umumiy foyda - KPI summa
              const netProfit = grossProfit - itemKpiAmount;
              const itemTotal = salePrice * item.quantity;
              const unitPrice = salePrice;

              return (
                <View key={index} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    {product.images && product.images.length > 0 ? (
                      <Image
                        source={{ uri: product.images[0] }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color="#8E8E93" />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{product.name || 'Maxsulot'}</Text>
                      {product.productCode && (
                        <Text style={styles.itemCode}>Kod: {product.productCode}</Text>
                      )}
                      <View style={styles.quantityContainer}>
                        <Ionicons name="layers-outline" size={14} color="#666" />
                        <Text style={styles.itemQuantity}>
                          {item.quantity} dona
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.itemPrices}>
                    <View style={styles.priceSection}>
                      {originalPrice > 0 && originalPrice !== salePrice && (
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Asl narx (birlik):</Text>
                          <Text style={styles.priceValue}>{formatPrice(originalPrice)}</Text>
                        </View>
                      )}
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Sotuv narxi (birlik):</Text>
                        <Text style={styles.priceValueBold}>{formatPrice(unitPrice)}</Text>
                      </View>
                      {item.quantity > 1 && (
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Miqdor:</Text>
                          <Text style={styles.priceValue}>{item.quantity} dona</Text>
                        </View>
                      )}
                    </View>
                    
                    {netProfit > 0 && (
                      <View style={[styles.priceRow, styles.netProfitRow]}>
                        <View style={styles.kpiLabelContainer}>
                          <Ionicons name="trending-up-outline" size={14} color="#007AFF" />
                          <Text style={styles.priceLabel}>Sof foyda:</Text>
                        </View>
                        <Text style={styles.priceValueNetProfit}>
                          {formatPrice(netProfit)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[styles.priceRow, styles.itemTotalRow]}>
                      <Text style={styles.priceLabelBold}>Mahsulot jami:</Text>
                      <Text style={styles.priceValueBold}>
                        {formatPrice(itemTotal)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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

          <View style={styles.summarySection}>
            {requestedTotalOriginalPrice > 0 && requestedTotalOriginalPrice !== requestedTotalPrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jami asl narx</Text>
                <Text style={styles.infoValue}>{formatPrice(requestedTotalOriginalPrice)}</Text>
              </View>
            )}
            {requestedTotalKpiPrice > 0 && (
              <View style={styles.infoRowSmall}>
                <View style={styles.kpiLabelContainerSmall}>
                  <Text style={styles.infoLabelSmall}>KPI summa</Text>
                </View>
                <Text style={[styles.infoValueSmall, styles.priceValueKpiSmall]}>{formatPrice(requestedTotalKpiPrice)}</Text>
              </View>
            )}
            {requestedNetProfit > 0 && (
              <View style={styles.infoRowSmall}>
                <View style={styles.kpiLabelContainerSmall}>
                  <Text style={styles.infoLabelSmall}>Sof foyda</Text>
                </View>
                <Text style={[styles.infoValueSmall, styles.priceValueNetProfitSmall]}>{formatPrice(requestedNetProfit)}</Text>
              </View>
            )}
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Jami to'lov summa</Text>
              <Text style={styles.totalValue}>{formatPrice(requestedTotalPrice)}</Text>
            </View>
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
  infoGrid: {
    gap: 12,
  },
  infoGridItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGridContent: {
    flex: 1,
    gap: 2,
  },
  infoGridLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoGridValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  infoGridSubValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  workflowContainer: {
    gap: 0,
  },
  workflowStep: {
    position: 'relative',
  },
  workflowStepContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  workflowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  workflowStepInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  workflowStepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  workflowStepDate: {
    fontSize: 12,
    color: '#999',
  },
  workflowLine: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginTop: -4,
  },
  infoRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  kpiLabelContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabelSmall: {
    fontSize: 14,
    color: '#34C759',
  },
  infoValueSmall: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  priceValueKpiSmall: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  priceValueNetProfitSmall: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  itemPrices: {
    gap: 8,
    paddingLeft: 72,
    marginTop: 4,
  },
  priceSection: {
    gap: 4,
    marginBottom: 8,
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
    fontWeight: '600',
  },
  priceValueNetProfit: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  kpiRow: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  kpiLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: -8,
    marginRight: -8,
  },
  summarySection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
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


