import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKpiSummary } from '../hooks/useKpiSummary';

export function KpiSummarySection() {
  const { summary, loading } = useKpiSummary();

  if (loading || !summary) {
    return null;
  }

  return (
    <View style={styles.kpiSection}>
      <Text style={styles.kpiSectionTitle}>KPI Bonus</Text>
      <View style={styles.kpiCard}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <Ionicons name="wallet" size={24} color="#007AFF" />
            <Text style={styles.kpiLabel}>Jami bonus</Text>
            <Text style={styles.kpiValue}>
              {summary.totalAmount.toLocaleString()} so'm
            </Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={[styles.kpiItem, styles.kpiItemHalf]}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.kpiLabel}>To'langan</Text>
            <Text style={[styles.kpiValue, styles.kpiValuePaid]}>
              {summary.paidAmount.toLocaleString()} so'm
            </Text>
          </View>
          <View style={[styles.kpiItem, styles.kpiItemHalf]}>
            <Ionicons name="time" size={20} color="#FF9500" />
            <Text style={styles.kpiLabel}>To'lanmagan</Text>
            <Text style={[styles.kpiValue, styles.kpiValueUnpaid]}>
              {summary.unpaidAmount.toLocaleString()} so'm
            </Text>
          </View>
        </View>
        <View style={styles.kpiFooter}>
          <Text style={styles.kpiTransactions}>
            Jami transaksiyalar: {summary.totalTransactions}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiSection: {
    padding: 20,
  },
  kpiSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  kpiItemHalf: {
    flex: 0.5,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  kpiValuePaid: {
    color: '#34C759',
  },
  kpiValueUnpaid: {
    color: '#FF9500',
  },
  kpiFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 4,
  },
  kpiTransactions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

