import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useKpiBalance } from '../hooks/useKpiBalance';

interface KpiBalanceCardProps {
  onPress?: () => void;
}

export function KpiBalanceCard({ onPress }: KpiBalanceCardProps) {
  const { balance, loading } = useKpiBalance();

  if (loading || !balance) {
    return <View />;
  }

  const Content = (
    <>
      <View style={styles.kpiBalanceHeader}>
        <Ionicons name="wallet" size={20} color="#007AFF" />
        <Text style={styles.kpiBalanceTitle}>Kunlik KPI balansi</Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color="#666" style={styles.kpiBalanceArrow} />
        )}
      </View>
      <View style={styles.kpiBalanceRow}>
        <View style={styles.kpiBalanceItem}>
          <Text style={styles.kpiBalanceLabel}>Jami</Text>
          <Text style={styles.kpiBalanceValue}>
            {balance.totalAmount.toLocaleString()} so'm
          </Text>
        </View>
        <View style={styles.kpiBalanceDivider} />
        <View style={styles.kpiBalanceItem}>
          <Text style={styles.kpiBalanceLabel}>To'langan</Text>
          <Text style={[styles.kpiBalanceValue, styles.kpiBalancePaid]}>
            {balance.paidAmount.toLocaleString()} so'm
          </Text>
        </View>
        <View style={styles.kpiBalanceDivider} />
        <View style={styles.kpiBalanceItem}>
          <Text style={styles.kpiBalanceLabel}>To'lanmagan</Text>
          <Text style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid]}>
            {balance.unpaidAmount.toLocaleString()} so'm
          </Text>
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.kpiBalanceCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.kpiBalanceCard}>
      {Content}
    </View>
  );
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
  kpiBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  kpiBalanceTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  kpiBalanceArrow: {
    marginLeft: 'auto',
  },
  kpiBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBalanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiBalanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
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
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
});
