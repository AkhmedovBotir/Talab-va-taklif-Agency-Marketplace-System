import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, DeliveryNotification, DeliveryNotificationType } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { useDeliveryNotifications } from '../../contexts/DeliveryNotificationsContext';
import { useSnackbar } from '../../components/SnackbarProvider';

function typeAccent(type: DeliveryNotificationType): { bg: string; border: string; icon: React.ComponentProps<typeof Ionicons>['name'] } {
  switch (type) {
    case 'success':
      return { bg: '#ECFDF5', border: '#86EFAC', icon: 'checkmark-circle' };
    case 'warning':
      return { bg: '#FFFBEB', border: '#FCD34D', icon: 'warning' };
    case 'error':
      return { bg: '#FEF2F2', border: '#FCA5A5', icon: 'alert-circle' };
    case 'update':
      return { bg: '#EFF6FF', border: '#93C5FD', icon: 'sync-outline' };
    case 'announcement':
      return { bg: '#F5F3FF', border: '#C4B5FD', icon: 'megaphone-outline' };
    case 'info':
    default:
      return { bg: '#F8FAFC', border: '#E2E8F0', icon: 'information-circle' };
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { token } = useDeliveryProviderAuth();
  const { showSnackbar } = useSnackbar();
  const { listVersion, refreshUnreadCount, setUnreadCount } = useDeliveryNotifications();

  const [items, setItems] = useState<DeliveryNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCountList, setUnreadCountList] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const markingAllRef = useRef(false);

  const limit = 10;

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!token) return;
      try {
        const res = await apiService.getNotifications(token, nextPage, limit);
        const { items: list, total_pages, unread_count } = res.data;
        setTotalPages(total_pages || 1);
        setUnreadCountList(unread_count);
        setUnreadCount(unread_count);
        setItems((prev) => (append ? [...prev, ...list] : list));
      } catch (e: any) {
        if (!append) setItems([]);
        showSnackbar(e.message || 'Xabarlar yuklanmadi', 'error');
      }
    },
    [token, limit, showSnackbar, setUnreadCount]
  );

  const reloadFromStart = useCallback(async () => {
    setPage(1);
    await loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadPage(1, false);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadPage]);

  useEffect(() => {
    if (!token || listVersion === 0) return;
    loadPage(1, false);
  }, [listVersion, token, loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadFromStart();
    await refreshUnreadCount();
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (loadingMore || loading || page >= totalPages) return;
    const next = page + 1;
    setLoadingMore(true);
    loadPage(next, true).finally(() => {
      setPage(next);
      setLoadingMore(false);
    });
  };

  const markRead = async (n: DeliveryNotification) => {
    if (!token || n.is_read) return;
    try {
      await apiService.markNotificationRead(token, n.id);
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x
        )
      );
      setUnreadCountList((c) => Math.max(0, c - 1));
      await refreshUnreadCount();
    } catch (e: any) {
      showSnackbar(e.message || 'O\'qildi qilinmadi', 'error');
    }
  };

  const markAllRead = useCallback(async () => {
    if (!token || markingAllRef.current) return;
    markingAllRef.current = true;
    setMarkingAll(true);
    try {
      await apiService.markAllNotificationsRead(token);
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true, read_at: x.read_at || new Date().toISOString() })));
      setUnreadCountList(0);
      setUnreadCount(0);
      showSnackbar('Barcha xabarlar o\'qildi', 'success');
    } catch (e: any) {
      showSnackbar(e.message || 'Xatolik', 'error');
    } finally {
      markingAllRef.current = false;
      setMarkingAll(false);
    }
  }, [token, showSnackbar, setUnreadCount]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={markAllRead}
          disabled={markingAll || unreadCountList === 0}
          style={styles.headerBtn}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={[styles.headerBtnText, unreadCountList === 0 && styles.headerBtnDisabled]}>
              Hammasini o&apos;qish
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, markAllRead, markingAll, unreadCountList]);

  const renderItem = ({ item }: { item: DeliveryNotification }) => {
    const accent = typeAccent(item.type);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: accent.bg, borderColor: accent.border },
          !item.is_read && styles.cardUnread,
        ]}
        onPress={() => markRead(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <Ionicons name={accent.icon} size={22} color="#1E293B" style={styles.cardIcon} />
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {new Date(item.created_at).toLocaleString('uz-UZ')} · {item.target_type}
            </Text>
          </View>
          {!item.is_read && <View style={styles.dot} />}
        </View>
        <Text style={styles.cardMessage}>{item.message}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.hint}>Xabarlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCountList > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            O&apos;qilmagan: <Text style={styles.bannerBold}>{unreadCountList}</Text>
          </Text>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Xabarlar yo&apos;q</Text>
            <Text style={styles.emptySub}>Yangi xabarlar bu yerda ko&apos;rinadi</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  hint: { marginTop: 10, color: '#64748B', fontSize: 14 },
  banner: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  bannerText: { fontSize: 14, color: '#1E40AF' },
  bannerBold: { fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 28, maxWidth: 900, width: '100%', alignSelf: 'center' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardIcon: { marginRight: 10, marginTop: 2 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  cardMessage: { fontSize: 15, color: '#334155', lineHeight: 22 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginTop: 6,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  footer: { paddingVertical: 16 },
  headerBtn: { marginRight: 12, paddingVertical: 6, paddingHorizontal: 4, minWidth: 100, alignItems: 'flex-end' },
  headerBtnText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  headerBtnDisabled: { color: '#94A3B8' },
});
