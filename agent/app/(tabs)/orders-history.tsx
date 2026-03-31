// Buyurtmalar tarixi — GET /agents/me/orders/history (delivered / cancelled)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { apiService } from '../../services/api';
import type { AgentMeOrderListItem } from '../../types/api';
import { isAgentOrderTimestampSet } from '../../utils/agentMeOrder';
import { getApiErrorMessage } from '../../utils/apiError';

const PAGE_LIMIT = 20;
const WEB_MAX_WIDTH = 820;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function marketplaceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Kutilmoqda (jarayonda)',
    delivered: 'Yetkazib berilgan',
    cancelled: 'Bekor qilingan',
  };
  return map[status] || status;
}

function marketplaceStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'delivered':
      return '#34C759';
    case 'cancelled':
      return '#FF3B30';
    default:
      return '#999';
  }
}

function parseDateAtBoundary(value: string, endOfDay: boolean): Date | null {
  const v = value.trim();
  if (!v) return null;
  const m = DATE_RE.exec(v);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || !Number.isFinite(d)) return null;
  if (mm < 1 || mm > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mm - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  if (date.getFullYear() !== y || date.getMonth() !== mm - 1 || date.getDate() !== d) return null;
  return date;
}

function normalizeDateInput(value: string): string {
  // Faqat raqam va "-" qoldiramiz: mobile klaviaturada kiritishni yengillashtiradi.
  return value.replace(/[^\d-]/g, '').slice(0, 10);
}

export default function OrdersHistoryScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellWidth = isWeb ? Math.min(WEB_MAX_WIDTH, Math.max(320, windowWidth - 40)) : undefined;

  const [orders, setOrders] = useState<AgentMeOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = parseDateAtBoundary(dateFrom, false);
    const to = parseDateAtBoundary(dateTo, true);
    return orders.filter((o) => {
      const matchesText =
        !q ||
        String(o.id).includes(q) ||
        (o.snap_area_name || '').toLowerCase().includes(q) ||
        (o.primary_custom_address || '').toLowerCase().includes(q);
      if (!matchesText) return false;
      if (!from && !to) return true;
      const createdAt = new Date(o.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
      return true;
    });
  }, [orders, searchQuery, dateFrom, dateTo]);

  const dateRangeInvalid = useMemo(() => {
    const from = parseDateAtBoundary(dateFrom, false);
    const to = parseDateAtBoundary(dateTo, true);
    if (!from || !to) return false;
    return from.getTime() > to.getTime();
  }, [dateFrom, dateTo]);

  const loadOrders = useCallback(
    async (page: number = 1) => {
      try {
        const res = await apiService.getMyOrdersHistory({ page, limit: PAGE_LIMIT });
        setOrders(res.items);
        setTotalPages(Math.max(1, res.totalPages));
        setCurrentPage(res.page);
        setTotal(res.total);
      } catch (error: unknown) {
        showSnackbar(getApiErrorMessage(error, 'Buyurtmalarni yuklashda xatolik'), { variant: 'error' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showSnackbar]
  );

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(currentPage);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    Keyboard.dismiss();
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/order/${orderId}`);
  };

  const renderOrderItem = ({ item }: { item: AgentMeOrderListItem }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item.id)}
      accessibilityRole="button"
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.id}</Text>
          <Text style={styles.areaText} numberOfLines={2}>
            {item.snap_area_name || item.primary_custom_address || 'Manzil'}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleString('uz-UZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: marketplaceStatusColor(item.marketplace_status) }]}>
          <Text style={styles.statusText}>{marketplaceStatusLabel(item.marketplace_status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.items_count} ta mahsulot</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {`${(item.total_amount || 0).toLocaleString()} so'm`}
          </Text>
        </View>
        {item.assigned_punkt?.name ? (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.assigned_punkt.name}</Text>
          </View>
        ) : null}
        <View style={styles.pipelineRow}>
          <Text style={styles.pipelineLabel}>Punkt zanjiri:</Text>
          <View style={styles.pipelineIcons}>
            <Ionicons
              name={isAgentOrderTimestampSet(item.agent_declared_payment_to_punkt_at) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={isAgentOrderTimestampSet(item.agent_declared_payment_to_punkt_at) ? '#34C759' : '#ccc'}
            />
            <Ionicons
              name={isAgentOrderTimestampSet(item.punkt_confirmed_agent_payment_at) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={isAgentOrderTimestampSet(item.punkt_confirmed_agent_payment_at) ? '#34C759' : '#ccc'}
            />
            <Ionicons
              name={isAgentOrderTimestampSet(item.punkt_post_payment_delivered_at) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={isAgentOrderTimestampSet(item.punkt_post_payment_delivered_at) ? '#34C759' : '#ccc'}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.outer, isWeb && shellWidth ? { alignItems: 'center' as const } : null]}>
        <View style={[styles.shell, styles.shellFlex, shellWidth ? { width: shellWidth, maxWidth: '100%' as const } : null]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
            <Text style={styles.headerSubtitle}>Yetkazilgan va bekor qilingan</Text>
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.totalText}>Jami: {total} ta</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ID yoki hudud (joriy sahifa)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Tozalash">
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filtersRow}>
            <View style={styles.filterInputWrap}>
              <Text style={styles.filterLabel}>Dan (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="2026-03-01"
                value={dateFrom}
                onChangeText={(v) => setDateFrom(normalizeDateInput(v))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                returnKeyType="done"
              />
            </View>
            <View style={styles.filterInputWrap}>
              <Text style={styles.filterLabel}>Gacha (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="2026-03-30"
                value={dateTo}
                onChangeText={(v) => setDateTo(normalizeDateInput(v))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                returnKeyType="done"
              />
            </View>
          </View>
          <View style={styles.filterMetaRow}>
            <Text style={styles.filterMetaText}>
              Ko'rsatilmoqda: {filteredOrders.length} / {orders.length}
            </Text>
            {(searchQuery || dateFrom || dateTo) ? (
              <TouchableOpacity onPress={clearFilters} accessibilityRole="button">
                <Text style={styles.clearFilterText}>Filtrni tozalash</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {dateRangeInvalid && (
            <Text style={styles.filterErrorText}>Sana oralig'i noto'g'ri: "dan" sanasi "gacha"dan katta.</Text>
          )}

          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {(searchQuery.trim() || dateFrom.trim() || dateTo.trim())
                    ? "Qidiruv bo'yicha natija yo'q"
                    : "Tarix bo'sh"}
                </Text>
              </View>
            }
          />

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => {
                  if (currentPage > 1) loadOrders(currentPage - 1);
                }}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.pageButtonText}>Oldingi</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => {
                  if (currentPage < totalPages) loadOrders(currentPage + 1);
                }}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageButtonText}>Keyingi</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 12,
  },
  outer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  shell: {
    width: '100%',
  },
  shellFlex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  toolbar: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterInputWrap: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 2,
  },
  filterInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterMetaRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterMetaText: {
    fontSize: 12,
    color: '#777',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterErrorText: {
    marginHorizontal: 16,
    marginBottom: 6,
    fontSize: 12,
    color: '#C62828',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  orderHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  areaText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 130,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderInfo: {
    gap: 8,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pipelineLabel: {
    fontSize: 12,
    color: '#888',
  },
  pipelineIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
