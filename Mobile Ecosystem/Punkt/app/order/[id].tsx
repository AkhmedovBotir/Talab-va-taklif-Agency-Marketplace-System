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
  TextInput,
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

// Helper function to shorten base64 strings in logs
const shortenBase64 = (str: string, maxLength: number = 100): string => {
  if (typeof str !== 'string') return str;
  if (str.length <= maxLength) return str;
  if (str.startsWith('data:image') || str.length > 200) {
    return str.substring(0, maxLength) + '... [truncated]';
  }
  return str;
};

// Helper function to clean object for logging (remove long base64 strings)
const cleanForLog = (obj: any, depth: number = 0): any => {
  if (depth > 5) return '[max depth reached]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && obj.length > 200) {
      return shortenBase64(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForLog(item, depth + 1));
  }
  const cleaned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string' && value.length > 200) {
        cleaned[key] = shortenBase64(value);
      } else if (typeof value === 'object') {
        cleaned[key] = cleanForLog(value, depth + 1);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

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
  const [payZakladModalVisible, setPayZakladModalVisible] = useState(false);
  const [selectedContragentRequest, setSelectedContragentRequest] = useState<{
    _id: string;
    contragentId: Contragent | string;
  } | null>(null);
  const [zakladPercentage, setZakladPercentage] = useState<number>(40);
  const [payFinalPaymentModalVisible, setPayFinalPaymentModalVisible] = useState(false);
  const [payProfitModalVisible, setPayProfitModalVisible] = useState(false);
  const [selectedContragentRequestForPayment, setSelectedContragentRequestForPayment] = useState<{
    _id: string;
    contragentId: Contragent | string;
  } | null>(null);
  const [paidZakladRequestIds, setPaidZakladRequestIds] = useState<Set<string>>(new Set());

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
      // Error handled silently
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
      
      // Backend'dan kelgan zakladPaid field'larini state'ga sinxronlashtirish
      if (response.data.contragentRequests) {
        const paidIds = new Set<string>();
        response.data.contragentRequests.forEach((req: any) => {
          if (req._id && ((req as any).zakladPaid === true)) {
            paidIds.add(req._id);
          }
        });
        if (paidIds.size > 0) {
          setPaidZakladRequestIds(prev => {
            return new Set([...prev, ...paidIds]);
          });
        }
      }
      
      setOrder(response.data);
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
      await apiService.requestToContragent(id, { contragentId: selectedContragent._id });
      
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
  const isConfirmedByCustomer = orderStatus === 'confirmed_by_customer';
  
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
  
  // Check if zaklad can be paid (when order is delivered_to_punkt and there's a delivered contragent request)
  // This must be checked BEFORE canAssignToAgent to ensure zaklad is paid first
  // Zaklad to'langanligini tekshirish: agar contragentRequest'da zakladPaid field bo'lsa yoki 
  // boshqa usul bilan zaklad to'langanligini aniqlash
  const deliveredContragentRequests = order.contragentRequests?.filter(
    (req) => {
      if (typeof req !== 'object') return false;
      const status = req.status;
      const requestId = req._id;
      // Zaklad to'langanligini tekshirish:
      // 1. Agar req'da zakladPaid field bo'lsa
      // 2. Yoki state'da zaklad to'langan request ID'lar ro'yxatida bo'lsa
      const zakladPaid = (req as any).zakladPaid === true || paidZakladRequestIds.has(requestId);
      return status === 'delivered_to_punkt' && !zakladPaid;
    }
  ) || [];
  
  // Zaklad to'lash mumkin bo'lsa, faqat zaklad to'lanmagan delivered request'lar bo'lsa
  const canPayZaklad = 
    isDeliveredToPunkt &&
    (isMyPunkt || isCurrentPunkt) &&
    deliveredContragentRequests.length > 0 && // Faqat zaklad to'lanmagan request'lar
    !isAssignedToAgent &&
    !order.assignedToAgent &&
    !canReceiveFromContragent &&
    !canReceiveFromPunkt &&
    !canSendToPunkt &&
    !isConfirmedByCustomer; // Don't show if customer already confirmed

  // Step 7: Assign to agent (if delivered to punkt and this punkt has it, and not yet assigned)
  // Workflow: Holat 1, 2 - o'z tumanidagi buyurtmalar uchun agentga yuborish
  // Holat 3 - faqat buyurtmachi tumani punkti uchun agentga yuborish (kontragent tumani punkti uchun emas)
  // Must show AFTER "Receive from Contragent" or "Receive from Punkt" - only show if already delivered to punkt
  // Only show if order is in this punkt's tuman (not for second punkt in Holat 3)
  // IMPORTANT: Can only assign to agent AFTER zaklad is paid (if zaklad needs to be paid)
  
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
    !canSendToPunkt && // Ensure this only shows when send to punkt is not available (only for second punkt)
    !canPayZaklad; // IMPORTANT: Can only assign to agent AFTER zaklad is paid (if zaklad needs to be paid)

  // Check if final payment and profit can be paid (when customer confirmed the order)
  const canPayFinalPayment = 
    isConfirmedByCustomer &&
    (isMyPunkt || isCurrentPunkt) &&
    deliveredContragentRequests.length > 0 &&
    !canReceiveFromContragent &&
    !canReceiveFromPunkt &&
    !canSendToPunkt &&
    !canAssignToAgent;

  const canPayProfit = canPayFinalPayment; // Same conditions

  const handlePayZaklad = () => {
    if (deliveredContragentRequests.length === 0) {
      Alert.alert('Xatolik', 'Zaklad to\'lash uchun yetkazilgan contragent so\'rovi topilmadi');
      return;
    }
    
    // If there's only one delivered request, select it automatically
    if (deliveredContragentRequests.length === 1) {
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequest(req);
        setPayZakladModalVisible(true);
      }
    } else {
      // If multiple, show selection (for now, just use the first one)
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequest(req);
        setPayZakladModalVisible(true);
      }
    }
  };

  const submitPayZaklad = async () => {
    if (!selectedContragentRequest || !zakladPercentage) {
      Alert.alert('Xatolik', 'Barcha maydonlarni to\'ldiring');
      return;
    }

    if (zakladPercentage < 0 || zakladPercentage > 100) {
      Alert.alert('Xatolik', 'Zaklad foizi 0 dan 100 gacha bo\'lishi kerak');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.payZaklad({
        orderId: id,
        contragentRequestId: selectedContragentRequest._id,
        zakladPercentage: zakladPercentage,
      });
      
      // Zaklad to'langan contragent request ID'sini state'ga qo'shish
      // Bu orqali zaklad to'langanligi darhol yangilanadi va canPayZaklad false bo'ladi
      const paidRequestId = selectedContragentRequest._id;
      setPaidZakladRequestIds(prev => {
        return new Set([...prev, paidRequestId]);
      });
      
      // Zaklad to'langandan keyin order'ni yangilash
      // Bu orqali backend'dan yangi order ma'lumotlari keladi
      await loadOrder();
      
      setPayZakladModalVisible(false);
      setSelectedContragentRequest(null);
      setZakladPercentage(40);
      Alert.alert('Muvaffaqiyatli', 'Zaklad muvaffaqiyatli to\'landi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Zaklad to\'lashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayFinalPayment = () => {
    if (deliveredContragentRequests.length === 0) {
      Alert.alert('Xatolik', 'Qolgan asl narx to\'lash uchun yetkazilgan contragent so\'rovi topilmadi');
      return;
    }
    
    if (deliveredContragentRequests.length === 1) {
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequestForPayment(req);
        setPayFinalPaymentModalVisible(true);
      }
    } else {
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequestForPayment(req);
        setPayFinalPaymentModalVisible(true);
      }
    }
  };

  const submitPayFinalPayment = async () => {
    if (!selectedContragentRequestForPayment) {
      Alert.alert('Xatolik', 'Contragent so\'rovi tanlanmagan');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.payFinalPayment({
        orderId: id,
        contragentRequestId: selectedContragentRequestForPayment._id,
      });
      Alert.alert('Muvaffaqiyatli', 'Qolgan asl narx muvaffaqiyatli to\'landi', [
        { text: 'OK', onPress: () => {
          setPayFinalPaymentModalVisible(false);
          setSelectedContragentRequestForPayment(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Qolgan asl narx to\'lashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayProfit = () => {
    if (deliveredContragentRequests.length === 0) {
      Alert.alert('Xatolik', 'Sof foyda to\'lash uchun yetkazilgan contragent so\'rovi topilmadi');
      return;
    }
    
    if (deliveredContragentRequests.length === 1) {
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequestForPayment(req);
        setPayProfitModalVisible(true);
      }
    } else {
      const req = deliveredContragentRequests[0];
      if (typeof req === 'object' && req._id) {
        setSelectedContragentRequestForPayment(req);
        setPayProfitModalVisible(true);
      }
    }
  };

  const submitPayProfit = async () => {
    if (!selectedContragentRequestForPayment) {
      Alert.alert('Xatolik', 'Contragent so\'rovi tanlanmagan');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.payProfit({
        orderId: id,
        contragentRequestId: selectedContragentRequestForPayment._id,
      });
      Alert.alert('Muvaffaqiyatli', 'Sof foyda muvaffaqiyatli to\'landi', [
        { text: 'OK', onPress: () => {
          setPayProfitModalVisible(false);
          setSelectedContragentRequestForPayment(null);
          loadOrder();
        }},
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Sof foyda to\'lashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };
  

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
          {order.items.map((item, index) => {
            // Product ma'lumotlarini olish - agar product object bo'lsa, undan foydalanamiz
            // Agar product faqat ID bo'lsa, boshqa ma'lumotlardan foydalanamiz
            const product = typeof item.product === 'object' ? item.product : null;
            const productName = product?.name 
              ? product.name 
              : (item as any).productModel || (item as any).productType || 'Mahsulot';
            const productPrice = product?.price 
              ? product.price 
              : item.price;
            const productContragent = product?.contragent;
            
            return (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{productName}</Text>
                <Text style={styles.itemQuantity}>Miqdor: {item.quantity} ta</Text>
                  {productContragent && (
                    <View style={styles.contragentInfo}>
                      <Text style={styles.contragentLabel}>Contragent:</Text>
                      <Text style={styles.contragentName}>{productContragent.name}</Text>
                      {productContragent.inn && (
                        <Text style={styles.contragentDetails}>INN: {productContragent.inn}</Text>
                      )}
                      {productContragent.phone && (
                        <Text style={styles.contragentDetails}>Tel: {productContragent.phone}</Text>
                      )}
                      {productContragent.tuman && (
                        <Text style={styles.contragentDetails}>
                          {productContragent.viloyat?.name || ''}{productContragent.tuman ? `, ${productContragent.tuman.name}` : ''}
                        </Text>
                      )}
              </View>
                  )}
                  {product?.category && (
                    <Text style={styles.itemCategory}>
                      Kategoriya: {product.category.name}
                    </Text>
                  )}
                  {(item as any).productType && !productContragent && (
                    <Text style={styles.itemCategory}>
                      Turi: {(item as any).productType}
                    </Text>
                  )}
                </View>
                <View style={styles.itemPriceContainer}>
              <Text style={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </Text>
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <Text style={styles.itemOriginalPrice}>
                      {formatPrice(item.originalPrice * item.quantity)}
                    </Text>
                  )}
            </View>
              </View>
            );
          })}
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

        {/* Step 8: Pay zaklad to contragent (if delivered to punkt and not yet assigned) */}
        {canPayZaklad && (
          <Button
            title="Contragentga zaklad to'lash"
            onPress={handlePayZaklad}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 9: Pay final payment to contragent (if customer confirmed) */}
        {canPayFinalPayment && (
          <Button
            title="Contragentga qolgan asl narx to'lash"
            onPress={handlePayFinalPayment}
            variant="secondary"
            loading={actionLoading}
            style={styles.actionButton}
          />
        )}

        {/* Step 10: Pay profit to contragent (if customer confirmed) */}
        {canPayProfit && (
          <Button
            title="Contragentga sof foyda to'lash"
            onPress={handlePayProfit}
            variant="secondary"
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
         !canAssignToAgent && 
         !canPayZaklad &&
         !canPayFinalPayment &&
         !canPayProfit && (
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
              />
              {selectedAgent && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.selectedPunktLabel}>Tanlangan agent:</Text>
                  <Text style={styles.selectedPunktName}>{selectedAgent.name}</Text>
                  <Text style={styles.selectedPunktDetails}>
                    {selectedAgent.phone}
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

      <Modal
        visible={payZakladModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPayZakladModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contragentga zaklad to'lash</Text>
              <TouchableOpacity onPress={() => {
                setPayZakladModalVisible(false);
                setSelectedContragentRequest(null);
                setZakladPercentage(40);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedContragentRequest && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.modalLabel}>Contragent:</Text>
                  {typeof selectedContragentRequest.contragentId === 'object' ? (
                    <Text style={styles.selectedPunktName}>
                      {selectedContragentRequest.contragentId.name}
                    </Text>
                  ) : (
                    <Text style={styles.selectedPunktName}>Contragent ID: {selectedContragentRequest.contragentId}</Text>
                  )}
                </View>
              )}

              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Zaklad foizi (%)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={zakladPercentage.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num >= 0 && num <= 100) {
                      setZakladPercentage(num);
                    } else if (text === '') {
                      setZakladPercentage(0);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="40"
                  placeholderTextColor="#999"
                />
                <Text style={styles.modalHint}>
                  Zaklad foizi 0 dan 100 gacha bo'lishi kerak
                </Text>
              </View>

              {order && zakladPercentage > 0 && (
                <View style={styles.zakladCalculation}>
                  <Text style={styles.modalLabel}>Hisob-kitob:</Text>
                  <Text style={styles.calculationText}>
                    Buyurtma jami: {order.totalPrice.toLocaleString()} so'm
                  </Text>
                  <Text style={styles.calculationText}>
                    Zaklad ({zakladPercentage}%): {(order.totalPrice * zakladPercentage / 100).toLocaleString()} so'm
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setPayZakladModalVisible(false);
                  setSelectedContragentRequest(null);
                  setZakladPercentage(40);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="To'lash"
                onPress={submitPayZaklad}
                loading={actionLoading}
                disabled={!selectedContragentRequest || zakladPercentage <= 0 || zakladPercentage > 100}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Final Payment Modal */}
      <Modal
        visible={payFinalPaymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPayFinalPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contragentga qolgan asl narx to'lash</Text>
              <TouchableOpacity onPress={() => {
                setPayFinalPaymentModalVisible(false);
                setSelectedContragentRequestForPayment(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedContragentRequestForPayment && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.modalLabel}>Contragent:</Text>
                  {typeof selectedContragentRequestForPayment.contragentId === 'object' ? (
                    <Text style={styles.selectedPunktName}>
                      {selectedContragentRequestForPayment.contragentId.name}
                    </Text>
                  ) : (
                    <Text style={styles.selectedPunktName}>Contragent ID: {selectedContragentRequestForPayment.contragentId}</Text>
                  )}
                </View>
              )}

              {order && (
                <View style={styles.zakladCalculation}>
                  <Text style={styles.modalLabel}>Hisob-kitob:</Text>
                  <Text style={styles.calculationText}>
                    Buyurtma jami narx: {order.totalPrice.toLocaleString()} so'm
                  </Text>
                  <Text style={styles.calculationText}>
                    Jami asl narx: {order.totalOriginalPrice?.toLocaleString() || '0'} so'm
                  </Text>
                  <Text style={styles.calculationText}>
                    Qolgan asl narx: {order.totalOriginalPrice ? (order.totalOriginalPrice - (order.totalPrice * 0.4)).toLocaleString() : '0'} so'm
                  </Text>
                  <Text style={[styles.calculationText, { color: '#8E8E93', fontSize: 12, marginTop: 8 }]}>
                    * Qolgan asl narx = Jami asl narx - Zaklad (zaklad price dan hisoblangani uchun, original ga proportional)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setPayFinalPaymentModalVisible(false);
                  setSelectedContragentRequestForPayment(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="To'lash"
                onPress={submitPayFinalPayment}
                loading={actionLoading}
                disabled={!selectedContragentRequestForPayment}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Profit Payment Modal */}
      <Modal
        visible={payProfitModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPayProfitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contragentga sof foyda to'lash</Text>
              <TouchableOpacity onPress={() => {
                setPayProfitModalVisible(false);
                setSelectedContragentRequestForPayment(null);
              }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedContragentRequestForPayment && (
                <View style={styles.selectedPunktInfo}>
                  <Text style={styles.modalLabel}>Contragent:</Text>
                  {typeof selectedContragentRequestForPayment.contragentId === 'object' ? (
                    <Text style={styles.selectedPunktName}>
                      {selectedContragentRequestForPayment.contragentId.name}
                    </Text>
                  ) : (
                    <Text style={styles.selectedPunktName}>Contragent ID: {selectedContragentRequestForPayment.contragentId}</Text>
                  )}
                </View>
              )}

              {order && (
                <View style={styles.zakladCalculation}>
                  <Text style={styles.modalLabel}>Hisob-kitob:</Text>
                  <Text style={styles.calculationText}>
                    Buyurtma jami narx: {order.totalPrice.toLocaleString()} so'm
                  </Text>
                  <Text style={styles.calculationText}>
                    Jami asl narx: {order.totalOriginalPrice?.toLocaleString() || '0'} so'm
                  </Text>
                  <Text style={[styles.calculationText, { color: '#34C759', fontWeight: '700' }]}>
                    Sof foyda: {order.totalOriginalPrice ? (order.totalPrice - order.totalOriginalPrice).toLocaleString() : order.totalPrice.toLocaleString()} so'm
                  </Text>
                  <Text style={[styles.calculationText, { color: '#8E8E93', fontSize: 12, marginTop: 8 }]}>
                    * Sof foyda = Jami narx - Jami asl narx
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Bekor qilish"
                onPress={() => {
                  setPayProfitModalVisible(false);
                  setSelectedContragentRequestForPayment(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="To'lash"
                onPress={submitPayProfit}
                loading={actionLoading}
                disabled={!selectedContragentRequestForPayment}
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
    paddingTop: 30,
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
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  itemOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  contragentInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contragentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  contragentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contragentDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  modalInputContainer: {
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginTop: 8,
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  zakladCalculation: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  calculationText: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
  },
});

