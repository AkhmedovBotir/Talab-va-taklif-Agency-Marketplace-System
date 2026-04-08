import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppSnackbar, { SnackbarType } from '../components/AppSnackbar';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import {
  apiService,
  LocalShopNotification,
  LocalShopNotificationType,
} from '../services/api';

function typeAccent(type: string): { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string } {
  const t = (type || 'info').toLowerCase() as LocalShopNotificationType;
  const map: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
    info: { icon: 'information-circle', color: '#007AFF', bg: '#E3F2FD' },
    warning: { icon: 'warning', color: '#F57C00', bg: '#FFF3E0' },
    success: { icon: 'checkmark-circle', color: '#2E7D32', bg: '#E8F5E9' },
    error: { icon: 'close-circle', color: '#C62828', bg: '#FFEBEE' },
    update: { icon: 'cloud-download', color: '#6A1B9A', bg: '#F3E5F5' },
    announcement: { icon: 'megaphone', color: '#1565C0', bg: '#E3F2FD' },
  };
  return map[t] || map.info;
}

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { refreshUnreadCount } = useNotifications();

  const [items, setItems] = useState<LocalShopNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listUnread, setListUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [readAllBusy, setReadAllBusy] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!token) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await apiService.getNotifications(token, {
          page: nextPage,
          limit: 15,
        });
        const data = res.data;
        const list = data?.items ?? [];
        setListUnread(data?.unread_count ?? 0);
        setTotalPages(Math.max(1, data?.total_pages ?? 1));
        setPage(nextPage);
        if (append) {
          setItems((prev) => {
            const ids = new Set(prev.map((x) => String(x.id)));
            const merged = [...prev];
            for (const it of list) {
              if (!ids.has(String(it.id))) merged.push(it);
            }
            return merged;
          });
        } else {
          setItems(list);
        }
        await refreshUnreadCount();
      } catch (e: any) {
        showSnackbar(e?.message || 'Bildirishnomalarni yuklashda xatolik');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token, refreshUnreadCount]
  );

  useEffect(() => {
    if (token) {
      loadPage(1, false);
    }
  }, [token, loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPage(1, false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || page >= totalPages) return;
    loadPage(page + 1, true);
  }, [loadPage, loadingMore, loading, page, totalPages]);

  const markOneRead = async (n: LocalShopNotification) => {
    if (!token || n.is_read) return;
    try {
      await apiService.markNotificationRead(token, n.id);
      setItems((prev) =>
        prev.map((x) =>
          String(x.id) === String(n.id)
            ? { ...x, is_read: true, read_at: new Date().toISOString() }
            : x
        )
      );
      setListUnread((c) => Math.max(0, c - 1));
      await refreshUnreadCount();
    } catch (e: any) {
      showSnackbar(e?.message || 'O\'qilgan deb belgilashda xatolik');
    }
  };

  const onPressItem = (n: LocalShopNotification) => {
    setExpandedId((cur) => (String(cur) === String(n.id) ? null : n.id));
    void markOneRead(n);
  };

  const hasUnreadInList = items.some((x) => !x.is_read) || listUnread > 0;

  const onReadAll = async () => {
    if (!token || readAllBusy) return;
    setReadAllBusy(true);
    try {
      await apiService.markAllNotificationsRead(token);
      setItems((prev) =>
        prev.map((x) => ({ ...x, is_read: true, read_at: x.read_at || new Date().toISOString() }))
      );
      setListUnread(0);
      await refreshUnreadCount();
      showSnackbar('Barchasi o\'qilgan deb belgilandi', 'success');
    } catch (e: any) {
      showSnackbar(e?.message || 'Xatolik yuz berdi');
    } finally {
      setReadAllBusy(false);
    }
  };

  const renderItem = ({ item }: { item: LocalShopNotification }) => {
    const accent = typeAccent(item.type);
    const expanded = expandedId !== null && String(expandedId) === String(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => onPressItem(item)}
        activeOpacity={0.75}>
        <View style={[styles.typeIconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name={accent.icon} size={22} color={accent.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]} numberOfLines={expanded ? undefined : 2}>
              {item.title}
            </Text>
            {!item.is_read ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.meta}>
            {formatShortDate(item.created_at)}
            {item.target_type ? ` · ${item.target_type}` : ''}
          </Text>
          {(expanded || item.is_read) && (
            <Text style={styles.message}>{item.message}</Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#8E8E93"
        />
      </TouchableOpacity>
    );
  };

  if (!token) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Bildirishnomalar</Text>
        <TouchableOpacity
          style={[styles.readAllBtn, readAllBusy && styles.readAllDisabled]}
          onPress={onReadAll}
          disabled={readAllBusy || !hasUnreadInList}>
          <Text
            style={[
              styles.readAllText,
              (readAllBusy || !hasUnreadInList) && styles.readAllTextDisabled,
            ]}>
            Hammasini o‘qilgan
          </Text>
        </TouchableOpacity>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color="#007AFF" />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#c0c0c0" />
              <Text style={styles.emptyText}>Hozircha bildirishnoma yo‘q</Text>
            </View>
          }
        />
      )}

      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f7fa',
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  screenTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  readAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  readAllDisabled: {
    opacity: 0.45,
  },
  readAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  readAllTextDisabled: {
    color: '#8E8E93',
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 120 : 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  cardTitleUnread: {
    color: '#111',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 5,
  },
  meta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginTop: 10,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
});
