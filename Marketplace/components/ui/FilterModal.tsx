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
  hideContragentFilter?: boolean;
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
  hideContragentFilter = false,
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

  const [contragentSearch, setContragentSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [subcategoryDropdownVisible, setSubcategoryDropdownVisible] = useState(false);

  const loadFilters = useCallback(async (currentFilters?: any) => {
    const filtersToUse = currentFilters !== undefined ? currentFilters : filters;
    setLoading(true);
    try {
      const response = await apiService.filterProducts({
        minPrice: filtersToUse.minPrice,
        maxPrice: filtersToUse.maxPrice,
        contragent: filtersToUse.contragent,
        category: filtersToUse.category,
        subcategory: filtersToUse.subcategory,
        page: 1,
        limit: 1,
      });

      if (response && response.availableFilters) {
        setAvailableFilters({
          contragents: response.availableFilters.contragents || [],
          categories: response.availableFilters.categories || [],
          subcategories: response.availableFilters.subcategories || [],
        });
      } else {
        setAvailableFilters({
          contragents: [],
          categories: [],
          subcategories: [],
        });
      }
    } catch (error: any) {
        console.error('Error loading filters:', error);
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
      setCategoryDropdownVisible(false);
      setSubcategoryDropdownVisible(false);
      
      const timer = setTimeout(() => {
        loadFilters(resetFilters);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setAvailableFilters({
        contragents: [],
        categories: [],
        subcategories: [],
      });
      setContragentSearch('');
      setCategorySearch('');
      setCategoryDropdownVisible(false);
      setSubcategoryDropdownVisible(false);
    }
  }, [visible, initialFilters, loadFilters]);

  useEffect(() => {
    if (visible && (filters.contragent || filters.category || filters.subcategory)) {
      const timer = setTimeout(() => {
        loadFilters(filters);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filters.contragent, filters.category, filters.subcategory, visible, loadFilters]);

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

  const activeFiltersCount = 
    (filters.contragent ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerDragIndicator} />
            </View>
            <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                  <Ionicons name="filter" size={22} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Filterlar</Text>
                  {activeFiltersCount > 0 && (
                <Text style={styles.headerSubtitle}>
                      {activeFiltersCount} ta filter tanlangan
                </Text>
                  )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Price Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="cash-outline" size={20} color="#007AFF" />
                </View>
                <Text style={styles.sectionTitle}>Narx oralig'i</Text>
              </View>
              <View style={styles.priceCard}>
                <View style={styles.priceRow}>
                  <View style={styles.priceInputGroup}>
                      <Text style={styles.priceLabel}>Min narx</Text>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#999"
                        value={minPriceText}
                        onChangeText={(value) => handlePriceChange('min', value)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.priceSuffix}>so'm</Text>
                    </View>
                  </View>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceInputGroup}>
                      <Text style={styles.priceLabel}>Max narx</Text>
                    <View style={styles.priceInputWrapper}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor="#999"
                        value={maxPriceText}
                        onChangeText={(value) => handlePriceChange('max', value)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.priceSuffix}>so'm</Text>
                    </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contragents */}
            {!hideContragentFilter && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                  <Ionicons name="storefront-outline" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.sectionTitle}>Do'konlar</Text>
                </View>
                {loading && (!availableFilters.contragents || availableFilters.contragents.length === 0) ? (
                  <View style={styles.emptyFilterContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.emptyFilterText}>Yuklanmoqda...</Text>
                  </View>
                ) : availableFilters.contragents && availableFilters.contragents.length > 0 ? (
                  <>
                    <View style={styles.searchCard}>
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
                      <View style={styles.filterList}>
                        {availableFilters.contragents
                        .filter((contragent) =>
                          contragent.name.toLowerCase().includes(contragentSearch.toLowerCase())
                        )
                        .map((contragent) => (
                        <TouchableOpacity
                          key={contragent._id}
                          activeOpacity={0.7}
                          style={[
                                styles.filterCard,
                                filters.contragent === contragent._id && styles.filterCardActive,
                          ]}
                          onPress={() => {
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
                            setFilters(newFilters);
                            loadFilters(newFilters);
                          }}
                        >
                              <View style={styles.filterCardContent}>
                                <View style={[
                                  styles.filterCheckbox,
                                  filters.contragent === contragent._id && styles.filterCheckboxActive,
                                ]}>
                                  {filters.contragent === contragent._id && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                  )}
                            </View>
                                <Text style={[
                                  styles.filterCardText,
                                  filters.contragent === contragent._id && styles.filterCardTextActive,
                                ]}>
                              {contragent.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                          ))}
                      </View>
                    ) : (
                      <View style={styles.emptyFilterContainer}>
                        <Ionicons name="search-outline" size={40} color="#ddd" />
                        <Text style={styles.emptyFilterText}>
                          "{contragentSearch}" bo'yicha topilmadi
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyFilterContainer}>
                    <Ionicons name="storefront-outline" size={40} color="#ddd" />
                    <Text style={styles.emptyFilterText}>Do'konlar topilmadi</Text>
                  </View>
                )}
              </View>
            )}

            {/* Categories - Select Dropdown */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="folder-outline" size={20} color="#007AFF" />
                </View>
                  <Text style={styles.sectionTitle}>Kategoriyalar</Text>
                </View>
                {loading && (!availableFilters.categories || availableFilters.categories.length === 0) ? (
                  <View style={styles.emptyFilterContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.emptyFilterText}>Yuklanmoqda...</Text>
                  </View>
                ) : availableFilters.categories && availableFilters.categories.length > 0 ? (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setCategoryDropdownVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.selectButtonText,
                    filters.category && styles.selectButtonTextSelected
                  ]}>
                    {filters.category 
                      ? availableFilters.categories.find(c => c._id === filters.category)?.name || 'Kategoriya tanlang'
                      : 'Kategoriya tanlang'}
                  </Text>
                  <Ionicons 
                    name={categoryDropdownVisible ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={filters.category ? '#007AFF' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyFilterContainer}>
                  <Ionicons name="folder-outline" size={40} color="#ddd" />
                  <Text style={styles.emptyFilterText}>Kategoriyalar topilmadi</Text>
                </View>
              )}
            </View>

            {/* Subcategories - Select Dropdown */}
            {availableFilters.subcategories && availableFilters.subcategories.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name="albums-outline" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.sectionTitle}>Kichik kategoriyalar</Text>
                </View>
                        <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setSubcategoryDropdownVisible(true)}
                          activeOpacity={0.7}
                        >
                  <Text style={[
                    styles.selectButtonText,
                    filters.subcategory && styles.selectButtonTextSelected
                  ]}>
                    {filters.subcategory 
                      ? availableFilters.subcategories.find(s => s._id === filters.subcategory)?.name || 'Kichik kategoriya tanlang'
                      : 'Kichik kategoriya tanlang'}
                  </Text>
                  <Ionicons 
                    name={subcategoryDropdownVisible ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={filters.subcategory ? '#007AFF' : '#9CA3AF'} 
                  />
                        </TouchableOpacity>
              </View>
                      )}
          </ScrollView>

          {/* Category Dropdown Modal */}
          <Modal
            visible={categoryDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCategoryDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.dropdownBackdrop}
              activeOpacity={1}
              onPress={() => setCategoryDropdownVisible(false)}
            >
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Kategoriya tanlang</Text>
                  <TouchableOpacity onPress={() => setCategoryDropdownVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                    </View>
                <ScrollView style={styles.dropdownScrollView}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      !filters.category && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setFilters(prev => ({ ...prev, category: undefined, subcategory: undefined }));
                      setCategoryDropdownVisible(false);
                      loadFilters({ ...filters, category: undefined, subcategory: undefined });
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      !filters.category && styles.dropdownItemTextActive,
                    ]}>
                      Barchasi
                    </Text>
                    {!filters.category && (
                      <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  {availableFilters.categories.map((category) => (
                        <TouchableOpacity
                          key={category._id}
                          style={[
                        styles.dropdownItem,
                        filters.category === category._id && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                        const newCategory = filters.category === category._id ? undefined : category._id;
                            const newFilters = {
                              ...filters,
                              category: newCategory,
                              subcategory: undefined,
                            };
                            setFilters(newFilters);
                        setCategoryDropdownVisible(false);
                            loadFilters(newFilters);
                          }}
                        >
                      <Text style={[
                        styles.dropdownItemText,
                        filters.category === category._id && styles.dropdownItemTextActive,
                      ]}>
                              {category.name}
                            </Text>
                          {filters.category === category._id && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                  ))}
                </ScrollView>
                      </View>
            </TouchableOpacity>
          </Modal>

          {/* Subcategory Dropdown Modal */}
          <Modal
            visible={subcategoryDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSubcategoryDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.dropdownBackdrop}
              activeOpacity={1}
              onPress={() => setSubcategoryDropdownVisible(false)}
            >
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Kichik kategoriya tanlang</Text>
                  <TouchableOpacity onPress={() => setSubcategoryDropdownVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                  </View>
                <ScrollView style={styles.dropdownScrollView}>
                    <TouchableOpacity
                      style={[
                      styles.dropdownItem,
                      !filters.subcategory && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                      setFilters(prev => ({ ...prev, subcategory: undefined }));
                      setSubcategoryDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      !filters.subcategory && styles.dropdownItemTextActive,
                    ]}>
                      Barchasi
                    </Text>
                    {!filters.subcategory && (
                      <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  {availableFilters.subcategories.map((subcategory) => (
                    <TouchableOpacity
                      key={subcategory._id}
                          style={[
                        styles.dropdownItem,
                        filters.subcategory === subcategory._id && styles.dropdownItemActive,
                          ]}
                      onPress={() => {
                        const newSubcategory = filters.subcategory === subcategory._id ? undefined : subcategory._id;
                        setFilters(prev => ({ ...prev, subcategory: newSubcategory }));
                        setSubcategoryDropdownVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        filters.subcategory === subcategory._id && styles.dropdownItemTextActive,
                      ]}>
                          {subcategory.name}
                        </Text>
                      {filters.subcategory === subcategory._id && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color="#666" />
              <Text style={styles.resetButtonText}>Tozalash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Qo'llash</Text>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerTop: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  priceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputGroup: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    padding: 0,
  },
  priceSuffix: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 6,
  },
  priceDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
    marginTop: 24,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  filterList: {
    gap: 8,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
    borderWidth: 2,
    shadowColor: '#007AFF',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCheckboxActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterCardText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  filterCardTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyFilterContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minHeight: 52,
  },
  selectButtonText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  selectButtonTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownScrollView: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
