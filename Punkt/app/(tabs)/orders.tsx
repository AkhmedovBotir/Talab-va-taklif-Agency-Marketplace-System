import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KpiBalanceCard } from '../components/KpiBalanceCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PunktMeOrderCard } from '../components/PunktMeOrderCard';
import { useAuth } from '../contexts/AuthContext';
import {
  useScreenContentWidth,
} from '../hooks/useScreenContentWidth';
import { apiService, PunktMeOrderListItem } from '../services/api';

const PAGE_SIZE = 20;

export default function OrdersScreen() {
  const { isLoading: authLoading, isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<PunktMeOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [kpiRefreshTrigger, setKpiRefreshTrigger] = useState(0);
  const router = useRouter();
  const { isWeb, horizontalPad, contentMaxWidth } = useScreenContentWidth(960);
  // Webda ham mobilga yaqin bitta markaziy ustun
  const listMaxWidth = isWeb ? Math.min(contentMaxWidth, 560) : contentMaxWidth;

  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    if (!reset) setLoadingMore(true);
    try {
      const response = await apiService.getPunktMeOrdersToday({
        page: pageNum,
        limit: PAGE_SIZE,
      });
      const pageData = response.data;
      if (reset) {
        setOrders(pageData.items);
      } else {
        setOrders((prev) => [...prev, ...pageData.items]);
      }
      setTotalPages(pageData.total_pages || 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg !== 'Logging out...') {
        console.error('Bugungi buyurtmalar:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  /** Webda token AsyncStorage dan keyin kelishi va FlatList layout — avvalgi so‘rov bo‘sh qaytishi mumkin */
  useEffect(() => {
    if (authLoading || !isAuthenticated || !token) {
      return;
    }
    setLoading(true);
    setPage(1);
    loadOrders(1, true);
  }, [authLoading, isAuthenticated, token, loadOrders]);

  const handleRefresh = async () => {
    if (authLoading || !isAuthenticated || !token) return;
    setRefreshing(true);
    setPage(1);
    setKpiRefreshTrigger((p) => p + 1);
    await loadOrders(1, true);
  };

  useFocusEffect(
    useCallback(() => {
      setKpiRefreshTrigger((p) => p + 1);
    }, [])
  );

  const loadMore = () => {
    if (loadingMore || refreshing || page >= totalPages) return;
    if (authLoading || !isAuthenticated || !token) return;
    const next = page + 1;
    setPage(next);
    loadOrders(next, false);
  };

  if ((authLoading || loading) && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          isWeb && {
            paddingHorizontal: horizontalPad,
            maxWidth: listMaxWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
      >
        <KpiBalanceCard
          onPress={() => router.push('/kpi')}
          refreshTrigger={kpiRefreshTrigger}
          maxWidth={isWeb ? listMaxWidth : undefined}
        />
      </View>

      <FlatList
        data={orders}
        style={
          Platform.OS === 'web'
            ? ({ flex: 1, minHeight: 0, width: '100%' } as const)
            : { flex: 1 }
        }
        removeClippedSubviews={Platform.OS !== 'web'}
        renderItem={({ item }) => (
          <PunktMeOrderCard
            order={item}
            maxWidth={isWeb ? listMaxWidth : undefined}
            variant="default"
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: horizontalPad,
            flexGrow: isWeb ? 1 : undefined,
            ...(isWeb && {
              alignSelf: 'center',
              width: '100%',
              maxWidth: listMaxWidth,
            }),
            paddingBottom: Platform.OS === 'web' ? 24 : 16,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, isWeb && { maxWidth: listMaxWidth }]}>
            <Ionicons name="cube-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Bugun uchun buyurtma yo‘q</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 10,
  },
  list: {
    paddingTop: 12,
  },
  emptyContainer: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});
