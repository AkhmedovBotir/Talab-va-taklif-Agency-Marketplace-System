import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native';
import { apiService, Region } from '@/services/api';

interface RegionPickerProps {
  label: string;
  type: 'region' | 'district' | 'mfy';
  parentId?: string;
  value?: string;
  initialRegion?: Region | null;
  onSelect: (region: Region) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function RegionPicker({
  label,
  type,
  parentId,
  value,
  initialRegion,
  onSelect,
  placeholder = 'Tanlang...',
  disabled = false,
  error,
}: RegionPickerProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(initialRegion || null);

  // Update selected region when initialRegion changes
  useEffect(() => {
    if (initialRegion) {
      setSelectedRegion(initialRegion);
    } else if (!value) {
      setSelectedRegion(null);
    }
  }, [initialRegion, value]);

  // Load regions when modal opens or parentId/type changes
  useEffect(() => {
    if (modalVisible && (!parentId || parentId)) {
      loadRegions();
    }
  }, [modalVisible, parentId, type]);

  // Update selected region from regions list when it loads (if value is provided)
  useEffect(() => {
    if (value && regions.length > 0) {
      const found = regions.find((r) => r._id === value);
      if (found && (!selectedRegion || selectedRegion._id !== found._id)) {
        setSelectedRegion(found);
      }
    }
  }, [regions, value]);

  const loadRegions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRegions(type, parentId);
      setRegions(data);
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (region: Region) => {
    setSelectedRegion(region);
    onSelect(region);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.picker, disabled && styles.disabled, error && styles.pickerError]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.pickerText, !selectedRegion && styles.placeholder]}>
          {selectedRegion ? selectedRegion.name : placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <FlatList
                data={regions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.regionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.regionText}>{item.name}</Text>
                    {selectedRegion?._id === item._id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Ma'lumot topilmadi</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  checkmark: {
    fontSize: 18,
    color: '#2563EB',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  pickerError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

