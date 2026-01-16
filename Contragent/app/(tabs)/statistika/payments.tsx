import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiService, ContragentPayment, PaymentStatisticsData } from '../../../services/api';
import { formatNumberDisplay } from '../../../utils/formatNumber';

type PaymentTab = 'paid' | 'unpaid';

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PaymentTab>('unpaid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<ContragentPayment[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const formatCurrency = (num: number): string => {
    return formatNumberDisplay(num) + ' so\'m';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchPayments = async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const currentPage = isRefresh ? 1 : page;
      const params = {
        page: currentPage,
        limit: 20,
      };

      let response;
      if (activeTab === 'paid') {
        response = await apiService.getPaidPayments(params);
      } else {
        response = await apiService.getUnpaidPayments(params);
      }

      if (isRefresh || currentPage === 1) {
        setPayments(response.data);
      } else {
        setPayments((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === params.limit && currentPage < response.totalPages);
      if (!isLoadMore) {
        setPage(currentPage);
      }
    } catch (err: any) {
      setError(err.message || 'To\'lovlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.getPaymentStatistics();
      setStatistics(response.data);
    } catch (err: any) {
      // Ignore payment statistics errors
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
      fetchStatistics();
    }, [activeTab])
  );

  const handleTabChange = (tab: PaymentTab) => {
    setActiveTab(tab);
    setPage(1);
    setPayments([]);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
      fetchPayments(false, true);
    }
  };

  const handlePaymentPress = (paymentId: string) => {
    router.push({
      pathname: '/(tabs)/statistika/payment-detail' as any,
      params: { paymentId },
    });
  };

  const renderPaymentItem = ({ item }: { item: ContragentPayment }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => handlePaymentPress(item._id)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentHeaderLeft}>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
          <View style={styles.paymentStatusContainer}>
            {item.status === 'paid' ? (
              <View style={[styles.statusBadge, styles.statusPaid]}>
                <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                <Text style={styles.statusText}>To\'langan</Text>
              </View>
            ) : item.isOverdue ? (
              <View style={[styles.statusBadge, styles.statusOverdue]}>
                <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                <Text style={styles.statusText}>Muddati o'tgan</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusPending]}>
                <Ionicons name="time" size={14} color="#FF9500" />
                <Text style={styles.statusText}>Kutilmoqda</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.paymentInfoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.paymentInfoText}>
            {activeTab === 'paid' ? 'To\'langan: ' : 'Muddat: '}
            {activeTab === 'paid' ? formatDateTime(item.paidAt) : formatDate(item.dueDate)}
          </Text>
        </View>
        {item.orders && item.orders.length > 0 && (
          <View style={styles.paymentInfoRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.paymentInfoText}>
              {item.orders.length} ta buyurtma
            </Text>
          </View>
        )}
        {item.paidBy && (
          <View style={styles.paymentInfoRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.paymentInfoText}>
              {item.paidBy.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {activeTab === 'paid' ? 'To\'langan to\'lovlar mavjud emas' : 'To\'lanmagan to\'lovlar mavjud emas'}
      </Text>
    </View>
  );

  if (loading && payments.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Statistics Summary */}
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>To\'lanmagan</Text>
              <Text style={styles.statValue}>{formatCurrency(statistics.unpaid.totalAmount)}</Text>
              <Text style={styles.statCount}>{statistics.unpaid.count} ta</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>To\'langan</Text>
              <Text style={[styles.statValue, styles.statValueGreen]}>
                {formatCurrency(statistics.paid.totalAmount)}
              </Text>
              <Text style={styles.statCount}>{statistics.paid.count} ta</Text>
            </View>
          </View>
          {statistics.overdue.count > 0 && (
            <View style={styles.overdueCard}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <View style={styles.overdueInfo}>
                <Text style={styles.overdueLabel}>Muddati o'tgan to'lovlar</Text>
                <Text style={styles.overdueValue}>
                  {formatCurrency(statistics.overdue.totalAmount)} ({statistics.overdue.count} ta)
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unpaid' && styles.tabActive]}
          onPress={() => handleTabChange('unpaid')}
        >
          <Text style={[styles.tabText, activeTab === 'unpaid' && styles.tabTextActive]}>
            To'lanmagan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'paid' && styles.tabActive]}
          onPress={() => handleTabChange('paid')}
        >
          <Text style={[styles.tabText, activeTab === 'paid' && styles.tabTextActive]}>
            To'langan
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPayments()}>
            <Text style={styles.retryButtonText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayments(true)} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statValueGreen: {
    color: '#34C759',
  },
  statCount: {
    fontSize: 12,
    color: '#999',
  },
  overdueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  overdueInfo: {
    flex: 1,
  },
  overdueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overdueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentHeaderLeft: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusOverdue: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentInfo: {
    gap: 8,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});

