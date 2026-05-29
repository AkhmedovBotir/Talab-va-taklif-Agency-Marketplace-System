import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, Region } from '../services/api';

interface RegionPickerProps {
  label?: string;
  value?: string;
  type: 'region' | 'district' | 'mfy';
  parentId?: string;
  onSelect: (region: Region) => void;
  displayValue?: string;
  disabled?: boolean;
  multiple?: boolean;
  selectedIds?: string[];
}

export default function RegionPicker({
  label,
  value,
  type,
  parentId,
  onSelect,
  displayValue,
  disabled = false,
  multiple = false,
  selectedIds = [],
}: RegionPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (modalVisible) {
      loadRegions();
    }
  }, [modalVisible, parentId, type]);

  const loadRegions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRegions({
        type,
        parent: parentId,
        limit: 1000,
        search: searchText || undefined,
      });
      // response is RegionsResponse, which has a data property containing Region[]
      if (response && response.data) {
        setRegions(response.data);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (region: Region) => {
    onSelect(region);
    if (!multiple) {
      setModalVisible(false);
      setSearchText('');
    }
  };

  const isSelected = (regionId: string) => {
    if (multiple) {
      return selectedIds.includes(regionId);
    }
    return value === regionId;
  };

  const displayText = displayValue || regions.find((r) => r._id === value)?.name || label || 'Tanlang';

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.pickerButtonDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}>
        <Text style={[styles.pickerText, disabled && styles.pickerTextDisabled]} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={disabled ? '#ccc' : '#666'} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Tanlang'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              <FlatList
                data={regions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const selected = isSelected(item._id);
                  return (
                    <TouchableOpacity
                      style={[styles.regionItem, selected && styles.regionItemSelected]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}>
                      <Text style={[styles.regionText, selected && styles.regionTextSelected]}>
                        {item.name}
                      </Text>
                      {selected && <Ionicons name={multiple ? "checkbox" : "checkmark"} size={20} color="#007AFF" />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Ma&apos;lumot topilmadi</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  pickerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  pickerTextDisabled: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  regionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  regionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
