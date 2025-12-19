import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../contexts/LocationContext';
import RegionPicker from './ui/RegionPicker';
import { Region } from '../services/api';

interface LocationSelectorProps {
  show?: boolean;
}

export default function LocationSelector({ show = true }: LocationSelectorProps) {
  const insets = useSafeAreaInsets();
  const { selectedViloyat, selectedTuman, setSelectedViloyat, setSelectedTuman } = useLocation();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const handleLocationPress = () => {
    setLocationModalVisible(true);
  };

  const handleViloyatSelect = (region: Region) => {
    setSelectedViloyat(region);
    setSelectedTuman(null); // Clear tuman when viloyat changes
  };

  const handleTumanSelect = (region: Region) => {
    setSelectedTuman(region);
    // Don't close modal automatically - let user see the selection
    // Modal will close when user presses save button
  };

  const handleSave = () => {
    if (selectedViloyat && selectedTuman) {
      setLocationModalVisible(false);
    }
  };

  const getLocationText = () => {
    if (selectedTuman && selectedViloyat) {
      return `${selectedViloyat.name}, ${selectedTuman.name}`;
    }
    if (selectedViloyat) {
      return selectedViloyat.name;
    }
    return 'Hududni tanlang';
  };

  if (!show) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.locationSelector}
        onPress={handleLocationPress}
        activeOpacity={0.7}
      >
        <View style={styles.locationIconContainer}>
          <Ionicons name="location" size={20} color="#007AFF" />
        </View>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationLabel}>Yetkazib berish hududi</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {getLocationText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <Modal
        visible={locationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <Text style={styles.modalCancel}>Bekor qilish</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hududni tanlang</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedViloyat(null);
                setSelectedTuman(null);
                setLocationModalVisible(false);
              }}
            >
              <Text style={styles.modalClear}>Tozalash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalInfoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.modalDescription}>
                Avval viloyatni, keyin tumanni tanlang
              </Text>
            </View>
            
            <RegionPicker
              label="Viloyat"
              value={selectedViloyat?._id || ''}
              type="region"
              onSelect={handleViloyatSelect}
              displayValue={selectedViloyat?.name}
            />

            <RegionPicker
              label="Tuman"
              value={selectedTuman?._id || ''}
              type="district"
              parentId={selectedViloyat?._id}
              onSelect={handleTumanSelect}
              displayValue={selectedTuman?.name}
              disabled={!selectedViloyat}
            />

            {selectedTuman && (
              <>
                <View style={styles.selectedLocationBox}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.selectedLocationText}>
                    Tanlangan: {selectedViloyat?.name}, {selectedTuman.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Saqlash</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    gap: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalClear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    width: 80,
    textAlign: 'right',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  modalDescription: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

