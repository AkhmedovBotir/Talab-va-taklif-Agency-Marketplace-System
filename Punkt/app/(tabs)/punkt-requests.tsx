import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useDialog } from '../contexts/DialogContext';
import {
  apiService,
  PunktTransfer,
  PunktTransferStatus,
} from '../services/api';
import { uzTransferStatus } from '../utils/status-uz';

type TransferScope = 'incoming' | 'outgoing';

const INCOMING_STATUS_OPTIONS: Array<PunktTransferStatus | ''> = [
  '',
  'sent',
  'accepted_by_target',
];

const OUTGOING_STATUS_OPTIONS: Array<PunktTransferStatus | ''> = [
  '',
  'sent',
  'accepted_by_target',
  'returned_to_source',
  'received_by_source',
];

function statusLabel(status: PunktTransferStatus): string {
  return uzTransferStatus(status);
}

function shortStatusLabel(status: PunktTransferStatus): string {
  switch (status) {
    case 'sent':
      return 'Yuborildi';
    case 'accepted_by_target':
      return 'Qabul qilindi';
    case 'returned_to_source':
      return 'Qaytarildi';
    case 'received_by_source':
      return 'Yakunlandi';
    default:
      return status;
  }
}

export default function PunktRequestsScreen() {
  const [items, setItems] = useState<PunktTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<TransferScope>('incoming');
  const [statusFilter, setStatusFilter] = useState<PunktTransferStatus | ''>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const router = useRouter();
  const { showConfirm, showAlert } = useDialog();

  const loadTransfers = useCallback(async () => {
    try {
      const res =
        scope === 'incoming'
          ? await apiService.getPunktTransfersIncoming({ page: 1, limit: 100 })
          : await apiService.getPunktTransfersOutgoing({ page: 1, limit: 100 });
      setItems(res.data.items || []);
    } catch (error) {
      console.error('Transferlar yuklanmadi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((x) => x.status === statusFilter);
  }, [items, statusFilter]);
  const statusOptions = scope === 'incoming' ? INCOMING_STATUS_OPTIONS : OUTGOING_STATUS_OPTIONS;

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransfers();
  };

  const doAction = async (
    transfer: PunktTransfer,
    action: 'accept' | 'return' | 'confirm'
  ) => {
    const actionText =
      action === 'accept' ? 'Qabul qilish' : action === 'return' ? 'Qaytarish' : 'Qabulni tasdiqlash';
    const ok = await showConfirm({
      title: actionText,
      message: `Transfer #${transfer.id} uchun "${actionText}" amalini bajarishni tasdiqlaysizmi?`,
      cancelText: 'Bekor',
      confirmText: actionText,
      destructive: action === 'return',
    });
    if (!ok) return;

    setActionLoading(transfer.id);
    try {
      if (action === 'accept') {
        await apiService.acceptPunktTransfer(transfer.id);
      } else if (action === 'return') {
        await apiService.returnPunktTransfer(transfer.id);
      } else {
        await apiService.confirmPunktTransferReceived(transfer.id);
      }
      await loadTransfers();
      await showAlert({ title: 'Muvaffaqiyatli', message: 'Amal bajarildi' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Amalni bajarishda xatolik';
      await showAlert({ title: 'Xatolik', message: msg || 'Amalni bajarishda xatolik' });
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (item: PunktTransfer) => {
    const busy = actionLoading === item.id;
    if (scope === 'incoming') {
      if (item.status === 'sent') {
        return (
          <View style={styles.actionsContainer}>
            <Button
              title="Qabul qilish"
              onPress={() => doAction(item, 'accept')}
              variant="primary"
              style={styles.actionButton}
              disabled={busy}
            />
            <Button
              title="Qaytarish"
              onPress={() => doAction(item, 'return')}
              variant="outline"
              style={styles.actionButton}
              disabled={busy}
            />
          </View>
        );
      }
      return null;
    }
    if (scope === 'outgoing' && item.status === 'returned_to_source') {
      return (
        <View style={styles.actionsContainer}>
          <Button
            title="Qabul qildim (yakun)"
            onPress={() => doAction(item, 'confirm')}
            variant="primary"
            style={styles.actionButton}
            disabled={busy}
          />
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }: { item: PunktTransfer }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        onPress={() => router.push(`/order/${item.order_id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderText}>Buyurtma #{item.order_id}</Text>
          <Text style={styles.transferId}>Transfer #{item.id}</Text>
        </View>
        <Text style={styles.rowText}>
          Source punkt ID: {item.source_punkt_id} · Target punkt ID: {item.target_punkt_id}
        </Text>
        <Text style={styles.rowText}>
          Qatorlar: {item.order_item_ids?.length ? item.order_item_ids.join(', ') : 'Barchasi'}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
        </View>
      </TouchableOpacity>
      {renderActions(item)}
    </View>
  );

  if (loading && items.length === 0) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.scopeRow}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'incoming' && styles.scopeBtnActive]}
            onPress={() => setScope('incoming')}
          >
            <Text style={[styles.scopeBtnText, scope === 'incoming' && styles.scopeBtnTextActive]}>
              Kiruvchi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'outgoing' && styles.scopeBtnActive]}
            onPress={() => setScope('outgoing')}
          >
            <Text style={[styles.scopeBtnText, scope === 'outgoing' && styles.scopeBtnTextActive]}>
              Chiquvchi
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.filterCaption}>Holat filtri</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status || 'all'}
              style={[styles.filterButton, statusFilter === status && styles.filterButtonActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterButtonText, statusFilter === status && styles.filterButtonTextActive]}>
                {status ? shortStatusLabel(status) : 'Barchasi'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Transferlar topilmadi</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 6,
  },
  filterCaption: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  scopeBtnActive: {
    backgroundColor: '#007AFF',
  },
  scopeBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  scopeBtnTextActive: {
    color: '#FFF',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingTop: 12,
  },
  cardHeader: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  transferId: {
    fontSize: 13,
    color: '#777',
    fontWeight: '600',
  },
  rowText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
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
});
