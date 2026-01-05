import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKpiBalance } from '../hooks/useKpiBalance';

interface KpiBalanceBadgeProps {
  date?: string;
  onPress?: () => void;
  compact?: boolean;
}

export function KpiBalanceBadge({ date, onPress, compact = false }: KpiBalanceBadgeProps) {
  const { balance, loading } = useKpiBalance(date);

  if (loading && !balance) {
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (!balance) {
    return null;
  }

  const Content = (
    <View style={[styles.content, compact && styles.compactContent]}>
      <View style={[styles.iconContainer, compact && styles.compactIconContainer]}>
        <Ionicons name="wallet-outline" size={compact ? 16 : 18} color="#007AFF" />
      </View>
      <View style={styles.balanceInfo}>
        {!compact && (
          <Text style={styles.label}>KPI Bonus</Text>
        )}
        <Text style={[styles.amount, compact && styles.compactAmount]}>
          {balance.totalAmount.toLocaleString('uz-UZ')} so'm
        </Text>
        {!compact && (
          <Text style={styles.subAmount}>
            To'lanmagan: {balance.unpaidAmount.toLocaleString('uz-UZ')} so'm
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.compact]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {Content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compact: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactContent: {
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  balanceInfo: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  compactAmount: {
    fontSize: 14,
  },
  subAmount: {
    fontSize: 11,
    color: '#999',
  },
});

