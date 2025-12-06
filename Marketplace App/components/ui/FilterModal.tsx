import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService, { Category, Contragent } from '../../services/api';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    minPrice?: number;
    maxPrice?: number;
    contragent?: string;
    category?: string;
    subcategory?: string;
  }) => void;
  initialFilters?: {
    minPrice?: number;
    maxPrice?: number;
    contragent?: string;
    category?: string;
    subcategory?: string;
  };
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<{
    contragents: Contragent[];
    categories: Category[];
    subcategories: Category[];
  }>({
    contragents: [],
    categories: [],
    subcategories: [],
  });

  const [filters, setFilters] = useState({
    minPrice: initialFilters.minPrice || undefined,
    maxPrice: initialFilters.maxPrice || undefined,
    contragent: initialFilters.contragent || undefined,
    category: initialFilters.category || undefined,
    subcategory: initialFilters.subcategory || undefined,
  });

  const [minPriceText, setMinPriceText] = useState(
    initialFilters.minPrice?.toString() || ''
  );
  const [maxPriceText, setMaxPriceText] = useState(
    initialFilters.maxPrice?.toString() || ''
  );

  // Search states for filters
  const [contragentSearch, setContragentSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const loadFilters = useCallback(async (currentFilters?: any) => {
    const filtersToUse = currentFilters !== undefined ? currentFilters : filters;
    setLoading(true);
    try {
      // Load filters with current filter values to get available options
      const response = await apiService.filterProducts({
        minPrice: filtersToUse.minPrice,
        maxPrice: filtersToUse.maxPrice,
        contragent: filtersToUse.contragent,
        category: filtersToUse.category,
        subcategory: filtersToUse.subcategory,
        page: 1,
        limit: 1, // We only need availableFilters, not products
      });

      if (response && response.availableFilters) {
        setAvailableFilters({
          contragents: response.availableFilters.contragents || [],
          categories: response.availableFilters.categories || [],
          subcategories: response.availableFilters.subcategories || [],
        });
        console.log('Available filters loaded:', {
          contragents: response.availableFilters.contragents?.length || 0,
          categories: response.availableFilters.categories?.length || 0,
          subcategories: response.availableFilters.subcategories?.length || 0,
        });
      } else {
        // If availableFilters is missing, set empty arrays
        console.warn('availableFilters is missing in response');
        setAvailableFilters({
          contragents: [],
          categories: [],
          subcategories: [],
        });
      }
    } catch (error: any) {
        console.error('Error loading filters:', error);
        // If error, try loading without any filters to get initial available options
        try {
          const initialResponse = await apiService.filterProducts({
            page: 1,
            limit: 1,
          });
          if (initialResponse && initialResponse.availableFilters) {
            setAvailableFilters({
              contragents: initialResponse.availableFilters.contragents || [],
              categories: initialResponse.availableFilters.categories || [],
              subcategories: initialResponse.availableFilters.subcategories || [],
            });
          } else {
            // If still no availableFilters, try loading all categories and contragents separately
            try {
              const [categoriesResponse, contragentsResponse] = await Promise.all([
                apiService.getCategories({ status: 'active' }),
                apiService.getContragents({ status: 'active' }),
              ]);
              
              setAvailableFilters({
                contragents: contragentsResponse.data || [],
                categories: categoriesResponse.data || [],
                subcategories: [],
              });
            } catch (fallbackError: any) {
              console.error('Error loading fallback filters:', fallbackError);
              setAvailableFilters({
                contragents: [],
                categories: [],
                subcategories: [],
              });
            }
          }
        } catch (initialError: any) {
          console.error('Error loading initial filters:', initialError);
          // Set empty filters on error
          setAvailableFilters({
            contragents: [],
            categories: [],
            subcategories: [],
          });
        }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset filters when modal opens
      const resetFilters = {
        minPrice: initialFilters.minPrice || undefined,
        maxPrice: initialFilters.maxPrice || undefined,
        contragent: initialFilters.contragent || undefined,
        category: initialFilters.category || undefined,
        subcategory: initialFilters.subcategory || undefined,
      };
      setFilters(resetFilters);
      setMinPriceText(initialFilters.minPrice?.toString() || '');
      setMaxPriceText(initialFilters.maxPrice?.toString() || '');
      setContragentSearch('');
      setCategorySearch('');
      
      // Load filters with reset filters - use setTimeout to ensure state is updated
      setTimeout(() => {
        loadFilters(resetFilters);
      }, 100);
    } else {
      // Reset available filters when modal closes
      setAvailableFilters({
        contragents: [],
        categories: [],
        subcategories: [],
      });
      setContragentSearch('');
      setCategorySearch('');
    }
  }, [visible, initialFilters]);

  // Reload filters when contragent or category changes (but not on initial load)
  useEffect(() => {
    if (visible && (filters.contragent || filters.category || filters.subcategory)) {
      const timer = setTimeout(() => {
        loadFilters(filters);
      }, 300); // Debounce to avoid too many API calls
      
      return () => clearTimeout(timer);
    }
  }, [filters.contragent, filters.category, filters.subcategory, visible]);

  const handleApply = () => {
    const appliedFilters: any = {};
    if (filters.contragent) appliedFilters.contragent = filters.contragent;
    if (filters.category) appliedFilters.category = filters.category;
    if (filters.subcategory) appliedFilters.subcategory = filters.subcategory;
    if (filters.minPrice) appliedFilters.minPrice = filters.minPrice;
    if (filters.maxPrice) appliedFilters.maxPrice = filters.maxPrice;

    onApply(appliedFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      minPrice: undefined,
      maxPrice: undefined,
      contragent: undefined,
      category: undefined,
      subcategory: undefined,
    };
    setFilters(resetFilters);
    setMinPriceText('');
    setMaxPriceText('');
    setAvailableFilters({
      contragents: [],
      categories: [],
      subcategories: [],
    });
    // Reload filters after reset
    loadFilters(resetFilters);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') {
      setMinPriceText(value);
      setFilters((prev) => ({
        ...prev,
        minPrice: value ? parseInt(value) || undefined : undefined,
      }));
    } else {
      setMaxPriceText(value);
      setFilters((prev) => ({
        ...prev,
        maxPrice: value ? parseInt(value) || undefined : undefined,
      }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="options" size={24} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Filterlar</Text>
                <Text style={styles.headerSubtitle}>
                  {String(
                    (filters.contragent ? 1 : 0) +
                    (filters.category ? 1 : 0) +
                    (filters.subcategory ? 1 : 0) +
                    (filters.minPrice ? 1 : 0) +
                    (filters.maxPrice ? 1 : 0)
                  )}{' '}
                  filter tanlangan
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Price Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetag-outline" size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Narx oralig'i</Text>
              </View>
                <View style={styles.priceContainer}>
                  <View style={styles.priceInputContainer}>
                    <View style={styles.priceLabelContainer}>
                      <Text style={styles.priceLabel}>Min narx</Text>
                      <Text style={styles.priceLabelSuffix}>so'm</Text>
                    </View>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#999"
                        value={minPriceText}
                        onChangeText={(value) => handlePriceChange('min', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.priceSeparatorContainer}>
                    <View style={styles.priceSeparator} />
                  </View>
                  <View style={styles.priceInputContainer}>
                    <View style={styles.priceLabelContainer}>
                      <Text style={styles.priceLabel}>Max narx</Text>
                      <Text style={styles.priceLabelSuffix}>so'm</Text>
                    </View>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#999"
                        value={maxPriceText}
                        onChangeText={(value) => handlePriceChange('max', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Contragents */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="storefront-outline" size={20} color="#007AFF" />
                  <Text style={styles.sectionTitle}>Do'konlar</Text>
                </View>
                {loading && (!availableFilters.contragents || availableFilters.contragents.length === 0) ? (
                  <View style={styles.emptyFilterContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.emptyFilterText}>Do'konlar yuklanmoqda...</Text>
                  </View>
                ) : availableFilters.contragents && availableFilters.contragents.length > 0 ? (
                  <>
                    <View style={styles.searchContainer}>
                      <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Do'kon qidirish..."
                        placeholderTextColor="#999"
                        value={contragentSearch}
                        onChangeText={setContragentSearch}
                      />
                      {contragentSearch.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setContragentSearch('')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {availableFilters.contragents
                      .filter((contragent) =>
                        contragent.name.toLowerCase().includes(contragentSearch.toLowerCase())
                      ).length > 0 ? (
                      availableFilters.contragents
                        .filter((contragent) =>
                          contragent.name.toLowerCase().includes(contragentSearch.toLowerCase())
                        )
                        .map((contragent) => (
                        <TouchableOpacity
                          key={contragent._id}
                          activeOpacity={0.7}
                          style={[
                            styles.filterItem,
                            filters.contragent === contragent._id &&
                              styles.filterItemActive,
                          ]}
                          onPress={() => {
                            console.log('Contragent pressed:', contragent.name);
                            const newContragent =
                              filters.contragent === contragent._id
                                ? undefined
                                : contragent._id;
                            const newFilters = {
                              ...filters,
                              contragent: newContragent,
                              category: undefined,
                              subcategory: undefined,
                            };
                            console.log('New filters:', newFilters);
                            setFilters(newFilters);
                            loadFilters(newFilters);
                          }}
                        >
                          <View style={styles.filterItemLeft}>
                            <View
                              style={[
                                styles.filterItemIcon,
                                filters.contragent === contragent._id &&
                                  styles.filterItemIconActive,
                              ]}
                            >
                              <Ionicons
                                name={filters.contragent === contragent._id ? 'checkmark' : 'storefront'}
                                size={18}
                                color={filters.contragent === contragent._id ? '#007AFF' : '#666'}
                              />
                            </View>
                            <Text
                              style={[
                                styles.filterItemText,
                                filters.contragent === contragent._id &&
                                  styles.filterItemTextActive,
                              ]}
                            >
                              {contragent.name}
                            </Text>
                          </View>
                          {filters.contragent === contragent._id && (
                            <View style={styles.checkmarkContainer}>
                              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.emptyFilterContainer}>
                        <Ionicons name="search-outline" size={32} color="#ccc" />
                        <Text style={styles.emptyFilterText}>
                          "{contragentSearch}" bo'yicha do'konlar topilmadi
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyFilterContainer}>
                    <Ionicons name="storefront-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyFilterText}>Do'konlar topilmadi</Text>
                  </View>
                )}
              </View>

              {/* Categories */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="folder-outline" size={20} color="#007AFF" />
                  <Text style={styles.sectionTitle}>Kategoriyalar</Text>
                </View>
                {loading && (!availableFilters.categories || availableFilters.categories.length === 0) ? (
                  <View style={styles.emptyFilterContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.emptyFilterText}>Kategoriyalar yuklanmoqda...</Text>
                  </View>
                ) : availableFilters.categories && availableFilters.categories.length > 0 ? (
                  <>
                    <View style={styles.searchContainer}>
                      <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Kategoriya qidirish..."
                        placeholderTextColor="#999"
                        value={categorySearch}
                        onChangeText={setCategorySearch}
                      />
                      {categorySearch.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => setCategorySearch('')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {availableFilters.categories
                      .filter((category) =>
                        category.name.toLowerCase().includes(categorySearch.toLowerCase())
                      ).length > 0 ? (
                      availableFilters.categories
                        .filter((category) =>
                          category.name.toLowerCase().includes(categorySearch.toLowerCase())
                        )
                        .map((category) => (
                        <TouchableOpacity
                          key={category._id}
                          activeOpacity={0.7}
                          style={[
                            styles.filterItem,
                            filters.category === category._id &&
                              styles.filterItemActive,
                          ]}
                          onPress={() => {
                            console.log('Category pressed:', category.name);
                            const newCategory =
                              filters.category === category._id
                                ? undefined
                                : category._id;
                            const newFilters = {
                              ...filters,
                              category: newCategory,
                              subcategory: undefined,
                            };
                            console.log('New filters:', newFilters);
                            setFilters(newFilters);
                            loadFilters(newFilters);
                          }}
                        >
                          <View style={styles.filterItemLeft}>
                            <View
                              style={[
                                styles.filterItemIcon,
                                filters.category === category._id &&
                                  styles.filterItemIconActive,
                              ]}
                            >
                              <Ionicons
                                name={filters.category === category._id ? 'checkmark' : 'folder'}
                                size={18}
                                color={filters.category === category._id ? '#007AFF' : '#666'}
                              />
                            </View>
                            <Text
                              style={[
                                styles.filterItemText,
                                filters.category === category._id &&
                                  styles.filterItemTextActive,
                              ]}
                            >
                              {category.name}
                            </Text>
                          </View>
                          {filters.category === category._id && (
                            <View style={styles.checkmarkContainer}>
                              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.emptyFilterContainer}>
                        <Ionicons name="search-outline" size={32} color="#ccc" />
                        <Text style={styles.emptyFilterText}>
                          "{categorySearch}" bo'yicha kategoriyalar topilmadi
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyFilterContainer}>
                    <Ionicons name="folder-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyFilterText}>Kategoriyalar topilmadi</Text>
                  </View>
                )}
              </View>

              {/* Subcategories */}
              {availableFilters.subcategories && availableFilters.subcategories.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="albums-outline" size={20} color="#007AFF" />
                    <Text style={styles.sectionTitle}>Kichik kategoriyalar</Text>
                  </View>
                  {availableFilters.subcategories.map((subcategory) => (
                    <TouchableOpacity
                      key={subcategory._id}
                      activeOpacity={0.7}
                      style={[
                        styles.filterItem,
                        filters.subcategory === subcategory._id &&
                          styles.filterItemActive,
                      ]}
                      onPress={() => {
                        console.log('Subcategory pressed:', subcategory.name);
                        setFilters((prev) => {
                          const newSubcategory =
                            prev.subcategory === subcategory._id
                              ? undefined
                              : subcategory._id;
                          const newFilters = {
                            ...prev,
                            subcategory: newSubcategory,
                          };
                          console.log('New filters:', newFilters);
                          return newFilters;
                        });
                      }}
                    >
                      <View style={styles.filterItemLeft}>
                        <View
                          style={[
                            styles.filterItemIcon,
                            filters.subcategory === subcategory._id &&
                              styles.filterItemIconActive,
                          ]}
                        >
                          <Ionicons
                            name={filters.subcategory === subcategory._id ? 'checkmark' : 'albums'}
                            size={18}
                            color={filters.subcategory === subcategory._id ? '#007AFF' : '#666'}
                          />
                        </View>
                        <Text
                          style={[
                            styles.filterItemText,
                            filters.subcategory === subcategory._id &&
                              styles.filterItemTextActive,
                          ]}
                        >
                          {subcategory.name}
                        </Text>
                      </View>
                      {filters.subcategory === subcategory._id && (
                        <View style={styles.checkmarkContainer}>
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color="#333" />
              <Text style={styles.resetButtonText}>Tozalash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.applyButtonText}>Qo'llash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  priceLabelSuffix: {
    fontSize: 12,
    color: '#999',
  },
  priceInputWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  priceInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priceSeparatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 28,
  },
  priceSeparator: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e5e7',
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filterItemActive: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  filterItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterItemIconActive: {
    backgroundColor: '#e6f3ff',
  },
  filterItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  filterItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  emptyFilterContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
