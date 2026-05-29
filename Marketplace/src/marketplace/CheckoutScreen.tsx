import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { api, parsePositiveProductId } from '../services/api';
import type { Address, Region, District, MFY } from '../types';
import { useMarketplace } from './MarketplaceContext';
import { TAB_BAR_BOTTOM_CLEARANCE } from './BottomTabBar';
import { formatAddressGeoSummary } from '../lib/addressLabels';
import { cn } from '../lib/utils';

type AddrMode = 'default' | 'delivery_area';

function DeliveryAreaSelectNative({
  addresses,
  value,
  onChange,
  regions,
  districts,
  mfys,
}: {
  addresses: Address[];
  value: number | null;
  onChange: (id: number) => void;
  regions: Region[];
  districts: District[];
  mfys: MFY[];
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = addresses.find((a) => Number(a.id) === value);
  const title =
    selected != null
      ? `${selected.name}${selected.is_default ? ' · ASOSIY' : ''}`
      : 'Manzilni tanlang';
  const geo = selected != null ? formatAddressGeoSummary(selected, regions, districts, mfys) : '';
  const sub = selected != null && selected.description?.trim() ? selected.description.trim() : null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="mt-3 flex-row items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 active:bg-slate-50"
      >
        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tanlangan manzil</Text>
          <Text className={cn('mt-0.5 text-sm font-bold leading-snug text-slate-900', value == null && 'text-slate-400')}>
            {title}
          </Text>
          {geo ? (
            <Text className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500" numberOfLines={3}>
              {geo}
            </Text>
          ) : null}
          {sub ? (
            <Text className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500" numberOfLines={2}>
              {sub}
            </Text>
          ) : null}
        </View>
        <ChevronDown size={20} color="#64748b" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          className="flex-1 justify-end bg-black/45"
          style={Platform.OS === 'web' ? { zIndex: 100 } : undefined}
        >
          <Pressable className="flex-1" onPress={() => setOpen(false)} accessibilityRole="button" />
          <View
            className="max-h-[72%] rounded-t-3xl bg-white shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="border-b border-slate-100 px-4 py-3.5">
              <Text className="text-center text-base font-black text-slate-900">Manzilni tanlang</Text>
            </View>
            <ScrollView className="px-3 py-2" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {addresses.map((a) => {
                const id = Number(a.id);
                const rowGeo = formatAddressGeoSummary(a, regions, districts, mfys);
                return (
                  <Pressable
                    key={String(a.id)}
                    onPress={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={cn(
                      'mb-2 rounded-2xl border-2 px-4 py-3.5',
                      value === id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'
                    )}
                  >
                    <Text className="text-sm font-bold leading-snug text-slate-900">{a.name}</Text>
                    {rowGeo ? (
                      <Text
                        className="mt-1 text-[10px] font-medium leading-relaxed text-slate-600"
                        numberOfLines={4}
                      >
                        {rowGeo}
                      </Text>
                    ) : null}
                    {a.description?.trim() ? (
                      <Text
                        className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500"
                        numberOfLines={3}
                      >
                        {a.description.trim()}
                      </Text>
                    ) : null}
                    {a.is_default ? (
                      <Text className="mt-1 text-[10px] font-black uppercase text-orange-600">Asosiy</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function CheckoutScreen() {
  const m = useMarketplace();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [mfys, setMfys] = useState<MFY[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [addrMode, setAddrMode] = useState<AddrMode>('default');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [extraPhone, setExtraPhone] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasDefault = useMemo(() => addresses.some((a) => a.is_default), [addresses]);

  const loadAddr = useCallback(async () => {
    setLoadingAddr(true);
    try {
      const [list, reg, dist, mfyList] = await Promise.all([
        api.addresses.list(),
        api.regions.getRegions(),
        api.regions.getDistricts(),
        api.regions.getMFYs(),
      ]);
      setAddresses(list);
      setRegions(reg);
      setDistricts(dist);
      setMfys(mfyList);
      const def = list.find((a) => a.is_default);
      if (def != null) setSelectedAreaId(Number(def.id));
      else {
        const first = list[0];
        if (first != null) setSelectedAreaId(Number(first.id));
      }
    } finally {
      setLoadingAddr(false);
    }
  }, []);

  useEffect(() => {
    void loadAddr();
  }, [loadAddr]);

  useEffect(() => {
    if (m.cart.length === 0) {
      router.replace('/cart');
    }
  }, [m.cart.length]);

  const onSubmit = async () => {
    if (m.cart.length === 0) return;

    const items: { product_id: number; quantity: number }[] = [];
    for (const line of m.cart) {
      const pid = parsePositiveProductId(line.id);
      if (pid == null) {
        Alert.alert('Xato', 'Baʼzi mahsulotlarning ID si noto‘g‘ri.');
        return;
      }
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        Alert.alert('Xato', 'Miqdor noto‘g‘ri.');
        return;
      }
      items.push({ product_id: pid, quantity: qty });
    }

    let address: { type: 'default' } | { type: 'delivery_area'; delivery_area_id: number };

    if (addrMode === 'default') {
      if (!hasDefault) {
        Alert.alert(
          'Asosiy manzil',
          'Buyurtma uchun profilda asosiy yetkazib berish manzili bo‘lishi kerak. Profildan manzil qo‘shing va asosiy qilib belgilang.'
        );
        return;
      }
      address = { type: 'default' };
    } else {
      if (selectedAreaId == null || Number.isNaN(selectedAreaId)) {
        Alert.alert('Manzil', 'Saqlangan manzilni tanlang.');
        return;
      }
      address = { type: 'delivery_area', delivery_area_id: selectedAreaId };
    }

    const phone = extraPhone.trim();
    const note = addressNote.trim();

    setSubmitting(true);
    try {
      const order = await api.orders.create({
        items,
        address,
        extra_phone: phone || undefined,
        address_note: note || undefined,
      });
      await api.cart.clear();
      await m.refreshCart();
      router.replace(`/orders/${order.id}`);
    } catch (e) {
      Alert.alert('Buyurtma', e instanceof Error ? e.message : 'Buyurtma yuborilmadi');
    } finally {
      setSubmitting(false);
    }
  };

  if (m.cart.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      <View
        className="border-b border-slate-200/80 bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: topPad + 8 }}
      >
        <View className="w-full flex-row items-center gap-3" style={{ maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined, alignSelf: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
            hitSlop={8}
          >
            <ChevronLeft size={22} color="#475569" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-black text-slate-900">Buyurtmani rasmiylashtirish</Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manzil va tasdiqlash</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + TAB_BAR_BOTTOM_CLEARANCE + 140,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full pb-1"
          style={{
            maxWidth: m.isTabletUpWeb ? 560 : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
        <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <View className="border-b border-slate-100 px-4 py-3">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buyurtmadagi mahsulotlar</Text>
            <Text className="mt-0.5 text-xs font-medium text-slate-500">{m.cartCount} ta pozitsiya</Text>
          </View>
          {m.cart.map((item, idx) => {
            const uri = item.images?.[0];
            const lineTotal = item.price * item.quantity;
            const lineKey = item.cartLineId != null ? String(item.cartLineId) : `${item.id}-${idx}`;
            return (
              <View
                key={lineKey}
                className={cn('flex-row gap-3 px-4 py-3', idx > 0 && 'border-t border-slate-100')}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    className="h-14 w-14 rounded-xl bg-slate-100"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-14 w-14 rounded-xl bg-slate-200" />
                )}
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-slate-900" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs font-medium text-slate-500">
                    {item.quantity} × {item.price.toLocaleString()} so‘m
                  </Text>
                </View>
                <Text className="text-sm font-black text-orange-600">{lineTotal.toLocaleString()}</Text>
              </View>
            );
          })}
          <View className="flex-row items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-3.5">
            <Text className="text-xs font-black uppercase tracking-wide text-slate-500">Jami</Text>
            <Text className="text-lg font-black text-slate-900">{m.cartTotal.toLocaleString()} so‘m</Text>
          </View>
        </View>

        <Text className="mb-2 text-sm font-black text-slate-800">Yetkazib berish manzili</Text>

        {loadingAddr ? (
          <ActivityIndicator className="my-6" color="#f97316" />
        ) : (
          <View className="gap-2">
            <Pressable
              onPress={() => setAddrMode('default')}
              className={cn(
                'rounded-2xl border-2 p-4',
                addrMode === 'default' ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 bg-white'
              )}
            >
              <Text className="font-black text-slate-900">Asosiy manzil</Text>
              <Text className="mt-1 text-xs font-medium text-slate-500">
                {hasDefault
                  ? 'Profilda belgilangan asosiy yetkazib berish manzili ishlatiladi.'
                  : 'Asosiy manzil yo‘q — avval profildan qo‘shing.'}
              </Text>
            </Pressable>

            {addresses.length > 0 ? (
              <Pressable
                onPress={() => setAddrMode('delivery_area')}
                className={cn(
                  'rounded-2xl border-2 p-4',
                  addrMode === 'delivery_area' ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 bg-white'
                )}
              >
                <Text className="font-black text-slate-900">Boshqa saqlangan manzil</Text>
                {addrMode === 'delivery_area' ? (
                  <DeliveryAreaSelectNative
                    addresses={addresses}
                    value={selectedAreaId}
                    onChange={(id) => setSelectedAreaId(id)}
                    regions={regions}
                    districts={districts}
                    mfys={mfys}
                  />
                ) : (
                  <Text className="mt-1 text-xs text-slate-500">Ro‘yxatdan tanlang</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}

        <View className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <Text className="mb-3 text-sm font-black text-slate-800">Qo‘shimcha (ixtiyoriy)</Text>
          <Text className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Aloqa telefoni
          </Text>
          <TextInput
            value={extraPhone}
            onChangeText={setExtraPhone}
            placeholder="+998901234567"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            className="mb-4 rounded-2xl border-2 border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800"
          />
          <Text className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Yetkazish bo‘yicha izoh
          </Text>
          <TextInput
            value={addressNote}
            onChangeText={setAddressNote}
            placeholder="Masalan: 3-podezd, 4-qavat, domofon kodi"
            placeholderTextColor="#94a3b8"
            multiline
            className="min-h-[88px] rounded-2xl border-2 border-slate-200 bg-slate-50/90 px-4 py-3.5 text-sm font-medium text-slate-800"
          />
        </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200/90 bg-white px-4 pt-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_BOTTOM_CLEARANCE }}
      >
        <View
          className="w-full"
          style={{
            maxWidth: m.isTabletUpWeb ? 560 : undefined,
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
          <Pressable
            onPress={() => void onSubmit()}
            disabled={submitting || loadingAddr}
            className={cn(
              'items-center rounded-2xl bg-gray-900 py-4 shadow-lg active:opacity-90',
              (submitting || loadingAddr) && 'opacity-50'
            )}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">Buyurtmani tasdiqlash</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
