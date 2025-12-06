// Notifications Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'promotion' | 'update';
  targetType: string;
  createdAt: string;
  isRead: boolean;
}

const TYPE_CONFIG = {
  info: { icon: 'information-circle', color: '#007AFF', bg: '#E3F2FD' },
  warning: { icon: 'warning', color: '#FF9500', bg: '#FFF3E0' },
  success: { icon: 'checkmark-circle', color: '#34C759', bg: '#E8F5E9' },
  error: { icon: 'close-circle', color: '#FF3B30', bg: '#FFEBEE' },
  announcement: { icon: 'megaphone', color: '#5856D6', bg: '#EDE7F6' },
  promotion: { icon: 'gift', color: '#FF2D55', bg: '#FCE4EC' },
  update: { icon: 'refresh-circle', color: '#00BCD4', bg: '#E0F7FA' },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await apiService.getNotifications({ page: pageNum, limit: 20 });
      
      if (response.success) {
        if (pageNum === 1) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.log('Notifications load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = () => {
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
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
      } catch (error) {
        console.log('Mark read error:', error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.log('Mark all read error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hozirgina';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity style={styles.openButton}>
              <Text style={[styles.openButtonText, { color: config.color }]}>Ochish</Text>
              <Ionicons name="chevron-forward" size={14} color={config.color} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Habarlar yo'q</Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Barchasini o'qilgan deb belgilash</Text>
        </TouchableOpacity>
      )}

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator style={styles.footerLoader} color="#007AFF" />
            ) : null
          }
        />
      )}

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
                    { backgroundColor: TYPE_CONFIG[selectedNotification.type]?.bg || TYPE_CONFIG.info.bg }
                  ]}>
                    <Ionicons
                      name={(TYPE_CONFIG[selectedNotification.type]?.icon || 'information-circle') as any}
                      size={32}
                      color={TYPE_CONFIG[selectedNotification.type]?.color || '#007AFF'}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.modalTime}>{formatDate(selectedNotification.createdAt)}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: TYPE_CONFIG[selectedNotification.type]?.bg || TYPE_CONFIG.info.bg }
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    { color: TYPE_CONFIG[selectedNotification.type]?.color || '#007AFF' }
                  ]}>
                    {selectedNotification.type.toUpperCase()}
                  </Text>
                </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  markAllButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  markAllText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalTime: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});






