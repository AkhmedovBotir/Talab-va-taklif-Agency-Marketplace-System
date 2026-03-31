import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, Modal, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Plus, Minus, ChevronLeft, Package } from 'lucide-react-native';
import { useMarketplace } from './MarketplaceContext';
import { TAB_BAR_BOTTOM_CLEARANCE } from './BottomTabBar';
import { cn } from '../lib/utils';

const MOBILE_REFRESH_TINT = '#f97316';

export function CartScreen() {
  const m = useMarketplace();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const onPullRefresh = async () => {
    setPullRefreshing(true);
    try {
      await m.refreshCart();
    } finally {
      setPullRefreshing(false);
    }
  };

  const openClearModal = () => {
    if (m.cart.length === 0) return;
    setClearModalVisible(true);
  };

  const handleConfirmClear = () => {
    setClearModalVisible(false);
    m.clearCart();
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
                {m.cartCount > 0 ? `${m.cartCount} ta mahsulot` : 'Hozircha bo‘sh'}
              </Text>
            </View>
          </View>
          {m.cart.length > 0 ? (
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: m.cart.length > 0 ? 200 : 120,
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
          {m.cart.length === 0 ? (
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
              {m.cart.map((item) => (
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
                        onPress={() => m.removeFromCart(item.id)}
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
                          onPress={() => m.updateQuantity(item.id, -1)}
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
                            if (item.quantity < max) m.updateQuantity(item.id, 1);
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

      {m.cart.length > 0 ? (
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
                  {m.cartTotal.toLocaleString()}{' '}
                  <Text className="text-sm font-bold text-slate-500">so‘m</Text>
                </Text>
              </View>
              <View className="rounded-full bg-orange-500 px-3 py-1">
                <Text className="text-[10px] font-black uppercase tracking-wider text-white">
                  {m.cartCount} dona
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/checkout')}
              className="items-center rounded-2xl bg-gray-900 py-4 shadow-lg active:opacity-90"
            >
              <Text className="text-base font-bold text-white">Buyurtma berish</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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
