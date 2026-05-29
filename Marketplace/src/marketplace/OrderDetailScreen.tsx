import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Ban, Star } from 'lucide-react-native';
import { api } from '../services/api';
import type { MarketplaceOrder, CommentTemplate, OrderRatingItemPayload } from '../types';
import {
  orderStatusLabelUz,
  formatOrderAddressSummary,
  orderStatusBadgeBoxClassName,
  orderStatusBadgeLabelClassName,
  getOrderRoadmapStages,
  orderRoadmapStageLabel,
} from '../lib/orders';
import {
  productImageMapFromList,
  fetchProductImageById,
  fetchLocalShopProductImageById,
  resolveOrderLineImageUri,
  formatOrderLineQtyLabel,
  formatOrderLineUnitPriceLabel,
} from '../lib/orderLineMedia';
import { useMarketplace } from './MarketplaceContext';
import { TAB_BAR_BOTTOM_CLEARANCE } from './BottomTabBar';
import { cn } from '../lib/utils';

function formatOrderDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OrderDetailScreen() {
  const { id, market } = useLocalSearchParams<{ id: string | string[]; market?: string | string[] }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  const marketScope = (Array.isArray(market) ? market[0] : market) === 'mahalla' ? 'mahalla' : 'bozor';
  const m = useMarketplace();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);

  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentTemplates, setCommentTemplates] = useState<CommentTemplate[]>([]);
  const [ratingDraft, setRatingDraft] = useState<Record<number, { score: number; comment_template_id?: number; note: string }>>({});

  const fetchOne = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const o = marketScope === 'mahalla' ? await api.localShopOrders.get(orderId) : await api.orders.get(orderId);
      setOrder(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yuklanmadi');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, marketScope]);

  useFocusEffect(
    useCallback(() => {
      void fetchOne();
    }, [fetchOne])
  );

  useEffect(() => {
    void api.commentTemplates.list().then(setCommentTemplates).catch(() => {});
  }, []);

  const listImgMap = useMemo(() => productImageMapFromList(m.products), [m.products]);
  const [fetchedImages, setFetchedImages] = useState<Record<number, string>>({});

  useEffect(() => {
    setFetchedImages({});
  }, [order?.id]);

  const orderItemPids = order?.items?.map((l) => `${l.product_id}:${l.local_shop_product_id ?? 0}`).join(',') ?? '';

  useEffect(() => {
    if (!order?.items?.length) return;
    let cancelled = false;
    const ids =
      order.market === 'mahalla'
        ? [...new Set(order.items.map((l) => l.local_shop_product_id ?? 0).filter((id) => id > 0))]
        : [...new Set(order.items.map((l) => l.product_id).filter((pid) => pid > 0))];

    (async () => {
      const additions: Record<number, string> = {};
      for (const pid of ids) {
        const sample =
          order.market === 'mahalla'
            ? order.items.find((l) => (l.local_shop_product_id ?? 0) === pid)
            : order.items.find((l) => l.product_id === pid);
        if (sample?.image_url?.trim()) continue;
        if (order.market !== 'mahalla' && listImgMap.has(String(pid))) continue;
        const url =
          order.market === 'mahalla'
            ? await fetchLocalShopProductImageById(pid, order.local_shop_id)
            : await fetchProductImageById(pid);
        if (url && !cancelled) additions[pid] = url;
      }
      if (!cancelled && Object.keys(additions).length > 0) {
        setFetchedImages((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(additions)) {
            const n = Number(k);
            if (!next[n]) next[n] = v;
          }
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order?.id, orderItemPids, listImgMap]);

  const onConfirmCancelOrder = useCallback(async () => {
    if (order == null || !order.can_cancel) return;
    setCancelSubmitting(true);
    try {
      const updated = marketScope === 'mahalla' ? await api.localShopOrders.cancel(order.id) : await api.orders.cancel(order.id);
      setOrder(updated);
      setCancelModalVisible(false);
      await Promise.all([m.refreshCart(), m.refreshLocalCart(), m.loadProducts(m.search)]);
    } catch (e) {
      Alert.alert('Buyurtma', e instanceof Error ? e.message : 'Bekor qilinmadi');
    } finally {
      setCancelSubmitting(false);
    }
  }, [order, m, marketScope]);

  const openRatingModal = useCallback(() => {
    if (!order) return;
    const draft: Record<number, { score: number; comment_template_id?: number; note: string }> = {};
    for (const line of order.items) {
      const itemId = Number(line.order_item_id ?? 0);
      if (itemId > 0) draft[itemId] = { score: 5, note: '' };
    }
    setRatingDraft(draft);
    setRatingModalVisible(true);
    void (async () => {
      const updates: Record<number, { score: number; comment_template_id?: number; note: string }> = {};
      await Promise.all(
        order.items.map(async (line) => {
          const itemId = Number(line.order_item_id ?? 0);
          const pid = Number(line.product_id ?? 0);
          if (!itemId || !pid) return;
          try {
            const res = await api.productRatings.get(pid, { page: 1, limit: 100 });
            const own = res.items.find((it) => Number(it.order_id) === Number(order.id) && Number(it.order_item_id) === itemId);
            if (!own) return;
            updates[itemId] = {
              score: Math.min(5, Math.max(1, Number(own.score) || 5)),
              comment_template_id: own.comment_template_id,
              note: own.note || own.comment_template || '',
            };
          } catch {
            // ignore per-line errors
          }
        })
      );
      if (Object.keys(updates).length) {
        setRatingDraft((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [order]);

  const submitRatings = useCallback(async () => {
    if (!order) return;
    const items: OrderRatingItemPayload[] = order.items
      .map((line) => {
        const itemId = Number(line.order_item_id ?? 0);
        const draft = ratingDraft[itemId];
        if (!itemId || !draft) return null;
        if (draft.score < 1 || draft.score > 5) return null;
        return {
          order_item_id: itemId,
          score: draft.score,
          comment_template_id: draft.comment_template_id || undefined,
          note: draft.note?.trim() || undefined,
        };
      })
      .filter(Boolean) as OrderRatingItemPayload[];
    if (!items.length) return Alert.alert('Baholash', "Baholash uchun mahsulot topilmadi.");
    setRatingSubmitting(true);
    try {
      await api.orders.rate(order.id, items);
      setRatingModalVisible(false);
      Alert.alert('Baholash', 'Rahmat! Baholaringiz saqlandi.');
    } catch (e) {
      Alert.alert('Baholash', e instanceof Error ? e.message : "Baholash yuborilmadi");
    } finally {
      setRatingSubmitting(false);
    }
  }, [order, ratingDraft]);

  /** Keng ekran: holat/manzil chapda, mahsulotlar/o‘ngda (RN Web, planshet). */
  const layoutWide = m.windowWidth >= 768;
  const contentMaxW = layoutWide ? Math.min(m.containerMaxWidth, 1200) : undefined;
  const roadmapStages = getOrderRoadmapStages(order?.roadmap);

  return (
    <View className="flex-1 bg-slate-100">
      <View
        className="border-b border-slate-200/80 bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: topPad + 8 }}
      >
        <View
          className="w-full flex-row items-center gap-3"
          style={{ maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined, alignSelf: 'center' }}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
            hitSlop={8}
          >
            <ChevronLeft size={22} color="#475569" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-black text-slate-900">Buyurtma</Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {orderId ? `#${orderId}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 + TAB_BAR_BOTTOM_CLEARANCE }}
      >
        <View
          className="w-full"
          style={{
            maxWidth: contentMaxW,
            width: '100%',
            alignSelf: contentMaxW != null ? 'center' : undefined,
          }}
        >
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : error ? (
          <Text className="text-center text-sm font-medium text-rose-600">{error}</Text>
        ) : order ? (
          <View className={cn('gap-4', layoutWide && 'flex-row items-start')}>
            <View className={cn('gap-4', layoutWide && 'min-w-0 flex-[5]')}>
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Holat</Text>
                <View className="mt-3">
                  <View className={orderStatusBadgeBoxClassName(order.status)}>
                    <Text className={orderStatusBadgeLabelClassName(order.status)}>
                      {orderStatusLabelUz(order.status)}
                    </Text>
                  </View>
                </View>
                <Text className="mt-3 text-xs text-slate-500">{formatOrderDate(order.created_at)}</Text>
                {order.can_cancel ? (
                  <View className="mt-4 border-t border-slate-100 pt-4">
                    <View className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                      <Text className="text-[11px] font-semibold leading-5 text-amber-950/90">
                        Buyurtma kutilmoqda. Bekor qilsangiz, mahsulotlar ombor zaxirasiga qaytariladi.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setCancelModalVisible(true)}
                      className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white py-3.5 active:bg-rose-50/80"
                    >
                      <Ban size={18} color="#be123c" />
                      <Text className="text-sm font-black text-rose-700">Buyurtmani bekor qilish</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manzil</Text>
                <Text className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                  {formatOrderAddressSummary(order.address)}
                </Text>
                {order.address_note ? (
                  <Text className="mt-2 text-xs text-slate-600">Izoh: {order.address_note}</Text>
                ) : null}
                {order.extra_phone ? (
                  <Text className="mt-1 text-xs text-slate-600">Qo‘shimcha tel: {order.extra_phone}</Text>
                ) : null}
              </View>

              {roadmapStages.length > 0 ? (
                <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Buyurtma jarayoni
                  </Text>
                  <View className="mt-3 gap-2.5">
                    {roadmapStages.map((step) => (
                      <View key={step.key} className="flex-row items-start gap-2.5">
                        <View
                          className={cn(
                            'mt-0.5 h-2.5 w-2.5 rounded-full',
                            step.done ? 'bg-emerald-500' : 'bg-slate-300'
                          )}
                        />
                        <View className="min-w-0 flex-1">
                          <Text
                            className={cn(
                              'text-xs font-semibold',
                              step.done ? 'text-slate-900' : 'text-slate-500'
                            )}
                          >
                            {orderRoadmapStageLabel(step.key)}
                          </Text>
                          {step.at ? (
                            <Text className="mt-0.5 text-[11px] text-slate-500">
                              {formatOrderDate(step.at)}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                  {order?.roadmap?.current_stage ? (
                    <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Joriy bosqich
                      </Text>
                      <Text className="mt-1 text-xs font-semibold text-slate-800">
                        {orderRoadmapStageLabel(order.roadmap.current_stage)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View className={cn('gap-4', layoutWide && 'min-w-0 flex-[7]')}>
              <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Text className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Mahsulotlar</Text>
                {order.items.map((line, idx) => {
                  const imgUri = resolveOrderLineImageUri(
                    line.product_id,
                    line.image_url,
                    listImgMap,
                    fetchedImages,
                    line.local_shop_product_id ?? line.product_id
                  );
                  return (
                    <View
                      key={`${line.product_id}_${idx}`}
                      className="mb-3 flex-row items-start gap-3 border-b border-slate-100 pb-3 last:mb-0 last:border-0 last:pb-0"
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          className="h-16 w-16 shrink-0 rounded-xl bg-slate-100"
                          resizeMode="cover"
                          accessibilityLabel={line.product_name}
                        />
                      ) : (
                        <View className="h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          <Package size={26} color="#94a3b8" />
                        </View>
                      )}
                      <View className="min-w-0 flex-1">
                        <Text className="font-bold text-slate-900" numberOfLines={3}>
                          {line.product_name || `Mahsulot #${line.product_id}`}
                        </Text>
                        <Text className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {line.product_code != null
                            ? `Kod: ${line.product_code} · ID: ${line.product_id}`
                            : `ID: ${line.product_id}`}
                        </Text>
                        <View className="mt-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text className="text-[11px] font-black uppercase tracking-wide text-slate-400">Soni</Text>
                            <Text className="max-w-[68%] text-right text-sm font-semibold text-slate-800">
                              {formatOrderLineQtyLabel(line)}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between gap-2">
                            <Text
                              className="max-w-[55%] text-[11px] font-black uppercase tracking-wide text-slate-400"
                              numberOfLines={2}
                            >
                              {formatOrderLineUnitPriceLabel(line)}
                            </Text>
                            <Text className="shrink-0 text-sm font-semibold text-slate-800">
                              {line.unit_price.toLocaleString()} so‘m
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="min-w-[88px] shrink-0 items-end self-start pt-0.5">
                        <Text className="text-[10px] font-black uppercase tracking-wide text-slate-400">Umumiy</Text>
                        <Text className="mt-0.5 text-base font-black text-orange-600">
                          {line.line_total.toLocaleString()} so‘m
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View className="flex-row items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-4">
                <Text className="text-sm font-black uppercase tracking-wide text-slate-600">Jami</Text>
                <Text className="text-xl font-black text-slate-900">{order.total_amount.toLocaleString()} so‘m</Text>
              </View>
              {order.status === 'delivered' && marketScope === 'bozor' ? (
                <Pressable onPress={openRatingModal} className="rounded-2xl bg-emerald-600 px-4 py-4">
                  <Text className="text-center text-sm font-black uppercase tracking-wide text-white">Mahsulotlarni baholash</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !ratingSubmitting && setRatingModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/45 px-0 md:justify-center md:px-4">
          <Pressable className="absolute inset-0" onPress={() => !ratingSubmitting && setRatingModalVisible(false)} />
          <View className="max-h-[90%] w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 md:max-h-[86%] md:max-w-3xl md:self-center md:rounded-3xl">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-300" />
            <Text className="mb-3 text-lg font-black text-slate-900">Mahsulotlarni baholash</Text>
            <ScrollView>
              <View className="gap-3">
                {order?.items.map((line, idx) => {
                  const itemId = Number(line.order_item_id ?? 0);
                  if (!itemId) return null;
                  const draft = ratingDraft[itemId] || { score: 5, note: '' };
                  return (
                    <View key={`${itemId}_${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <Text className="font-bold text-slate-800">{line.product_name}</Text>
                      <Text className="mt-1 text-[11px] font-semibold text-slate-500">Sizning bahongiz: {draft.score} / 5</Text>
                      <View className="mt-2 flex-row items-center gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Pressable
                            key={score}
                            onPress={() => setRatingDraft((p) => ({ ...p, [itemId]: { ...draft, score } }))}
                            className="rounded-full p-1"
                          >
                            <Star size={22} color={score <= draft.score ? '#f59e0b' : '#cbd5e1'} fill={score <= draft.score ? '#f59e0b' : 'none'} />
                          </Pressable>
                        ))}
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                        <View className="flex-row gap-2">
                          {commentTemplates.map((tpl) => (
                            <Pressable
                              key={tpl.id}
                              onPress={() =>
                                setRatingDraft((p) => ({
                                  ...p,
                                  [itemId]: {
                                    ...draft,
                                    comment_template_id: tpl.id,
                                    note: draft.note || tpl.comment,
                                  },
                                }))
                              }
                              className={cn(
                                'rounded-full border px-3 py-1.5',
                                draft.comment_template_id === tpl.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
                              )}
                            >
                              <Text className="text-xs font-semibold text-slate-700">{tpl.comment}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                      <TextInput
                        value={draft.note}
                        onChangeText={(note) => setRatingDraft((p) => ({ ...p, [itemId]: { ...draft, note } }))}
                        placeholder="Izoh (ixtiyoriy)"
                        multiline
                        className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800"
                      />
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={() => !ratingSubmitting && setRatingModalVisible(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-center font-bold text-slate-600">Yopish</Text>
              </Pressable>
              <Pressable onPress={() => void submitRatings()} disabled={ratingSubmitting} className="flex-1 rounded-xl bg-emerald-600 py-3 disabled:opacity-60">
                <Text className="text-center font-bold text-white">{ratingSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelSubmitting && setCancelModalVisible(false)}
      >
        <View className="flex-1 justify-center px-5">
          <Pressable
            className="absolute inset-0 bg-black/55"
            onPress={() => !cancelSubmitting && setCancelModalVisible(false)}
            accessibilityLabel="Yopish"
          />
          <View className="relative z-10 mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl">
            <View className="mb-2 h-12 w-12 items-center justify-center self-center rounded-2xl bg-rose-50">
              <Ban size={24} color="#e11d48" />
            </View>
            <Text className="text-center text-lg font-black text-slate-900">Buyurtmani bekor qilish?</Text>
            <Text className="mt-2 text-center text-sm font-medium leading-5 text-slate-500">
              Bekor qilingach holat «Bekor qilingan» bo‘ladi va mahsulotlar zaxiraga qaytadi. Keyin tiklab
              bo‘lmaydi.
            </Text>
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => !cancelSubmitting && setCancelModalVisible(false)}
                className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 active:opacity-80"
              >
                <Text className="text-sm font-bold text-slate-700">Yo‘q</Text>
              </Pressable>
              <Pressable
                onPress={() => void onConfirmCancelOrder()}
                disabled={cancelSubmitting}
                className={cn(
                  'min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-rose-600 active:opacity-90',
                  cancelSubmitting && 'opacity-50'
                )}
              >
                {cancelSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-sm font-black text-white">Ha, bekor qilish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
