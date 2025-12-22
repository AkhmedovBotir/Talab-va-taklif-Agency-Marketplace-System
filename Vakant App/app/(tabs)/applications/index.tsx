import { Application, vacancyApi } from '@/services/vacancyApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'reviewed' | 'accepted' | 'rejected' | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadApplications = useCallback(
    async (pageNum: number = 1, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else if (pageNum > 1) {
          setLoadingMore(true);
        }

        const response = await vacancyApi.getApplications({
          page: pageNum,
          limit: 20,
          status: statusFilter,
        });

        if (reset) {
          setApplications(response.data);
        } else {
          setApplications((prev) => [...prev, ...response.data]);
        }

        setHasMore(pageNum < response.totalPages);
        setPage(pageNum);
      } catch (error: any) {
        Alert.alert('Xatolik', error.message || 'Arizalarni yuklashda xatolik');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadApplications(1, true);
  }, [statusFilter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadApplications(1, true);
  }, [loadApplications]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadApplications(page + 1, false);
    }
  }, [page, hasMore, loadingMore, loadApplications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'reviewed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'reviewed':
        return 'Ko\'rib chiqilmoqda';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return status;
    }
  };

  const renderApplication = ({ item }: { item: Application }) => {
    const vacancy =
      typeof item.vacancy === 'object' ? item.vacancy : null;

    if (!vacancy) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/applications/${item._id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.vacancyName} numberOfLines={2}>
              {vacancy.name}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeText}>
                  {vacancy.target === 'agent' ? 'Agent' : 'Punkt'}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>
                  {vacancy.type === 'fulltime' ? 'To\'liq' : 'Yarim'}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {vacancy.salary && (
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{vacancy.salary}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {new Date(item.createdAt).toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  if (loading && applications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                !statusFilter && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(undefined)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  !statusFilter && styles.filterButtonTextActive,
                ]}
              >
                Barchasi
              </Text>
            </TouchableOpacity>
            {(['pending', 'reviewed', 'accepted', 'rejected'] as const).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    statusFilter === status && styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setStatusFilter(
                      statusFilter === status ? undefined : status
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      statusFilter === status && styles.filterButtonTextActive,
                    ]}
                  >
                    {getStatusText(status)}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Arizalar topilmadi</Text>
            <Text style={styles.emptySubtext}>
              Vakansiyaga topshirib ko'ring
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  vacancyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  badgeSecondary: {
    backgroundColor: '#F3E8FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

