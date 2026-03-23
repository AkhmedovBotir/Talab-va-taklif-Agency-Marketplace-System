import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, Product, Category } from '../../../services/api';
import { formatNumberDisplay } from '../../../utils/formatNumber';

export default function MaxsulotlarScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterModerationStatus, setFilterModerationStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const router = useRouter();

  const loadProducts = useCallback(async () => {
    try {
      const response = await apiService.getMyProducts({ limit: 1000 });
      setProducts(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Maxsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories({ limit: 1000, status: 'active' });
      if (response && response.success && response.data) {
        if (response.data.length === 0) {
          const allResponse = await apiService.getCategories({ limit: 1000 });
          if (allResponse && allResponse.success && allResponse.data) {
            const activeCategories = allResponse.data.filter((cat) => cat.status === 'active');
            setCategories(activeCategories);
          } else {
            setCategories([]);
          }
        } else {
          setCategories(response.data);
        }
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  useEffect(() => {
    const hasFilters = filterCategory !== null || filterStatus !== 'all' || filterModerationStatus !== 'all';
    setHasActiveFilters(hasFilters);
  }, [filterCategory, filterStatus, filterModerationStatus]);

  useFocusEffect(
    useCallback(() => {
      // Refresh products when screen comes into focus
      loadProducts();
    }, [loadProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = filterCategory === null || product.category._id === filterCategory;
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    // Moderation status filter
    const matchesModerationStatus = 
      filterModerationStatus === 'all' || 
      product.moderationStatus === filterModerationStatus;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesModerationStatus;
  });

  const handleResetFilters = () => {
    setFilterCategory(null);
    setFilterStatus('all');
    setFilterModerationStatus('all');
  };

  const handleView = (product: Product) => {
    router.push({
      pathname: '/(tabs)/ombor/product/view',
      params: { productId: product._id },
    });
  };

  const handleEdit = (product: Product) => {
    router.push({
      pathname: '/(tabs)/ombor/product/edit',
      params: { productId: product._id },
    });
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setSubmitting(true);
    try {
      await apiService.deleteProduct(productToDelete._id);
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts();
      Alert.alert('Muvaffaqiyat', 'Maxsulot muvaffaqiyatli o\'chirildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Maxsulot o\'chirishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (product: Product, value: boolean) => {
    try {
      await apiService.updateProductStatus(product._id, {
        status: value ? 'active' : 'inactive',
      });
      loadProducts();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Status yangilashda xatolik');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Maxsulot nomi bo'yicha qidirish..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? "#007AFF" : "#666"} 
          />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Maxsulot topilmadi' : 'Maxsulotlar mavjud emas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleView(item)}
            activeOpacity={0.7}
          >
            {/* Product Image */}
            {item.images && item.images.length > 0 ? (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}

            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <View style={styles.productNameRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.badgesContainer}>
                      {item.censored && (
                        <View style={styles.censoredBadge}>
                          <Ionicons name="warning" size={12} color="#FF6B6B" />
                          <Text style={styles.censoredBadgeText}>18+</Text>
                        </View>
                      )}
                      {item.moderationStatus && (
                        <View style={[
                          styles.moderationBadge,
                          item.moderationStatus === 'approved' && styles.moderationBadgeApproved,
                          item.moderationStatus === 'rejected' && styles.moderationBadgeRejected,
                          item.moderationStatus === 'pending' && styles.moderationBadgePending,
                        ]}>
                          <Text style={[
                            styles.moderationBadgeText,
                            item.moderationStatus === 'approved' && styles.moderationBadgeTextApproved,
                            item.moderationStatus === 'rejected' && styles.moderationBadgeTextRejected,
                            item.moderationStatus === 'pending' && styles.moderationBadgeTextPending,
                          ]}>
                            {item.moderationStatus === 'approved' ? 'Tasdiqlangan' : 
                             item.moderationStatus === 'rejected' ? 'Rad etilgan' : 
                             'Kutilmoqda'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.productCode}>Kod: {item.productCode}</Text>
                </View>
                <Switch
                  value={item.status === 'active'}
                  onValueChange={(value) => handleStatusChange(item, value)}
                  trackColor={{ false: '#ccc', true: '#34C759' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Narx:</Text>
                  <Text style={styles.detailValue}>{formatNumberDisplay(item.price)} so'm</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Miqdor:</Text>
                  <Text style={styles.detailValue}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleView(item);
                  }}
                >
                  <Ionicons name="eye-outline" size={18} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Ko'rish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Tahrirlash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    O'chirish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          router.push('/(tabs)/ombor/product/create' as any);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalScroll} contentContainerStyle={styles.filterModalScrollContent}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategoriya</Text>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterCategory === null && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterCategory === null && styles.filterOptionTextActive,
                  ]}>
                    Barchasi
                  </Text>
                  {filterCategory === null && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.filterOption,
                      filterCategory === category._id && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterCategory(category._id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterCategory === category._id && styles.filterOptionTextActive,
                    ]}>
                      {category.name}
                    </Text>
                    {filterCategory === category._id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filterStatus === status && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterStatus(status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterStatus === status && styles.filterOptionTextActive,
                    ]}>
                      {status === 'all' ? 'Barchasi' : status === 'active' ? 'Faol' : 'Nofaol'}
                    </Text>
                    {filterStatus === status && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Moderation Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Moderatsiya holati</Text>
                {(['all', 'pending', 'approved', 'rejected'] as const).map((modStatus) => (
                  <TouchableOpacity
                    key={modStatus}
                    style={[
                      styles.filterOption,
                      filterModerationStatus === modStatus && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterModerationStatus(modStatus)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filterModerationStatus === modStatus && styles.filterOptionTextActive,
                    ]}>
                      {modStatus === 'all' ? 'Barchasi' : 
                       modStatus === 'pending' ? 'Kutilmoqda' :
                       modStatus === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                    </Text>
                    {filterModerationStatus === modStatus && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.filterResetButtonText}>Tozalash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.filterApplyButtonText}>Qo'llash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning" size={48} color="#FF3B30" />
            <Text style={styles.deleteModalTitle}>O'chirish</Text>
            <Text style={styles.deleteModalText}>
              "{productToDelete?.name}" maxsulotini o'chirmoqchimisiz?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
              >
                <Text style={styles.cancelDeleteButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>O'chirish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
    position: 'relative',
  },
  filterButtonActive: {
    // Active state styling is handled by icon color
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  censoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  censoredBadgeText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  moderationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  moderationBadgePending: {
    backgroundColor: '#FFF3CD',
  },
  moderationBadgeApproved: {
    backgroundColor: '#D1E7DD',
  },
  moderationBadgeRejected: {
    backgroundColor: '#F8D7DA',
  },
  moderationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moderationBadgeTextPending: {
    color: '#856404',
  },
  moderationBadgeTextApproved: {
    color: '#0F5132',
  },
  moderationBadgeTextRejected: {
    color: '#842029',
  },
  productCode: {
    fontSize: 11,
    color: '#666',
  },
  productDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffebeb',
  },
  actionButtonText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  deleteModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmDeleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterModalCloseButton: {
    padding: 4,
  },
  filterModalScroll: {
    flex: 1,
  },
  filterModalScrollContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterResetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  filterApplyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  filterApplyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
