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

export default function DashboardScreen() {
  const { contragent } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Xush kelibsiz!</Text>
          <Text style={styles.companyName}>{contragent?.name || 'Kontragent'}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>INN</Text>
              <Text style={styles.infoValue}>{contragent?.inn || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{contragent?.phone || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Manzil</Text>
              <Text style={styles.infoValue}>
                {contragent?.viloyat?.name || '-'}
                {contragent?.tuman?.name ? `, ${contragent.tuman.name}` : ''}
                {contragent?.mfy?.name ? `, ${contragent.mfy.name}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Holat</Text>
              <Text style={styles.infoValue}>
                {contragent?.status === 'active' ? 'Faol' : contragent?.status || '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Tezkor amallar</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Hujjatlar</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Xabarnomalar</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Sozlamalar</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});







