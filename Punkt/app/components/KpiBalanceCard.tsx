import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useKpiBalance } from '../hooks/useKpiBalance';

interface KpiBalanceCardProps {
  onPress?: () => void;
  refreshTrigger?: number;
  /** Web: buyurtmalar ustuni bilan bir xil kenglik chegarasi */
  maxWidth?: number;
}

export function KpiBalanceCard({ onPress, refreshTrigger, maxWidth }: KpiBalanceCardProps) {
  const { width } = useWindowDimensions();
  const { balance, loading, refresh } = useKpiBalance();

  const isWeb = Platform.OS === 'web';
  /** Faqat tor mobil; webda ham uch ustun (RN Web flex + stack rejimi chalkashadi) */
  const stackStats = !isWeb && width < 380;
  const cardShadow =
    isWeb
      ? ({ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } as object)
      : null;

  React.useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refresh();
    }
  }, [refreshTrigger, refresh]);

  if (loading || !balance) {
    return <View />;
  }

  const rowStyle = stackStats ? styles.kpiBalanceRowStack : styles.kpiBalanceRow;

  const Content = (
    <>
      <View style={styles.kpiBalanceHeader}>
        <Ionicons name="wallet" size={20} color="#007AFF" />
        <View style={styles.kpiBalanceTitleBlock}>
          <Text style={styles.kpiBalanceTitle}>Bugungi KPI</Text>
          <Text style={styles.kpiBalanceSubtitle}>UTC kun: {balance.date}</Text>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color="#666" style={styles.kpiBalanceArrow} />
        )}
      </View>
      <View style={[rowStyle, isWeb && !stackStats && styles.kpiBalanceRowWeb]}>
        <View
          style={[
            styles.kpiBalanceItem,
            stackStats && styles.kpiBalanceItemStack,
            isWeb && !stackStats && styles.kpiBalanceItemWeb,
          ]}
        >
          <Text style={[styles.kpiBalanceLabel, stackStats && styles.kpiBalanceLabelStack]}>
            Punkt KPI (jami)
          </Text>
          <Text
            style={[styles.kpiBalanceValue, stackStats && styles.kpiBalanceValueStack]}
            numberOfLines={2}
            {...(!isWeb ? { adjustsFontSizeToFit: true } : {})}
          >
            {balance.totalAmount.toLocaleString('uz-UZ')} so‘m
          </Text>
        </View>
        {!stackStats ? <View style={styles.kpiBalanceDivider} /> : <View style={styles.kpiBalanceDividerH} />}
        <View
          style={[
            styles.kpiBalanceItem,
            stackStats && styles.kpiBalanceItemStack,
            isWeb && !stackStats && styles.kpiBalanceItemWeb,
          ]}
        >
          <Text style={[styles.kpiBalanceLabel, stackStats && styles.kpiBalanceLabelStack]}>
            To‘langan
          </Text>
          <Text
            style={[styles.kpiBalanceValue, styles.kpiBalancePaid, stackStats && styles.kpiBalanceValueStack]}
            numberOfLines={2}
          >
            {balance.paidAmount.toLocaleString('uz-UZ')} so‘m
          </Text>
        </View>
        {!stackStats ? <View style={styles.kpiBalanceDivider} /> : <View style={styles.kpiBalanceDividerH} />}
        <View
          style={[
            styles.kpiBalanceItem,
            stackStats && styles.kpiBalanceItemStack,
            isWeb && !stackStats && styles.kpiBalanceItemWeb,
          ]}
        >
          <Text style={[styles.kpiBalanceLabel, stackStats && styles.kpiBalanceLabelStack]}>
            To‘lanmagan
          </Text>
          <Text
            style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid, stackStats && styles.kpiBalanceValueStack]}
            numberOfLines={2}
          >
            {balance.unpaidAmount.toLocaleString('uz-UZ')} so‘m
          </Text>
        </View>
      </View>
      {balance.totalKpiPool != null && (
        <Text style={styles.kpiMeta}>
          KPI havzasi: {balance.totalKpiPool.toLocaleString('uz-UZ')} so‘m · Yetkazilgan:{' '}
          {balance.totalTransactions}
        </Text>
      )}
    </>
  );

  const outerStyle = [
    styles.kpiBalanceCard,
    maxWidth != null && { maxWidth, width: '100%', alignSelf: 'center' },
    isWeb && styles.kpiBalanceCardWeb,
    cardShadow,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={outerStyle} onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return <View style={outerStyle}>{Content}</View>;
}

export default KpiBalanceCard;

const styles = StyleSheet.create({
  kpiBalanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  /** Web: ota konteyner flex ichida to‘liq kenglik — ichki row to‘g‘ri bo‘lishi uchun */
  kpiBalanceCardWeb: {
    width: '100%',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  kpiBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  kpiBalanceTitleBlock: {
    flex: 1,
  },
  kpiBalanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  kpiBalanceSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  kpiBalanceArrow: {
    marginLeft: 'auto',
  },
  kpiMeta: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  kpiBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBalanceRowWeb: {
    width: '100%',
    alignSelf: 'stretch',
  },
  kpiBalanceItemWeb: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  kpiBalanceRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  },
  kpiBalanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiBalanceItemStack: {
    alignItems: 'flex-start',
    paddingVertical: 8,
    flex: 0,
  },
  kpiBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiBalanceLabelStack: {
    alignSelf: 'flex-start',
  },
  kpiBalanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    ...(Platform.OS === 'web' ? ({ maxWidth: '100%' } as object) : {}),
  },
  kpiBalanceValueStack: {
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  kpiBalancePaid: {
    color: '#34C759',
  },
  kpiBalanceUnpaid: {
    color: '#FF9500',
  },
  kpiBalanceDivider: {
    width: 1,
    height: 40,
    flexShrink: 0,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  kpiBalanceDividerH: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
});
