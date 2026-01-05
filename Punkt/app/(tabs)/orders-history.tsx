import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { OrderCard } from '../components/OrderCard';
import { apiService, Order } from '../services/api';

export default function OrdersHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const router = useRouter();

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('uz-UZ');
  };

  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await apiService.getOrdersHistory(params);

      if (reset) {
        setOrders(response.data);
      } else {
        setOrders((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      console.error('Error loading orders history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders(1, true);
    setPage(1);
  }, [filters]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1, true);
  };

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
      startDate: '',
      endDate: '',
    });
    setStartDate(null);
    setEndDate(null);
    setFilterModalVisible(false);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setFilters({ ...filters, startDate: formatDate(selectedDate) });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setFilters({ ...filters, endDate: formatDate(selectedDate) });
    }
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  if (loading && orders.length === 0) {
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
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                {startDate ? formatDisplayDate(startDate) : 'Boshlanish'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                {endDate ? formatDisplayDate(endDate) : 'Tugash'}
              </Text>
            </TouchableOpacity>
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

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
            />
          )}
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
              <Text style={styles.emptyText}>Tarixda buyurtmalar topilmadi</Text>
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

                <Text style={styles.dateLabel}>Boshlanish sanasi</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.datePickerText}>
                    {startDate ? formatDisplayDate(startDate) : 'Sanani tanlang'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.dateLabel}>Tugash sanasi</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.datePickerText}>
                    {endDate ? formatDisplayDate(endDate) : 'Sanani tanlang'}
                  </Text>
                </TouchableOpacity>
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
    </>
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
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFF',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
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
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F9F9F9',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
});

