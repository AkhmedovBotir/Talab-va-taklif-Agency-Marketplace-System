// Order Details Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Order } from '../../types/api';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [payingToPunkt, setPayingToPunkt] = useState(false);
  const router = useRouter();
  const { agent } = useAuth();

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getOrderById(id);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Buyurtmani yuklashda xatolik';
      Alert.alert('Xatolik', errorMessage, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!order) return;

    Alert.alert(
      'Buyurtmani tasdiqlash',
      'Haqiqatan ham mijozga borib buyurtmani tasdiqlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          style: 'default',
          onPress: confirmOrder,
        },
      ]
    );
  };

  const confirmOrder = async () => {
    if (!id) return;

    setConfirming(true);
    try {
      const response = await apiService.confirmOrder(id);
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', response.message || 'Buyurtma tasdiqlandi');
        // Reload order data after confirmation
        loadOrder();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Buyurtmani tasdiqlashda xatolik';
      Alert.alert('Xatolik', errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkDelivered = () => {
    if (!order) return;

    Alert.alert(
      'Buyurtmani yetkazilgan deb belgilash',
      'Haqiqatan ham buyurtma mijozga yetkazilgan deb belgilaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Belgilash',
          style: 'default',
          onPress: markOrderAsDelivered,
        },
      ]
    );
  };

  const markOrderAsDelivered = async () => {
    if (!id) return;

    setMarkingDelivered(true);
    try {
      const response = await apiService.markOrderAsDelivered(id);
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', response.message || 'Buyurtma yetkazilgan deb belgilandi');
        // Reload order data after marking as delivered
        loadOrder();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Buyurtmani yetkazilgan deb belgilashda xatolik';
      Alert.alert('Xatolik', errorMessage);
    } finally {
      setMarkingDelivered(false);
    }
  };

  const canConfirm = () => {
    if (!order || !agent) return false;
    // Agent uchun: faqat assigned_to_agent status'ida, hali tasdiqlanmagan va punktga to'lov qilingan bo'lsa
    const paymentTransaction = (order as any).paymentTransaction || 
                                (order as any).payment || 
                                (order as any).transaction ||
                                (order as any).agentPayment;
    const hasPayment = paymentTransaction !== null && paymentTransaction !== undefined;
    return (
      order.status === 'assigned_to_agent' &&
      order.assignedToAgent?._id === agent._id &&
      !order.agentConfirmedAt &&
      hasPayment // Punktga to'lov qilingan bo'lishi kerak
    );
  };

  const canPayToPunkt = () => {
    if (!order || !agent) return false;
    // Agar buyurtma allaqachon tasdiqlangan bo'lsa, to'lov tugmasi ko'rsatilmaydi
    if (order.agentConfirmedAt) return false;
    
    // Agent uchun: faqat assigned_to_agent yoki confirmed_by_agent status'ida va hali punktga to'lov qilinmagan bo'lsa
    const paymentTransaction = (order as any).paymentTransaction || 
                                (order as any).payment || 
                                (order as any).transaction ||
                                (order as any).agentPayment;
    const hasPayment = paymentTransaction !== null && paymentTransaction !== undefined;
    
    // Agar to'lov qilingan bo'lsa, to'lov tugmasi ko'rsatilmaydi
    if (hasPayment) return false;
    
    return (
      (order.status === 'assigned_to_agent' || order.status === 'confirmed_by_agent') &&
      order.assignedToAgent?._id === agent._id &&
      order.assignedByPunkt
    );
  };

  const handlePayToPunkt = () => {
    if (!order) return;

    Alert.alert(
      'Punktga to\'lov qilish va buyurtmani tasdiqlash',
      `Haqiqatan ham punktga ${(order.totalPrice || 0).toLocaleString()} so'm to'lov qilib, buyurtmani tasdiqlamoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'To\'lov qilish va tasdiqlash',
          style: 'default',
          onPress: payToPunkt,
        },
      ]
    );
  };

  const payToPunkt = async () => {
    if (!id) return;

    setPayingToPunkt(true);
    try {
      const response = await apiService.payToPunkt(id);
      if (response.success) {
        // To'lov qilingandan keyin avtomatik ravishda buyurtmani tasdiqlash
        try {
          const confirmResponse = await apiService.confirmOrder(id);
          if (confirmResponse.success) {
            Alert.alert('Muvaffaqiyatli', 'To\'lov qilindi va buyurtma tasdiqlandi');
          } else {
            Alert.alert('Muvaffaqiyatli', response.message || 'To\'lov muvaffaqiyatli amalga oshirildi');
          }
        } catch (confirmError: any) {
          // To'lov qilindi, lekin tasdiqlashda xatolik bo'lsa ham to'lov muvaffaqiyatli
          Alert.alert('Muvaffaqiyatli', response.message || 'To\'lov muvaffaqiyatli amalga oshirildi');
        }
        // Reload order data after payment and confirmation
        loadOrder();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'To\'lov qilishda xatolik';
      Alert.alert('Xatolik', errorMessage);
    } finally {
      setPayingToPunkt(false);
    }
  };

  const canMarkDelivered = () => {
    if (!order || !agent) return false;
    return (
      order.assignedToAgent?._id === agent._id &&
      order.confirmedByAgent !== null &&
      !order.deliveredAt
    );
  };

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
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Kutilmoqda',
      processing: 'Jarayonda',
      shipped: 'Yuborilgan',
      delivered: 'Yetkazilgan',
      cancelled: 'Bekor qilingan',
      confirmed_by_punkt: 'Punkt tomonidan tasdiqlangan',
      requested_to_contragent: 'Kontragentga so\'rov yuborilgan',
      accepted_by_contragent: 'Kontragent tomonidan qabul qilingan',
      delivered_to_punkt: 'Punktga yetkazilgan',
      assigned_to_agent: 'Agentga tayinlangan',
      confirmed_by_agent: 'Agent tomonidan tasdiqlangan',
      confirmed_by_customer: 'Mijoz tomonidan tasdiqlangan',
    };
    return statusMap[status] || status;
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'delivered_to_punkt':
        return '#007AFF';
      default:
        return '#FF9500';
    }
  };

  const getContragentRequestStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Kutilmoqda',
      accepted: 'Qabul qilingan',
      rejected: 'Rad etilgan',
      delivered_to_punkt: 'Punktga yetkazilgan',
    };
    return statusMap[status] || status;
  };

  const getPunktRequestStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'delivered':
        return '#007AFF';
      default:
        return '#FF9500';
    }
  };

  const getPunktRequestStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Kutilmoqda',
      accepted: 'Qabul qilingan',
      rejected: 'Rad etilgan',
      delivered: 'Yetkazilgan',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Buyurtma topilmadi</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Buyurtma #${order.orderNumber}`,
          headerShown: true,
          headerBackTitle: 'Orqaga',
        }}
      />
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>Buyurtma #{order.orderNumber}</Text>
          <Text style={styles.date}>
            {new Date(order.createdAt).toLocaleString('uz-UZ')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Ism:</Text>
            <Text style={styles.infoValue}>
              {order.user?.name || 'Mijoz'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Telefon:</Text>
            <Text style={styles.infoValue}>
              {order.phoneNumber || order.user?.phone}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.infoValue}>
              {order.deliveryViloyat.name}
              {order.deliveryTuman && `, ${order.deliveryTuman.name}`}
              {order.deliveryMfy && `, ${order.deliveryMfy.name}`}
            </Text>
          </View>
          {order.deliveryNote && (
            <Text style={styles.deliveryNote}>{order.deliveryNote}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mahsulotlar</Text>
        {order.items.map((item, index) => {
          // Product ma'lumotlarini to'g'ri ko'rsatish
          const productName = typeof item.product === 'object' && item.product?.name 
            ? item.product.name 
            : (item as any).productModel || (item as any).productType || 'Mahsulot';
          
          const productInfo = typeof item.product === 'object' && item.product
            ? `Narxi: ${(item.product.price || 0).toLocaleString()} so'm`
            : (item as any).productType 
              ? `${(item as any).productType} - ${(item as any).productModel || ''}`
              : '';

          return (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{productName}</Text>
                  {productInfo && (
                    <Text style={styles.itemInfo}>{productInfo}</Text>
                  )}
                </View>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <View style={styles.itemFooter}>
                <View>
                  <Text style={styles.itemPrice}>
                    Birlik narxi: {(item.price || 0).toLocaleString()} so'm
                  </Text>
                  {item.originalPrice && (
                    <Text style={styles.itemOriginalPrice}>
                      Asl narx: {(item.originalPrice || 0).toLocaleString()} so'm
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemTotal}>
                    Jami: {((item.price || 0) * (item.quantity || 0)).toLocaleString()} so'm
                  </Text>
                  {(item as any).kpiBonusPercent && (
                    <Text style={styles.itemKpi}>
                      KPI: {(item as any).kpiBonusPercent}%
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>To'lov ma'lumotlari</Text>
        <View style={styles.infoCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>To'lov usuli:</Text>
            <Text style={styles.summaryValue}>
              {order.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>To'lov holati:</Text>
            <Text style={styles.summaryValue}>
              {order.paymentStatus === 'paid' ? 'To\'langan' : 'To\'lanmagan'}
            </Text>
          </View>
          {(() => {
            const paymentTransaction = (order as any).paymentTransaction || 
                                      (order as any).payment || 
                                      (order as any).transaction ||
                                      (order as any).agentPayment;
            return paymentTransaction ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Punktga to'lov:</Text>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.paidText}>To'langan</Text>
                </View>
              </View>
            ) : null;
          })()}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Jami summa:</Text>
            <Text style={styles.totalValue}>
              {(order.totalPrice || 0).toLocaleString()} so'm
            </Text>
          </View>
        </View>
      </View>

      {order.assignedToAgent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent ma'lumotlari</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle" size={20} color="#007AFF" />
              <Text style={styles.infoValue}>{order.assignedToAgent.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#007AFF" />
              <Text style={styles.infoValue}>{order.assignedToAgent.phone}</Text>
            </View>
            {order.assignedAt && (
              <Text style={styles.assignedDate}>
                Tayinlangan: {new Date(order.assignedAt).toLocaleString('uz-UZ')}
              </Text>
            )}
          </View>
        </View>
      )}

      {order.confirmedByAgent && (
        <View style={styles.section}>
          <View style={styles.confirmedCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <View style={styles.confirmedInfo}>
              <Text style={styles.confirmedTitle}>Agent tomonidan tasdiqlangan</Text>
              <Text style={styles.confirmedAgent}>
                {order.confirmedByAgent.name} tomonidan
              </Text>
              {order.agentConfirmedAt && (
                <Text style={styles.confirmedDate}>
                  {new Date(order.agentConfirmedAt).toLocaleString('uz-UZ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {order.deliveredAt && (
        <View style={styles.section}>
          <View style={[styles.confirmedCard, styles.deliveredCard]}>
            <Ionicons name="checkmark-done-circle" size={24} color="#007AFF" />
            <View style={styles.confirmedInfo}>
              <Text style={styles.confirmedTitle}>Yetkazilgan deb belgilangan</Text>
              <Text style={styles.confirmedDate}>
                {new Date(order.deliveredAt).toLocaleString('uz-UZ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {order.customerConfirmed && (
        <View style={styles.section}>
          <View style={[styles.confirmedCard, styles.customerConfirmedCard]}>
            <Ionicons name="checkmark-done-circle" size={24} color="#34C759" />
            <View style={styles.confirmedInfo}>
              <Text style={styles.confirmedTitle}>Mijoz tomonidan tasdiqlangan</Text>
              {order.customerConfirmedAt && (
                <Text style={styles.confirmedDate}>
                  {new Date(order.customerConfirmedAt).toLocaleString('uz-UZ')}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {order.currentPunkt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joriy punkt</Text>
          <View style={styles.infoCard}>
            {typeof order.currentPunkt === 'object' ? (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="storefront" size={20} color="#007AFF" />
                  <Text style={styles.infoValue}>{order.currentPunkt.name}</Text>
                </View>
                {order.currentPunkt.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color="#007AFF" />
                    <Text style={styles.infoValue}>{order.currentPunkt.phone}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* ID bo'lsa, confirmedByPunkt yoki assignedByPunkt'dan nom olishga harakat qilamiz */}
                {(() => {
                  const punktId = order.currentPunkt;
                  const punkt = order.confirmedByPunkt?._id === punktId 
                    ? order.confirmedByPunkt 
                    : order.assignedByPunkt?._id === punktId 
                      ? order.assignedByPunkt 
                      : null;
                  
                  if (punkt) {
                    return (
                      <>
                        <View style={styles.infoRow}>
                          <Ionicons name="storefront" size={20} color="#007AFF" />
                          <Text style={styles.infoValue}>{punkt.name}</Text>
                        </View>
                        {punkt.phone && (
                          <View style={styles.infoRow}>
                            <Ionicons name="call" size={20} color="#007AFF" />
                            <Text style={styles.infoValue}>{punkt.phone}</Text>
                          </View>
                        )}
                      </>
                    );
                  } else {
                    return (
                      <View style={styles.infoRow}>
                        <Ionicons name="storefront" size={20} color="#007AFF" />
                        <Text style={styles.infoValue}>Punkt ID: {punktId}</Text>
                      </View>
                    );
                  }
                })()}
              </>
            )}
          </View>
        </View>
      )}

      {order.confirmedByPunkt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Punkt ma'lumotlari</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="storefront" size={20} color="#007AFF" />
              <Text style={styles.infoValue}>{order.confirmedByPunkt.name}</Text>
            </View>
            {order.confirmedByPunkt.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#007AFF" />
                <Text style={styles.infoValue}>{order.confirmedByPunkt.phone}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoValue}>
                Holat: {order.punktStatus === 'confirmed' ? 'Tasdiqlangan' : order.punktStatus}
              </Text>
            </View>
          </View>
        </View>
      )}

      {order.contragentRequests && order.contragentRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontragent so'rovlari</Text>
          {order.contragentRequests.map((request, index) => (
            <View key={index} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>
                  {request.contragentId.name}
                </Text>
                <View style={[styles.statusBadge, { 
                  backgroundColor: getRequestStatusColor(request.status) 
                }]}>
                  <Text style={styles.statusText}>
                    {getContragentRequestStatusText(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDate}>
                So'rov: {new Date(request.requestedAt).toLocaleString('uz-UZ')}
              </Text>
              {request.respondedAt && (
                <Text style={styles.requestDate}>
                  Javob: {new Date(request.respondedAt).toLocaleString('uz-UZ')}
                </Text>
              )}
              {request.deliveredToPunktAt && (
                <Text style={styles.requestDate}>
                  Yetkazilgan: {new Date(request.deliveredToPunktAt).toLocaleString('uz-UZ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {order.punktToPunktRequests && order.punktToPunktRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Punktdan punktga so'rovlar</Text>
          {order.punktToPunktRequests.map((request, index) => (
            <View key={index} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestTitle}>
                    {request.fromPunktId.name} → {request.toPunktId.name}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: getPunktRequestStatusColor(request.status) 
                }]}>
                  <Text style={styles.statusText}>
                    {getPunktRequestStatusText(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDate}>
                So'rov: {new Date(request.requestedAt).toLocaleString('uz-UZ')}
              </Text>
              {request.respondedAt && (
                <Text style={styles.requestDate}>
                  Javob: {new Date(request.respondedAt).toLocaleString('uz-UZ')}
                </Text>
              )}
              {request.deliveredAt && (
                <Text style={styles.requestDate}>
                  Yetkazilgan: {new Date(request.deliveredAt).toLocaleString('uz-UZ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {canPayToPunkt() && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.payButton, payingToPunkt && styles.payButtonDisabled]}
            onPress={handlePayToPunkt}
            disabled={payingToPunkt}
          >
            {payingToPunkt ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="wallet" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Punktga to'lov qilish va buyurtmani tasdiqlash ({(order.totalPrice || 0).toLocaleString()} so'm)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canConfirm() && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Buyurtmani tasdiqlash</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canMarkDelivered() && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.deliveredButton, markingDelivered && styles.deliveredButtonDisabled]}
            onPress={handleMarkDelivered}
            disabled={markingDelivered}
          >
            {markingDelivered ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                <Text style={styles.deliveredButtonText}>Yetkazilgan deb belgilash</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deliveryNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemKpi: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  assignedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  confirmedCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  confirmedInfo: {
    flex: 1,
  },
  confirmedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  confirmedAgent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  confirmedDate: {
    fontSize: 12,
    color: '#666',
  },
  actionContainer: {
    padding: 16,
    marginTop: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
  customerConfirmedCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  deliveredCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF4E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  deliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  deliveredButtonDisabled: {
    opacity: 0.6,
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

