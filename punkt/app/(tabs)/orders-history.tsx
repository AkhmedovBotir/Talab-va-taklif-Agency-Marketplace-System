import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PunktMeOrderCard } from '../components/PunktMeOrderCard';
import { WebDateInput } from '../components/WebDateInput';
import { useAuth } from '../contexts/AuthContext';
import {
  useScreenContentWidth,
} from '../hooks/useScreenContentWidth';
import { apiService, PunktMeOrderListItem } from '../services/api';

const PAGE_SIZE = 20;

export default function OrdersHistoryScreen() {
  const { isLoading: authLoading, isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<PunktMeOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [startDateValue, setStartDateValue] = useState<Date | null>(null);
  const [endDateValue, setEndDateValue] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const router = useRouter();
  const { isWeb, horizontalPad, contentMaxWidth } = useScreenContentWidth(960);
  // Webda ham mobilga yaqin bitta markaziy ustun
  const listMaxWidth = isWeb ? Math.min(contentMaxWidth, 560) : contentMaxWidth;
  const hasActiveFilters = !!startDateValue || !!endDateValue;

  const formatDateForApi = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return 'Sanani tanlang';
    return date.toLocaleDateString('uz-UZ');
  };

  const loadOrders = useCallback(async (
    pageNum = 1,
    reset = false,
    dateRange?: { startDate: Date | null; endDate: Date | null }
  ) => {
    if (!reset) setLoadingMore(true);
    try {
      const start = dateRange ? dateRange.startDate : startDateValue;
      const end = dateRange ? dateRange.endDate : endDateValue;
      const response = await apiService.getPunktMeOrdersHistory({
        page: pageNum,
        limit: PAGE_SIZE,
        startDate: formatDateForApi(start),
        endDate: formatDateForApi(end),
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
        console.error('Buyurtmalar tarixi:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [startDateValue, endDateValue]);

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
    await loadOrders(1, true);
  };

  const loadMore = () => {
    if (loadingMore || refreshing || page >= totalPages) return;
    if (authLoading || !isAuthenticated || !token) return;
    const next = page + 1;
    setPage(next);
    loadOrders(next, false);
  };

  const applyDateFilter = () => {
    if (authLoading || !isAuthenticated || !token) return;
    setLoading(true);
    setPage(1);
    loadOrders(1, true);
  };

  const clearDateFilter = () => {
    setStartDateValue(null);
    setEndDateValue(null);
    if (authLoading || !isAuthenticated || !token) return;
    setLoading(true);
    setPage(1);
    loadOrders(1, true, { startDate: null, endDate: null });
  };

  const onStartDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (!selectedDate) return;
    setStartDateValue(selectedDate);
    if (endDateValue && selectedDate > endDateValue) {
      setEndDateValue(selectedDate);
    }
  };

  const onEndDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (!selectedDate) return;
    setEndDateValue(selectedDate);
  };

  if ((authLoading || loading) && orders.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Buyurtmalar tarixi' }} />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Buyurtmalar tarixi' }} />
      <View style={styles.container}>
        <View
          style={[
            styles.banner,
            isWeb && {
              marginHorizontal: horizontalPad,
              maxWidth: listMaxWidth,
              width: '100%',
              alignSelf: 'center',
            },
          ]}
        >
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.bannerText}>
            Tayinlangan buyurtmalar tarixi. Quyidan sana oralig‘ini tanlab serverda filtrlashingiz mumkin.
          </Text>
        </View>

        <View
          style={[
            styles.filterCard,
            isWeb && {
              marginHorizontal: horizontalPad,
              maxWidth: listMaxWidth,
              width: '100%',
              alignSelf: 'center',
            },
          ]}
        >
          <Text style={styles.filterTitle}>Sana filtri</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Dan</Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={startDateValue}
                  onChange={(d) => {
                    setStartDateValue(d);
                    if (d && endDateValue && d > endDateValue) {
                      setEndDateValue(d);
                    }
                  }}
                  maximumDate={endDateValue || new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[styles.dateBtnText, !startDateValue && styles.datePlaceholder]}>
                    {formatDisplayDate(startDateValue)}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Gacha</Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={endDateValue}
                  onChange={(d) => setEndDateValue(d)}
                  minimumDate={startDateValue || undefined}
                  maximumDate={new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[styles.dateBtnText, !endDateValue && styles.datePlaceholder]}>
                    {formatDisplayDate(endDateValue)}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={[styles.filterActionBtn, styles.applyBtn]} onPress={applyDateFilter}>
              <Text style={styles.applyBtnText}>Qo‘llash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterActionBtn, styles.clearBtn, !hasActiveFilters && styles.clearBtnDisabled]}
              onPress={clearDateFilter}
              disabled={!hasActiveFilters}
            >
              <Text style={[styles.clearBtnText, !hasActiveFilters && styles.clearBtnTextDisabled]}>
                Tozalash
              </Text>
            </TouchableOpacity>
          </View>
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
              <Ionicons name="archive-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Tarixda buyurtma yo‘q</Text>
            </View>
          }
        />
      </View>
      {Platform.OS !== 'web' && showStartDatePicker && (
        <DateTimePicker
          value={startDateValue || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={endDateValue || new Date()}
        />
      )}
      {Platform.OS !== 'web' && showEndDatePicker && (
        <DateTimePicker
          value={endDateValue || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDateValue || undefined}
          maximumDate={new Date()}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: 16,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  filterCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  dateBtn: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBtnText: {
    fontSize: 14,
    color: '#111',
  },
  datePlaceholder: {
    color: '#999',
  },
  filterActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  filterActionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    backgroundColor: '#007AFF',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    backgroundColor: '#F2F2F7',
  },
  clearBtnDisabled: {
    opacity: 0.55,
  },
  clearBtnText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtnTextDisabled: {
    color: '#8E8E93',
  },
  list: {
    paddingTop: 8,
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
