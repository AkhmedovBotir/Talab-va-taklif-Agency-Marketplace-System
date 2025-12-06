import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AgentPicker } from '../components/AgentPicker';
import { Button } from '../components/Button';
import { ContragentPicker } from '../components/ContragentPicker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PunktPicker } from '../components/PunktPicker';
import { useAuth } from '../contexts/AuthContext';
import { AgentSelection, apiService, Contragent, Order, PunktSelection } from '../services/api';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { punkt } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedPunkt, setSelectedPunkt] = useState<PunktSelection | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentSelection | null>(null);
  const [requestToPunktModalVisible, setRequestToPunktModalVisible] = useState(false);
  const [selectedToPunkt, setSelectedToPunkt] = useState<PunktSelection | null>(null);
  const [requestToContragentModalVisible, setRequestToContragentModalVisible] = useState(false);
  const [selectedContragent, setSelectedContragent] = useState<Contragent | null>(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await apiService.getOrderById(id);
      setOrder(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Buyurtma yuklanmadi');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Tasdiqlash',
      'Buyurtmani tasdiqlashni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.confirmOrder(id);
              await loadOrder();
              Alert.alert('Muvaffaqiyatli', 'Buyurtma tasdiqlandi');
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Tasdiqlashda xatolik');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAutoRoute = () => {
    Alert.alert(
      'Avtomatik routing',
      'Buyurtma maxsulotlar mavjudligiga qarab avtomatik routing qilinadi. Davom etasizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Davom etish',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await apiService.autoRouteOrder(id);
              await loadOrder();
              const message = response.data.routingResults.errors.length > 0
                ? `Routing qilindi. Xatolar: ${response.data.routingResults.errors.join(', ')}`
                : 'Buyurtma muvaffaqiyatli routing qilindi';
              Alert.alert('Muvaffaqiyatli', message);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Routing qilishda xatolik');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestToPunkts = () => {
    setRequestModalVisible(true);
  };

  const submitRequest = async () => {
    if (!selectedPunkt) {
      Alert.alert('Xatolik', 'Punktni tanlang');
      return;
    }

    if (!selectedPunkt.tuman) {
      Alert.alert('Xatolik', 'Tanlangan punktda tuman mavjud emas');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.requestToPunkts(id, { tumanIds: [selectedPunkt.tuman._id] });
      Alert.alert('Muvaffaqiyatli', 'So\'rov yuborildi', [
        { text: 'OK', onPress: () => {
          setRequestModalVisible(false);
          setSelectedPunkt(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'So\'rov yuborishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = (response: 'accepted' | 'rejected') => {
    const message = response === 'accepted' 
      ? 'So\'rovni qabul qilishni xohlaysizmi?'
      : 'So\'rovni rad etishni xohlaysizmi?';

    Alert.alert('Javob berish', message, [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: response === 'accepted' ? 'Qabul qilish' : 'Rad etish',
        onPress: async () => {
          setActionLoading(true);
          try {
            // Check if this is a punkt-to-punkt request (new format)
            if (hasPendingPunktToPunktRequest) {
              await apiService.respondToPunktRequest(id, { response });
            } else {
              // Fall back to old format
              await apiService.respondToRequest(id, { response });
            }
            await loadOrder();
            Alert.alert('Muvaffaqiyatli', 'Javob yuborildi');
          } catch (error: any) {
            Alert.alert('Xatolik', error.message || 'Javob yuborishda xatolik');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAssignToAgent = () => {
    setAssignModalVisible(true);
  };

  const submitAssign = async () => {
    if (!selectedAgent) {
      Alert.alert('Xatolik', 'Agentni tanlang');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.assignOrderToAgent(id, { agentId: selectedAgent._id });
      Alert.alert('Muvaffaqiyatli', 'Buyurtma agentga yuborildi', [
        { text: 'OK', onPress: () => {
          setAssignModalVisible(false);
          setSelectedAgent(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Agentga yuborishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestToPunkt = () => {
    setRequestToPunktModalVisible(true);
  };

  const submitRequestToPunkt = async () => {
    if (!selectedToPunkt) {
      Alert.alert('Xatolik', 'Punktni tanlang');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.requestToPunkt(id, { toPunktId: selectedToPunkt._id });
      Alert.alert('Muvaffaqiyatli', 'Punktga so\'rov yuborildi', [
        { text: 'OK', onPress: () => {
          setRequestToPunktModalVisible(false);
          setSelectedToPunkt(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Punktga so\'rov yuborishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestToContragent = () => {
    setRequestToContragentModalVisible(true);
  };

  const submitRequestToContragent = async () => {
    if (!selectedContragent) {
      Alert.alert('Xatolik', 'Contragentni tanlang');
      return;
    }

    console.log('=== Contragentga so\'rov yuborish ===');
    console.log('Order ID:', id);
    console.log('Selected Contragent:', selectedContragent);
    console.log('Contragent ID:', selectedContragent._id);
    console.log('Request Data:', { contragentId: selectedContragent._id });

    setActionLoading(true);
    try {
      const response = await apiService.requestToContragent(id, { contragentId: selectedContragent._id });
      console.log('✅ Success Response:', response);
      Alert.alert('Muvaffaqiyatli', 'Contragentga so\'rov yuborildi', [
        { text: 'OK', onPress: () => {
          setRequestToContragentModalVisible(false);
          setSelectedContragent(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      console.error('❌ Error Details:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      Alert.alert('Xatolik', error.message || 'Contragentga so\'rov yuborishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveFromPunkt = () => {
    Alert.alert(
      'Qabul qilish',
      'Punktdan buyurtmani qabul qilishni xohlaysizmi? Qabul qilingandan keyin avtomatik routing qilinadi.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.receiveFromPunkt(id);
              // Reload order to get updated status
              await loadOrder();
              
              // Show success message
              Alert.alert(
                'Muvaffaqiyatli', 
                'Buyurtma qabul qilindi. Avtomatik routing qilindi. Endi kontragentlarga so\'rov yuborilgan yoki siz qo\'lda routing qilishingiz mumkin.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Order will be reloaded and routing buttons will appear
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Qabul qilishda xatolik');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReceiveFromContragent = () => {
    Alert.alert(
      'Qabul qilish',
      'Contragentdan buyurtmani qabul qilishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.receiveFromContragent(id);
              Alert.alert('Muvaffaqiyatli', 'Buyurtma qabul qilindi', [
                { text: 'OK', onPress: () => loadOrder() },
              ]);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Qabul qilishda xatolik');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRespondToPunktRequest = (response: 'accepted' | 'rejected') => {
    const message = response === 'accepted' 
      ? 'Punkt so\'rovini qabul qilishni xohlaysizmi?'
      : 'Punkt so\'rovini rad etishni xohlaysizmi?';

    Alert.alert('Javob berish', message, [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: response === 'accepted' ? 'Qabul qilish' : 'Rad etish',
        onPress: async () => {
          setActionLoading(true);
          try {
            await apiService.respondToPunktRequest(id, { response });
            await loadOrder();
            Alert.alert('Muvaffaqiyatli', 'Javob yuborildi');
          } catch (error: any) {
            Alert.alert('Xatolik', error.message || 'Javob yuborishda xatolik');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return null;
  }

  // Status-based button visibility logic
  const isMyPunkt = punkt?._id === order.confirmedByPunkt?._id;
  
  // Check if current punkt is the current punkt (after receiving from another punkt)
  const currentPunktId = order.currentPunkt 
    ? (typeof order.currentPunkt === 'object' ? order.currentPunkt._id : order.currentPunkt)
    : null;
  const isCurrentPunkt = punkt?._id && currentPunktId ? punkt._id === currentPunktId : false;
  
  // Check order status
  const orderStatus = order.status;
  const isPending = orderStatus === 'pending';
  const isConfirmedByPunkt = orderStatus === 'confirmed_by_punkt';
  const isRequestedToContragent = orderStatus === 'requested_to_contragent';
  const isAcceptedByContragent = orderStatus === 'accepted_by_contragent';
  const isDeliveredToPunkt = orderStatus === 'delivered_to_punkt';
  const isAssignedToAgent = orderStatus === 'assigned_to_agent';
  
  // Check punktStatus for backward compatibility
  const punktStatus = order.punktStatus;
  const isPunktStatusPending = punktStatus === 'pending';
  const isPunktStatusConfirmed = punktStatus === 'confirmed';
  const isPunktStatusRejected = punktStatus === 'rejected';
  const isPunktStatusRequested = punktStatus === 'requested';
  
  // Check if this punkt has a pending request to respond to (old format)
  const hasPendingRequest = order.punktRequests.some(
    (req) =>
      typeof req.punktId === 'object' &&
      req.punktId._id === punkt?._id &&
      req.status === 'pending'
  );

  // Check if this punkt has a pending punkt-to-punkt request to respond to
  const hasPendingPunktToPunktRequest = order.punktToPunktRequests?.some(
    (req) =>
      typeof req.toPunktId === 'object' &&
      req.toPunktId._id === punkt?._id &&
      req.status === 'pending'
  ) || false;
  
  // Step 1: If pending request to this punkt - show respond buttons
  // Can respond if punktStatus is 'requested' or has pending request
  const canRespondToRequest = hasPendingRequest || hasPendingPunktToPunktRequest;
  
  // Step 2: If pending and no request - show confirm or request to punkts
  // Can confirm if order is pending and no pending request to this punkt
  const canConfirm = (isPending || isPunktStatusPending) && !hasPendingRequest;
  
  // Can request to punkts if pending and cannot confirm directly
  const canRequestToPunkts = (isPending || isPunktStatusPending) && !hasPendingRequest;
  
  // Step 3: If confirmed by this punkt - show assignment and request options
  // Can assign to agent if confirmed/delivered by this punkt and not yet assigned
  const canAssignToAgent = 
    (isConfirmedByPunkt || isDeliveredToPunkt || isPunktStatusConfirmed) && 
    (isMyPunkt || isCurrentPunkt) && 
    !isAssignedToAgent &&
    !order.assignedToAgent;
  
  // Can request to other punkt/contragent if confirmed/delivered by this punkt or current punkt and not assigned
  const canRequestToOthers = 
    (isConfirmedByPunkt || isDeliveredToPunkt || isPunktStatusConfirmed) && 
    (isMyPunkt || isCurrentPunkt) && 
    !isAssignedToAgent;
  
  // Step 4: Receive buttons
  // Can receive from punkt if order has accepted punkt-to-punkt request
  const hasAcceptedPunktToPunktRequest = order.punktToPunktRequests?.some(
    (req) =>
      typeof req.toPunktId === 'object' &&
      req.toPunktId._id === punkt?._id &&
      req.status === 'accepted'
  ) || false;
  
  const canReceiveFromPunkt = 
    hasAcceptedPunktToPunktRequest ||
    ((isConfirmedByPunkt || isDeliveredToPunkt || isPunktStatusConfirmed) && !isMyPunkt);
  
  // Can receive from contragent if contragent has accepted
  const canReceiveFromContragent = isAcceptedByContragent || isRequestedToContragent;

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Buyurtma tafsilotlari</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
        <View style={styles.card}>
          <InfoRow label="Ism" value={order.user.name} />
          <InfoRow label="Telefon" value={order.phoneNumber} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manzil</Text>
        <View style={styles.card}>
          <InfoRow label="Viloyat" value={order.deliveryViloyat.name} />
          {order.deliveryTuman && (
            <InfoRow label="Tuman" value={order.deliveryTuman.name} />
          )}
          {order.deliveryMfy && (
            <InfoRow label="MFY" value={order.deliveryMfy.name} />
          )}
          {order.deliveryNote && (
            <InfoRow label="Izoh" value={order.deliveryNote} />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mahsulotlar</Text>
        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemQuantity}>Miqdor: {item.quantity} ta</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>To'lov</Text>
        <View style={styles.card}>
          <InfoRow label="To'lov usuli" value={order.paymentMethod} />
          <InfoRow label="To'lov holati" value={order.paymentStatus} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Jami:</Text>
            <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
          </View>
        </View>
      </View>

      {order.punktRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Punkt so'rovlari</Text>
          <View style={styles.card}>
            {order.punktRequests.map((req, index) => {
              const punkt = typeof req.punktId === 'object' ? req.punktId : null;
              return (
                <View key={index} style={styles.requestRow}>
                  <View>
                    <Text style={styles.requestPunktName}>
                      {punkt?.name || 'Noma\'lum'}
                    </Text>
                    <Text style={styles.requestStatus}>{req.status}</Text>
                  </View>
                  <Text style={styles.requestDate}>
                    {formatDate(req.requestedAt)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {order.punktToPunktRequests && order.punktToPunktRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Punktdan punktga so'rovlar</Text>
          <View style={styles.card}>
            {order.punktToPunktRequests.map((req, index) => {
              const fromPunkt = typeof req.fromPunktId === 'object' ? req.fromPunktId : null;
              const toPunkt = typeof req.toPunktId === 'object' ? req.toPunktId : null;
              const statusLabels: Record<string, string> = {
                'pending': 'Kutilmoqda',
                'accepted': 'Qabul qilindi',
                'rejected': 'Rad etilgan',
                'delivered': 'Yetkazildi',
              };
              return (
                <View key={index} style={styles.requestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestPunktName}>
                      {fromPunkt?.name || 'Noma\'lum'} → {toPunkt?.name || 'Noma\'lum'}
                    </Text>
                    <Text style={styles.requestStatus}>
                      {statusLabels[req.status] || req.status}
                    </Text>
                    {req.requestedAt && (
                      <Text style={styles.requestDate}>
                        So'rov: {formatDate(req.requestedAt)}
                      </Text>
                    )}
                    {req.respondedAt && (
                      <Text style={styles.requestDate}>
                        Javob: {formatDate(req.respondedAt)}
                      </Text>
                    )}
                    {req.deliveredAt && (
                      <Text style={styles.requestDate}>
                        Yetkazildi: {formatDate(req.deliveredAt)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {order.confirmedByPunkt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasdiqlangan</Text>
          <View style={styles.card}>
            <InfoRow
              label="Punkt"
              value={order.confirmedByPunkt.name}
            />
          </View>
        </View>
      )}

      {order.currentPunkt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hozirgi punkt</Text>
          <View style={styles.card}>
            <InfoRow
              label="Punkt"
              value={typeof order.currentPunkt === 'object' ? order.currentPunkt.name : 'Noma\'lum'}
            />
            {typeof order.currentPunkt === 'object' && order.currentPunkt.phone && (
              <InfoRow
                label="Telefon"
                value={order.currentPunkt.phone}
              />
            )}
          </View>
        </View>
      )}

      {order.assignedToAgent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agentga yuborilgan</Text>
          <View style={styles.card}>
            <InfoRow
              label="Agent"
              value={order.assignedToAgent.name}
            />
            <InfoRow
              label="Telefon"
              value={order.assignedToAgent.phone}
            />
            {order.assignedAt && (
              <InfoRow
                label="Yuborilgan vaqti"
                value={formatDate(order.assignedAt)}
              />
            )}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {/* Step 1: If pending request to this punkt - show respond buttons */}
        {canRespondToRequest && (
          <>
            <Button
              title="Qabul qilish"
              onPress={() => handleRespond('accepted')}
              variant="secondary"
              loading={actionLoading}
              style={styles.actionButton}
            />
            <Button
              title="Rad etish"
              onPress={() => handleRespond('rejected')}
              variant="danger"
              loading={actionLoading}
              style={styles.actionButton}
            />
          </>
        )}

        {/* Step 2: If pending and no request - show confirm or request to punkts */}
        {canConfirm && (
          <Button
            title="Tasdiqlash"
            onPress={handleConfirm}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {canRequestToPunkts && (
          <Button
            title="Punktga so'rov yuborish"
            onPress={handleRequestToPunkts}
            variant="outline"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 3: If confirmed/delivered by this punkt - show assignment and request options */}
        {canAssignToAgent && (
          <Button
            title="Agentga yuborish"
            onPress={handleAssignToAgent}
            variant="primary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {canRequestToOthers && (
          <>
            <Button
              title="Avtomatik routing"
              onPress={handleAutoRoute}
              variant="primary"
              loading={actionLoading}
              style={styles.actionButton}
            />
            <Button
              title="Boshqa punktga so'rov yuborish"
              onPress={handleRequestToPunkt}
              variant="outline"
              loading={actionLoading}
              style={styles.actionButton}
            />
            <Button
              title="Contragentga so'rov yuborish"
              onPress={handleRequestToContragent}
              variant="outline"
              loading={actionLoading}
              style={styles.actionButton}
            />
          </>
        )}

        {/* Step 4: Receive buttons - show when appropriate */}
        {canReceiveFromPunkt && (
          <Button
            title="Punktdan qabul qilish"
            onPress={handleReceiveFromPunkt}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {canReceiveFromContragent && (
          <Button
            title="Contragentdan qabul qilish"
            onPress={handleReceiveFromContragent}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* If no actions available, show message */}
        {!canRespondToRequest && 
         !canConfirm && 
         !canRequestToPunkts && 
         !canAssignToAgent && 
         !canRequestToOthers && 
         !canReceiveFromPunkt && 
         !canReceiveFromContragent && (
          <View style={styles.noActionsContainer}>
            <Text style={styles.noActionsText}>
              {isPunktStatusRejected && 'Buyurtma rad etilgan'}
              {isPunktStatusRequested && !hasPendingRequest && 'So\'rov yuborilgan, javob kutilmoqda'}
              {isAssignedToAgent && 'Buyurtma agentga yuborilgan'}
              {isConfirmedByPunkt && !isMyPunkt && 'Buyurtma boshqa punkt tomonidan tasdiqlangan'}
              {orderStatus === 'confirmed_by_agent' && 'Buyurtma agent tomonidan tasdiqlangan'}
              {orderStatus === 'confirmed_by_customer' && 'Buyurtma mijoz tomonidan tasdiqlangan'}
              {!orderStatus && 'Hech qanday amal mavjud emas'}
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Punktga so'rov yuborish</Text>
              <TouchableOpacity onPress={() => {
                setRequestModalVisible(false);
                setSelectedPunkt(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Punktni tanlang</Text>
              <PunktPicker
                selectedPunkt={selectedPunkt}
                onSelect={setSelectedPunkt}
                viloyatId={order?.deliveryViloyat._id}
                tumanId={order?.deliveryTuman?._id}
              />
              {selectedPunkt && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan punkt:</Text>
                  <Text style={styles.selectedPunktName}>{selectedPunkt.name}</Text>
                  <Text style={styles.selectedPunktDetails}>
                    {selectedPunkt.phone} • {selectedPunkt.viloyat.name}
                    {selectedPunkt.tuman && `, ${selectedPunkt.tuman.name}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setRequestModalVisible(false);
                  setSelectedPunkt(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Yuborish"
                onPress={submitRequest}
                loading={actionLoading}
                disabled={!selectedPunkt}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agentga yuborish</Text>
              <TouchableOpacity onPress={() => {
                setAssignModalVisible(false);
                setSelectedAgent(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Agentni tanlang</Text>
              <AgentPicker
                selectedAgent={selectedAgent}
                onSelect={setSelectedAgent}
                viloyatId={order?.deliveryViloyat._id}
                tumanId={order?.deliveryTuman?._id}
                mfyId={order?.deliveryMfy?._id}
              />
              {selectedAgent && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan agent:</Text>
                  <Text style={styles.selectedPunktName}>{selectedAgent.name}</Text>
                  <Text style={styles.selectedPunktDetails}>
                    {selectedAgent.phone} • {selectedAgent.viloyat.name}
                    {selectedAgent.tuman && `, ${selectedAgent.tuman.name}`}
                    {selectedAgent.mfy && `, ${selectedAgent.mfy.name}`}
                  </Text>
                  <Text style={styles.selectedPunktDetails}>
                    Turi: {selectedAgent.agentType === 'viloyat' ? 'Viloyat' : selectedAgent.agentType === 'tuman' ? 'Tuman' : 'MFY'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setAssignModalVisible(false);
                  setSelectedAgent(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Yuborish"
                onPress={submitAssign}
                loading={actionLoading}
                disabled={!selectedAgent}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={requestToPunktModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestToPunktModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Boshqa punktga so'rov yuborish</Text>
              <TouchableOpacity onPress={() => {
                setRequestToPunktModalVisible(false);
                setSelectedToPunkt(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Punktni tanlang</Text>
              <PunktPicker
                selectedPunkt={selectedToPunkt}
                onSelect={setSelectedToPunkt}
                viloyatId={order?.deliveryViloyat._id}
                tumanId={order?.deliveryTuman?._id}
                orderItems={order?.items}
              />
              {selectedToPunkt && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan punkt:</Text>
                  <Text style={styles.selectedPunktName}>{selectedToPunkt.name}</Text>
                  <Text style={styles.selectedPunktDetails}>
                    {selectedToPunkt.phone} • {selectedToPunkt.viloyat.name}
                    {selectedToPunkt.tuman && `, ${selectedToPunkt.tuman.name}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setRequestToPunktModalVisible(false);
                  setSelectedToPunkt(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Yuborish"
                onPress={submitRequestToPunkt}
                loading={actionLoading}
                disabled={!selectedToPunkt}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={requestToContragentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestToContragentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contragentga so'rov yuborish</Text>
              <TouchableOpacity onPress={() => {
                setRequestToContragentModalVisible(false);
                setSelectedContragent(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Contragentni tanlang</Text>
              <ContragentPicker
                selectedContragent={selectedContragent}
                onSelect={setSelectedContragent}
                orderId={id}
              />
              {selectedContragent && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan contragent:</Text>
                  <Text style={styles.selectedPunktName}>{selectedContragent.name}</Text>
                  {selectedContragent.inn && (
                    <Text style={styles.selectedPunktDetails}>INN: {selectedContragent.inn}</Text>
                  )}
                  {selectedContragent.phone && (
                    <Text style={styles.selectedPunktDetails}>Telefon: {selectedContragent.phone}</Text>
                  )}
                  {selectedContragent.viloyat && (
                    <Text style={styles.selectedPunktDetails}>
                      {selectedContragent.viloyat.name}
                      {selectedContragent.tuman && `, ${selectedContragent.tuman.name}`}
                      {selectedContragent.mfy && `, ${selectedContragent.mfy.name}`}
                    </Text>
                  )}
                  {selectedContragent.products && selectedContragent.products.length > 0 && (
                    <Text style={styles.selectedPunktDetails}>
                      {selectedContragent.products.length} ta mahsulot
                    </Text>
                  )}
                  {selectedContragent.hasRequest && selectedContragent.requestStatus && (
                    <Text style={styles.selectedPunktDetails}>
                      Holat: {selectedContragent.requestStatus}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setRequestToContragentModalVisible(false);
                  setSelectedContragent(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Yuborish"
                onPress={submitRequestToContragent}
                loading={actionLoading}
                disabled={!selectedContragent}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
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
}

function getStatusLabel(status: string) {
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
      return 'Punkt tomonidan tasdiqlangan';
    case 'requested_to_contragent':
      return 'Contragentga so\'rov yuborilgan';
    case 'accepted_by_contragent':
      return 'Contragent tomonidan qabul qilingan';
    case 'delivered_to_punkt':
      return 'Punktga yetkazilgan';
    case 'assigned_to_agent':
      return 'Agentga yuborilgan';
    case 'confirmed_by_agent':
      return 'Agent tomonidan tasdiqlangan';
    case 'confirmed_by_customer':
      return 'Mijoz tomonidan tasdiqlangan';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  requestPunktName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  requestStatus: {
    fontSize: 14,
    color: '#666',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedPunktInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF30',
  },
  selectedPunktLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedPunktName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  selectedPunktDetails: {
    fontSize: 14,
    color: '#666',
  },
  noActionsContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  noActionsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

