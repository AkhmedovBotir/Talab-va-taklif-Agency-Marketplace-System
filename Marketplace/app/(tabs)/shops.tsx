import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import MaxallaStoreSelectionModal from '../../components/MaxallaStoreSelectionModal';
import ProductCard from '../../components/ui/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { Category, MaxallaStore, Product } from '../../services/api';

export default function CategoriesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotification();
    const { addToCart, getCartItemQuantity } = useCart();
    const { selectedViloyat, selectedTuman, selectedMfy } = useLocation();
    const { isAuthenticated } = useAuth();
    const { showError, showSuccess } = useSnackbar();
    
    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesRefreshing, setCategoriesRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    
    // Subcategories state
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
    
    // Products state
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [storeModalVisible, setStoreModalVisible] = useState(false);
    const [selectedProductForStore, setSelectedProductForStore] = useState<Product | null>(null);

    // Load Categories (parent categories only)
    const loadCategories = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            const response = await apiService.getCategories({ 
                status: 'active',
                includeSubcategories: false,
            });
            // Filter to only show parent categories (no parent)
            const parentCategories = response.data.filter(cat => !cat.parent);
            setCategories(parentCategories);
        } catch (error: any) {
            console.error('Error loading categories:', error);
            Alert.alert('Xatolik', error.message || 'Kategoriyalarni yuklashda xatolik yuz berdi');
        } finally {
            setCategoriesLoading(false);
            setCategoriesRefreshing(false);
        }
    }, []);

    // Load Subcategories for selected category
    const loadSubcategories = useCallback(async (categoryId: string) => {
        try {
            setSubcategoriesLoading(true);
            const response = await apiService.getCategoryById(categoryId, true);
            if (response.success && response.data) {
                const category = response.data;
                // Get subcategories from the category
                const subs = category.subcategories || [];
                setSubcategories(subs);
            }
        } catch (error: any) {
            console.error('Error loading subcategories:', error);
            Alert.alert('Xatolik', error.message || 'Kichik kategoriyalarni yuklashda xatolik yuz berdi');
        } finally {
            setSubcategoriesLoading(false);
        }
    }, []);

    // Load Products for selected subcategory
    const loadProducts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (!selectedSubcategory) return;

        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await apiService.getProducts({
                page: pageNum,
                limit: 20,
                status: 'active',
                subcategory: selectedSubcategory._id,
            });

            // Filter products by selected tuman
            let filteredProducts = response.data;
            if (selectedTuman) {
                filteredProducts = response.data.filter((product) => {
                    if (!product.deliveryRegions || product.deliveryRegions.length === 0) {
                        return false;
                    }
                    const matches = product.deliveryRegions.some((region) => {
                        if (region.tuman) {
                            return region.tuman._id === selectedTuman._id;
                        }
                        if (region.viloyat && selectedViloyat) {
                            return region.viloyat._id === selectedViloyat._id;
                        }
                        return false;
                    });
                    return matches;
                });
            }

            if (append) {
                setProducts((prev) => [...prev, ...filteredProducts]);
            } else {
                setProducts(filteredProducts);
            }

            setPage(response.page);
            setHasMore(response.page < response.totalPages);
        } catch (error: any) {
            console.error('Error loading products:', error);
            Alert.alert('Xatolik', error.message || 'Mahsulotlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [selectedSubcategory, selectedTuman, selectedViloyat]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadSubcategories(selectedCategory._id);
            setSelectedSubcategory(null);
            setProducts([]);
        }
    }, [selectedCategory, loadSubcategories]);

    useEffect(() => {
        if (selectedSubcategory) {
            setPage(1);
            setHasMore(true);
            setSearchQuery('');
            loadProducts(1, false);
        }
    }, [selectedSubcategory, loadProducts]);

    // Local filter - search query ga qarab mahsulotlarni filter qilish
    const filteredProducts = searchQuery.trim()
        ? products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
          )
        : products;

    const handleRefresh = useCallback(() => {
        if (selectedSubcategory) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
            setSearchQuery('');
            loadProducts(1, false);
        } else if (selectedCategory) {
            setCategoriesRefreshing(true);
            loadSubcategories(selectedCategory._id);
        } else {
            setCategoriesRefreshing(true);
            loadCategories();
        }
    }, [selectedCategory, selectedSubcategory, loadCategories, loadSubcategories, loadProducts]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !searchQuery.trim() && selectedSubcategory) {
            loadProducts(page + 1, true);
        }
    }, [loadingMore, hasMore, page, loadProducts, searchQuery, selectedSubcategory]);

    const handleCategoryPress = (category: Category) => {
        setSelectedCategory(category);
    };

    const handleSubcategoryPress = (subcategory: Category) => {
        setSelectedSubcategory(subcategory);
    };

    const handleBackPress = () => {
        if (selectedSubcategory) {
            setSelectedSubcategory(null);
            setProducts([]);
        setSearchQuery('');
        setPage(1);
        setHasMore(true);
        } else if (selectedCategory) {
            setSelectedCategory(null);
            setSubcategories([]);
            setSelectedSubcategory(null);
            setProducts([]);
            setSearchQuery('');
            setPage(1);
            setHasMore(true);
        }
    };

    const handleProductPress = (product: Product) => {
        router.push(`/product/${product._id}` as any);
    };

    const handleAddToCart = async (product: Product) => {
        if (!isAuthenticated) {
            Alert.alert('Kirish kerak', 'Korzinkaga qo\'shish uchun tizimga kiring');
            return;
        }

        const productType = product.productType || 'tuman';
        
        // For maxalla products, show store selection modal
        if (productType === 'maxalla') {
            // Check if user has selected MFY
            if (!selectedMfy) {
                showError('Maxalla mahsulotlarini qo\'shish uchun MFY tanlang');
                return;
            }
            setSelectedProductForStore(product);
            setStoreModalVisible(true);
            return;
        }

        // For tuman products, add directly to cart
        try {
            await addToCart(product._id, 1, productType);
            showSuccess(`${product.name} korzinkaga qo'shildi`);
        } catch (error) {
            // Error is already shown in context
        }
    };

    const handleStoreSelect = async (store: MaxallaStore) => {
        if (!selectedProductForStore) return;

        try {
            // Add the selected store's product to maxalla cart
            await addToCart(store.product._id, 1, 'maxalla');
            showSuccess(`${selectedProductForStore.name} ${store.contragent.name} dokonidan korzinkaga qo'shildi`);
            setStoreModalVisible(false);
            setSelectedProductForStore(null);
        } catch (error) {
            // Error is already shown in context
        }
    };

    const handleNotificationPress = () => {
        router.push('/notifications' as any);
    };

    // Render Category Item
    const renderCategoryItem = ({ item }: { item: Category }) => {
        const imageUri = item.image || undefined;
        
        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.categoryIconContainer}>
                    {imageUri ? (
                        <Image 
                            source={{ uri: imageUri }} 
                            style={styles.categoryImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="grid-outline" size={32} color="#007AFF" />
                    )}
                </View>
                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName} numberOfLines={2}>
                        {item.name}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    // Render Subcategory Item
    const renderSubcategoryItem = ({ item }: { item: Category }) => {
        const imageUri = item.image || undefined;

        return (
        <TouchableOpacity
                style={styles.subcategoryCard}
                onPress={() => handleSubcategoryPress(item)}
            activeOpacity={0.8}
        >
                <View style={styles.subcategoryIconContainer}>
                    {imageUri ? (
                    <Image 
                            source={{ uri: imageUri }} 
                            style={styles.subcategoryImage}
                        resizeMode="cover"
                    />
                ) : (
                        <Ionicons name="folder-outline" size={28} color="#007AFF" />
                )}
            </View>
                <View style={styles.subcategoryInfo}>
                    <Text style={styles.subcategoryName} numberOfLines={2}>
                    {item.name}
                    </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
    );
    };

    // Render Product Item
    const renderProductItem = ({ item }: { item: Product }) => {
        const productType = item.productType || 'tuman';
        const isInCart = getCartItemQuantity(item._id, productType) > 0;
        return (
            <ProductCard
                product={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                isInCart={isInCart}
            />
    );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

    const renderEmptyCategories = () => {
        if (categoriesLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Kategoriyalar topilmadi</Text>
            </View>
        );
    };

    const renderEmptySubcategories = () => {
        if (subcategoriesLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="folder-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Kichik kategoriyalar topilmadi</Text>
            </View>
        );
    };

    const renderEmptyProducts = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
            </View>
        );
    };

    // Show Categories List
    if (!selectedCategory) {
        return (
            <View style={styles.container}>
                <Header 
                    title="Kategoriyalar" 
                    onNotificationPress={handleNotificationPress} 
                    unreadCount={unreadCount} 
                />

                {categoriesLoading && categories.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 100 },
                        ]}
                        refreshControl={
                            <RefreshControl refreshing={categoriesRefreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={renderEmptyCategories}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        );
    }

    // Show Subcategories List
    if (!selectedSubcategory) {
    return (
        <View style={styles.container}>
            <Header 
                    title={selectedCategory.name} 
                    onNotificationPress={handleNotificationPress} 
                    unreadCount={unreadCount}
                    showBackButton
                    onBackPress={handleBackPress}
                />

                {subcategoriesLoading && subcategories.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <FlatList
                        data={subcategories}
                        renderItem={renderSubcategoryItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 100 },
                        ]}
                        refreshControl={
                            <RefreshControl refreshing={categoriesRefreshing} onRefresh={handleRefresh} />
                        }
                        ListEmptyComponent={renderEmptySubcategories}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        );
    }

    // Show Products List
    return (
        <View style={styles.container}>
            <Header 
                title={selectedSubcategory.name} 
                onNotificationPress={handleNotificationPress} 
                unreadCount={unreadCount}
                showBackButton
                onBackPress={handleBackPress}
            />

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Mahsulot qidirish..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && products.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 100 },
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={!searchQuery.trim() ? handleLoadMore : undefined}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmptyProducts}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Maxalla Store Selection Modal */}
            {selectedProductForStore && (
                <MaxallaStoreSelectionModal
                    visible={storeModalVisible}
                    productId={selectedProductForStore._id}
                    productName={selectedProductForStore.name}
                    onClose={() => {
                        setStoreModalVisible(false);
                        setSelectedProductForStore(null);
                    }}
                    onSelectStore={handleStoreSelect}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    listContent: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    categoryImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    categoryInfo: {
        flex: 1,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    subcategoryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    subcategoryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    subcategoryImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    subcategoryInfo: {
        flex: 1,
        marginRight: 12,
    },
    subcategoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});
