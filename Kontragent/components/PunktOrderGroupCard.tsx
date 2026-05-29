import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PunktLineRequest } from '../services/api';
import { formatNumberDisplay } from '../utils/formatNumber';
import {
  OrderLineGroup,
  dominantLineStatus,
  sumGroupLines,
} from '../utils/orderLineGroups';

type Props = {
  group: OrderLineGroup;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onOpenLine: (line: PunktLineRequest) => void;
  onOpenGroup: (group: OrderLineGroup) => void;
  punktNameById?: Record<number, string>;
  productNameByProductId?: Record<number, string>;
  /** Asosiy ro‘yxat — kattaroq kartochka; tarix — ixcham */
  compact?: boolean;
};

function lineTotal(l: PunktLineRequest) {
  return l.unitPrice * l.quantity;
}

export function PunktOrderGroupCard({
  group,
  getStatusColor,
  getStatusText,
  onOpenLine,
  onOpenGroup,
  punktNameById,
  productNameByProductId,
  compact = false,
}: Props) {
  const { lines, orderId } = group;
  const multi = lines.length > 1;
  const dom = dominantLineStatus(lines);
  const domColor = getStatusColor(dom);
  const total = sumGroupLines(lines);
  const punktId = lines[0]?.punktId ?? '—';
  const punktNameFromLine = lines[0]?.punktName;
  const punktName =
    punktNameFromLine && punktNameFromLine.trim().length > 0
      ? punktNameFromLine
      : typeof punktId === 'number'
        ? punktNameById?.[punktId] ?? `ID: ${punktId}`
        : String(punktId);
  const latest = lines[0];
  const latestCreated = latest?.createdAt ? new Date(latest.createdAt) : null;

  if (!multi) {
    const item = lines[0];
    const statusColor = getStatusColor(item.status);
    const t = lineTotal(item);
    const created = item.createdAt ? new Date(item.createdAt) : null;
    const resolvedProductName =
      (item.productId != null ? productNameByProductId?.[item.productId] : undefined) ||
      item.productName;

    return (
      <TouchableOpacity
        style={[styles.card, compact && styles.cardCompact, styles.cardPressable]}
        onPress={() => onOpenLine(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardInner}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
                <Ionicons name="receipt-outline" size={compact ? 20 : 22} color={statusColor} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.label}>Buyurtma</Text>
                <Text style={styles.orderId}>#{orderId}</Text>
                <Text style={styles.productSubtitle} numberOfLines={2}>
                  {resolvedProductName}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="cube-outline" size={18} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.metaLabel}>Qator</Text>
                <Text style={styles.metaValue}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="storefront" size={18} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.metaLabel}>Punkt</Text>
                <Text style={styles.metaValue}>{punktName}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="time" size={18} color="#FF9500" />
              </View>
              <View>
                <Text style={styles.metaLabel}>Vaqt</Text>
                <Text style={styles.metaValue}>
                  {created && !Number.isNaN(created.getTime())
                    ? created.toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </Text>
              </View>
            </View>
            {t > 0 && (
              <View style={styles.metaRow}>
                <View style={styles.metaIcon}>
                  <Ionicons name="cash" size={18} color="#34C759" />
                </View>
                <View>
                  <Text style={styles.metaLabel}>Qator summasi</Text>
                  <Text style={[styles.metaValue, styles.priceStrong]}>
                    {formatNumberDisplay(t)} so'm
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.arrowWrap}>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, styles.cardMulti, compact && styles.cardCompact]}>
      <View style={styles.cardInner}>
        <TouchableOpacity
          style={[styles.multiHeader, styles.cardPressable]}
          onPress={() => onOpenGroup(group)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${domColor}15` }]}>
              <Ionicons name="layers-outline" size={compact ? 20 : 22} color={domColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.label}>Buyurtma</Text>
              <Text style={styles.orderId}>#{orderId}</Text>
              <Text style={styles.groupHint}>
                {lines.length} ta qator • {punktName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${domColor}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: domColor }]} />
            <Text style={[styles.statusText, { color: domColor }]}>
              {getStatusText(dom)}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.activityTitle}>Qatorlar bo‘yicha</Text>
        <View style={styles.activityList}>
          {lines.map((line) => {
            const c = getStatusColor(line.status);
            return (
              <TouchableOpacity
                key={line.id}
                style={[styles.activityRow, styles.cardPressable, { borderLeftColor: c }]}
                onPress={() => onOpenLine(line)}
                activeOpacity={0.65}
              >
                <View style={styles.activityRowBody}>
                  <Text style={styles.activityName} numberOfLines={2}>
                    {(line.productId != null ? productNameByProductId?.[line.productId] : undefined) ||
                      line.productName}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {line.quantity} {line.unit} · {formatNumberDisplay(lineTotal(line))} so'm
                  </Text>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: `${c}18` }]}>
                  <Text style={[styles.miniBadgeText, { color: c }]}>{getStatusText(line.status)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaIcon}>
            <Ionicons name="time" size={18} color="#FF9500" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLabel}>So‘nggi yangilanish</Text>
            <Text style={styles.metaValue}>
              {latestCreated && !Number.isNaN(latestCreated.getTime())
                ? latestCreated.toLocaleDateString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </Text>
          </View>
        </View>

        {total > 0 && (
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="cash" size={18} color="#34C759" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Buyurtma bo‘yicha jami</Text>
              <Text style={[styles.metaValue, styles.priceStrong]}>
                {formatNumberDisplay(total)} so'm
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.groupLink, styles.cardPressable]}
          onPress={() => onOpenGroup(group)}
          activeOpacity={0.7}
        >
          <Text style={styles.groupLinkText}>Buyurtma xulosasi</Text>
          <Ionicons name="arrow-forward-circle-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: Platform.OS === 'web' ? 0 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardCompact: {
    marginHorizontal: 0,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardMulti: {},
  cardInner: {
    padding: 16,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  multiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  productSubtitle: {
    fontSize: 13,
    color: '#636366',
    marginTop: 4,
    fontWeight: '500',
  },
  groupHint: {
    fontSize: 13,
    color: '#636366',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    maxWidth: '42%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 4,
  },
  activityList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  activityRowBody: {
    flex: 1,
    minWidth: 0,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  activityMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 110,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 12,
  },
  metaBlock: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  priceStrong: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 16,
  },
  arrowWrap: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  groupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  groupLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  cardPressable: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
});
