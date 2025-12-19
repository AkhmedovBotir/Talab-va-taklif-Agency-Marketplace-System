import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentSelection | null>(null);
  const [requestToPunktModalVisible, setRequestToPunktModalVisible] = useState(false);
  const [selectedToPunkt, setSelectedToPunkt] = useState<PunktSelection | null>(null);
  const [requestToContragentModalVisible, setRequestToContragentModalVisible] = useState(false);
  const [selectedContragent, setSelectedContragent] = useState<Contragent | null>(null);
  const [orderContragents, setOrderContragents] = useState<Contragent[]>([]);
  const [loadingContragents, setLoadingContragents] = useState(false);
  const [sendToPunktModalVisible, setSendToPunktModalVisible] = useState(false);
  const [selectedSendToPunkt, setSelectedSendToPunkt] = useState<PunktSelection | null>(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrderContragents = useCallback(async () => {
    if (!order || !id) return;
    setLoadingContragents(true);
    try {
      const response = await apiService.getOrderContragents(id);
      setOrderContragents(response.data.contragents);
    } catch (error: any) {
      console.error('Error loading order contragents:', error);
    } finally {
      setLoadingContragents(false);
    }
  }, [order, id]);

  useEffect(() => {
    if (!order || !id || !punkt) return;
    
    const orderStatus = order.status;
    const isConfirmedByPunkt = orderStatus === 'confirmed_by_punkt';
    const isRequestedToContragent = orderStatus === 'requested_to_contragent';
    const isAssignedToAgent = orderStatus === 'assigned_to_agent';
    const isMyPunkt = punkt._id === order.confirmedByPunkt?._id;
    
    // Check if current punkt is this punkt
    const currentPunktId = order.currentPunkt 
      ? (typeof order.currentPunkt === 'object' ? order.currentPunkt._id : order.currentPunkt)
      : null;
    const isCurrentPunkt = punkt._id && currentPunktId ? punkt._id === currentPunktId : false;
    
    // Load contragents if this punkt is the current punkt (for Holat 3 - second punkt)
    // or if this punkt confirmed the order (for Holat 1, 2 - first punkt)
    if ((isConfirmedByPunkt || isRequestedToContragent) && (isMyPunkt || isCurrentPunkt) && !isAssignedToAgent) {
      loadOrderContragents();
    }
  }, [order, id, punkt, loadOrderContragents]);

  const loadOrder = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await apiService.getOrderById(id);
      setOrder(response.data);
      console.log('order', response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Buyurtma yuklanmadi');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrder(false);
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

    setActionLoading(true);
    try {
      const response = await apiService.requestToContragent(id, { contragentId: selectedContragent._id });
      
      const productCount = selectedContragent.products?.length || 0;
      const message = productCount > 0 
        ? `Contragentga so'rov yuborildi. Faqat bu contragentga tegishli ${productCount} ta mahsulot so'raldi.`
        : 'Contragentga so\'rov yuborildi';
      
      Alert.alert('Muvaffaqiyatli', message, [
        { text: 'OK', onPress: () => {
          setRequestToContragentModalVisible(false);
          setSelectedContragent(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Contragentga so\'rov yuborishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveFromPunkt = () => {
    if (!order) return;
    
    // Check if there's a pending request (will be auto-accepted)
    const pendingRequest = order.punktToPunktRequests?.find(
      (req) => {
        const toPunktId = typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId;
        return toPunktId === punkt?._id && req.status === 'pending';
      }
    );
    
    const acceptedRequest = order.punktToPunktRequests?.find(
      (req) => {
        const toPunktId = typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId;
        return toPunktId === punkt?._id && req.status === 'accepted';
      }
    );
    
    const deliveredRequest = order.punktToPunktRequests?.find(
      (req) => {
        const toPunktId = typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId;
        return toPunktId === punkt?._id && req.status === 'delivered';
      }
    );

    const message = pendingRequest
      ? 'Punktdan buyurtmani qabul qilishni xohlaysizmi? So\'rov avtomatik qabul qilinadi va buyurtma tasdiqlanadi.'
      : acceptedRequest
      ? 'Punktdan buyurtmani qabul qilishni xohlaysizmi?'
      : deliveredRequest
      ? 'Punktdan yuborilgan buyurtmani qabul qilishni xohlaysizmi?'
      : 'Punktdan buyurtmani qabul qilishni xohlaysizmi?';

    Alert.alert(
      'Qabul qilish',
      message,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Qabul qilish',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.receiveFromPunkt(id);
              await loadOrder();
              
              const successMessage = pendingRequest
                ? 'So\'rov avtomatik qabul qilindi va buyurtma tasdiqlandi. Buyurtma qabul qilindi. Endi kontragentlarga so\'rov yuborishingiz mumkin.'
                : deliveredRequest
                ? 'Buyurtma qabul qilindi. Endi agentga yuborishingiz mumkin.'
                : 'Buyurtma qabul qilindi. Endi kontragentlarga so\'rov yuborishingiz mumkin.';
              
              Alert.alert('Muvaffaqiyatli', successMessage);
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

  const handleSendToPunkt = () => {
    // If there's an accepted request, pre-select the fromPunkt (the one who sent the request)
    if (acceptedRequestToThisPunkt && typeof acceptedRequestToThisPunkt.fromPunktId === 'object') {
      const fromPunkt = acceptedRequestToThisPunkt.fromPunktId;
      // Convert to PunktSelection format
      setSelectedSendToPunkt({
        _id: fromPunkt._id,
        name: fromPunkt.name,
        phone: fromPunkt.phone,
        viloyat: fromPunkt.viloyat,
        tuman: fromPunkt.tuman,
        status: 'active',
      });
    }
    setSendToPunktModalVisible(true);
  };

  const submitSendToPunkt = async () => {
    if (!selectedSendToPunkt) {
      Alert.alert('Xatolik', 'Punktni tanlang');
      return;
    }

    Alert.alert(
      'Yuborish',
      `${selectedSendToPunkt.name} punktiga buyurtmani yuborishni xohlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Yuborish',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.sendToPunkt(id, { toPunktId: selectedSendToPunkt._id });
              Alert.alert('Muvaffaqiyatli', 'Buyurtma punktga yuborildi', [
                { text: 'OK', onPress: () => {
                  setSendToPunktModalVisible(false);
                  setSelectedSendToPunkt(null);
                  loadOrder();
                }},
              ]);
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Punktga yuborishda xatolik');
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

  // Status-based button visibility logic according to new API workflow
  const orderStatus = order.status;
  const isPending = orderStatus === 'pending';
  const isConfirmedByPunkt = orderStatus === 'confirmed_by_punkt';
  const isRequestedToContragent = orderStatus === 'requested_to_contragent';
  const isAcceptedByContragent = orderStatus === 'accepted_by_contragent';
  const isDeliveredToPunkt = orderStatus === 'delivered_to_punkt';
  const isAssignedToAgent = orderStatus === 'assigned_to_agent';
  
  // Check if this punkt confirmed the order
  const isMyPunkt = punkt?._id === order.confirmedByPunkt?._id;
  
  // Check if current punkt is this punkt
  const currentPunktId = order.currentPunkt 
    ? (typeof order.currentPunkt === 'object' ? order.currentPunkt._id : order.currentPunkt)
    : null;
  const isCurrentPunkt = punkt?._id && currentPunktId ? punkt._id === currentPunktId : false;
  
  // Check if this punkt has a pending punkt-to-punkt request to respond to
  const hasPendingPunktToPunktRequest = order.punktToPunktRequests?.some(
    (req) =>
      typeof req.toPunktId === 'object' &&
      req.toPunktId._id === punkt?._id &&
      req.status === 'pending'
  ) || false;
  
  // Check if there's an accepted punkt-to-punkt request (can receive)
  const hasAcceptedPunktToPunktRequest = order.punktToPunktRequests?.some(
    (req) => {
      const toPunktId = typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId;
      return toPunktId === punkt?._id && req.status === 'accepted';
    }
  ) || false;
  
  // Check if there's a delivered punkt-to-punkt request to this punkt (can receive after sending)
  const hasDeliveredPunktToPunktRequestToThisPunkt = order.punktToPunktRequests?.some(
    (req) => {
      const toPunktId = typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId;
      return toPunktId === punkt?._id && req.status === 'delivered';
    }
  ) || false;
  
  // Check if contragent has accepted/delivered (can receive)
  const hasAcceptedContragentRequest = order.contragentRequests?.some(
    (req) => {
      const status = typeof req === 'object' ? req.status : null;
      return status === 'accepted' || status === 'delivered_to_punkt';
    }
  ) || false;
  
  // Check if there are contragents without requests (for continuing to request)
  const requestedContragentIds = new Set(
    order.contragentRequests?.map((req) => {
      const contragentId = typeof req.contragentId === 'object' ? req.contragentId._id : req.contragentId;
      return contragentId;
    }) || []
  );
  
  // If contragents list is not loaded yet, assume there might be unrequested ones
  // If loaded, check if there are any without requests
  const hasUnrequestedContragents = orderContragents.length === 0 
    ? true // Show button if not loaded yet (will be checked after load)
    : orderContragents.some(
        (c) => !c.hasRequest || !requestedContragentIds.has(c._id)
      );
  
  // Check if there are contragents from other tumans (need to request to punkt)
  const punktTumanId = punkt?.tuman?._id;
  const hasOtherTumanContragents = orderContragents.length === 0
    ? true // Show button if not loaded yet (will be checked after load)
    : orderContragents.some(
        (c) => c.tuman?._id && c.tuman._id !== punktTumanId && (!c.hasRequest || !requestedContragentIds.has(c._id))
      );
  
  // Button visibility logic according to workflow:
  // Step 1: Respond to punkt request (if pending request to this punkt)
  const canRespondToPunktRequest = hasPendingPunktToPunktRequest;
  
  // Step 2: Confirm order (if pending and this is the current punkt)
  const canConfirm = isPending && (isCurrentPunkt || !order.currentPunkt);
  
  // Step 3: Request to contragent (if confirmed by this punkt OR currentPunkt and not yet requested/assigned)
  // According to API: allows if punkt is currentPunkt (even if not in region)
  // Also allow if requested_to_contragent but there are still unrequested contragents
  const canRequestToContragent = 
    (isMyPunkt || isCurrentPunkt) && 
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    ((isConfirmedByPunkt || isRequestedToContragent || isCurrentPunkt) && hasUnrequestedContragents);
  
  // Step 4: Request to punkt (if confirmed by this punkt and not yet requested/assigned)
  // Also allow if requested_to_contragent and there are contragents from other tumans
  const canRequestToPunkt = 
    isMyPunkt && 
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    ((isConfirmedByPunkt || (isRequestedToContragent && hasOtherTumanContragents)));
  
  // Check if there's an accepted punkt-to-punkt request where this punkt is the toPunkt (can send back to fromPunkt)
  // This means B punkt received request from A punkt, accepted it, and now can send back to A punkt
  // Also check for 'delivered' status in case the request was already processed but currentPunkt hasn't changed yet
  const acceptedRequestToThisPunkt = order.punktToPunktRequests?.find(
    (req) =>
      typeof req.toPunktId === 'object' &&
      req.toPunktId._id === punkt?._id &&
      (req.status === 'accepted' || req.status === 'delivered')
  );
  
  // Check if there's a delivered punkt-to-punkt request where this punkt is the fromPunkt (punkt already sent the order)
  const hasDeliveredPunktToPunktRequest = order.punktToPunktRequests?.some(
    (req) =>
      typeof req.fromPunktId === 'object' &&
      req.fromPunktId._id === punkt?._id &&
      req.status === 'delivered'
  ) || false;
  
  // Check if there's a delivered punkt-to-punkt request where this punkt is the toPunkt (punkt received the order)
  // This is for Holat 3 - when Buloqboshi punkt receives from Asaka punkt
  const hasReceivedFromPunktRequest = order.punktToPunktRequests?.some(
    (req) => {
      if (req.status !== 'delivered') return false;
      const toPunktId = typeof req.toPunktId === 'object' && req.toPunktId !== null 
        ? req.toPunktId._id 
        : req.toPunktId;
      const matches = toPunktId && punkt?._id && String(toPunktId) === String(punkt._id);
      if (matches) {
        console.log('Found received request:', { toPunktId, punktId: punkt._id, req });
      }
      return matches;
    }
  ) || false;
  
  // Step 5: Receive from contragent (if contragent has accepted/delivered and this punkt is currentPunkt)
  // Workflow: Holat 1, 2 - o'z tumanidagi contragentdan qabul qilish
  // Must show BEFORE "Assign to Agent" and "Send to Punkt" - only show if not yet delivered to punkt
  const canReceiveFromContragent = 
    (isAcceptedByContragent || hasAcceptedContragentRequest) &&
    (isMyPunkt || isCurrentPunkt) &&
    !isDeliveredToPunkt &&
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    !hasDeliveredPunktToPunktRequest; // Don't show if already sent to another punkt
  
  // Step 6: Receive from punkt (if there's a pending, accepted, or delivered punkt-to-punkt request to this punkt)
  // Workflow: Holat 3 - boshqa punktdan qabul qilish (buyurtmachi tumani punkti)
  // According to API: if pending, it will auto-accept and confirm; if accepted, just receive; if delivered, receive after sending
  // Show receive button for accepted/delivered requests, or as alternative to accept/reject for pending
  const canReceiveFromPunkt = 
    (hasPendingPunktToPunktRequest || hasAcceptedPunktToPunktRequest || hasDeliveredPunktToPunktRequestToThisPunkt) &&
    !isDeliveredToPunkt &&
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    !canReceiveFromContragent; // Don't show if can receive from contragent
  
  // Check if order is in this punkt's tuman (needed for canSendToPunkt and canAssignToAgent)
  // Check both object and string ID formats
  const orderTumanId = order.deliveryTuman?._id || order.deliveryTuman;
  const punktTumanIdForOrder = punkt?.tuman?._id || punkt?.tuman;
  const isOrderInPunktTuman = orderTumanId && punktTumanIdForOrder && 
    orderTumanId === punktTumanIdForOrder;
  
  // Step 6.5: Send to punkt (if this punkt is currentPunkt, has received from contragent, and there's an accepted request)
  // Workflow: Holat 3 - kontragent tumani punkti contragentdan qabul qilib, buyurtmachi tumani punktiga yuboradi
  // According to API: B punkt can send to A punkt after receiving from contragent
  // Conditions:
  // 1. This punkt is currentPunkt (kontragent tumani punkti)
  // 2. Order is delivered_to_punkt (contragentdan qabul qilingan)
  // 3. There's an accepted request TO this punkt (from buyurtmachi tumani punkti)
  // 4. This punkt hasn't already sent the order (hasDeliveredPunktToPunktRequest = false)
  // 5. Order is NOT in this punkt's tuman (for Holat 3, this should be different tuman - kontragent tumani punkti)
  // 6. Request status is 'accepted' (not 'delivered' - if delivered, it means already sent)
  const canSendToPunkt = 
    isCurrentPunkt &&
    !isOrderInPunktTuman && // This punkt is not in the order's tuman (kontragent tumani punkti, not buyurtmachi tumani)
    isDeliveredToPunkt &&
    acceptedRequestToThisPunkt !== undefined &&
    acceptedRequestToThisPunkt.status === 'accepted' && // Only show if request is accepted, not delivered
    acceptedRequestToThisPunkt.fromPunktId !== undefined && // Ensure fromPunktId exists
    !hasDeliveredPunktToPunktRequest && // Don't show if already sent
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    !canReceiveFromContragent && // Don't show if can receive from contragent
    !canReceiveFromPunkt; // Don't show if can receive from punkt
  
  // Step 7: Assign to agent (if delivered to punkt and this punkt has it, and not yet assigned)
  // Workflow: Holat 1, 2 - o'z tumanidagi buyurtmalar uchun agentga yuborish
  // Holat 3 - faqat buyurtmachi tumani punkti uchun agentga yuborish (kontragent tumani punkti uchun emas)
  // Must show AFTER "Receive from Contragent" or "Receive from Punkt" - only show if already delivered to punkt
  // Only show if order is in this punkt's tuman (not for second punkt in Holat 3)
  
  // For Holat 3: Buloqboshi punkt can assign to agent if:
  // 1. Order is in Buloqboshi tuman (isOrderInPunktTuman = true)
  // 2. Has received from punkt (hasReceivedFromPunktRequest = true) OR is currentPunkt OR isMyPunkt
  // For Holat 1, 2: O'z tumanidagi buyurtmalar uchun agentga yuborish
  const canAssignToAgent = 
    isDeliveredToPunkt &&
    isOrderInPunktTuman && // Only show if order is in this punkt's tuman (buyurtmachi tumani punkti)
    (isMyPunkt || isCurrentPunkt || hasReceivedFromPunktRequest) && // Allow if punkt received from another punkt (Holat 3)
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    !canReceiveFromContragent && // Ensure this only shows when receive from contragent is not available
    !canReceiveFromPunkt && // Ensure this only shows when receive from punkt is not available (pending/accepted only, not delivered)
    !canSendToPunkt; // Ensure this only shows when send to punkt is not available (only for second punkt)
  
  // Debug: Log button visibility for troubleshooting
  if (order && punkt) {
    const currentPunktId = order.currentPunkt 
      ? (typeof order.currentPunkt === 'object' ? order.currentPunkt._id : order.currentPunkt)
      : null;
    console.log('Button visibility debug:', {
      isDeliveredToPunkt,
      isOrderInPunktTuman,
      isMyPunkt,
      isCurrentPunkt,
      hasReceivedFromPunktRequest,
      canReceiveFromContragent,
      canReceiveFromPunkt,
      canSendToPunkt,
      canAssignToAgent,
      orderTumanId,
      punktTumanIdForOrder,
      punktId: punkt._id,
      currentPunktId,
      punktToPunktRequests: order.punktToPunktRequests?.map(req => ({
        status: req.status,
        toPunktId: typeof req.toPunktId === 'object' ? req.toPunktId._id : req.toPunktId,
        fromPunktId: typeof req.fromPunktId === 'object' ? req.fromPunktId._id : req.fromPunktId,
      })),
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Buyurtma tafsilotlari</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
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

      {order.contragentRequests && order.contragentRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contragent so'rovlari</Text>
          <View style={styles.card}>
            {order.contragentRequests.map((req, index) => {
              const contragent = typeof req.contragentId === 'object' ? req.contragentId : null;
              const statusLabels: Record<string, string> = {
                'pending': 'Kutilmoqda',
                'accepted': 'Qabul qilindi',
                'rejected': 'Rad etilgan',
                'delivered_to_punkt': 'Punktga yetkazildi',
              };
              return (
                <View key={index} style={styles.requestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestPunktName}>
                      {contragent?.name || 'Noma\'lum contragent'}
                    </Text>
                    <Text style={styles.requestStatus}>
                      {statusLabels[req.status] || req.status}
                    </Text>
                    {req.requestedAt && (
                      <Text style={styles.requestDate}>
                        So'rov: {formatDate(req.requestedAt)}
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
        {/* Step 1: Respond to punkt request (if pending request to this punkt) */}
        {/* According to API: Can either accept/reject OR receive (which auto-accepts) */}
        {canRespondToPunktRequest && hasPendingPunktToPunktRequest && (
          <>
            <Button
              title="Qabul qilish va tasdiqlash"
              onPress={() => handleRespondToPunktRequest('accepted')}
              variant="secondary"
              loading={actionLoading}
              style={styles.actionButton}
            />
            <Button
              title="Rad etish"
              onPress={() => handleRespondToPunktRequest('rejected')}
              variant="danger"
              loading={actionLoading}
              style={styles.actionButton}
            />
          </>
        )}

        {/* Step 2: Confirm order (if pending) */}
        {canConfirm && (
          <Button
            title="Tasdiqlash"
            onPress={handleConfirm}
            variant="primary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 3: Request to contragent (if confirmed by this punkt) */}
        {canRequestToContragent && (
          <Button
            title="Contragentga so'rov yuborish"
            onPress={handleRequestToContragent}
            variant="outline"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 4: Request to punkt (if confirmed by this punkt) */}
        {canRequestToPunkt && (
          <Button
            title="Boshqa punktga so'rov yuborish"
            onPress={handleRequestToPunkt}
            variant="outline"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 5: Receive from contragent (if contragent has accepted/delivered) */}
        {/* Workflow: Holat 1, 2 - o'z tumanidagi contragentdan qabul qilish */}
        {canReceiveFromContragent && (
          <Button
            title="Contragentdan qabul qilish"
            onPress={handleReceiveFromContragent}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 5.5: Send to punkt (if this punkt received from contragent and needs to send to customer's district punkt) */}
        {/* Workflow: Holat 3 - kontragent tumani punkti contragentdan qabul qilib, buyurtmachi tumani punktiga yuboradi */}
        {canSendToPunkt && (
          <Button
            title="Boshqa punktga yuborish"
            onPress={handleSendToPunkt}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 6: Receive from punkt (if there's a pending or accepted punkt-to-punkt request) */}
        {/* Workflow: Holat 3 - buyurtmachi tumani punkti boshqa punktdan qabul qiladi */}
        {/* For pending: Receive auto-accepts and confirms. For accepted: just receives */}
        {canReceiveFromPunkt && !canRespondToPunktRequest && (
          <Button
            title={hasPendingPunktToPunktRequest ? "Punktdan qabul qilish (avtomatik qabul va tasdiqlash)" : "Punktdan qabul qilish"}
            onPress={handleReceiveFromPunkt}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}
        
        {/* Alternative: Receive directly from pending (auto-accepts) - shown alongside accept/reject */}
        {canReceiveFromPunkt && canRespondToPunktRequest && hasPendingPunktToPunktRequest && (
          <Button
            title="Yoki to'g'ridan-to'g'ri qabul qilish (avtomatik qabul)"
            onPress={handleReceiveFromPunkt}
            variant="outline"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 7: Assign to agent (if delivered/received and not yet assigned) */}
        {canAssignToAgent && (
          <Button
            title="Agentga yuborish"
            onPress={handleAssignToAgent}
            variant="primary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* If no actions available, show message */}
        {!canRespondToPunktRequest && 
         !canConfirm && 
         !canRequestToContragent && 
         !canRequestToPunkt && 
         !canReceiveFromContragent && 
         !canSendToPunkt &&
         !canReceiveFromPunkt && 
         !canAssignToAgent && (
          <View style={styles.noActionsContainer}>
            <Text style={styles.noActionsText}>
              {isAssignedToAgent && 'Buyurtma agentga yuborilgan'}
              {orderStatus === 'confirmed_by_agent' && 'Buyurtma agent tomonidan tasdiqlangan'}
              {orderStatus === 'confirmed_by_customer' && 'Buyurtma mijoz tomonidan tasdiqlangan'}
              {!isMyPunkt && isConfirmedByPunkt && 'Buyurtma boshqa punkt tomonidan tasdiqlangan'}
              {!canConfirm && !canRequestToContragent && !canRequestToPunkt && 'Hech qanday amal mavjud emas'}
            </Text>
          </View>
        )}
      </View>

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
                currentPunktTumanId={punkt?.tuman?._id}
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
                    <View style={styles.productsContainer}>
                      <Text style={styles.productsLabel}>
                        Bu contragentdan so'raladigan mahsulotlar ({selectedContragent.products.length} ta):
                      </Text>
                      {selectedContragent.products.map((product, index) => (
                        <View key={product._id || index} style={styles.productItem}>
                          <Text style={styles.productName}>• {product.name}</Text>
                          <Text style={styles.productDetails}>
                            Miqdor: {product.quantity} ta • Narx: {product.price.toLocaleString()} so'm
                          </Text>
                        </View>
                      ))}
                    </View>
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

      <Modal
        visible={sendToPunktModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSendToPunktModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Punktga yuborish</Text>
              <TouchableOpacity onPress={() => {
                setSendToPunktModalVisible(false);
                setSelectedSendToPunkt(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Punktni tanlang</Text>
              <PunktPicker
                selectedPunkt={selectedSendToPunkt}
                onSelect={setSelectedSendToPunkt}
                viloyatId={order?.deliveryViloyat._id}
                tumanId={order?.deliveryTuman?._id}
                orderItems={order?.items}
                currentPunktTumanId={punkt?.tuman?._id}
              />
              {selectedSendToPunkt && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan punkt:</Text>
                  <Text style={styles.selectedPunktName}>{selectedSendToPunkt.name}</Text>
                  <Text style={styles.selectedPunktDetails}>
                    {selectedSendToPunkt.phone} • {selectedSendToPunkt.viloyat.name}
                    {selectedSendToPunkt.tuman && `, ${selectedSendToPunkt.tuman.name}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setSendToPunktModalVisible(false);
                  setSelectedSendToPunkt(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Yuborish"
                onPress={submitSendToPunkt}
                loading={actionLoading}
                disabled={!selectedSendToPunkt}
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
  productsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  productsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  productItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  productDetails: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
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

