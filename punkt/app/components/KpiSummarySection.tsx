import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKpiSummary } from '../hooks/useKpiSummary';

export function KpiSummarySection() {
  const { summary, loading } = useKpiSummary();
  const { width } = useWindowDimensions();
  const stackPaidRow = width < 400;

  if (loading || !summary) {
    return null;
  }

  const cardShadow =
    Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } as object)
      : null;

  return (
    <View style={styles.kpiSection}>
      <Text style={styles.kpiSectionTitle}>Bugungi KPI</Text>
      {summary.dateUtc ? (
        <Text style={styles.kpiDateHint}>Hisob UTC kuni: {summary.dateUtc}</Text>
      ) : null}
      <View style={[styles.kpiCard, cardShadow]}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <Ionicons name="wallet" size={24} color="#007AFF" />
            <Text style={styles.kpiLabel}>Punkt KPI (jami)</Text>
            <Text style={styles.kpiValue}>
              {summary.totalAmount.toLocaleString('uz-UZ')} so‘m
            </Text>
          </View>
        </View>
        <View style={[styles.kpiRow, stackPaidRow && styles.kpiRowStack]}>
          <View style={[styles.kpiItem, styles.kpiItemHalf, stackPaidRow && styles.kpiItemFull]}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.kpiLabel}>To‘langan</Text>
            <Text style={[styles.kpiValue, styles.kpiValuePaid]}>
              {summary.paidAmount.toLocaleString('uz-UZ')} so‘m
            </Text>
          </View>
          <View style={[styles.kpiItem, styles.kpiItemHalf, stackPaidRow && styles.kpiItemFull]}>
            <Ionicons name="time" size={20} color="#FF9500" />
            <Text style={styles.kpiLabel}>To‘lanmagan</Text>
            <Text style={[styles.kpiValue, styles.kpiValueUnpaid]}>
              {summary.unpaidAmount.toLocaleString('uz-UZ')} so‘m
            </Text>
          </View>
        </View>
        <View style={styles.kpiFooter}>
          <Text style={styles.kpiTransactions}>
            Yetkazilgan buyurtmalar: {summary.totalTransactions}
            {summary.totalKpiPool != null
              ? ` · KPI havzasi: ${summary.totalKpiPool.toLocaleString('uz-UZ')} so‘m`
              : ''}
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
    marginBottom: 4,
  },
  kpiDateHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 10,
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
  kpiRowStack: {
    flexDirection: 'column',
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
  kpiItemFull: {
    flex: 0,
    width: '100%',
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
