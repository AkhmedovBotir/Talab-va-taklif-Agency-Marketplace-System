import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useServiceAccess } from '../contexts/ServiceAccessContext';
import {
  billingTypeLabel,
  formatFreeMonthsUz,
  formatServiceDateTime,
  getPeriodEndUrgency,
  getPeriodEndUrgencyMessage,
} from '../utils/formatServiceDate';

interface ServicePeriodCardProps {
  style?: ViewStyle;
}

export default function ServicePeriodCard({ style }: ServicePeriodCardProps) {
  const { serviceAccess, loading: serviceAccessLoading } = useServiceAccess();

  const periodUrgency =
    serviceAccess?.can_operate && serviceAccess.period_end_at
      ? getPeriodEndUrgency(serviceAccess.period_end_at, serviceAccess.can_operate)
      : 0;
  const periodUrgencyMessage = getPeriodEndUrgencyMessage(
    serviceAccess?.period_end_at,
    periodUrgency
  );
  const periodCardCritical = periodUrgency === 3;
  const isActiveOk = !!serviceAccess?.can_operate && periodUrgency === 0;

  const headerIconColor = periodCardCritical
    ? '#fff'
    : isActiveOk
      ? '#2E7D32'
      : '#007AFF';

  return (
    <View
      style={[
        styles.card,
        isActiveOk && styles.serviceCardActive,
        !serviceAccess?.can_operate && serviceAccess && styles.serviceCardExpired,
        periodUrgency === 1 && styles.serviceCardUrgent3,
        periodUrgency === 2 && styles.serviceCardUrgent2,
        periodUrgency === 3 && styles.serviceCardUrgent1,
        style,
      ]}>
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={headerIconColor} />
        <Text style={[styles.cardTitle, periodCardCritical && styles.serviceCardTextLight]}>
          Xizmat muddati
        </Text>
      </View>

      {serviceAccessLoading && !serviceAccess ? (
        <ActivityIndicator
          color={periodCardCritical ? '#fff' : isActiveOk ? '#2E7D32' : '#007AFF'}
          style={styles.loader}
        />
      ) : serviceAccess ? (
        <>
          {periodUrgencyMessage ? (
            <View
              style={[
                styles.periodUrgencyBanner,
                periodUrgency === 1 && styles.periodUrgencyBanner3,
                periodUrgency === 2 && styles.periodUrgencyBanner2,
                periodUrgency === 3 && styles.periodUrgencyBanner1,
              ]}>
              <Ionicons
                name="warning"
                size={18}
                color={periodCardCritical ? '#fff' : '#C62828'}
              />
              <Text
                style={[
                  styles.periodUrgencyText,
                  periodCardCritical && styles.serviceCardTextLight,
                ]}>
                {periodUrgencyMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, periodCardCritical && styles.serviceCardLabelLight]}>
              Holat:
            </Text>
            <Text
              style={[
                styles.infoValue,
                periodCardCritical && styles.serviceCardTextLight,
                isActiveOk && styles.serviceActiveText,
                !serviceAccess.can_operate && !periodCardCritical && styles.serviceExpiredText,
              ]}>
              {serviceAccess.message}
            </Text>
          </View>

          {serviceAccess.billing_type ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, periodCardCritical && styles.serviceCardLabelLight]}>
                Tarif:
              </Text>
              <Text style={[styles.infoValue, periodCardCritical && styles.serviceCardTextLight]}>
                {billingTypeLabel(serviceAccess.billing_type)}
                {serviceAccess.billing_type === 'free' && serviceAccess.free_months
                  ? ` (${formatFreeMonthsUz(serviceAccess.free_months)})`
                  : ''}
              </Text>
            </View>
          ) : null}

          {serviceAccess.period_start_at ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, periodCardCritical && styles.serviceCardLabelLight]}>
                Boshlangan:
              </Text>
              <Text style={[styles.infoValue, periodCardCritical && styles.serviceCardTextLight]}>
                {formatServiceDateTime(serviceAccess.period_start_at)}
              </Text>
            </View>
          ) : null}

          {serviceAccess.period_end_at ? (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={[styles.infoLabel, periodCardCritical && styles.serviceCardLabelLight]}>
                Tugash:
              </Text>
              <Text style={[styles.infoValue, periodCardCritical && styles.serviceCardTextLight]}>
                {formatServiceDateTime(serviceAccess.period_end_at)}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.serviceAccessEmpty}>Xizmat holati yuklanmadi</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  serviceCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  serviceCardExpired: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  serviceCardUrgent3: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  serviceCardUrgent2: {
    backgroundColor: '#FFCDD2',
    borderColor: '#E57373',
  },
  serviceCardUrgent1: {
    backgroundColor: '#C62828',
    borderColor: '#B71C1C',
  },
  serviceCardTextLight: {
    color: '#fff',
  },
  serviceCardLabelLight: {
    color: 'rgba(255, 255, 255, 0.88)',
  },
  serviceActiveText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  serviceExpiredText: {
    color: '#C62828',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  loader: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  periodUrgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  periodUrgencyBanner3: {
    backgroundColor: 'rgba(198, 40, 40, 0.12)',
  },
  periodUrgencyBanner2: {
    backgroundColor: 'rgba(198, 40, 40, 0.22)',
  },
  periodUrgencyBanner1: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  periodUrgencyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#B71C1C',
  },
  serviceAccessEmpty: {
    fontSize: 14,
    color: '#999',
    paddingVertical: 8,
  },
});
