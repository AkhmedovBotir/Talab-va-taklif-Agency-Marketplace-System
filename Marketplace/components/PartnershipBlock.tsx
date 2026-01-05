import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PartnershipRequestModal from './PartnershipRequestModal';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface PartnershipBlockProps {
  compact?: boolean;
}

export default function PartnershipBlock({ compact = false }: PartnershipBlockProps) {
  const { token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkPartnershipRequests = useCallback(async () => {
    if (!token) {
      setHasRequest(false);
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      const response = await apiService.getMyPartnershipRequests({ limit: 1 }, token);
      if (response.success && response.data && response.data.length > 0) {
        setHasRequest(true);
      } else {
        setHasRequest(false);
      }
    } catch (error: any) {
      // Don't show error, just assume no requests
      setHasRequest(false);
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    checkPartnershipRequests();
  }, [checkPartnershipRequests]);

  if (!token || checking || hasRequest) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, compact && styles.compactContainer]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={compact ? 24 : 32} color="#007AFF" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, compact && styles.compactTitle]}>
            Bizga hamkor bo'ling
          </Text>
          {!compact && (
            <Text style={styles.description}>
              Hamkor bo'lib, bizning platformada mahsulotlaringizni sotish imkoniyatiga ega bo'ling
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#007AFF" />
      </TouchableOpacity>

      {token && (
        <PartnershipRequestModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          token={token}
          onSuccess={() => {
            setModalVisible(false);
            // Check again after successful submission
            checkPartnershipRequests();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  compactContainer: {
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 16,
    marginBottom: 0,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});




