import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api, { Notification, NotificationType } from '../services/api';

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string; bgColor: string; lightBg: string }> = {
  info: { icon: 'information-circle', color: '#3B82F6', bgColor: '#3B82F6', lightBg: '#EFF6FF' },
  warning: { icon: 'warning', color: '#F59E0B', bgColor: '#F59E0B', lightBg: '#FFFBEB' },
  success: { icon: 'checkmark-circle', color: '#10B981', bgColor: '#10B981', lightBg: '#ECFDF5' },
  error: { icon: 'close-circle', color: '#EF4444', bgColor: '#EF4444', lightBg: '#FEF2F2' },
  announcement: { icon: 'megaphone', color: '#8B5CF6', bgColor: '#8B5CF6', lightBg: '#F5F3FF' },
  promotion: { icon: 'pricetag', color: '#EC4899', bgColor: '#EC4899', lightBg: '#FDF2F8' },
  update: { icon: 'refresh-circle', color: '#06B6D4', bgColor: '#06B6D4', lightBg: '#ECFEFF' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { decrementUnreadCount, resetUnreadCount, refreshUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (!token) return;
    
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await api.getNotifications({ page: pageNum, limit: 20 }, token);
      
      if (response.success) {
        if (refresh || pageNum === 1) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.page < response.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    fetchNotifications(1, true);
    refreshUnreadCount();
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);

    if (!notification.isRead && token) {
      try {
        await api.markNotificationAsRead(notification._id, token);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        decrementUnreadCount();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await api.markAllNotificationsAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      resetUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = NOTIFICATION_CONFIG[item.type] || NOTIFICATION_CONFIG.info;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: item.isRead ? '#fff' : config.lightBg },
          !item.isRead && { borderLeftWidth: 4, borderLeftColor: config.color }
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
          </View>
          <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity style={styles.openButton} onPress={() => handleNotificationPress(item)}>
              <Text style={[styles.openButtonText, { color: config.color }]}>Ochish</Text>
              <Ionicons name="chevron-forward" size={14} color={config.color} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    if (!selectedNotification) return null;
    const config = NOTIFICATION_CONFIG[selectedNotification.type] || NOTIFICATION_CONFIG.info;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: config.lightBg }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon as any} size={32} color="#fff" />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
              <Text style={styles.modalTime}>{formatDate(selectedNotification.createdAt)}</Text>
              <View style={[styles.typeBadge, { backgroundColor: config.lightBg }]}>
                <Text style={[styles.typeBadgeText, { color: config.color }]}>
                  {selectedNotification.type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: config.bgColor }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirishnomalar</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Barchasini o'qish</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>Bildirishnomalar yo'q</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#007AFF']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && !refreshing ? (
              <ActivityIndicator style={styles.footerLoader} size="small" color="#007AFF" />
            ) : null
          }
        />
      )}

      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1F2937' },
  markAllButton: { padding: 8 },
  markAllText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 16 },
  listContainer: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937' },
  unreadTitle: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  message: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: '#9CA3AF' },
  openButton: { flexDirection: 'row', alignItems: 'center' },
  openButtonText: { fontSize: 13, fontWeight: '600', marginRight: 2 },
  footerLoader: { paddingVertical: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalBody: { padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  modalTime: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  modalMessage: { fontSize: 16, color: '#4B5563', lineHeight: 24, textAlign: 'center' },
  modalCloseButton: {
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

