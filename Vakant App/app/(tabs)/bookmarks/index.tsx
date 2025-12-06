import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VacancyCard } from '@/components/VacancyCard';
import { vacancyApi, Vacancy } from '@/services/vacancyApi';

export default function BookmarksScreen() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadBookmarks = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await vacancyApi.getBookmarks({
        page: pageNum,
        limit: 20,
      });

      if (reset) {
        setVacancies(response.data);
      } else {
        setVacancies((prev) => [...prev, ...response.data]);
      }

      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Saqlangan vakansiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks(1, true);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadBookmarks(1, true);
  }, [loadBookmarks]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadBookmarks(page + 1, false);
    }
  }, [page, hasMore, loadingMore, loadBookmarks]);

  const handleBookmark = async (vacancyId: string) => {
    try {
      const isBookmarked = await vacancyApi.toggleBookmark(vacancyId);
      if (!isBookmarked) {
        // Remove from list if unbookmarked
        setVacancies((prev) => prev.filter((v) => v._id !== vacancyId));
      } else {
        // Update bookmark status
        setVacancies((prev) =>
          prev.map((v) =>
            v._id === vacancyId ? { ...v, isBookmarked } : v
          )
        );
      }
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Saqlanganlar</Text>
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyText}>Saqlangan vakansiyalar yo'q</Text>
            <Text style={styles.emptySubtext}>
              Vakansiyalarni saqlab oling
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
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    paddingVertical: 80,
  },
  emptyIconContainer: {
    marginBottom: 16,
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

