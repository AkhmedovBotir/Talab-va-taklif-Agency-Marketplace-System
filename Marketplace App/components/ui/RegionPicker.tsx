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
  displayValue?: string; // Display text when value is set but region not loaded yet
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
  const [visible, setVisible] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limit = 20;

  const loadRegions = useCallback(async (pageNum: number, search: string, append = false) => {
    if (disabled) return;

    setLoading(true);
    try {
      const params: any = {
        type,
        page: pageNum,
        limit,
      };

      if (parentId) {
        params.parent = parentId;
      }

      if (search) {
        params.search = search;
      }

      const response = await apiService.getRegions(params);

      if (append) {
        setRegions((prev) => {
          // Remove duplicates by _id
          const existingIds = new Set(prev.map(r => r._id));
          const newRegions = response.data.filter(r => !existingIds.has(r._id));
          return [...prev, ...newRegions];
        });
      } else {
        setRegions(response.data);
      }

      setPage(response.page);
      setTotalPages(response.totalPages);
      setHasMore(response.page < response.totalPages);
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  }, [disabled, type, parentId]);

  useEffect(() => {
    if (visible) {
      setRegions([]);
      setPage(1);
      setSearchText('');
      setSelectedRegion(null);
      loadRegions(1, '');
    }
  }, [visible, type, parentId, loadRegions]);

  useEffect(() => {
    if (value && regions.length > 0) {
      const region = regions.find((r) => r._id === value);
      if (region) {
        setSelectedRegion(region);
        setDisplayText(region.name);
      }
    } else if (!value) {
      setSelectedRegion(null);
      setDisplayText('');
    }
  }, [value, regions]);

  useEffect(() => {
    if (displayValue && value) {
      setDisplayText(displayValue);
    } else if (!value) {
      setDisplayText('');
    }
  }, [displayValue, value]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setPage(1);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(() => {
      loadRegions(1, text);
    }, 300);
  }, [loadRegions]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadRegions(page + 1, searchText, true);
    }
  }, [loading, hasMore, page, searchText, loadRegions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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
        style={[styles.input, error && styles.inputError, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !displayText && styles.placeholder]}>
          {displayText || getPlaceholder()}
        </Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                value={searchText}
                onChangeText={handleSearch}
                placeholderTextColor="#999"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={regions}
              keyExtractor={(item, index) => item._id || `region-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedRegion?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      selectedRegion?._id === item._id && styles.itemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedRegion?._id === item._id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              removeClippedSubviews={false}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loading && regions.length > 0 ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                loading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Hech narsa topilmadi</Text>
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
    marginBottom: 16,
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemSelected: {
    backgroundColor: '#f0f8ff',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  itemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

