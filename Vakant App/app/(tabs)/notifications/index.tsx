import { useNotifications } from '@/contexts/NotificationContext';
import { notificationApi, VacancyNotification } from '@/services/notificationApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export const options = {
  headerShown: false,
  tabBarStyle: { display: 'none' },
};

const PAGE_LIMIT = 20;

export default function NotificationsScreen() {
  const { unreadCount, decrementUnread, resetUnread, refreshUnreadCount } =
    useNotifications();
  const [notifications, setNotifications] = useState<VacancyNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<VacancyNotification | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    loadNotifications(1, true);
  }, []);

  const loadNotifications = useCallback(
    async (targetPage = 1, replace = false) => {
      try {
        if (targetPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await notificationApi.getNotifications({
          page: targetPage,
          limit: PAGE_LIMIT,
        });

        setNotifications((prev) =>
          replace ? response.data : [...prev, ...response.data]
        );
        setPage(response.pagination.page);
        setTotalPages(response.pagination.pages);
        setError(null);
        refreshUnreadCount();
      } catch (err: any) {
        setError(err.message || 'Notificationlarni yuklashda xatolik');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [refreshUnreadCount]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1, true);
  }, [loadNotifications]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    loadNotifications(page + 1, false);
  };

  const handleMarkAsRead = async (item: VacancyNotification) => {
    if (item.isRead) return;

    try {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === item._id ? { ...notif, isRead: true } : notif
        )
      );
      decrementUnread(1);
      await notificationApi.markAsRead(item._id);
      refreshUnreadCount();
    } catch (err) {
      setError('Notificationni o‘qilgan deb belgilashda xatolik');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } catch (err) {
      setError('Barcha notificationlarni o‘qilgan deb belgilashda xatolik');
    }
  };

  const openDetail = async (item: VacancyNotification) => {
    setSelectedNotification(item);
    setDetailVisible(true);
    await handleMarkAsRead(item);
  };

  const renderItem = ({ item }: { item: VacancyNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => openDetail(item)}
      activeOpacity={0.9}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconCircle, getTypeStyle(item.type)]}>
          <Ionicons
            name={getTypeIcon(item.type)}
            size={18}
            color={getTypeIconColor(item.type)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.typeBadge, getTypeStyle(item.type)]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bildirishnomalar</Text>
      {unreadCount > 0 ? (
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAll}>
          <Text style={styles.markAllText}>Hammasi o‘qildi</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 110 }} />
      )}
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ListHeader />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContent : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Bildirishnomalar yo‘q</Text>
            <Text style={styles.emptySubtitle}>
              Yangi xabarlar kelganida bu yerda ko‘rasiz
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 12 }} color="#2563EB" />
          ) : null
        }
      />

      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconCircle, getTypeStyle(selectedNotification?.type || 'info')]}>
                <Ionicons
                  name={getTypeIcon(selectedNotification?.type || 'info')}
                  size={20}
                  color={getTypeIconColor(selectedNotification?.type || 'info')}
                />
              </View>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedNotification?.title}
              </Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDate}>
              {selectedNotification ? formatDate(selectedNotification.createdAt) : ''}
            </Text>

            <View style={[styles.typeBadge, getTypeStyle(selectedNotification?.type || 'info'), { alignSelf: 'flex-start', marginTop: 8 }]}>
              <Text style={styles.typeText}>{selectedNotification?.type}</Text>
            </View>

            <Text style={styles.modalMessage}>{selectedNotification?.message}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setDetailVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Yopish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return date;
  }
}

function getTypeStyle(type: VacancyNotification['type']) {
  switch (type) {
    case 'success':
      return { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' };
    case 'warning':
      return { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' };
    case 'error':
      return { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' };
    case 'announcement':
      return { backgroundColor: 'rgba(79, 70, 229, 0.12)', borderColor: '#4F46E5' };
    case 'promotion':
      return { backgroundColor: 'rgba(6, 182, 212, 0.12)', borderColor: '#06B6D4' };
    case 'update':
      return { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: '#3B82F6' };
    default:
      return { backgroundColor: 'rgba(37, 99, 235, 0.08)', borderColor: '#2563EB' };
  }
}

function getTypeIcon(type: VacancyNotification['type']) {
  switch (type) {
    case 'success':
      return 'checkmark-done-outline';
    case 'warning':
      return 'alert-circle-outline';
    case 'error':
      return 'close-circle-outline';
    case 'announcement':
      return 'megaphone-outline';
    case 'promotion':
      return 'gift-outline';
    case 'update':
      return 'refresh-outline';
    default:
      return 'information-circle-outline';
  }
}

function getTypeIconColor(type: VacancyNotification['type']) {
  switch (type) {
    case 'success':
      return '#10B981';
    case 'warning':
      return '#F59E0B';
    case 'error':
      return '#EF4444';
    case 'announcement':
      return '#4F46E5';
    case 'promotion':
      return '#06B6D4';
    case 'update':
      return '#2563EB';
    default:
      return '#2563EB';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalDate: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  modalMessage: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 15,
  },
});

