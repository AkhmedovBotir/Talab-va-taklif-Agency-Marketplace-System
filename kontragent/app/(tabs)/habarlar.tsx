import { Ionicons } from '@expo/vector-icons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, Notification } from '../../services/api';
import { subscribeContragentNotificationInbox } from '../../services/contragentNotificationEvents';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  info: { icon: 'information-circle', color: '#007AFF', bgColor: '#E3F2FD', label: 'Ma\'lumot' },
  warning: { icon: 'warning', color: '#FF9500', bgColor: '#FFF3E0', label: 'Ogohlantirish' },
  success: { icon: 'checkmark-circle', color: '#34C759', bgColor: '#E8F5E9', label: 'Muvaffaqiyat' },
  error: { icon: 'close-circle', color: '#FF3B30', bgColor: '#FFEBEE', label: 'Xatolik' },
  announcement: { icon: 'megaphone', color: '#5856D6', bgColor: '#EDE7F6', label: 'E\'lon' },
  promotion: { icon: 'gift', color: '#FF2D55', bgColor: '#FCE4EC', label: 'Aksiya' },
  update: { icon: 'refresh-circle', color: '#00C7BE', bgColor: '#E0F7FA', label: 'Yangilanish' },
};

export default function HabarlarScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      const response = await apiService.getNotifications({ page: pageNum, limit: 20 });
      if (response.success) {
        if (refresh || pageNum === 1) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setHasMore(pageNum < response.pagination.pages);
        setPage(pageNum);
        setServerUnreadCount(response.unreadCount);
      }
    } catch (error) {
      // Ignore notification fetching errors
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    return subscribeContragentNotificationInbox(() => {
      void fetchNotifications(1, true);
    });
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    
    if (!notification.isRead) {
      try {
        await apiService.markNotificationRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setServerUnreadCount(c => Math.max(0, c - 1));
      } catch (error) {
        // Ignore marking notification read errors
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setServerUnreadCount(0);
    } catch (error) {
      // Ignore marking all read errors
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

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
          </View>
          <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
          <View style={styles.footerRow}>
            <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Habarlar yo'q</Text>
      <Text style={styles.emptySubtitle}>Yangi habarlar bu yerda ko'rinadi</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {serverUnreadCount > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.unreadText}>Yangi {serverUnreadCount} ta habar</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Barchasini o'qilgan deb belgilash</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item._id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.modalIconContainer,
                    { backgroundColor: TYPE_CONFIG[selectedNotification.type]?.bgColor || TYPE_CONFIG.info.bgColor }
                  ]}>
                    <Ionicons
                      name={(TYPE_CONFIG[selectedNotification.type]?.icon || TYPE_CONFIG.info.icon) as any}
                      size={32}
                      color={TYPE_CONFIG[selectedNotification.type]?.color || TYPE_CONFIG.info.color}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={[
                  styles.modalTypeBadge,
                  { backgroundColor: TYPE_CONFIG[selectedNotification.type]?.bgColor || TYPE_CONFIG.info.bgColor }
                ]}>
                  <Text style={[
                    styles.modalTypeText,
                    { color: TYPE_CONFIG[selectedNotification.type]?.color || TYPE_CONFIG.info.color }
                  ]}>
                    {TYPE_CONFIG[selectedNotification.type]?.label || TYPE_CONFIG.info.label}
                  </Text>
                </View>
                
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedNotification.createdAt)}</Text>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: TYPE_CONFIG[selectedNotification.type]?.color || TYPE_CONFIG.info.color }
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Yopish</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  markAllText: {
    fontSize: 13,
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
