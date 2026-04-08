import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, BaseProduct, MaxallaProduct } from '../../services/api';

export default function ProductsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const modalKeyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<MaxallaProduct[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBaseProductModal, setShowBaseProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MaxallaProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<MaxallaProduct | null>(null);
  const [availableBaseProducts, setAvailableBaseProducts] = useState<BaseProduct[]>([]);
  const [loadingBaseProducts, setLoadingBaseProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');

  // Form states
  const [selectedBaseProduct, setSelectedBaseProduct] = useState<BaseProduct | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  const loadProducts = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await apiService.getMaxallaProducts(token);
      if (response.success) {
        // response is PaginatedResponse<MaxallaProduct>
        // response.data is MaxallaProduct[]
        setProducts(response.data || []);
      }
    } catch (error: any) {
      if (!isRefresh) {
        showSnackbar(error.message || 'Maxsulotlarni yuklashda xatolik');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadProducts(true);
  };

  const loadAvailableBaseProducts = async () => {
    if (!token) return;
    setLoadingBaseProducts(true);
    try {
      const response = await apiService.getAvailableBaseProducts(token, {
        search: searchQuery.trim() || undefined,
      });
      if (response.success) {
        // Create flowda allaqachon qo'shilgan template'larni yashiramiz.
        const usedTemplateIds = new Set(
          products.map((product) => String(product.baseProduct?._id || ''))
        );
        const filteredTemplates = (response.data || []).filter(
          (template) => !usedTemplateIds.has(String(template._id))
        );
        setAvailableBaseProducts(filteredTemplates);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Maxsulotlarni yuklashda xatolik');
    } finally {
      setLoadingBaseProducts(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedBaseProduct || !quantity.trim() || !price.trim() || !originalPrice.trim()) {
      showSnackbar('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFormattedNumber(price);
    const originalPriceNum = parseFormattedNumber(originalPrice);

    if (isNaN(quantityNum) || quantityNum < 0) {
      showSnackbar('Miqdor to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      showSnackbar('Narx to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    if (isNaN(originalPriceNum) || originalPriceNum < 0) {
      showSnackbar('Asl narx to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      const response = await apiService.createMaxallaProduct(token, {
        template_id: Number(selectedBaseProduct._id),
        quantity: quantityNum,
        price: priceNum,
        original_price: originalPriceNum,
      });

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        showSnackbar('Maxsulot yaratildi', 'success');
        loadProducts();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Maxsulot yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct || !quantity.trim() || !price.trim() || !originalPrice.trim()) return;
    if (!token) return;

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFormattedNumber(price);
    const originalPriceNum = parseFormattedNumber(originalPrice);

    if (isNaN(quantityNum) || quantityNum < 0) {
      showSnackbar('Miqdor to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      showSnackbar('Narx to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    if (isNaN(originalPriceNum) || originalPriceNum < 0) {
      showSnackbar('Asl narx to\'g\'ri raqam bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateMaxallaProduct(token, selectedProduct._id, {
        template_id: selectedBaseProduct ? Number(selectedBaseProduct._id) : undefined,
        quantity: quantityNum,
        price: priceNum,
        original_price: originalPriceNum,
      });

      if (response.success) {
        setShowEditModal(false);
        resetForm();
        showSnackbar('Maxsulot yangilandi', 'success');
        loadProducts();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Maxsulot yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product: MaxallaProduct) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!token || !productToDelete) return;
    setLoading(true);
    try {
      const response = await apiService.deleteMaxallaProduct(token, productToDelete._id);
      if (response.success) {
        setShowDeleteModal(false);
        setProductToDelete(null);
        showSnackbar('Maxsulot o\'chirildi', 'success');
        loadProducts();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Maxsulot o\'chirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product: MaxallaProduct) => {
    setSelectedProduct(product);
    setSelectedBaseProduct(product.baseProduct);
    setQuantity(product.quantity.toString());
    setPrice(formatCurrency(product.price));
    setOriginalPrice(formatCurrency(product.originalPrice));
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedBaseProduct(null);
    setQuantity('');
    setPrice('');
    setOriginalPrice('');
    setSelectedProduct(null);
    setSearchQuery('');
    setAvailableBaseProducts([]);
  };

  const openBaseProductModal = () => {
    setSearchQuery('');
    setAvailableBaseProducts([]);
    setShowBaseProductModal(true);
    loadAvailableBaseProducts();
  };

  const selectBaseProduct = (baseProduct: BaseProduct) => {
    setSelectedBaseProduct(baseProduct);
    setShowBaseProductModal(false);
    setSearchQuery('');
    setAvailableBaseProducts([]);
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const formatNumberInput = (value: string) => {
    // Faqat raqamlarni olib tashlash
    const numbers = value.replace(/\D/g, '');
    // Formatlash (3 ta raqamdan keyin bo'shliq)
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const parseFormattedNumber = (value: string): number => {
    // Formatlangan stringdan raqamni olish
    const numbers = value.replace(/\D/g, '');
    return numbers ? parseFloat(numbers) : 0;
  };

  const getImageUri = (product: BaseProduct): string | null => {
    const firstImage = product.images?.[0];
    if (!firstImage) return null;
    if (
      firstImage.startsWith('http://') ||
      firstImage.startsWith('https://') ||
      firstImage.startsWith('data:')
    ) {
      return firstImage;
    }
    return `data:image/jpeg;base64,${firstImage}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !listSearchQuery.trim() ||
      product.baseProduct.name.toLowerCase().includes(listSearchQuery.trim().toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderProduct = ({ item }: { item: MaxallaProduct }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.baseProduct.name}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productCategory}>Kategoriya: {item.baseProduct.category.name}</Text>
            {item.baseProduct.subcategory && (
              <Text style={styles.productSubcategory}>Subkategoriya: {item.baseProduct.subcategory.name}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
          <Text
            style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
            {item.status === 'active' ? 'Faol' : 'Nofaol'}
          </Text>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Miqdor:</Text>
          <Text style={styles.detailValue}>
            {item.quantity} {item.baseProduct.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Narx:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.price)} so'm</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Asl narx:</Text>
          <Text style={[styles.detailValue, styles.originalPrice]}>
            {formatCurrency(item.originalPrice)} so'm
          </Text>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color="#007AFF" />
          <Text style={styles.editButtonText}>Tahrirlash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>O'chirish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBaseProduct = ({ item }: { item: BaseProduct }) => (
    <TouchableOpacity
      style={styles.baseProductItem}
      onPress={() => selectBaseProduct(item)}
      activeOpacity={0.7}>
      {getImageUri(item) ? (
        <Image source={{ uri: getImageUri(item)! }} style={styles.baseProductImage} resizeMode="cover" />
      ) : (
        <View style={styles.baseProductImagePlaceholder}>
          <Ionicons name="image-outline" size={18} color="#999" />
        </View>
      )}
      <View style={styles.baseProductInfo}>
        <Text style={styles.baseProductName}>{item.name}</Text>
        <Text style={styles.baseProductCategory}>
          {item.category.name}
          {item.subcategory && ` • ${item.subcategory.name}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.pageContent, isWeb && styles.pageContentWeb]}>
        <View style={styles.header}>
          <Text style={styles.title}>Ombor</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            activeOpacity={0.8}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.listSearchInput}
              placeholder="Mahsulot qidirish..."
              placeholderTextColor="#999"
              value={listSearchQuery}
              onChangeText={setListSearchQuery}
            />
          </View>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
              activeOpacity={0.8}>
              <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                Barchasi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'active' && styles.filterChipActive]}
              onPress={() => setStatusFilter('active')}
              activeOpacity={0.8}>
              <Text style={[styles.filterChipText, statusFilter === 'active' && styles.filterChipTextActive]}>
                Faol
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'inactive' && styles.filterChipActive]}
              onPress={() => setStatusFilter('inactive')}
              activeOpacity={0.8}>
              <Text style={[styles.filterChipText, statusFilter === 'inactive' && styles.filterChipTextActive]}>
                Nofaol
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && filteredProducts.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filteredProducts.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {products.length === 0
                ? 'Hozircha maxsulot yo\'q'
                : 'Qidiruv bo\'yicha maxsulot topilmadi'}
            </Text>
            {products.length === 0 && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                activeOpacity={0.7}>
                <Text style={styles.emptyStateButtonText}>Qo'shish</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            style={styles.list}
          />
        )}
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={modalKeyboardBehavior}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi maxsulot</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={styles.selectButton}
                onPress={openBaseProductModal}
                activeOpacity={0.7}>
                <View style={styles.selectButtonContent}>
                  <Text
                    style={[
                      styles.selectButtonText,
                      !selectedBaseProduct && styles.selectButtonTextPlaceholder,
                    ]}>
                    {selectedBaseProduct
                      ? selectedBaseProduct.name
                      : 'Asosiy maxsulotni tanlang'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              {selectedBaseProduct && (
                <View style={styles.selectedProductInfo}>
                  {getImageUri(selectedBaseProduct) && (
                    <Image
                      source={{ uri: getImageUri(selectedBaseProduct)! }}
                      style={styles.selectedProductImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.selectedProductName}>{selectedBaseProduct.name}</Text>
                  <Text style={styles.selectedProductCategory}>
                    {selectedBaseProduct.category.name}
                    {selectedBaseProduct.subcategory &&
                      ` • ${selectedBaseProduct.subcategory.name}`}
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Miqdor (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Miqdor kiriting"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  editable={!loading}
                />
                {selectedBaseProduct && (
                  <Text style={styles.unitHint}>
                    Birlik: {selectedBaseProduct.unit} (1 {selectedBaseProduct.unit} ={' '}
                    {selectedBaseProduct.unitSize})
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Narx, so'm (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Narx kiriting"
                  value={price}
                  onChangeText={(text) => setPrice(formatNumberInput(text))}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Asl narx, so'm (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Asl narx kiriting"
                  value={originalPrice}
                  onChangeText={(text) => setOriginalPrice(formatNumberInput(text))}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>


              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (loading ||
                    !selectedBaseProduct ||
                    !quantity.trim() ||
                    !price.trim() ||
                    !originalPrice.trim()) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={
                  loading ||
                  !selectedBaseProduct ||
                  !quantity.trim() ||
                  !price.trim() ||
                  !originalPrice.trim()
                }
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>Saqlash</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={modalKeyboardBehavior}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maxsulotni tahrirlash</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              {selectedBaseProduct && (
                <View style={styles.selectedProductInfo}>
                  {getImageUri(selectedBaseProduct) && (
                    <Image
                      source={{ uri: getImageUri(selectedBaseProduct)! }}
                      style={styles.selectedProductImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.selectedProductName}>{selectedBaseProduct.name}</Text>
                  {selectedBaseProduct.description && (
                    <Text style={styles.selectedProductDescription}>
                      {selectedBaseProduct.description}
                    </Text>
                  )}
                  <Text style={styles.selectedProductCategory}>
                    {selectedBaseProduct.category.name}
                    {selectedBaseProduct.subcategory &&
                      ` • ${selectedBaseProduct.subcategory.name}`}
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Miqdor (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Miqdor kiriting"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  editable={!loading}
                />
                {selectedBaseProduct && (
                  <Text style={styles.unitHint}>
                    Birlik: {selectedBaseProduct.unit} (1 {selectedBaseProduct.unit} ={' '}
                    {selectedBaseProduct.unitSize})
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Narx, so'm (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Narx kiriting"
                  value={price}
                  onChangeText={(text) => setPrice(formatNumberInput(text))}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Asl narx, so'm (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Asl narx kiriting"
                  value={originalPrice}
                  onChangeText={(text) => setOriginalPrice(formatNumberInput(text))}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>


              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (loading || !quantity.trim() || !price.trim() || !originalPrice.trim()) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleUpdate}
                disabled={loading || !quantity.trim() || !price.trim() || !originalPrice.trim()}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>Saqlash</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Base Product Selection Modal */}
      <Modal
        visible={showBaseProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBaseProductModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asosiy maxsulotni tanlang</Text>
              <TouchableOpacity
                onPress={() => setShowBaseProductModal(false)}
                style={styles.closeButton}
                disabled={loadingBaseProducts}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={loadAvailableBaseProducts}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={loadAvailableBaseProducts}
                activeOpacity={0.7}>
                <Ionicons name="search" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {loadingBaseProducts ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : availableBaseProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Maxsulot topilmadi</Text>
              </View>
            ) : (
              <FlatList
                data={availableBaseProducts}
                renderItem={renderBaseProduct}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.baseProductList}
                style={styles.baseProductFlatList}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (loading) return;
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}>
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>O'chirish</Text>
            <Text style={styles.deleteModalText}>
              {productToDelete
                ? `"${productToDelete.baseProduct.name}" ni o'chirishni tasdiqlaysizmi?`
                : 'Maxsulotni o\'chirishni tasdiqlaysizmi?'}
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                disabled={loading}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton, loading && styles.saveButtonDisabled]}
                onPress={confirmDelete}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>O'chirish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  pageContent: {
    flex: 1,
    width: '100%',
  },
  pageContentWeb: {
    maxWidth: 1100,
    alignSelf: 'center',
  },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  listSearchInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
    color: '#1a1a1a',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f2f3f5',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    color: '#5b6470',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productMeta: {
    marginTop: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
  },
  productSubcategory: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  productDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Platform.OS === 'web' ? 20 : 20,
    borderTopRightRadius: Platform.OS === 'web' ? 20 : 20,
    borderBottomLeftRadius: Platform.OS === 'web' ? 20 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 20 : 0,
    maxHeight: '90%',
    height: Platform.OS === 'web' ? '86%' : undefined,
    minHeight: Platform.OS === 'web' ? 420 : undefined,
    flex: Platform.OS === 'web' ? 0 : 1,
    width: Platform.OS === 'web' ? '92%' : '100%',
    maxWidth: Platform.OS === 'web' ? 760 : undefined,
    overflow: 'hidden',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  modalScrollView: {
    flex: 1,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  selectButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  selectButtonTextPlaceholder: {
    color: '#999',
  },
  selectedProductInfo: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedProductImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#eef2f7',
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedProductDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedProductCategory: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  unitHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseProductList: {
    padding: 20,
  },
  baseProductFlatList: {
    flex: 1,
  },
  baseProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  baseProductImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eef2f7',
  },
  baseProductImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseProductInfo: {
    flex: 1,
  },
  baseProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  baseProductDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  baseProductCategory: {
    fontSize: 12,
    color: '#999',
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 18,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f4f7',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#e5484d',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
