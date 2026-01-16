import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { KpiBalanceCard } from '../components/KpiBalanceCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { OrderCard } from '../components/OrderCard';
import { apiService, Order } from '../services/api';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [kpiRefreshTrigger, setKpiRefreshTrigger] = useState(0);
  const router = useRouter();

  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.search) params.search = filters.search;

      const response = await apiService.getTodayOrders(params);

      if (reset) {
        setOrders(response.data);
      } else {
        setOrders((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders(1, true);
    setPage(1);
  }, [filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setKpiRefreshTrigger(prev => prev + 1);
    await loadOrders(1, true);
  };

  useFocusEffect(
    useCallback(() => {
      setKpiRefreshTrigger(prev => prev + 1);
    }, [])
  );

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, false);
    }
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    setPage(1);
    loadOrders(1, true);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentStatus: '',
      paymentMethod: '',
      search: '',
    });
    setFilterModalVisible(false);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (loading && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <KpiBalanceCard 
          onPress={() => router.push('/kpi')} 
          refreshTrigger={kpiRefreshTrigger}
        />
        <View style={styles.headerRow}>
          <Input
            placeholder="Qidirish (buyurtma raqami, telefon)"
            value={filters.search}
            onChangeText={(text) => setFilters({ ...filters, search: text })}
            containerStyle={styles.searchInput}
            style={styles.searchInputField}
          />
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="filter"
              size={24}
              color={hasActiveFilters ? '#007AFF' : '#666'}
            />
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/order/${item._id}`)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
          </View>
        }
      />

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrlash</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Holat"
                value={filters.status}
                onChangeText={(text) => setFilters({ ...filters, status: text })}
                placeholder="pending, processing, shipped, delivered, cancelled"
              />

              <Input
                label="To'lov holati"
                value={filters.paymentStatus}
                onChangeText={(text) => setFilters({ ...filters, paymentStatus: text })}
                placeholder="pending, paid, failed, refunded"
              />

              <Input
                label="To'lov usuli"
                value={filters.paymentMethod}
                onChangeText={(text) => setFilters({ ...filters, paymentMethod: text })}
                placeholder="cash, card"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Tozalash"
                onPress={clearFilters}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Qo'llash"
                onPress={applyFilters}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchInputField: {
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    flex: 1,
  },
});



