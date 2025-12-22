import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '../../services/api';
import { Region } from '../../services/api';

interface RegionPickerProps {
  label: string;
  value: string;
  onSelect: (region: Region) => void;
  type?: 'region' | 'district' | 'mfy';
  parentId?: string;
  error?: string;
  disabled?: boolean;
  displayValue?: string;
}

export default function RegionPicker({
  label,
  value,
  onSelect,
  type = 'region',
  parentId,
  error,
  disabled = false,
  displayValue,
}: RegionPickerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [displayText, setDisplayText] = useState<string>('');

  // Sort regions alphabetically by name (Uzbek alphabet)
  const sortRegionsAlphabetically = useCallback((regions: Region[]): Region[] => {
    return [...regions].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'uz');
    });
  }, []);

  // Load all regions at once
  const loadAllRegions = useCallback(async () => {
    if (disabled) return;

    setLoading(true);
    try {
      const params: any = {
        type,
        page: 1,
        limit: 1000,
      };

      if (parentId) {
        params.parent = parentId;
      }

      const response = await apiService.getRegions(params);
      
      // If there are more pages, load them all
      let allData = [...response.data];
      let currentPage = response.page;
      
      while (currentPage < response.totalPages) {
        currentPage++;
        const nextParams = { ...params, page: currentPage };
        const nextResponse = await apiService.getRegions(nextParams);
        allData = [...allData, ...nextResponse.data];
      }

      // Sort alphabetically
      const sortedRegions = sortRegionsAlphabetically(allData);
      setAllRegions(sortedRegions);
      setFilteredRegions(sortedRegions);
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  }, [disabled, type, parentId, sortRegionsAlphabetically]);

  useEffect(() => {
    if (visible) {
      setSearchText('');
      setSelectedRegion(null);
      loadAllRegions();
    }
  }, [visible, type, parentId, loadAllRegions]);

  useEffect(() => {
    if (value && allRegions.length > 0) {
      const region = allRegions.find((r) => r._id === value);
      if (region) {
        setSelectedRegion(region);
        setDisplayText(region.name);
      }
    } else if (!value) {
      setSelectedRegion(null);
      setDisplayText('');
    }
  }, [value, allRegions]);

  useEffect(() => {
    if (displayValue && value) {
      setDisplayText(displayValue);
    } else if (!value) {
      setDisplayText('');
    }
  }, [displayValue, value]);

  // Filter regions locally based on search text
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredRegions(allRegions);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = allRegions.filter((region) =>
        region.name?.toLowerCase().includes(searchLower)
      );
      setFilteredRegions(filtered);
    }
  }, [searchText, allRegions]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSelect = (region: Region) => {
    setSelectedRegion(region);
    setDisplayText(region.name);
    onSelect(region);
    setVisible(false);
    setSearchText('');
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'region':
        return 'Viloyatni tanlang';
      case 'district':
        return 'Tumanni tanlang';
      case 'mfy':
        return 'MFY ni tanlang';
      default:
        return 'Tanlang';
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          <Ionicons 
            name={type === 'region' ? 'location' : type === 'district' ? 'map' : 'home'} 
            size={20} 
            color={displayText ? '#007AFF' : '#999'} 
            style={styles.inputIcon}
          />
          <Text style={[styles.inputText, !displayText && styles.placeholder]}>
            {displayText || getPlaceholder()}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            {/* Drag Indicator */}
            <View style={styles.dragIndicator} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Ionicons 
                    name={type === 'region' ? 'location' : type === 'district' ? 'map' : 'home'} 
                    size={24} 
                    color="#007AFF" 
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <Text style={styles.modalSubtitle}>
                    {filteredRegions.length} ta {type === 'region' ? 'viloyat' : type === 'district' ? 'tuman' : 'MFY'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                value={searchText}
                onChangeText={handleSearch}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity 
                  onPress={() => handleSearch('')}
                  style={styles.clearSearchButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Regions List */}
            <FlatList
              data={filteredRegions}
              keyExtractor={(item, index) => item._id || `region-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedRegion?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <View style={[
                      styles.itemIconContainer,
                      selectedRegion?._id === item._id && styles.itemIconContainerActive
                    ]}>
                      <Ionicons 
                        name={type === 'region' ? 'location' : type === 'district' ? 'map' : 'home'} 
                        size={18} 
                        color={selectedRegion?._id === item._id ? '#007AFF' : '#999'} 
                      />
                    </View>
                    <Text
                      style={[
                        styles.itemText,
                        selectedRegion?._id === item._id && styles.itemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {selectedRegion?._id === item._id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              removeClippedSubviews={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ 
                paddingBottom: Math.max(insets.bottom + 20, 40) 
              }}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.emptyText}>Yuklanmoqda...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Hech narsa topilmadi</Text>
                    <Text style={styles.emptySubtext}>Boshqa so'z bilan qidiring</Text>
                  </View>
                )
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  inputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    color: '#999',
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
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
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemSelected: {
    backgroundColor: '#f0f8ff',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconContainerActive: {
    backgroundColor: '#e6f3ff',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});
