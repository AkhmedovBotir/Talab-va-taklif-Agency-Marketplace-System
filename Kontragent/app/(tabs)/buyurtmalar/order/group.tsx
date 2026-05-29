import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDialog } from '../../../../components/AppDialog';
import { PageWidthLayout } from '../../../../components/PageWidthLayout';
import { apiService, PunktLineRequest } from '../../../../services/api';
import { formatNumberDisplay } from '../../../../utils/formatNumber';
import { dominantLineStatus, sumGroupLines } from '../../../../utils/orderLineGroups';
import { getStatusUz } from '../../../../utils/statusUz';

export default function OrderGroupScreen() {
  const { orderId: orderIdParam, lineIds: lineIdsParam } = useLocalSearchParams<{
    orderId?: string;
    lineIds?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dialog, alert: showAlert } = useAppDialog();
  const [lines, setLines] = useState<PunktLineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [punktName, setPunktName] = useState<string>('');
  const [productNameByProductId, setProductNameByProductId] = useState<Record<number, string>>({});

  const orderId = orderIdParam != null ? Number(orderIdParam) : NaN;

  const load = useCallback(async () => {
    const idList =
      lineIdsParam != null && lineIdsParam.length > 0
        ? lineIdsParam.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
        : [];
    if (!Number.isFinite(orderId) || idList.length === 0) {
      setLoading(false);
      showAlert('Xatolik', 'Ma’lumot to‘liq emas', () => router.back());
      return;
    }
    try {
      const rows = await Promise.all(idList.map((id) => apiService.getPunktLineRequestById(id)));
      rows.sort((a, b) => a.id - b.id);
      setLines(rows);
    } catch (e: any) {
      showAlert('Xatolik', e.message || 'Yuklashda xatolik', () => router.back());
    } finally {
      setLoading(false);
    }
  }, [orderId, lineIdsParam, router, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const loadPunkt = async () => {
      const pid = lines[0]?.punktId;
      if (!pid) return;
      if (lines[0]?.punktName && lines[0].punktName!.trim().length > 0) {
        setPunktName(lines[0].punktName!);
        return;
      }
      try {
        let pageNum = 1;
        let found = '';
        while (!found && pageNum <= 30) {
          const res = await apiService.getNoAuthPunkts({ page: pageNum, limit: 100 });
          const row = res.items.find((p) => p.id === pid);
          if (row?.name) found = row.name;
          if (pageNum >= res.totalPages || res.items.length === 0) break;
          pageNum += 1;
        }
        if (!cancelled) setPunktName(found);
      } catch {
        if (!cancelled) setPunktName('');
      }
    };
    loadPunkt();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    const loadProductNames = async () => {
      const ids = Array.from(
        new Set(lines.map((l) => l.productId).filter((id): id is number => Number.isFinite(id as number)))
      );
      if (ids.length === 0) return;
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const n = await apiService.getNoAuthProductNameById(id);
          return [id, n] as const;
        })
      );
      if (cancelled) return;
      const map: Record<number, string> = {};
      for (const [id, n] of pairs) {
        if (n) map[id] = n;
      }
      setProductNameByProductId(map);
    };
    loadProductNames();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'preparing':
        return '#5856D6';
      case 'delivered':
        return '#007AFF';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => getStatusUz(status);

  const openLine = (id: number) => {
    router.push({
      pathname: '/buyurtmalar/order/view' as any,
      params: { lineRequestId: String(id) },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <PageWidthLayout flex={false} style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buyurtma</Text>
            <View style={{ width: 32 }} />
          </PageWidthLayout>
        </View>
        <PageWidthLayout style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </PageWidthLayout>
        {dialog}
      </View>
    );
  }

  const dom = dominantLineStatus(lines);
  const domColor = getStatusColor(dom);
  const total = sumGroupLines(lines);
  const punktId = lines[0]?.punktId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <PageWidthLayout flex={false} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtma #{orderId}</Text>
          <View style={{ width: 32 }} />
        </PageWidthLayout>
      </View>

      <PageWidthLayout flex={false} style={styles.summary}>
        <View style={[styles.summaryBadge, { backgroundColor: `${domColor}18` }]}>
          <Text style={[styles.summaryBadgeText, { color: domColor }]}>{getStatusText(dom)}</Text>
        </View>
        <Text style={styles.summarySub}>
          {lines.length} ta qator
          {punktId != null ? ` • ${punktName || `Punkt ID: ${punktId}`}` : ''}
        </Text>
        {total > 0 && (
          <Text style={styles.summaryTotal}>Jami: {formatNumberDisplay(total)} so'm</Text>
        )}
      </PageWidthLayout>

      <PageWidthLayout style={styles.listFlex}>
        <FlatList
          data={lines}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, Platform.OS === 'web' && styles.listWeb]}
          renderItem={({ item }) => {
            const c = getStatusColor(item.status);
            const lt = item.unitPrice * item.quantity;
            return (
              <TouchableOpacity
                style={[styles.row, { borderLeftColor: c }]}
                onPress={() => openLine(item.id)}
                activeOpacity={0.7}
              >
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {(item.productId != null ? productNameByProductId[item.productId] : undefined) ||
                    item.productName}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.quantity} {item.unit} · {formatNumberDisplay(lt)} so'm
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: `${c}18` }]}>
                <Text style={[styles.pillText, { color: c }]}>{getStatusText(item.status)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          );
        }}
        />
      </PageWidthLayout>
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  listFlex: {
    flex: 1,
    paddingHorizontal: 0,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summary: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    gap: 8,
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summarySub: {
    fontSize: 14,
    color: '#666',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  list: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  listWeb: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  rowMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 100,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
