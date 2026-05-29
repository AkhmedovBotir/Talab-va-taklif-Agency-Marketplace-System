import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDialog } from '../../../../components/AppDialog';
import { PageWidthLayout } from '../../../../components/PageWidthLayout';
import { useResponsive } from '../../../../hooks/useResponsive';
import { apiService, PunktLineRequest, PunktLineRequestStatus } from '../../../../services/api';
import { formatPrice } from '../../../../utils/formatNumber';
import { getStatusUz } from '../../../../utils/statusUz';

export default function OrderViewScreen() {
  const params = useLocalSearchParams<{ lineRequestId?: string }>();
  const lineRequestId = params.lineRequestId;
  const [line, setLine] = useState<PunktLineRequest | null>(null);
  const [punktName, setPunktName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [productNameFromNoAuth, setProductNameFromNoAuth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dialog, alert: showAlert, confirm: showConfirm } = useAppDialog();
  const { isWideWeb } = useResponsive();

  const idNum = lineRequestId != null && lineRequestId !== '' ? Number(lineRequestId) : NaN;

  const loadLine = useCallback(async () => {
    if (!Number.isFinite(idNum)) {
      setLoading(false);
      showAlert('Xatolik', 'ID noto\'g\'ri', () => router.back());
      return;
    }

    try {
      const data = await apiService.getPunktLineRequestById(idNum);
      setLine(data);
    } catch (error: any) {
      const msg = error.message || 'Yuklashda xatolik';
      showAlert('Xatolik', msg, () => router.back());
    } finally {
      setLoading(false);
    }
  }, [idNum, router, showAlert]);

  useEffect(() => {
    setLoading(true);
    loadLine();
  }, [loadLine]);

  useEffect(() => {
    let cancelled = false;
    const loadLookups = async () => {
      if (!line) return;
      try {
        const needPunktLookup = !line.punktName || line.punktName.trim().length === 0;
        const [punktNameResolved, districtNameResolved, noAuthProductName] = await Promise.all([
          needPunktLookup ? apiService.getNoAuthPunktNameById(line.punktId) : Promise.resolve(line.punktName),
          apiService.getNoAuthDistrictNameById(line.routingDistrictId),
          line.productId != null ? apiService.getNoAuthProductNameById(line.productId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPunktName(punktNameResolved ?? '');
        setDistrictName(districtNameResolved ?? '');
        setProductNameFromNoAuth(noAuthProductName ?? '');
      } catch {
        if (cancelled) return;
        setPunktName('');
        setDistrictName('');
      }
    };
    loadLookups();
    return () => {
      cancelled = true;
    };
  }, [line]);

  const getStatusColor = (status: PunktLineRequestStatus) => {
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

  const getStatusText = (status: PunktLineRequestStatus) => getStatusUz(status);

  type WfStep = {
    key: string;
    label: string;
    completed: boolean;
    date?: string;
    isRejected?: boolean;
  };

  const workflowSteps: WfStep[] = useMemo(() => {
    if (!line) return [];
    const s = line.status;
    if (s === 'rejected') {
      return [
        { key: 'created', label: 'Yaratildi', completed: true, date: line.createdAt },
        { key: 'rejected', label: 'Rad etildi', completed: true, date: line.updatedAt, isRejected: true },
      ];
    }
    return [
      { key: 'pending', label: 'Kutilmoqda', completed: s !== 'pending', date: line.createdAt },
      {
        key: 'accepted',
        label: 'Qabul qilindi',
        completed: s === 'accepted' || s === 'preparing' || s === 'delivered',
      },
      {
        key: 'preparing',
        label: 'Tayyorlanmoqda',
        completed: s === 'preparing' || s === 'delivered',
      },
      {
        key: 'delivered',
        label: 'Yetkazib berildi',
        completed: s === 'delivered',
        date: s === 'delivered' ? line.updatedAt : undefined,
      },
    ];
  }, [line]);

  const runAction = async (
    label: string,
    fn: () => Promise<{ message: string }>
  ) => {
    if (!line) return;
    setProcessing(true);
    try {
      const res = await fn();
      showAlert('Muvaffaqiyat', res.message || label, () => loadLine());
    } catch (error: any) {
      showAlert('Xatolik', error.message || label);
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = () => {
    if (!line) return;
    showConfirm('Tasdiqlash', 'Qabul qilasizmi?', () =>
      runAction('Qabul qilindi', () => apiService.acceptPunktLineRequest(line.id)),
      { confirmLabel: 'Qabul qilish' }
    );
  };

  const handlePreparing = () => {
    if (!line) return;
    showConfirm('Tasdiqlash', 'Tayyorlash bosqichiga o‘tkazasizmi?', () =>
      runAction('Tayyorlanmoqda', () => apiService.preparingPunktLineRequest(line.id)),
      { confirmLabel: 'Tayyorlash' }
    );
  };

  const handleDeliver = () => {
    if (!line) return;
    showConfirm('Tasdiqlash', 'Yetkazib berilganini tasdiqlaysizmi?', () =>
      runAction('Yetkazib berildi', () => apiService.deliverPunktLineRequest(line.id)),
      { confirmLabel: 'Yetkazildi' }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <PageWidthLayout flex={false} style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Qator so‘rovi</Text>
            <View style={styles.placeholder} />
          </PageWidthLayout>
        </View>
        <PageWidthLayout style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </PageWidthLayout>
        {dialog}
      </View>
    );
  }

  if (!line) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <PageWidthLayout flex={false} style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Qator so‘rovi</Text>
            <View style={styles.placeholder} />
          </PageWidthLayout>
        </View>
        <PageWidthLayout style={styles.centerContainer}>
          <Text style={styles.errorText}>So‘rov topilmadi</Text>
        </PageWidthLayout>
        {dialog}
      </View>
    );
  }

  const statusColor = getStatusColor(line.status);
  const qtyNum = Number.isFinite(line.quantity) ? line.quantity : 0;
  const unitPriceNum = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
  const lineTotal = qtyNum * unitPriceNum;
  const orderIdText = Number.isFinite(line.orderId) && line.orderId > 0 ? `#${line.orderId}` : '—';
  const punktIdText = Number.isFinite(line.punktId) && line.punktId > 0 ? `#${line.punktId}` : '—';
  const routingIdText =
    Number.isFinite(line.routingDistrictId) && line.routingDistrictId > 0
      ? `#${line.routingDistrictId}`
      : '—';
  const productNameText = (productNameFromNoAuth || line.productName || '').trim() || 'Nomsiz mahsulot';
  const qtyText = Number.isFinite(line.quantity) ? String(line.quantity) : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <PageWidthLayout flex={false} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Qator so‘rovi</Text>
          <View style={styles.placeholder} />
        </PageWidthLayout>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <PageWidthLayout flex={false} style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Umumiy</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(line.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>So‘rov ID</Text>
            <Text style={styles.infoValue}>{line.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyurtma ID</Text>
            <Text style={styles.infoValue}>{orderIdText}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyurtma holati</Text>
            <Text style={styles.infoValue}>{getStatusUz(line.orderStatus)}</Text>
          </View>
          {line.orderTotalAmount != null && Number.isFinite(line.orderTotalAmount) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buyurtma jami</Text>
              <Text style={styles.infoValue}>{formatPrice(line.orderTotalAmount)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Punkt ID</Text>
            <Text style={styles.infoValue}>
              {punktName ? `${punktName} (${punktIdText})` : punktIdText}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tuman (routing)</Text>
            <Text style={styles.infoValue}>
              {districtName
                ? `${districtName} (${routingIdText})`
                : routingIdText}
            </Text>
          </View>
          {line.assignedAgentName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agent</Text>
              <Text style={styles.infoValue}>
                {line.assignedAgentName}
                {line.assignedAgentId ? ` (#${line.assignedAgentId})` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mahsulot</Text>
            <Ionicons name="cube-outline" size={20} color="#007AFF" />
          </View>
          <View style={styles.productHeaderBox}>
            <Text style={styles.productNameMain}>{productNameText}</Text>
          </View>
          <View style={styles.productStatsRow}>
            <View style={styles.productStatItem}>
              <Text style={styles.productStatLabel}>Miqdor</Text>
              <Text style={styles.productStatValue}>
                {qtyText} {line.unit || 'dona'}
              </Text>
            </View>
            <View style={styles.productStatItem}>
              <Text style={styles.productStatLabel}>Birlik narxi</Text>
              <Text style={styles.productStatValue}>{formatPrice(unitPriceNum)}</Text>
            </View>
          </View>
          <View style={styles.productTotalBox}>
            <Text style={styles.totalLabel}>Qator jami</Text>
            <Text style={styles.totalValue}>{formatPrice(lineTotal)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ketma-ketlik</Text>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
          </View>
          <View style={styles.workflowContainer}>
            {workflowSteps.map((step, index) => {
              const isLast = index === workflowSteps.length - 1;
              const stepColor = step.isRejected
                ? '#FF3B30'
                : step.completed
                  ? '#34C759'
                  : '#FF9500';
              return (
                <View key={step.key} style={styles.workflowStep}>
                  <View style={styles.workflowStepContent}>
                    <View style={[styles.workflowIcon, { backgroundColor: `${stepColor}20` }]}>
                      {step.completed ? (
                        <Ionicons
                          name={step.isRejected ? 'close-circle' : 'checkmark-circle'}
                          size={20}
                          color={stepColor}
                        />
                      ) : (
                        <View style={[styles.workflowIconPending, { borderColor: stepColor }]} />
                      )}
                    </View>
                    <View style={styles.workflowStepInfo}>
                      <Text
                        style={[styles.workflowStepLabel, { color: step.completed ? '#333' : '#999' }]}
                      >
                        {step.label}
                      </Text>
                      {step.date ? (
                        <Text style={styles.workflowStepDate}>
                          {new Date(step.date).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.workflowLine,
                        { backgroundColor: step.completed ? '#34C759' : '#E0E0E0' },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {line.status === 'pending' && (
          <View style={[styles.actionsContainer, isWideWeb && styles.actionsWide]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Qabul qilish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {line.status === 'accepted' && (
          <View style={[styles.actionsContainer, isWideWeb && styles.actionsWide]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={handlePreparing}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="construct-outline" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Tayyorlash</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {line.status === 'preparing' && (
          <View style={[styles.actionsContainer, isWideWeb && styles.actionsWide]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={handleDeliver}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Yetkazib berildi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        </PageWidthLayout>
      </ScrollView>
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'web' ? 40 : 32,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  wrap: {
    flexShrink: 1,
  },
  productHeaderBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#E6EEF9',
    marginBottom: 12,
  },
  productNameMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: 22,
  },
  productStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  productStatItem: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  productStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  productStatValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  productTotalBox: {
    borderTopWidth: 1,
    borderTopColor: '#E7E7EA',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  workflowContainer: {
    gap: 0,
  },
  workflowStep: {
    position: 'relative',
  },
  workflowStepContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  workflowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowIconPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  workflowStepInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  workflowStepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  workflowStepDate: {
    fontSize: 12,
    color: '#999',
  },
  workflowLine: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginTop: -4,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionsWide: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {}),
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  deliverButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
