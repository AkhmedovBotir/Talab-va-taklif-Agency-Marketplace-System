import { VacancyCard } from '@/components/VacancyCard';
import { Vacancy, vacancyApi } from '@/services/vacancyApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VacanciesScreen() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<{
    target?: 'agent' | 'punkt';
    type?: 'parttime' | 'fulltime';
  }>({});
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadVacancies = useCallback(async (pageNum: number = 1, reset: boolean = false, searchText?: string) => {
    try {
      if (reset) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await vacancyApi.getVacancies({
        page: pageNum,
        limit: 20,
        search: searchText !== undefined ? (searchText || undefined) : (searchQuery || undefined),
        ...filters,
      });

      if (reset) {
        setVacancies(response.data);
      } else {
        setVacancies((prev) => [...prev, ...response.data]);
      }

      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Vakansiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters]);

  // Refresh list whenever screen gains focus (e.g., returning from detail)
  useFocusEffect(
    useCallback(() => {
      loadVacancies(1, true);
    }, [loadVacancies])
  );

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadVacancies(1, true, searchQuery);
    }, 500); // 500ms debounce delay

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    // Initial load and filter changes
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    loadVacancies(1, true);
  }, [filters]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    loadVacancies(1, true);
  }, [loadVacancies]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadVacancies(page + 1, false);
    }
  }, [page, hasMore, loadingMore, loadVacancies]);

  const handleBookmark = async (vacancyId: string) => {
    try {
      const isBookmarked = await vacancyApi.toggleBookmark(vacancyId);
      setVacancies((prev) =>
        prev.map((v) =>
          v._id === vacancyId ? { ...v, isBookmarked } : v
        )
      );
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Saqlashda xatolik');
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  if (loading && vacancies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Vakansiya qidirish..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vacancies}
        renderItem={({ item }) => (
          <VacancyCard
            vacancy={item}
            onPress={() => router.push(`/(tabs)/vacancies/${item._id}` as any)}
            onBookmark={() => handleBookmark(item._id)}
          />
        )}
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
            <Text style={styles.emptyText}>Vakansiyalar topilmadi</Text>
            <Text style={styles.emptySubtext}>
              Filtrlarni o'zgartirib ko'ring
            </Text>
          </View>
        }
      />

      {filterVisible && (
        <FilterModal
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setFilterVisible(false);
          }}
        />
      )}
    </View>
  );
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: { target?: 'agent' | 'punkt'; type?: 'parttime' | 'fulltime' };
  onApply: (filters: { target?: 'agent' | 'punkt'; type?: 'parttime' | 'fulltime' }) => void;
}

function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onApply({});
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtrlar</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Vakansiya turi</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                localFilters.target === 'agent' && styles.filterOptionActive,
              ]}
              onPress={() =>
                setLocalFilters((prev) =>
                  prev.target === 'agent' ? { ...prev, target: undefined } : { ...prev, target: 'agent' }
                )
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  localFilters.target === 'agent' && styles.filterOptionTextActive,
                ]}
              >
                Agent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                localFilters.target === 'punkt' && styles.filterOptionActive,
              ]}
              onPress={() =>
                setLocalFilters((prev) =>
                  prev.target === 'punkt' ? { ...prev, target: undefined } : { ...prev, target: 'punkt' }
                )
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  localFilters.target === 'punkt' && styles.filterOptionTextActive,
                ]}
              >
                Punkt
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Ish turi</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                localFilters.type === 'fulltime' && styles.filterOptionActive,
              ]}
              onPress={() =>
                setLocalFilters((prev) =>
                  prev.type === 'fulltime' ? { ...prev, type: undefined } : { ...prev, type: 'fulltime' }
                )
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  localFilters.type === 'fulltime' && styles.filterOptionTextActive,
                ]}
              >
                To'liq
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                localFilters.type === 'parttime' && styles.filterOptionActive,
              ]}
              onPress={() =>
                setLocalFilters((prev) =>
                  prev.type === 'parttime' ? { ...prev, type: undefined } : { ...prev, type: 'parttime' }
                )
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  localFilters.type === 'parttime' && styles.filterOptionTextActive,
                ]}
              >
                Yarim
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Tozalash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Qo'llash</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listContent: {
    padding: 16,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

