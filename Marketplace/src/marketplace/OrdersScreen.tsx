import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react-native';
import { api } from '../services/api';
import type { MarketplaceOrder } from '../types';
import { orderStatusLabelUz, formatOrderAddressSummary } from '../lib/orders';
import { useMarketplace } from './MarketplaceContext';
import { TAB_BAR_BOTTOM_CLEARANCE } from './BottomTabBar';
import { cn } from '../lib/utils';

const MOBILE_REFRESH_TINT = '#f97316';

function formatOrderDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function OrdersScreen() {
  const m = useMarketplace();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [tab, setTab] = useState<'bozor' | 'mahalla'>('bozor');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res =
        tab === 'bozor'
          ? await api.orders.list({ page: p, limit: 15 })
          : await api.localShopOrders.list({ page: p, limit: 15 });
      setTotalPages(Math.max(1, res.total_pages));
      setTotal(res.total);
      setPage(res.page);
      setOrders((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch {
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      void load(1, false);
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load(1, false);
  }, [load]);

  const loadMore = () => {
    if (page < totalPages && !loading && !loadingMore) void load(page + 1, true);
  };

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
            <Text className="text-xl font-black text-slate-900">Buyurtmalarim</Text>
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {total > 0 ? `Jami ${total} ta` : 'Ro‘yxat'}
            </Text>
          </View>
        </View>
      </View>
      <View className="px-4 pt-3">
        <View className="mx-auto w-full max-w-[560px] flex-row rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <Pressable
            onPress={() => setTab('bozor')}
            className={cn('flex-1 items-center rounded-xl py-2.5', tab === 'bozor' && 'bg-white')}
          >
            <Text className={cn('text-xs font-black uppercase tracking-wider', tab === 'bozor' ? 'text-slate-900' : 'text-slate-500')}>
              Bozor
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('mahalla')}
            className={cn('flex-1 items-center rounded-xl py-2.5', tab === 'mahalla' && 'bg-white')}
          >
            <Text className={cn('text-xs font-black uppercase tracking-wider', tab === 'mahalla' ? 'text-slate-900' : 'text-slate-500')}>
              Maxalla
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 + TAB_BAR_BOTTOM_CLEARANCE }}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MOBILE_REFRESH_TINT} colors={[MOBILE_REFRESH_TINT]} />
          ) : undefined
        }
      >
        <View
          className="w-full"
          style={{
            maxWidth: m.isTabletUpWeb ? 560 : undefined,
            width: '100%',
            alignSelf: m.isTabletUpWeb ? 'center' : undefined,
          }}
        >
        {loading && orders.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center rounded-[28px] border border-slate-200 bg-white px-6 py-16">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <Package size={40} color="#94a3b8" />
            </View>
            <Text className="text-center text-lg font-black text-slate-800">Hozircha buyurtma yo‘q</Text>
            <Text className="mt-2 text-center text-sm text-slate-500">Savatdan buyurtma bering</Text>
          </View>
        ) : (
          <View className="gap-3">
            {orders.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: '/orders/[id]', params: { id: String(o.id), market: tab } })}
                className="flex-row items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm active:opacity-90"
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-black text-slate-900">#{o.id}</Text>
                  <Text className="mt-0.5 text-xs font-medium text-slate-500">{formatOrderDate(o.created_at)}</Text>
                  <Text className="mt-1 text-xs text-slate-600" numberOfLines={1}>
                    {formatOrderAddressSummary(o.address)}
                  </Text>
                  <View className="mt-2 self-start rounded-full bg-slate-100 px-2 py-0.5">
                    <Text className="text-[10px] font-black uppercase text-slate-600">{orderStatusLabelUz(o.status)}</Text>
                  </View>
                </View>
                <View className="ml-3 items-end">
                  <Text className="text-base font-black text-orange-600">{o.total_amount.toLocaleString()} so‘m</Text>
                  <ChevronRight size={18} color="#cbd5e1" style={{ marginTop: 8 }} />
                </View>
              </Pressable>
            ))}
            {page < totalPages ? (
              <Pressable
                onPress={loadMore}
                disabled={loadingMore}
                className={cn('items-center rounded-2xl border border-slate-200 bg-white py-4', loadingMore && 'opacity-50')}
              >
                <Text className="font-bold text-slate-700">{loadingMore ? 'Yuklanmoqda...' : 'Yana yuklash'}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}
