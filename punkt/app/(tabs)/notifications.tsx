import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
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
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FEATURE_NOTIFICATIONS_ENABLED } from '../config/features';
import { useAuth } from '../contexts/AuthContext';
import { apiService, PunktMeNotificationItem } from '../services/api';
import { requestNotificationInboxSync } from '../services/notificationInboxSync';
import { subscribePunktNotificationRealtime } from '../services/punktNotificationRealtime';

type NotificationVisualType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error'
  | 'announcement'
  | 'update';

const typeConfig: Record<
  NotificationVisualType,
  { icon: string; color: string; bgColor: string; label: string }
> = {
  info: { icon: 'information-circle', color: '#007AFF', bgColor: '#E3F2FD', label: "Ma'lumot" },
  warning: { icon: 'warning', color: '#FF9500', bgColor: '#FFF3E0', label: 'Ogohlantirish' },
  success: { icon: 'checkmark-circle', color: '#34C759', bgColor: '#E8F5E9', label: 'Muvaffaqiyat' },
  error: { icon: 'close-circle', color: '#FF3B30', bgColor: '#FFEBEE', label: 'Xatolik' },
  announcement: { icon: 'megaphone', color: '#5856D6', bgColor: '#EDE7F6', label: "E'lon" },
  update: { icon: 'refresh-circle', color: '#00C7BE', bgColor: '#E0F7FA', label: 'Yangilanish' },
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<PunktMeNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<PunktMeNotificationItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNotifications = useCallback(async (pageNum = 1, reset = false) => {
    if (!FEATURE_NOTIFICATIONS_ENABLED) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await apiService.getPunktMeNotifications({
        page: pageNum,
        limit: 20,
      });

      const payload = response.data;
      const items = payload?.items ?? [];

      if (reset) {
        setNotifications(items);
      } else {
        setNotifications((prev) => [...prev, ...items]);
      }

      setServerUnreadCount(payload?.unread_count ?? 0);
      const totalPages = payload?.total_pages ?? 1;
      const currentPage = payload?.page ?? pageNum;
      setHasMore(currentPage < totalPages);
      if (reset) {
        requestNotificationInboxSync();
      }
    } catch (error: unknown) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!FEATURE_NOTIFICATIONS_ENABLED) {
      setLoading(false);
      return;
    }
    void loadNotifications(1, true);
  }, [loadNotifications]);

  useEffect(() => {
    if (!FEATURE_NOTIFICATIONS_ENABLED || !token) {
      return;
    }
    const unsub = subscribePunktNotificationRealtime(token, true, {
      onNew: (n) => {
        setNotifications((prev) => {
          if (prev.some((x) => x.id === n.id)) return prev;
          return [n, ...prev];
        });
        if (!n.is_read) {
          setServerUnreadCount((c) => c + 1);
        }
        requestNotificationInboxSync();
      },
    });
    return unsub;
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    void loadNotifications(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      void loadNotifications(nextPage, false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiService.markPunktMeNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setServerUnreadCount((c) => Math.max(0, c - 1));
      requestNotificationInboxSync();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markPunktMeNotificationsReadAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setServerUnreadCount(0);
      requestNotificationInboxSync();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const openNotificationDetail = (notification: PunktMeNotificationItem) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    if (!notification.is_read) {
      void handleMarkAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    return typeConfig[type as NotificationVisualType] || typeConfig.info;
  };

  const renderNotification = ({ item }: { item: PunktMeNotificationItem }) => {
    const config = getTypeConfig(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { borderLeftColor: config.color },
          !item.is_read && { backgroundColor: config.bgColor },
        ]}
        onPress={() => openNotificationDetail(item)}
      >
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as never} size={24} color={config.color} />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={1}>
              {item.message}
            </Text>
            <View style={styles.footerRow}>
              <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
              </View>
              <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  if (!FEATURE_NOTIFICATIONS_ENABLED) {
    return (
      <>
        <Stack.Screen options={{ title: 'Xabarlar' }} />
        <View style={styles.disabledWrap}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
          <Text style={styles.disabledTitle}>Xabarlar o‘chirilgan</Text>
          <Text style={styles.disabledSubtitle}>Bu bo‘lim vaqtincha ishlamaydi.</Text>
        </View>
      </>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Xabarlar' }} />
        <LoadingSpinner />
      </>
    );
  }

  const selectedConfig = selectedNotification ? getTypeConfig(selectedNotification.type) : typeConfig.info;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Xabarlar',
          headerRight: () =>
            serverUnreadCount > 0 ? (
              <TouchableOpacity onPress={() => void handleMarkAllAsRead()} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Barchasini o'qish</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Xabarlar topilmadi</Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: selectedConfig.bgColor }]}>
              <View style={styles.modalHeaderContent}>
                <View style={[styles.modalIconContainer, { backgroundColor: selectedConfig.color + '30' }]}>
                  <Ionicons name={selectedConfig.icon as never} size={32} color={selectedConfig.color} />
                </View>
                <View style={[styles.modalTypeBadge, { backgroundColor: selectedConfig.color }]}>
                  <Text style={styles.modalTypeText}>{selectedConfig.label}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
              <Text style={styles.modalDate}>
                {selectedNotification && formatDate(selectedNotification.created_at)}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.modalMessage}>{selectedNotification?.message}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: selectedConfig.color }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Yopish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  disabledWrap: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  disabledSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#000',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationDate: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  markAllButton: {
    marginRight: 16,
  },
  markAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderContent: {
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
