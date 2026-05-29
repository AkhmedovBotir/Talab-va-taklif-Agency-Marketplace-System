import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, Modal, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Plus, Minus, ChevronLeft, Package } from 'lucide-react-native';
import { useMarketplace } from './MarketplaceContext';
import { TAB_BAR_BOTTOM_CLEARANCE } from './BottomTabBar';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { useLocalShopsHoursMap } from '../hooks/useLocalShopsHoursMap';
import { LocalShopHoursStatus } from './LocalShopHoursStatus';

const MOBILE_REFRESH_TINT = '#f97316';

export function CartScreen() {
  const m = useMarketplace();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [shopPickerVisible, setShopPickerVisible] = useState(false);
  const [shopSubmitting, setShopSubmitting] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bozor' | 'mahalla'>('bozor');
  const [selectedLocalShopId, setSelectedLocalShopId] = useState<number | null>(null);
  const localShops = Array.from(
    m.localCart.reduce(
      (acc, it) => {
        const id = Number(it.local_shop?.id ?? 0);
        if (!id) return acc;
        const prev = acc.get(id) ?? {
          id,
          name: it.local_shop?.name || `Do'kon #${id}`,
          phone: it.local_shop?.phone,
          itemCount: 0,
          total: 0,
        };
        prev.itemCount += it.quantity;
        prev.total += it.price * it.quantity;
        acc.set(id, prev);
        return acc;
      },
      new Map<number, { id: number; name: string; phone?: string; itemCount: number; total: number }>()
    ).values()
  );
  const localShopOptions = localShops.map((s) => ({ id: s.id, name: s.name }));
  const localShopIds = localShops.map((s) => s.id);
  const { hoursByShopId } = useLocalShopsHoursMap(localShopIds, shopPickerVisible);
  const localItemsFiltered =
    selectedLocalShopId == null
      ? m.localCart
      : m.localCart.filter((it) => Number(it.local_shop?.id ?? 0) === selectedLocalShopId);
  const activeItems = activeTab === 'bozor' ? m.cart : localItemsFiltered;
  const activeCount =
    activeTab === 'bozor'
      ? m.cartCount
      : localItemsFiltered.reduce((sum, it) => sum + it.quantity, 0);
  const activeTotal =
    activeTab === 'bozor'
      ? m.cartTotal
      : localItemsFiltered.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const onPullRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([m.refreshCart(), m.refreshLocalCart()]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const openClearModal = () => {
    if (activeItems.length === 0) return;
    setClearModalVisible(true);
  };

  const handleConfirmClear = () => {
    setClearModalVisible(false);
    if (activeTab === 'bozor') m.clearCart();
    else m.clearLocalCart();
  };

  return (
    <View className="flex-1 bg-slate-100">
      <View
        className="border-b border-slate-200/80 bg-white px-4 pb-4 shadow-sm"
        style={{ paddingTop: topPad + 8 }}
      >
        <View
          className="w-full flex-row items-center justify-between"
          style={{
            maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
              hitSlop={8}
            >
              <ChevronLeft size={22} color="#475569" />
            </Pressable>
            <View>
              <Text className="text-xl font-black text-slate-900">Savat</Text>
              <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {activeCount > 0 ? `${activeCount} ta mahsulot` : 'Hozircha bo‘sh'}
              </Text>
            </View>
          </View>
          {activeItems.length > 0 ? (
            <Pressable
              onPress={openClearModal}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 active:opacity-80"
            >
              <Text className="text-[11px] font-black uppercase tracking-wide text-rose-600">Tozalash</Text>
            </Pressable>
          ) : (
            <View className="w-[72px]" />
          )}
        </View>
      </View>
      <View className="px-4 pt-3">
        <View className="mx-auto w-full max-w-[560px] flex-row rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <Pressable
            onPress={() => setActiveTab('bozor')}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5', activeTab === 'bozor' && 'bg-white')}
          >
            <Text className={cn('text-xs font-black uppercase tracking-wider', activeTab === 'bozor' ? 'text-slate-900' : 'text-slate-500')}>
              Bozor
            </Text>
            {m.cartCount > 0 ? (
              <View className="min-w-[18px] items-center rounded-full bg-orange-500 px-1">
                <Text className="text-[9px] font-black text-white">{m.cartCount > 99 ? '99+' : m.cartCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('mahalla')}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5', activeTab === 'mahalla' && 'bg-white')}
          >
            <Text className={cn('text-xs font-black uppercase tracking-wider', activeTab === 'mahalla' ? 'text-slate-900' : 'text-slate-500')}>
              Maxalla
            </Text>
            {m.localCartCount > 0 ? (
              <View className="min-w-[18px] items-center rounded-full bg-orange-500 px-1">
                <Text className="text-[9px] font-black text-white">{m.localCartCount > 99 ? '99+' : m.localCartCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        {activeTab === 'mahalla' && localShopOptions.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-auto mt-2 w-full max-w-[560px]">
            <View className="flex-row gap-2 pr-2">
              {localShopOptions.map((shop) => (
                <Pressable
                  key={shop.id}
                  onPress={() => setSelectedLocalShopId(shop.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2',
                    selectedLocalShopId === shop.id
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-slate-200 bg-white'
                  )}
                >
                  <Text className="text-[11px] font-bold text-slate-700">{shop.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: activeItems.length > 0 ? 200 : 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={onPullRefresh}
              tintColor={MOBILE_REFRESH_TINT}
              colors={[MOBILE_REFRESH_TINT]}
            />
          ) : undefined
        }
      >
        <View
          className="w-full pb-4"
          style={{
            maxWidth: m.isTabletUpWeb ? 560 : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
          {activeItems.length === 0 ? (
            <View className="items-center rounded-[28px] border border-slate-200/90 bg-white px-6 py-16 shadow-sm">
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-3xl bg-slate-100">
                <Package size={44} color="#94a3b8" />
              </View>
              <Text className="text-center text-xl font-black text-slate-800">Savatingiz bo‘sh</Text>
              <Text className="mt-2 max-w-xs text-center text-sm font-medium leading-5 text-slate-500">
                Mahsulot qo‘shib, buyurtma berishni boshlang
              </Text>
              <Pressable
                onPress={() => router.replace('/')}
                className="mt-8 rounded-2xl bg-gray-900 px-10 py-4 shadow-lg"
              >
                <Text className="text-center text-base font-bold text-white">Xaridlarga o‘tish</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {activeItems.map((item) => (
                <View
                  key={item.cartLineId != null ? `line-${item.cartLineId}` : item.id}
                  className="flex-row gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
                >
                  <Image source={{ uri: item.images[0] }} className="h-24 w-24 rounded-xl bg-slate-100" />
                  <View className="min-w-0 flex-1 justify-between py-0.5">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-base font-bold text-slate-900" numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Pressable
                        onPress={() =>
                          activeTab === 'bozor' ? m.removeFromCart(item.id) : m.removeLocalFromCart(item.id)
                        }
                        className="h-9 w-9 items-center justify-center rounded-lg bg-rose-50 active:opacity-70"
                        hitSlop={6}
                      >
                        <Trash2 size={18} color="#f43f5e" />
                      </Pressable>
                    </View>
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-base font-black text-orange-500">
                        {item.price.toLocaleString()}{' '}
                        <Text className="text-xs font-bold text-orange-600/90">so‘m</Text>
                      </Text>
                      <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50">
                        <Pressable
                          onPress={() =>
                            activeTab === 'bozor' ? m.updateQuantity(item.id, -1) : m.updateLocalQuantity(item.id, -1)
                          }
                          className="h-9 w-9 items-center justify-center rounded-l-xl active:bg-slate-200/80"
                        >
                          <Minus size={16} color="#475569" />
                        </Pressable>
                        <Text className="min-w-[28px] text-center text-sm font-black text-slate-800">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() => {
                            const max = item.availableStock ?? Infinity;
                            if (item.quantity < max) {
                              if (activeTab === 'bozor') m.updateQuantity(item.id, 1);
                              else m.updateLocalQuantity(item.id, 1);
                            }
                          }}
                          disabled={item.quantity >= (item.availableStock ?? Infinity)}
                          className={cn(
                            'h-9 w-9 items-center justify-center rounded-r-xl active:bg-slate-200/80',
                            item.quantity >= (item.availableStock ?? Infinity) && 'opacity-40'
                          )}
                        >
                          <Plus size={16} color="#475569" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {activeItems.length > 0 ? (
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
            <View className="mb-4 flex-row items-end justify-between">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Jami</Text>
                <Text className="mt-1 text-2xl font-black text-slate-900">
                  {activeTotal.toLocaleString()}{' '}
                  <Text className="text-sm font-bold text-slate-500">so‘m</Text>
                </Text>
              </View>
              <View className="rounded-full bg-orange-500 px-3 py-1">
                <Text className="text-[10px] font-black uppercase tracking-wider text-white">
                  {activeCount} dona
                </Text>
              </View>
            </View>
            {activeTab === 'bozor' ? (
              <Pressable
                onPress={() => router.push('/checkout')}
                className="items-center rounded-2xl bg-gray-900 py-4 shadow-lg active:opacity-90"
              >
                <Text className="text-base font-bold text-white">Buyurtma berish</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  setShopPickerVisible(true);
                }}
                className="items-center rounded-2xl bg-gray-900 py-4 shadow-lg active:opacity-90"
              >
                <Text className="text-base font-bold text-white">Maxalla buyurtma berish</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      <Modal
        visible={shopPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !shopSubmitting && setShopPickerVisible(false)}
      >
        <View className="flex-1 justify-center px-5">
          <Pressable
            className="absolute inset-0 bg-black/55"
            onPress={() => !shopSubmitting && setShopPickerVisible(false)}
            accessibilityLabel="Yopish"
          />
          <View className="relative z-10 mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-2xl">
            <Text className="text-center text-base font-black text-slate-900">Do'konni tanlang</Text>
            <Text className="mt-1 text-center text-xs font-medium text-slate-500">
              Buyurtmaga faqat tanlangan do‘kondagi mahsulotlar kiradi
            </Text>

            <ScrollView className="mt-4 max-h-72">
              <View className="gap-2">
                {localShops.map((shop) => (
                  <Pressable
                    key={shop.id}
                    onPress={() => setSelectedLocalShopId(shop.id)}
                    className={cn(
                      'rounded-2xl border p-3',
                      selectedLocalShopId === shop.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <Text className="text-sm font-black text-slate-900">{shop.name}</Text>
                    {shop.phone ? <Text className="mt-0.5 text-xs text-slate-500">{shop.phone}</Text> : null}
                    <Text className="mt-1 text-[11px] font-semibold text-slate-600">
                      {shop.itemCount} dona · {shop.total.toLocaleString()} so'm
                    </Text>
                    <View className="mt-2">
                      <LocalShopHoursStatus
                        workingHours={hoursByShopId.get(shop.id)}
                        compact
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => setShopPickerVisible(false)}
                disabled={shopSubmitting}
                className="min-h-[46px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
              >
                <Text className="text-sm font-bold text-slate-700">Bekor</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const shopId = selectedLocalShopId ?? localShopOptions[0]?.id;
                  if (!shopId) return;
                  setShopSubmitting(true);
                  void (async () => {
                    try {
                      const order = await api.localShopOrders.create({
                        local_shop_id: shopId,
                        address: { type: 'default' },
                      });
                      setShopPickerVisible(false);
                      await Promise.all([m.refreshLocalCart(), m.refreshCart()]);
                      router.replace({ pathname: '/orders/[id]', params: { id: String(order.id), market: 'mahalla' } });
                    } catch (e) {
                      Alert.alert('Buyurtma', e instanceof Error ? e.message : 'Buyurtma yuborilmadi');
                    } finally {
                      setShopSubmitting(false);
                    }
                  })();
                }}
                disabled={shopSubmitting || localShops.length === 0}
                className={cn(
                  'min-h-[46px] flex-1 items-center justify-center rounded-2xl bg-gray-900',
                  (shopSubmitting || localShops.length === 0) && 'opacity-50'
                )}
              >
                <Text className="text-sm font-black text-white">{shopSubmitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={clearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearModalVisible(false)}
      >
        <View className="flex-1 justify-center px-5">
          <Pressable
            className="absolute inset-0 bg-black/55"
            onPress={() => setClearModalVisible(false)}
            accessibilityLabel="Bekor qilish"
          />
          <View className="relative z-10 mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl">
            <View className="mb-2 h-12 w-12 items-center justify-center self-center rounded-2xl bg-rose-50">
              <Trash2 size={24} color="#f43f5e" />
            </View>
            <Text className="text-center text-lg font-black text-slate-900">Savatni tozalash</Text>
            <Text className="mt-2 text-center text-sm font-medium leading-5 text-slate-500">
              Barcha mahsulotlar o‘chiriladi. Davom etasizmi?
            </Text>
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => setClearModalVisible(false)}
                className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 active:opacity-80"
              >
                <Text className="text-sm font-bold text-slate-700">Bekor qilish</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmClear}
                className="min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-rose-600 active:opacity-90"
              >
                <Text className="text-sm font-black text-white">Ha, tozalash</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
