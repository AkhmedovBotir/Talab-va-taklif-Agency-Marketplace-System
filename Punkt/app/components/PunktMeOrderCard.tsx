import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  punktOrderHasAssignedAgent,
  apiService,
  type PunktMeOrderListItem,
} from '../services/api';
import { uzMarketplaceStatus, uzPunktAcceptanceStatus } from '../utils/status-uz';

function nonEmpty(iso?: string | null): boolean {
  return typeof iso === 'string' && iso.trim().length > 0;
}

function colorForAcceptance(status: string): string {
  switch (status) {
    case 'inbox':
      return '#FF9500';
    case 'rejected':
      return '#FF3B30';
    case 'contragent_requests_created':
      return '#34C759';
    default:
      return '#8E8E93';
  }
}

export type PunktMeOrderCardVariant = 'default' | 'web';

interface PunktMeOrderCardProps {
  order: PunktMeOrderListItem;
  onPress: () => void;
  maxWidth?: number;
  /** Desktop web: keng kartochka, to‘liq holat matni, bir xil sana formati */
  variant?: PunktMeOrderCardVariant;
}

export function PunktMeOrderCard({
  order,
  onPress,
  maxWidth,
  variant = 'default',
}: PunktMeOrderCardProps) {
  const isWebCard = variant === 'web';
  const [districtName, setDistrictName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const name = await apiService.getNoauthDistrictNameById(order.routing_district_id);
      if (!cancelled) setDistrictName(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [order.routing_district_id]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const cardShadow =
    isWebCard && Platform.OS === 'web'
      ? ({
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
        } as object)
      : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : null,
        isWebCard && styles.cardWeb,
        cardShadow,
      ]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={[styles.header, isWebCard && styles.headerWeb]}>
        <Text style={[styles.orderId, isWebCard && styles.orderIdWeb]}>#{order.id}</Text>
        <View
          style={[
            styles.badge,
            isWebCard && styles.badgeWeb,
            { backgroundColor: colorForAcceptance(order.punkt_acceptance_status) + '22' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isWebCard && styles.badgeTextWeb,
              { color: colorForAcceptance(order.punkt_acceptance_status) },
            ]}
            numberOfLines={isWebCard ? 3 : 2}
          >
            {uzPunktAcceptanceStatus(String(order.punkt_acceptance_status))}
          </Text>
        </View>
      </View>

      <View style={[styles.row, isWebCard && styles.rowWeb]}>
        <Text style={[styles.label, isWebCard && styles.labelWeb]}>Marketplace</Text>
        <Text style={[styles.value, isWebCard && styles.valueWeb]}>
          {uzMarketplaceStatus(order.marketplace_status)}
        </Text>
      </View>
      <View style={[styles.row, isWebCard && styles.rowWeb]}>
        <Text style={[styles.label, isWebCard && styles.labelWeb]}>Qatorlar</Text>
        <Text style={[styles.value, isWebCard && styles.valueWeb]}>{order.items_count} ta</Text>
      </View>
      <View style={[styles.row, isWebCard && styles.rowWeb]}>
        <Text style={[styles.label, isWebCard && styles.labelWeb]}>Jami</Text>
        <Text style={[styles.value, styles.valueWeb, styles.price]}>
          {formatPrice(order.total_amount)}
        </Text>
      </View>
      <View style={[styles.row, isWebCard && styles.rowWeb]}>
        <Text style={[styles.label, isWebCard && styles.labelWeb]}>Tuman</Text>
        <Text style={[styles.value, isWebCard && styles.valueWeb]}>
          {districtName || `ID ${order.routing_district_id}`}
        </Text>
      </View>

      {(order.punkt_collected_at != null && String(order.punkt_collected_at).trim() !== '') ||
      (order.punkt_ready_at != null && String(order.punkt_ready_at).trim() !== '') ||
      punktOrderHasAssignedAgent(order) ? (
        <View style={styles.logisticsHint}>
          {order.punkt_collected_at != null && String(order.punkt_collected_at).trim() !== '' ? (
            <Text style={styles.hintOk}>Yig‘ilgan</Text>
          ) : null}
          {order.punkt_ready_at != null && String(order.punkt_ready_at).trim() !== '' ? (
            <Text style={styles.hintOk}>Tayyor</Text>
          ) : null}
          {punktOrderHasAssignedAgent(order) ? (
            <Text style={styles.hintOk} numberOfLines={variant === 'web' ? 2 : 1}>
              {order.assigned_agent?.name
                ? `${order.assigned_agent.name}`
                : `Agent`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {(nonEmpty(order.agent_declared_payment_to_punkt_at) ||
        nonEmpty(order.punkt_confirmed_agent_payment_at) ||
        nonEmpty(order.punkt_post_payment_delivered_at) ||
        nonEmpty(order.punkt_contragent_remainder_handed_over_at)) && (
        <View style={styles.paymentHint}>
          {nonEmpty(order.agent_declared_payment_to_punkt_at) ? (
            <Text style={styles.hintPayment}>To‘lov e’lon</Text>
          ) : null}
          {nonEmpty(order.punkt_confirmed_agent_payment_at) ? (
            <Text style={styles.hintPayment}>To‘lov tasdiq</Text>
          ) : null}
          {nonEmpty(order.punkt_post_payment_delivered_at) ? (
            <Text style={styles.hintPayment}>Yetkazildi</Text>
          ) : null}
          {nonEmpty(order.punkt_contragent_remainder_handed_over_at) ? (
            <Text style={styles.hintPayment}>Kontragent to‘lovi</Text>
          ) : null}
        </View>
      )}

      <Text style={[styles.date, isWebCard && styles.dateWeb]}>
        {formatDate(order.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  cardWeb: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerWeb: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flexShrink: 1,
  },
  orderIdWeb: {
    fontSize: 22,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: '72%',
    flexShrink: 1,
  },
  badgeWeb: {
    maxWidth: '100%',
    alignSelf: 'stretch',
    minHeight: 34,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  badgeTextWeb: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  rowWeb: {
    marginBottom: 10,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  labelWeb: {
    fontSize: 15,
    minWidth: 120,
  },
  value: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  valueWeb: {
    fontSize: 15,
    flex: 1,
    maxWidth: '65%',
  },
  price: {
    fontWeight: '700',
    color: '#007AFF',
  },
  date: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
  },
  dateWeb: {
    marginTop: 14,
    fontSize: 13,
    textAlign: 'left',
  },
  logisticsHint: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  hintOk: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    backgroundColor: '#E8F8EC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  paymentHint: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  hintPayment: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D9C5E',
    backgroundColor: '#E6F5EC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
