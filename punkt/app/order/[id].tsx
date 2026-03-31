import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useDialog } from '../contexts/DialogContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
  useScreenContentWidth,
} from '../hooks/useScreenContentWidth';
import {
  apiService,
  punktContragentRequestLabel,
  punktLineItemContragentLabel,
  punktOrderAssignedAgentDisplay,
  punktOrderHasAssignedAgent,
  PunktMeAgentListItem,
  PunktMeOrderDetail,
  PunktMeOrderLineItem,
} from '../services/api';
import {
  uzAddressType,
  uzContragentLineRequestStatus,
  uzMarketplaceStatus,
  uzPunktAcceptanceStatus,
} from '../utils/status-uz';

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function lineAmount(item: PunktMeOrderLineItem): string | null {
  const t = item.total_price ?? item.line_total;
  if (typeof t === 'number') return formatMoney(t);
  const u = item.unit_price;
  const q = item.quantity;
  if (typeof u === 'number' && typeof q === 'number') return formatMoney(u * q);
  return null;
}

function hasIsoDate(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function lineTotalNum(item: PunktMeOrderLineItem): number | null {
  if (typeof item.line_total === 'number') return item.line_total;
  if (typeof item.total_price === 'number') return item.total_price;
  const u = item.unit_price;
  const q = item.quantity;
  if (typeof u === 'number' && typeof q === 'number') return u * q;
  return null;
}

const EMPTY_LINE_ITEMS: PunktMeOrderLineItem[] = [];

export default function PunktMeOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSnackbar } = useSnackbar();
  const { showConfirm } = useDialog();
  const { isWeb, horizontalPad, contentMaxWidth } =
    useScreenContentWidth(960);

  const [order, setOrder] = useState<PunktMeOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [payoutDraft, setPayoutDraft] = useState<Record<number, string>>({});
  const [agents, setAgents] = useState<PunktMeAgentListItem[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [snapMfyName, setSnapMfyName] = useState<string | null>(null);
  const [marketplaceUserName, setMarketplaceUserName] = useState<string | null>(null);
  const [requestDistrictNames, setRequestDistrictNames] = useState<Record<number, string>>({});
  const [agentMfyNames, setAgentMfyNames] = useState<Record<number, string>>({});

  const loadOrder = useCallback(
    async (showSpinner = true) => {
      if (!id) return;
      try {
        if (showSpinner) setLoading(true);
        const res = await apiService.getPunktMeOrderById(id);
        setOrder(res.data);
      } catch {
        router.back();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, router]
  );

  useEffect(() => {
    loadOrder(true);
  }, [loadOrder]);

  useEffect(() => {
    if (!order) {
      setDistrictName(null);
      setSnapMfyName(null);
      setMarketplaceUserName(null);
      setRequestDistrictNames({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const [dName, mfyName, uName] = await Promise.all([
        apiService.getNoauthDistrictNameById(order.routing_district_id),
        apiService.getNoauthMfyNameById(order.snap_mfy_id),
        apiService.getNoauthMarketplaceUserNameById(order.user_id),
      ]);
      if (cancelled) return;
      setDistrictName(dName);
      setSnapMfyName(mfyName);
      setMarketplaceUserName(uName);

      const districtIds = Array.from(
        new Set(
          (order.contragent_line_requests || [])
            .map((r) => r.routing_district_id)
            .filter((v): v is number => typeof v === 'number' && v > 0)
        )
      );
      const pairs = await Promise.all(
        districtIds.map(async (districtId) => [
          districtId,
          (await apiService.getNoauthDistrictNameById(districtId)) || '',
        ] as const)
      );
      if (!cancelled) {
        const next: Record<number, string> = {};
        for (const [idNum, name] of pairs) {
          if (name) next[idNum] = name;
        }
        setRequestDistrictNames(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order]);

  useEffect(() => {
    const items = order?.items;
    if (!items?.length) {
      setPayoutDraft({});
      return;
    }
    const next: Record<number, string> = {};
    for (const it of items) {
      const p = it.contragent_payout_percent;
      next[it.id] =
        typeof p === 'number' && !Number.isNaN(p) ? String(Math.round(p)) : '';
    }
    setPayoutDraft(next);
  }, [order?.id, order?.items]);

  const logisticsAccepted = order?.punkt_acceptance_status === 'contragent_requests_created';
  const collected = order ? hasIsoDate(order.punkt_collected_at) : false;
  const ready = order ? hasIsoDate(order.punkt_ready_at) : false;
  const hasAgent = order ? punktOrderHasAssignedAgent(order) : false;
  const lineItems = order?.items ?? EMPTY_LINE_ITEMS;
  const mfyOk = typeof order?.snap_mfy_id === 'number' && order.snap_mfy_id > 0;

  const payoutsSaved =
    lineItems.length > 0 &&
    lineItems.every(
      (it) =>
        typeof it.contragent_payout_percent === 'number' &&
        !Number.isNaN(it.contragent_payout_percent)
    );

  useEffect(() => {
    if (!order || !mfyOk || hasAgent || !ready || !payoutsSaved) {
      setAgents([]);
      return;
    }
    let cancelled = false;
    setAgentsLoading(true);
    (async () => {
      try {
        const res = await apiService.getPunktMeAgents(order.snap_mfy_id);
        if (!cancelled) setAgents(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setAgents([]);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order, mfyOk, hasAgent, ready, payoutsSaved, order?.snap_mfy_id]);

  useEffect(() => {
    if (!agents.length) {
      setAgentMfyNames({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const mfyIds = Array.from(
        new Set(
          agents
            .map((a) => a.mfy_id)
            .filter((v): v is number => typeof v === 'number' && v > 0)
        )
      );
      const pairs = await Promise.all(
        mfyIds.map(async (mfyId) => [
          mfyId,
          (await apiService.getNoauthMfyNameById(mfyId)) || '',
        ] as const)
      );
      if (!cancelled) {
        const next: Record<number, string> = {};
        for (const [idNum, name] of pairs) {
          if (name) next[idNum] = name;
        }
        setAgentMfyNames(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agents]);

  const canCollect =
    !!order &&
    logisticsAccepted &&
    !collected &&
    order.marketplace_status === 'pending';

  const canMarkReady =
    !!order && logisticsAccepted && collected && !ready && order.marketplace_status === 'pending';

  const canEditPayouts =
    !!order &&
    logisticsAccepted &&
    ready &&
    !hasAgent &&
    lineItems.length > 0 &&
    order.marketplace_status === 'pending';

  const payoutDraftValid = useMemo(() => {
    if (!lineItems.length) return false;
    for (const it of lineItems) {
      const raw = payoutDraft[it.id];
      if (raw === undefined || raw === null || String(raw).trim() === '') return false;
      const n = Number(String(raw).replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || n > 100) return false;
    }
    return true;
  }, [lineItems, payoutDraft]);

  const showAgentAssign = canEditPayouts && payoutsSaved && mfyOk;
  const showAgentMissingMfy = canEditPayouts && payoutsSaved && !mfyOk;

  const agentDeclared = order
    ? hasIsoDate(order.agent_declared_payment_to_punkt_at)
    : false;
  const punktPaymentConfirmed = order
    ? hasIsoDate(order.punkt_confirmed_agent_payment_at)
    : false;
  const postPaymentDelivered = order
    ? hasIsoDate(order.punkt_post_payment_delivered_at)
    : false;
  const remainderHanded = order
    ? hasIsoDate(order.punkt_contragent_remainder_handed_over_at)
    : false;

  const canConfirmAgentPayment =
    !!order &&
    hasAgent &&
    agentDeclared &&
    !punktPaymentConfirmed;

  const canPostPaymentDelivered =
    !!order &&
    hasAgent &&
    punktPaymentConfirmed &&
    !postPaymentDelivered;

  const canHandoverRemainder =
    !!order &&
    hasAgent &&
    punktPaymentConfirmed &&
    postPaymentDelivered &&
    !remainderHanded;

  const canAccept =
    order?.punkt_acceptance_status === 'inbox' && order?.marketplace_status === 'pending';

  const canReject = order?.punkt_acceptance_status === 'inbox';

  const showStickyFooter =
    canAccept ||
    canReject ||
    canCollect ||
    canMarkReady ||
    canConfirmAgentPayment ||
    canPostPaymentDelivered ||
    canHandoverRemainder;

  const onAccept = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Qabul qilish',
        message: 'Buyurtmani qabul qilib, kontragent so‘rovlarini yaratasizmi?',
        cancelText: 'Bekor',
        confirmText: 'Qabul qilish',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.acceptPunktMeOrder(id);
        showSnackbar(res.message || 'Buyurtma qabul qilindi', 'success');
        await loadOrder(false);
      } catch {
        /* snackbar notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onReject = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Rad etish',
        message: 'Buyurtmani rad etishni tasdiqlaysizmi?',
        cancelText: 'Bekor',
        confirmText: 'Rad etish',
        destructive: true,
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.rejectPunktMeOrder(id);
        showSnackbar(res.message || 'Buyurtma rad etildi', 'success');
        await loadOrder(false);
      } catch {
        /* snackbar notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onCollected = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Yig‘ildi',
        message: 'Buyurtma punktda yig‘ilgan deb belgilansinmi?',
        cancelText: 'Bekor',
        confirmText: 'Ha',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.punktMeOrderCollected(id);
        showSnackbar(res.message || 'Buyurtma yig‘ildi deb belgilandi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onReady = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Tayyor',
        message: 'Buyurtma tayyorlangan deb belgilansinmi?',
        cancelText: 'Bekor',
        confirmText: 'Ha',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.punktMeOrderReady(id);
        showSnackbar(res.message || 'Buyurtma tayyorlandi deb belgilandi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onSavePayouts = async () => {
    if (!id || !order || !payoutDraftValid) return;
    const payload = {
      items: lineItems.map((it) => {
        const raw = payoutDraft[it.id];
        const n = Math.round(Number(String(raw).replace(',', '.')));
        return { order_item_id: it.id, contragent_payout_percent: n };
      }),
    };
    setActionLoading(true);
    try {
      const res = await apiService.setPunktMeOrderContragentPayouts(id, payload);
      showSnackbar(res.message || 'Kontragent foizlari saqlandi', 'success');
      await loadOrder(false);
    } catch {
      /* notifier */
    } finally {
      setActionLoading(false);
    }
  };

  const onAssignAgent = (agent: PunktMeAgentListItem) => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Agentga topshirish',
        message: `${agent.name} ga buyurtma topshirilsinmi?`,
        cancelText: 'Bekor',
        confirmText: 'Topshirish',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.assignPunktMeOrderAgent(id, {
          agent_id: agent.id,
        });
        showSnackbar(res.message || 'Buyurtma agentga topshirildi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onConfirmAgentPayment = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Agent to‘lovi',
        message: 'Agent punktda to‘laganini tasdiqlaysizmi?',
        cancelText: 'Bekor',
        confirmText: 'Tasdiqlash',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.confirmPunktMeOrderAgentPayment(id);
        showSnackbar(res.message || 'Agent to‘lovi tasdiqlandi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onPostPaymentDelivered = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Yetkazish',
        message: 'To‘lovdan keyingi punkt yetkazish bosqichi bajarilgan deb belgilansinmi?',
        cancelText: 'Bekor',
        confirmText: 'Bajarildi',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.punktMeOrderPostPaymentDelivered(id);
        showSnackbar(res.message || 'To‘lovdan keyingi yetkazish bajarildi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const onHandoverRemainder = () => {
    if (!id || !order) return;
    void (async () => {
      const ok = await showConfirm({
        title: 'Kontragentga to‘lov',
        message:
          'To‘lovdan keyin kontragentlarga qolgan qism bo‘yicha hisob-kitob (to‘lov/topshirish) bajarilgan deb belgilansinmi?',
        cancelText: 'Bekor',
        confirmText: 'Bajarildi',
      });
      if (!ok) return;
      setActionLoading(true);
      try {
        const res = await apiService.punktMeOrderHandoverRemainderToContragents(id);
        showSnackbar(res.message || 'Kontragentga to‘lov (qoldiq) bajarildi', 'success');
        await loadOrder(false);
      } catch {
        /* notifier */
      } finally {
        setActionLoading(false);
      }
    })();
  };

  if (loading && !order) {
    return (
      <>
        <Stack.Screen options={{ title: 'Buyurtma', headerShown: true }} />
        <LoadingSpinner />
      </>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: `Buyurtma №${order.id}`, headerShown: true }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollInner,
          {
            paddingHorizontal: horizontalPad,
            paddingBottom:
              Math.max(insets.bottom, 20) + (showStickyFooter ? 148 : 8),
            alignItems: isWeb ? 'center' : undefined,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrder(false); }} />
        }
      >
        <View style={[styles.sheet, { maxWidth: isWeb ? contentMaxWidth : undefined, width: '100%' }]}>
          <View style={styles.statusRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Punkt holati</Text>
              <Text style={styles.chipValue}>
                {uzPunktAcceptanceStatus(String(order.punkt_acceptance_status))}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Marketplace</Text>
              <Text style={styles.chipValue}>{uzMarketplaceStatus(order.marketplace_status)}</Text>
            </View>
          </View>

          <Text style={styles.meta}>{formatDateTime(order.created_at)}</Text>
          <Text style={styles.amount}>{formatMoney(order.total_amount)}</Text>
          <Text style={styles.subMeta}>
            {order.items_count} ta qator · tuman: {districtName || `ID ${order.routing_district_id}`}
          </Text>

          {logisticsAccepted && (
            <>
              <Text style={styles.sectionTitle}>Logistika</Text>
              <Row
                label="Yig‘ilgan"
                value={
                  hasIsoDate(order.punkt_collected_at)
                    ? formatDateTime(order.punkt_collected_at!)
                    : '—'
                }
              />
              <Row
                label="Tayyorlangan"
                value={
                  hasIsoDate(order.punkt_ready_at)
                    ? formatDateTime(order.punkt_ready_at!)
                    : '—'
                }
              />
              <Row
                label="Tayinlangan agent"
                value={punktOrderAssignedAgentDisplay(order)}
              />
              {order.snap_mfy_id != null && (
                <Row label="MFY (snapshot)" value={snapMfyName || `ID ${order.snap_mfy_id}`} />
              )}
              {hasAgent && (
                <>
                  <Text style={styles.sectionSubtitle}>Agent — punkt oqimi</Text>
                  <Row
                    label="Agent to‘lov e’loni"
                    value={
                      hasIsoDate(order.agent_declared_payment_to_punkt_at)
                        ? formatDateTime(order.agent_declared_payment_to_punkt_at!)
                        : '— (agent e’lon qilishi kutilmoqda)'
                    }
                  />
                  <Row
                    label="Punkt to‘lovni tasdiqladi"
                    value={
                      hasIsoDate(order.punkt_confirmed_agent_payment_at)
                        ? formatDateTime(order.punkt_confirmed_agent_payment_at!)
                        : '—'
                    }
                  />
                  <Row
                    label="To‘lovdan keyin yetkazish"
                    value={
                      hasIsoDate(order.punkt_post_payment_delivered_at)
                        ? formatDateTime(order.punkt_post_payment_delivered_at!)
                        : '—'
                    }
                  />
                  <Row
                    label="Kontragentga to‘lov (qoldiq)"
                    value={
                      hasIsoDate(order.punkt_contragent_remainder_handed_over_at)
                        ? formatDateTime(order.punkt_contragent_remainder_handed_over_at!)
                        : '—'
                    }
                  />
                </>
              )}
            </>
          )}

          {order.user_id != null && (
            <Row
              label="Foydalanuvchi"
              value={marketplaceUserName || `ID ${order.user_id}`}
            />
          )}
          {order.address_mode && (
            <Row label="Manzil rejimi" value={uzAddressType(order.address_mode)} />
          )}
          {order.snap_area_name ? (
            <Row label="Hudud (snapshot)" value={order.snap_area_name} />
          ) : null}
          {order.primary_custom_address ? (
            <Row label="Manzil" value={order.primary_custom_address} />
          ) : null}
          {order.extra_phone ? <Row label="Qo‘shimcha tel." value={order.extra_phone} /> : null}
          {order.address_note ? <Row label="Izoh" value={order.address_note} /> : null}

          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => {
              const amt = lineAmount(item);
              const lt = lineTotalNum(item);
              const pct = item.contragent_payout_percent;
              const payAmt = item.contragent_payout_amount;
              const contrLabel = punktLineItemContragentLabel(item);
              return (
                <View key={item.id} style={styles.lineCard}>
                  <Text style={styles.lineName}>
                    {item.product_name || `Mahsulot #${item.product_id ?? item.id}`}
                  </Text>
                  <Text style={styles.lineSub}>
                    Qator #{item.id}
                    {contrLabel ? ` · ${contrLabel}` : ''}
                    {item.quantity != null ? ` · ${item.quantity} ta` : ''}
                  </Text>
                  {amt ? <Text style={styles.linePrice}>{amt}</Text> : null}
                  {lt != null && (
                    <Text style={styles.lineMeta}>Qator summasi (line_total): {formatMoney(lt)}</Text>
                  )}
                  {typeof pct === 'number' && !Number.isNaN(pct) && (
                    <Text style={styles.lineMeta}>
                      Kontragent foizi: {pct}% 
                      {typeof payAmt === 'number'
                        ? ` · summasi: ${formatMoney(payAmt)}`
                        : ''}
                    </Text>
                  )}
                  {canEditPayouts && (
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Foiz (0–100)</Text>
                      <TextInput
                        style={styles.payoutInput}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={payoutDraft[item.id] ?? ''}
                        onChangeText={(t) =>
                          setPayoutDraft((prev) => ({ ...prev, [item.id]: t }))
                        }
                        editable={!actionLoading}
                      />
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyLines}>Qatorlar ro‘yxati bo‘sh</Text>
          )}

          <Text style={styles.sectionTitle}>Kontragent qator so‘rovlari</Text>
          {order.contragent_line_requests && order.contragent_line_requests.length > 0 ? (
            order.contragent_line_requests.map((r) => (
              <View key={r.id} style={styles.reqCard}>
                <Text style={styles.reqTitle}>So‘rov #{r.id}</Text>
                <Text style={styles.reqSub}>
                  Qator #{r.order_item_id} · {punktContragentRequestLabel(r)} · tuman{' '}
                  {requestDistrictNames[r.routing_district_id] || `ID ${r.routing_district_id}`}
                </Text>
                <Text style={styles.reqStatus}>{uzContragentLineRequestStatus(r.status)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyLines}>
              Hozircha so‘rov yo‘q (qabul qilgach yaratiladi)
            </Text>
          )}

          {canEditPayouts && lineItems.length > 0 && (
            <TouchableOpacity
              style={[
                styles.btnFull,
                styles.btnPrimary,
                (!payoutDraftValid || actionLoading) && styles.btnDisabled,
              ]}
              onPress={onSavePayouts}
              disabled={!payoutDraftValid || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnFullText}>Kontragent foizlarini saqlash</Text>
              )}
            </TouchableOpacity>
          )}

          {showAgentMissingMfy && (
            <Text style={styles.warnText}>
              Buyurtmada MFY ko‘rsatilmagan — agent tayinlanmaydi (snap_mfy_id).
            </Text>
          )}

          {showAgentAssign && (
            <>
              <Text style={styles.sectionTitle}>MFY bo‘yicha agentlar</Text>
              {agentsLoading ? (
                <ActivityIndicator style={{ marginVertical: 16 }} />
              ) : agents.length === 0 ? (
                <Text style={styles.emptyLines}>Ushbu MFY uchun faol agent topilmadi</Text>
              ) : (
                agents.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.agentCard}
                    onPress={() => onAssignAgent(a)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.agentName}>{a.name}</Text>
                    <Text style={styles.agentSub}>{a.phone}</Text>
                    <Text style={styles.agentSub}>
                      MFY: {agentMfyNames[a.mfy_id] || `ID ${a.mfy_id}`}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      {showStickyFooter && (
        <View
          style={[
            styles.actions,
            isWeb ? styles.actionsWeb : null,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              ...(isWeb && {
                alignItems: 'center',
                backgroundColor: '#fff',
              }),
            },
          ]}
        >
          <View
            style={[
              styles.actionsCol,
              isWeb && { maxWidth: contentMaxWidth, width: '100%' },
            ]}
          >
            {(canAccept || canReject) && (
              <View style={styles.actionsRow}>
                {canReject && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnReject, actionLoading && styles.btnDisabled]}
                    onPress={onReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={22} color="#fff" />
                        <Text style={styles.btnText}>Rad etish</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {canAccept && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnAccept, actionLoading && styles.btnDisabled]}
                    onPress={onAccept}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                        <Text style={styles.btnText}>Qabul qilish</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
            {canCollect && (
              <TouchableOpacity
                style={[styles.btn, styles.btnLogistics, actionLoading && styles.btnDisabled]}
                onPress={onCollected}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cube-outline" size={22} color="#fff" />
                    <Text style={styles.btnText}>Yig‘ildi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canMarkReady && (
              <TouchableOpacity
                style={[styles.btn, styles.btnReady, actionLoading && styles.btnDisabled]}
                onPress={onReady}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={22} color="#fff" />
                    <Text style={styles.btnText}>Tayyorlandi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canConfirmAgentPayment && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPayment, actionLoading && styles.btnDisabled]}
                onPress={onConfirmAgentPayment}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cash-outline" size={22} color="#fff" />
                    <Text style={styles.btnText}>Agent to‘lovini tasdiqlash</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canPostPaymentDelivered && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPostDeliver, actionLoading && styles.btnDisabled]}
                onPress={onPostPaymentDelivered}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="car-outline" size={22} color="#fff" />
                    <Text style={styles.btnText}>To‘lovdan keyin yetkazildi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canHandoverRemainder && (
              <TouchableOpacity
                style={[styles.btn, styles.btnHandover, actionLoading && styles.btnDisabled]}
                onPress={onHandoverRemainder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="swap-horizontal-outline" size={22} color="#fff" />
                    <Text style={styles.btnText}>Kontragentga to‘lov bajarildi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollInner: {
    paddingTop: 16,
  },
  sheet: {
    alignSelf: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  chipLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chipValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4,
  },
  subMeta: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEE',
  },
  rowLabel: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 14,
    marginBottom: 8,
  },
  lineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  lineSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  linePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 8,
  },
  lineMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  payoutLabel: {
    fontSize: 14,
    color: '#333',
    width: 110,
  },
  payoutInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  warnText: {
    marginTop: 16,
    color: '#CC6600',
    fontSize: 14,
    lineHeight: 20,
  },
  agentCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  agentSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  emptyLines: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  reqCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  reqTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#111',
  },
  reqSub: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  reqStatus: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#F5F5F5',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' } as object)
      : null),
  },
  actionsWeb: {
    position: 'relative',
    // `styles.actions` ichidagi absolut xususiyatlarni bekor qilish
    left: undefined as any,
    right: undefined as any,
    bottom: undefined as any,
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    zIndex: 50,
  },
  actionsCol: {
    width: '100%',
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 52,
  },
  btnAccept: {
    backgroundColor: '#34C759',
  },
  btnReject: {
    backgroundColor: '#FF3B30',
  },
  btnLogistics: {
    backgroundColor: '#5856D6',
    width: '100%',
    flex: 0,
  },
  btnReady: {
    backgroundColor: '#007AFF',
    width: '100%',
    flex: 0,
  },
  btnPayment: {
    backgroundColor: '#2D9C5E',
    width: '100%',
    flex: 0,
  },
  btnPostDeliver: {
    backgroundColor: '#5AC8FA',
    width: '100%',
    flex: 0,
  },
  btnHandover: {
    backgroundColor: '#AF52DE',
    width: '100%',
    flex: 0,
  },
  btnFull: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnFullText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
