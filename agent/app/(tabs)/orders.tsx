// Faol buyurtmalar — GET /agents/me/orders/active
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import type { AgentMeOrderListItem, KPISummary } from '../../types/api';
import { isAgentOrderTimestampSet } from '../../utils/agentMeOrder';
import { getApiErrorMessage } from '../../utils/apiError';

const PAGE_LIMIT = 20;
const WEB_MAX_WIDTH = 820;

function marketplaceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Kutilmoqda (jarayonda)',
    delivered: 'Yetkazib berilgan',
    cancelled: 'Bekor qilingan',
  };
  return map[status] || status;
}

function addressModeLabel(mode?: string): string {
  const map: Record<string, string> = {
    default: "Asosiy saqlangan manzil",
    delivery_area: "Foydalanuvchining tanlangan saqlangan manzili",
    extra: "Matnli (qo'lda kiritilgan) manzil",
  };
  if (!mode) return '—';
  return map[mode] || mode;
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

export default function OrdersScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellWidth = isWeb ? Math.min(WEB_MAX_WIDTH, Math.max(320, windowWidth - 40)) : undefined;

  const [orders, setOrders] = useState<AgentMeOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [kpiBalance, setKpiBalance] = useState<KPISummary | null>(null);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        (o.snap_area_name || '').toLowerCase().includes(q) ||
        (o.primary_custom_address || '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const loadOrders = useCallback(
    async (page: number = 1) => {
      try {
        const res = await apiService.getMyActiveOrders({ page, limit: PAGE_LIMIT });
        setOrders(res.items);
        setTotalPages(Math.max(1, res.totalPages));
        setCurrentPage(res.page);
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
    loadKPIBalance();
  }, [loadOrders]);

  const loadKPIBalance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getKPISummary({ date: today });
      if (response.success && response.data) {
        setKpiBalance(response.data);
      }
    } catch {
      // KPI ixtiyoriy
    } finally {
      setLoadingKPI(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLoadingKPI(true);
    loadOrders(currentPage);
    loadKPIBalance();
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
        <View style={styles.orderHeaderText}>
          <Text style={styles.orderNumber}>#{item.id}</Text>
          <Text style={styles.areaText} numberOfLines={2}>
            {item.snap_area_name || item.primary_custom_address || 'Manzil'}
          </Text>
          <Text style={styles.metaText}>
            {item.items_count} ta mahsulot ·{' '}
            {new Date(item.created_at).toLocaleString('uz-UZ', {
              day: '2-digit',
              month: '2-digit',
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
        {item.address_mode ? (
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{addressModeLabel(item.address_mode)}</Text>
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
            <Text style={styles.headerTitle}>Ish navbati</Text>
            <Text style={styles.headerSubtitle}>Faol buyurtmalar (kutilmoqda)</Text>
          </View>

          {!loadingKPI && kpiBalance && (
            <TouchableOpacity style={styles.kpiBalanceCard} onPress={() => router.push('/kpi')} accessibilityRole="button">
              <View style={styles.kpiBalanceHeader}>
                <Ionicons name="wallet" size={20} color="#007AFF" />
                <Text style={styles.kpiBalanceTitle}>Kunlik KPI balansi</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" style={styles.kpiBalanceArrow} />
              </View>
              <View style={styles.kpiBalanceRow}>
                <View style={styles.kpiBalanceItem}>
                  <Text style={styles.kpiBalanceLabel}>Jami</Text>
                  <Text style={styles.kpiBalanceValue}>
                    {`${(kpiBalance.totalAmount ?? 0).toLocaleString()} so'm`}
                  </Text>
                </View>
                <View style={styles.kpiBalanceDivider} />
                <View style={styles.kpiBalanceItem}>
                  <Text style={styles.kpiBalanceLabel}>{"To'langan"}</Text>
                  <Text style={[styles.kpiBalanceValue, styles.kpiBalancePaid]}>
                    {`${(kpiBalance.paidAmount ?? 0).toLocaleString()} so'm`}
                  </Text>
                </View>
                <View style={styles.kpiBalanceDivider} />
                <View style={styles.kpiBalanceItem}>
                  <Text style={styles.kpiBalanceLabel}>{"To'lanmagan"}</Text>
                  <Text style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid]}>
                    {`${(kpiBalance.unpaidAmount ?? 0).toLocaleString()} so'm`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={"ID yoki hudud (joriy sahifa bo'yicha)"}
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
                  {searchQuery.trim()
                    ? "Qidiruv bo'yicha natija yo'q"
                    : "Faol buyurtmalar yo'q"}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  orderHeaderText: {
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
  metaText: {
    fontSize: 13,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
    flex: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  kpiBalanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  kpiBalanceArrow: {
    marginLeft: 'auto',
  },
  kpiBalanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  kpiBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiBalanceItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 88,
  },
  kpiBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiBalanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  kpiBalancePaid: {
    color: '#34C759',
  },
  kpiBalanceUnpaid: {
    color: '#FF9500',
  },
  kpiBalanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
});
