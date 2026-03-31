import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';

export default function DashboardScreen() {
  const { contragent } = useAuth();
  const { isDesktopWeb, maxPageWidth, pageGutter } = useResponsive();

  const iconSize = isDesktopWeb ? 20 : 24;

  const welcomeBlock = (
    <View style={styles.welcomeCard}>
      <Text style={[styles.welcomeText, isDesktopWeb && styles.welcomeTextDesktop]}>
        Xush kelibsiz!
      </Text>
      <Text style={[styles.companyName, isDesktopWeb && styles.companyNameDesktop]}>
        {contragent?.name || 'Kontragent'}
      </Text>
    </View>
  );

  const infoBlock = (
    <View style={styles.infoCard}>
      <View style={styles.infoRow}>
        <Ionicons name="business" size={iconSize} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>INN</Text>
          <Text style={styles.infoValue}>{contragent?.inn || '-'}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call" size={iconSize} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Telefon</Text>
          <Text style={styles.infoValue}>{contragent?.phone || '-'}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location" size={iconSize} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Manzil</Text>
          <Text style={styles.infoValue}>
            {contragent?.viloyat?.name || '-'}
            {contragent?.tuman?.name ? `, ${contragent.tuman.name}` : ''}
            {contragent?.mfy?.name ? `, ${contragent.mfy.name}` : ''}
          </Text>
        </View>
      </View>

      <View style={[styles.infoRow, styles.infoRowLast]}>
        <Ionicons name="checkmark-circle" size={iconSize} color="#34C759" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Holat</Text>
          <Text style={styles.infoValue}>
            {contragent?.status === 'active' ? 'Faol' : contragent?.status || '-'}
          </Text>
        </View>
      </View>
    </View>
  );

  const actionsBlock = (
    <View style={styles.actionsCard}>
      <Text style={[styles.sectionTitle, isDesktopWeb && styles.sectionTitleDesktop]}>
        Tezkor amallar
      </Text>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="document-text" size={iconSize} color="#007AFF" />
        <Text style={styles.actionButtonText}>Hujjatlar</Text>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="notifications" size={iconSize} color="#007AFF" />
        <Text style={styles.actionButtonText}>Xabarnomalar</Text>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.actionButtonLast]}>
        <Ionicons name="settings" size={iconSize} color="#007AFF" />
        <Text style={styles.actionButtonText}>Sozlamalar</Text>
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollInner,
        {
          paddingHorizontal: pageGutter,
          paddingBottom: isDesktopWeb ? 24 : 16,
          maxWidth: maxPageWidth,
          width: '100%',
          alignSelf: 'center',
        },
      ]}
    >
      {isDesktopWeb ? (
        <View>
          <View style={styles.webWelcomeRow}>{welcomeBlock}</View>
          <View style={styles.webColumns}>
            <View style={styles.webColLeft}>{infoBlock}</View>
            <View style={styles.webColRight}>{actionsBlock}</View>
          </View>
        </View>
      ) : (
        <View style={styles.mobileStack}>
          {welcomeBlock}
          {infoBlock}
          {actionsBlock}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollInner: {
    flexGrow: 1,
    paddingTop: 16,
  },
  mobileStack: {
    width: '100%',
  },
  webWelcomeRow: {
    marginBottom: 16,
  },
  webColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  webColLeft: {
    flex: 1,
    minWidth: 280,
    flexBasis: 0,
  },
  webColRight: {
    flex: 1,
    minWidth: 280,
    flexBasis: 0,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  welcomeTextDesktop: {
    fontSize: 14,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  companyNameDesktop: {
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionTitleDesktop: {
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonLast: {
    borderBottomWidth: 0,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
});
