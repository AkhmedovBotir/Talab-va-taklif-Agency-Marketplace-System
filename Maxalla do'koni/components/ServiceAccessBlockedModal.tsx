import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ServiceAccessData } from '../services/api';
import {
  billingTypeLabel,
  formatFreeMonthsUz,
  formatServiceDateTime,
} from '../utils/formatServiceDate';

interface ServiceAccessBlockedModalProps {
  visible: boolean;
  access: ServiceAccessData | null;
  checking: boolean;
  onRefresh: () => void;
}

export default function ServiceAccessBlockedModal({
  visible,
  access,
  checking,
  onRefresh,
}: ServiceAccessBlockedModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const message =
    access?.message ||
    'Xizmat muddati tugagan. Davom etish uchun admin bilan bog\'laning.';

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        /* Yopilmaydi */
      }}>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={48} color="#FF3B30" />
        </View>

        <Text style={styles.title}>Xizmat mavjud emas</Text>
        <Text style={styles.message}>{message}</Text>

        {access?.period_start_at ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Boshlangan</Text>
            <Text style={styles.detailValue}>{formatServiceDateTime(access.period_start_at)}</Text>
          </View>
        ) : null}

        {access?.period_end_at ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tugagan</Text>
            <Text style={styles.detailValue}>{formatServiceDateTime(access.period_end_at)}</Text>
          </View>
        ) : null}

        {access?.billing_type ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarif</Text>
            <Text style={styles.detailValue}>
              {billingTypeLabel(access.billing_type)}
              {access.billing_type === 'free' && access.free_months
                ? ` (${formatFreeMonthsUz(access.free_months)})`
                : ''}
            </Text>
          </View>
        ) : null}

        <Text style={styles.hint}>
          Admin xizmat muddatini uzaytirgach, quyidagi tugma orqali holatni tekshiring.
        </Text>

        <TouchableOpacity
          style={[styles.refreshButton, checking && styles.refreshButtonDisabled]}
          onPress={onRefresh}
          disabled={checking}
          activeOpacity={0.85}>
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" style={styles.refreshIcon} />
              <Text style={styles.refreshText}>Holatni tekshirish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  hint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 28,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minWidth: 240,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
