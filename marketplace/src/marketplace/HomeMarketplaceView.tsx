import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Search, Filter, ShoppingCart, MapPin, ChevronRight, Bell } from 'lucide-react-native';
import { cn, pickRandomSlice } from '../lib/utils';
import { useMarketplace, type ListNav } from './MarketplaceContext';
import { ProductCard } from './ProductCard';

const HOME_PREVIEW_COUNT = 6;

const MOBILE_REFRESH_TINT = '#f97316';

export function HomeMarketplaceView() {
  const m = useMarketplace();
  const prevListNav = useRef<ListNav | null>(null);
  const [homePreviewKey, setHomePreviewKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await m.refreshHomeScreen();
    } finally {
      setRefreshing(false);
    }
  }, [m.refreshHomeScreen]);

  useEffect(() => {
    if (prevListNav.current === 'products' && m.listNav === 'home') {
      setHomePreviewKey((k) => k + 1);
    }
    prevListNav.current = m.listNav;
  }, [m.listNav]);

  const homePreviewProducts = useMemo(
    () => pickRandomSlice(m.products, HOME_PREVIEW_COUNT),
    [m.products, homePreviewKey]
  );

  return (
    <View className={cn('flex-1', Platform.OS === 'web' ? 'bg-white' : 'bg-gray-50')}>
      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MOBILE_REFRESH_TINT}
              colors={[MOBILE_REFRESH_TINT]}
            />
          ) : undefined
        }
      >
        <View className="border-b border-gray-100 bg-white px-4 pb-6 pt-12 shadow-sm">
          <View
            className={cn('w-full gap-4', m.isTabletUpWeb ? 'flex-row items-center' : 'flex-col')}
            style={{
              maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
              width: '100%',
              alignSelf: m.isTabletUpWeb ? 'center' : undefined,
            }}
          >
            <View
              className={cn(
                'flex-row items-center gap-3',
                m.isTabletUpWeb ? 'max-w-[280px] flex-none shrink-0' : 'w-full'
              )}
            >
              <Pressable
                onPress={() => {
                  m.setIsRegionSelectorOpen(true);
                  m.setRegionSelectorStep('region');
                }}
                className={cn(
                  'min-h-[72px] flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 sm:px-5',
                  m.isTabletUpWeb
                    ? 'h-auto min-h-[64px] w-full rounded-xl px-3 py-2.5'
                    : 'flex-1'
                )}
              >
                <View className={cn('min-w-0 flex-1 flex-row items-start gap-3', m.isTabletUpWeb && 'gap-2')}>
                  <View
                    className={cn(
                      'mt-0.5 h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100',
                      m.isTabletUpWeb && 'mt-0 h-9 w-9 rounded-lg'
                    )}
                  >
                    <MapPin size={m.isTabletUpWeb ? 18 : 20} color="#f97316" />
                  </View>
                  <View className="min-w-0 flex-1">
                    {m.selectedRegion ? (
                      <View className="min-w-0 flex-col gap-0.5">
                        <View className="min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <Text
                            className="text-[10px] font-black uppercase tracking-widest text-orange-500"
                            numberOfLines={2}
                          >
                            {m.selectedRegion.name}
                          </Text>
                          {m.userAddresses.some((a) => a.is_default && a.mfy_id === m.selectedMFY?.id) ? (
                            <View className="flex-shrink-0 rounded bg-orange-500 px-1">
                              <Text className="text-[7px] font-black uppercase text-white">Asosiy</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          className={cn(
                            'font-black leading-snug text-gray-900',
                            m.isTabletUpWeb ? 'text-[13px]' : 'text-sm'
                          )}
                          numberOfLines={2}
                        >
                          {m.selectedDistrict?.name || 'Tuman tanlanmagan'}
                        </Text>
                        <Text
                          className={cn(
                            'font-bold leading-snug text-gray-500',
                            m.isTabletUpWeb ? 'text-[11px]' : 'text-xs'
                          )}
                          numberOfLines={2}
                        >
                          {m.selectedMFY?.name || 'MFY tanlanmagan'}
                        </Text>
                      </View>
                    ) : (
                      <Text className="font-black text-gray-400">Hududni tanlang</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#9ca3af" style={{ marginLeft: 8, flexShrink: 0 }} />
              </Pressable>

              {!m.isTabletUpWeb ? (
                <Pressable className="relative h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                  <Bell size={20} color="#f97316" />
                  {m.notificationsCount > 0 && (
                    <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                      <Text className="text-[10px] font-bold text-white">{m.notificationsCount}</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>

            <View
              className={cn(
                'flex-row items-center gap-3',
                m.isTabletUpWeb ? 'min-w-0 flex-1 flex-nowrap' : 'w-full flex-wrap'
              )}
            >
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { focus: '1' } })}
                className={cn(
                  'relative h-[52px] min-w-0 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 py-0 pl-11 pr-3',
                  m.isTabletUpWeb ? 'min-w-[12rem] flex-1' : 'flex-1'
                )}
              >
                <View className="pointer-events-none absolute left-4 top-1/2 z-10 -mt-2.5">
                  <Search size={18} color="#9ca3af" />
                </View>
                <Text className="text-sm font-bold text-gray-400" numberOfLines={1}>
                  Mahsulot qidirish...
                </Text>
              </Pressable>
              {m.isTabletUpWeb ? (
                <Pressable className="relative h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                  <Bell size={20} color="#f97316" />
                  {m.notificationsCount > 0 && (
                    <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                      <Text className="text-[10px] font-bold text-white">{m.notificationsCount}</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => router.push({ pathname: '/search', params: { openFilter: '1' } })}
                className="h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <Filter size={20} color="#4b5563" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/cart')}
                className="relative h-[52px] w-[52px] flex-shrink-0 items-center justify-center self-center rounded-2xl bg-gray-900"
              >
                <ShoppingCart size={20} color="white" />
                {m.cartCount > 0 && (
                  <View className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-orange-500">
                    <Text className="text-[11px] font-bold text-white">{m.cartCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        <View
          className="flex-row flex-wrap p-4"
          style={{
            columnGap: m.isSmallWeb ? 0 : m.cardGap,
            rowGap: 16,
            maxWidth: m.isTabletUpWeb ? m.containerMaxWidth : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
            justifyContent: 'space-around',
          }}
        >
          {m.loading
            ? Array(HOME_PREVIEW_COUNT)
                .fill(0)
                .map((_, i) => (
                  <View
                    key={i}
                    className="h-64 rounded-[32px] border border-gray-100 bg-white opacity-50"
                    style={{ width: m.resolvedCardWidth }}
                  />
                ))
            : homePreviewProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={m.setSelectedProduct}
                  onAddToCart={m.addToCart}
                  onCartDelta={m.updateQuantity}
                  inCartQty={m.cart.find((c) => String(c.id) === String(product.id))?.quantity ?? 0}
                  cardWidth={m.resolvedCardWidth}
                  isSmallWeb={m.isSmallWeb}
                />
              ))}
        </View>
        {!m.loading && m.products.length > 0 ? (
          <View className="items-center px-4 pb-4">
            <Pressable
              onPress={() => m.setListNav('products')}
              className="flex-row items-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 shadow-sm active:bg-orange-50"
            >
              <Text className="text-sm font-black uppercase tracking-widest text-gray-800">Barchasini ko&apos;rish</Text>
              <ChevronRight size={18} color="#1f2937" />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
