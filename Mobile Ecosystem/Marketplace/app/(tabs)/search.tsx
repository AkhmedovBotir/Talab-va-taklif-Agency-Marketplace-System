import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import FilterModal from '../../components/ui/FilterModal';
import ProductCard from '../../components/ui/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { MaxallaStore, Product } from '../../services/api';

// Helper function to calculate age from birthDate
const calculateAge = (birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        
        if (isNaN(birth.getTime())) return null;
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    } catch (error) {
        console.error('Error calculating age:', error);
        return null;
    }
};

export default function SearchScreen() {
    const router = useRouter();
    const { contragentId, contragentName, initialTab } = useLocalSearchParams<{
        contragentId?: string;
        contragentName?: string;
        initialTab?: 'tuman' | 'maxalla';
    }>();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotification();
    const { user, token } = useAuth();
    const { selectedTuman, selectedViloyat, selectedMfy } = useLocation();
    const { showError, showSuccess } = useSnackbar();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'tuman' | 'maxalla'>(
        initialTab === 'maxalla' ? 'maxalla' : 'tuman'
    );
    const [contragentFilter, setContragentFilter] = useState<string | undefined>(contragentId || undefined);
    const [contragentFilterName, setContragentFilterName] = useState<string | undefined>(contragentName || undefined);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        category?: string;
        subcategory?: string;
    }>({});
    const [storeModalVisible, setStoreModalVisible] = useState(false);
    const [selectedProductForStore, setSelectedProductForStore] = useState<Product | null>(null);

    // Debounce search query - 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadProducts = useCallback(
        async (pageNum: number = 1, append: boolean = false, searchText?: string) => {
            try {
                if (!append) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const queryToUse = searchText !== undefined ? searchText : debouncedSearchQuery;

                // Use search API if search query exists, otherwise use contragent filter
                if (queryToUse.trim()) {
                    const response = await apiService.search({
                        q: queryToUse.trim(),
                        page: pageNum,
                        limit: 20,
                    });

                    let searchProducts = response.results.products.data || [];

                    // Filter products by selected tuman
                    if (selectedTuman) {
                        searchProducts = searchProducts.filter((product) => {
                            if (!product.deliveryRegions || product.deliveryRegions.length === 0) {
                                return false; // Hide products without delivery regions
                            }
                            return product.deliveryRegions.some((region) => {
                                return region.tuman?._id === selectedTuman._id;
                            });
                        });
                    }

                    // Filter censored products for users under 18
                    const userAge = calculateAge(user?.birthDate);
                    if (userAge !== null && userAge < 18) {
                        searchProducts = searchProducts.filter((product) => {
                            if (product.censored === true) {
                                return false;
                            }
                            return true;
                        });
                    }

                    if (append) {
                        setProducts((prev) => [...prev, ...searchProducts]);
                    } else {
                        setProducts(searchProducts);
                    }

                    setPage(response.results.products.page);
                    setHasMore(response.results.products.page < response.results.products.totalPages);
                } else if (contragentFilter) {
                    // Use filter API with contragent and category/subcategory filters
                    const response = await apiService.filterProducts({
                        contragent: contragentFilter,
                        category: activeFilters.category,
                        subcategory: activeFilters.subcategory,
                        page: pageNum,
                        limit: 20,
                    });

                    let filteredProducts = response.results.data || [];

                    // Filter products by selected tuman
                    if (selectedTuman) {
                        filteredProducts = filteredProducts.filter((product) => {
                            if (!product.deliveryRegions || product.deliveryRegions.length === 0) {
                                return false; // Hide products without delivery regions
                            }
                            return product.deliveryRegions.some((region) => {
                                return region.tuman?._id === selectedTuman._id;
                            });
                        });
                    }

                    // Filter censored products for users under 18
                    const userAge = calculateAge(user?.birthDate);
                    if (userAge !== null && userAge < 18) {
                        filteredProducts = filteredProducts.filter((product) => {
                            if (product.censored === true) {
                                return false;
                            }
                            return true;
                        });
                    }

                    if (append) {
                        setProducts((prev) => [...prev, ...filteredProducts]);
                    } else {
                        setProducts(filteredProducts);
                    }

                    setPage(response.results.page);
                    setHasMore(response.results.page < response.results.totalPages);
                } else {
                    // Load products based on active tab
                    let response;
                    if (activeTab === 'maxalla') {
                        // Load maxalla products
                        response = await apiService.getMaxallaProducts({
                            page: pageNum,
                            limit: 20,
                            status: 'active',
                        });
                    } else {
                        // Load tuman products
                        response = await apiService.getProducts({
                            page: pageNum,
                            limit: 20,
                            status: 'active',
                        });
                    }

                    // Filter products by selected location
                    let allProducts = response.data || [];
                    
                    if (activeTab === 'maxalla') {
                        // For maxalla products, filter by selected MFY
                        if (selectedMfy) {
                            allProducts = allProducts.filter((product) => {
                                // Maxalla products are only available in their own MFY
                                return product.contragent?.mfy?._id === selectedMfy._id;
                            });
                        } else {
                            // If no MFY selected, show no maxalla products
                            allProducts = [];
                        }
                    } else {
                        // For tuman products, filter by selected tuman
                        if (selectedTuman) {
                            allProducts = allProducts.filter((product) => {
                                // If deliveryRegions is empty, check if product's contragent is in selected tuman
                                if (!product.deliveryRegions || product.deliveryRegions.length === 0) {
                                    // If deliveryRegions is empty, show product if contragent's tuman matches selected tuman
                                    if (product.contragent?.tuman?._id === selectedTuman._id) {
                                        return true;
                                    }
                                    return false;
                                }
                                
                                // Check if product is available in selected tuman through deliveryRegions
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
                    }

                    // Filter censored products for users under 18
                    const userAge = calculateAge(user?.birthDate);
                    if (userAge !== null && userAge < 18) {
                        allProducts = allProducts.filter((product) => {
                            if (product.censored === true) {
                                return false;
                            }
                            return true;
                        });
                    }

                    // Add productType to products
                    allProducts = allProducts.map((product) => ({
                        ...product,
                        productType: activeTab,
                    }));

                    if (append) {
                        setProducts((prev) => [...prev, ...allProducts]);
                    } else {
                        setProducts(allProducts);
                    }

                    setPage(response.page);
                    setHasMore(response.page < response.totalPages);
                }
            } catch (error: any) {
                console.error('Error loading products:', error);
                Alert.alert('Xatolik', error.message || 'Mahsulotlarni yuklashda xatolik yuz berdi');
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [debouncedSearchQuery, contragentFilter, activeFilters, selectedTuman, selectedViloyat, selectedMfy, activeTab, user?.birthDate]
    );

    // Load products when debounced search query changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        loadProducts(1, false);
    }, [debouncedSearchQuery]);

    // Load products when contragent filter changes (but not when search is active)
    useEffect(() => {
        if (!debouncedSearchQuery) {
            setPage(1);
            setHasMore(true);
            loadProducts(1, false);
        }
    }, [contragentFilter, debouncedSearchQuery, loadProducts]);

    // Load products when active filters change
    useEffect(() => {
        if (!debouncedSearchQuery && contragentFilter) {
            setPage(1);
            setHasMore(true);
            loadProducts(1, false);
        }
    }, [activeFilters, contragentFilter, debouncedSearchQuery, loadProducts]);

    // Reload products when location or tab changes
    useEffect(() => {
        if (!debouncedSearchQuery && !contragentFilter) {
            setPage(1);
            setHasMore(true);
            setProducts([]); // Clear products before loading new ones
            loadProducts(1, false);
        }
    }, [selectedTuman?._id, selectedMfy?._id, activeTab, debouncedSearchQuery, contragentFilter, loadProducts]);

    // Reset search when coming from shops
    useEffect(() => {
        if (contragentId) {
            setContragentFilter(contragentId);
            setContragentFilterName(contragentName || undefined);
            setSearchQuery('');
            setDebouncedSearchQuery('');
        }
    }, [contragentId, contragentName]);

    // Set initial tab when navigating from bosh sahifa blocks
    useEffect(() => {
        if (initialTab === 'maxalla' || initialTab === 'tuman') {
            setActiveTab(initialTab);
            setSearchQuery('');
            setDebouncedSearchQuery('');
            setContragentFilter(undefined);
            setContragentFilterName(undefined);
            setActiveFilters({});
        }
    }, [initialTab]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        loadProducts(1, false);
    }, [loadProducts]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            loadProducts(page + 1, true);
        }
    }, [loadingMore, hasMore, page, loadProducts]);

    const handleSearch = useCallback(() => {
        // Immediately use current search query
        setDebouncedSearchQuery(searchQuery);
        setPage(1);
        setHasMore(true);
        loadProducts(1, false, searchQuery);
    }, [searchQuery, loadProducts]);

    const handleProductPress = (product: Product) => {
        router.push(`/product/${product._id}` as any);
    };

    const { isAuthenticated } = useAuth();
    const { addToCart, getCartItemQuantity } = useCart();

    const handleAddToCart = async (product: Product) => {
        if (!isAuthenticated) {
            Alert.alert(
                'Kirish kerak',
                'Korzinkaga qo\'shish uchun tizimga kiring',
                [
                    { text: 'Bekor qilish', style: 'cancel' },
                    {
                        text: 'Kirish',
                        onPress: () => router.push('/(auth)/login'),
                    },
                ]
            );
            return;
        }

        const productType = product.productType || activeTab;
        
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

    const renderItem = ({ item }: { item: Product }) => {
        const productType = item.productType || activeTab;
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

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
            </View>
        );
    };

    const handleTabChange = useCallback((newTab: 'tuman' | 'maxalla') => {
        // Agar tab o'zgarmagan bo'lsa, hech narsa qilmaymiz
        if (newTab === activeTab) return;
        
        // Tozalash va yangilash
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setContragentFilter(undefined);
        setContragentFilterName(undefined);
        setActiveFilters({});
        setPage(1);
        setHasMore(true);
        setProducts([]);
        setActiveTab(newTab);
        
        // useEffect avtomatik ravishda yangi tab uchun mahsulotlarni yuklaydi
        // activeTab o'zgarganda va filterlar bo'sh bo'lganda useEffect ishga tushadi
    }, [activeTab]);

    const renderProductTabs = () => {
        return (
            <View style={styles.tabsWrapper}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tuman' && styles.tabActive]}
                    onPress={() => handleTabChange('tuman')}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name="storefront" 
                        size={20} 
                        color={activeTab === 'tuman' ? '#007AFF' : '#666'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'tuman' && styles.tabTextActive]}>
                        Tumandagi sotuv
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'maxalla' && styles.tabActive]}
                    onPress={() => handleTabChange('maxalla')}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name="home" 
                        size={20} 
                        color={activeTab === 'maxalla' ? '#007AFF' : '#666'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'maxalla' && styles.tabTextActive]}>
                        Maxalladagi sotuv
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Mahsulotlar" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />

            {/* Search Bar with Filter Button and Tabs */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputGroup}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Mahsulot qidirish..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setDebouncedSearchQuery('');
                                    setPage(1);
                                    setHasMore(true);
                                    loadProducts(1, false, '');
                                }}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* Filter Button - only show when contragent is selected */}
                    {contragentFilter && (
                        <TouchableOpacity
                            style={styles.filterButtonInline}
                            onPress={() => setFilterModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="options" size={20} color="#007AFF" />
                            {(activeFilters.category || activeFilters.subcategory) && (
                                <View style={styles.filterBadgeInline}>
                                    <Text style={styles.filterBadgeTextInline}>
                                        {(activeFilters.category ? 1 : 0) + (activeFilters.subcategory ? 1 : 0)}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
                {/* Tab Navigation */}
                {!debouncedSearchQuery && !contragentFilter && (
                    <>
                        {renderProductTabs()}
                        {activeTab === 'maxalla' && !selectedMfy && (
                            <View style={styles.tabWarning}>
                                <Ionicons name="information-circle" size={16} color="#FF9500" />
                                <Text style={styles.tabWarningText}>
                                    Maxalla mahsulotlarini ko'rish uchun MFY tanlang
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            {/* Active Filters */}
            {(contragentFilterName || activeFilters.category || activeFilters.subcategory) && (
                <View style={styles.filterContainer}>
                    {contragentFilterName && (
                    <View style={styles.filterBadgeItem}>
                        <Ionicons name="storefront" size={16} color="#007AFF" />
                        <Text style={styles.filterBadgeItemText}>{contragentFilterName}</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                setContragentFilter(undefined);
                                setContragentFilterName(undefined);
                                    setActiveFilters({});
                                setPage(1);
                                setHasMore(true);
                                loadProducts(1, false);
                            }}
                        >
                            <Ionicons name="close-circle" size={18} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    )}
                    {activeFilters.category && (
                        <View style={styles.filterBadgeItem}>
                            <Ionicons name="folder" size={16} color="#007AFF" />
                            <Text style={styles.filterBadgeItemText}>Kategoriya</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setActiveFilters(prev => {
                                        const newFilters = { ...prev };
                                        delete newFilters.category;
                                        delete newFilters.subcategory;
                                        return newFilters;
                                    });
                                }}
                            >
                                <Ionicons name="close-circle" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {activeFilters.subcategory && (
                        <View style={styles.filterBadgeItem}>
                            <Ionicons name="albums" size={16} color="#007AFF" />
                            <Text style={styles.filterBadgeItemText}>Kichik kategoriya</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setActiveFilters(prev => {
                                        const newFilters = { ...prev };
                                        delete newFilters.subcategory;
                                        return newFilters;
                                    });
                                }}
                            >
                                <Ionicons name="close-circle" size={18} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}


            {/* Products List */}
            {loading && products.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
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
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Filter Modal */}
            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApply={(filters) => {
                    setActiveFilters({
                        category: filters.category,
                        subcategory: filters.subcategory,
                    });
                }}
                initialFilters={{
                    contragent: contragentFilter,
                    category: activeFilters.category,
                    subcategory: activeFilters.subcategory,
                }}
                hideContragentFilter={!!contragentFilter}
            />

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
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    searchInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
        gap: 8,
    },
    filterBadgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f7ff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    filterBadgeItemText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    filterButtonInline: {
        width: 48,
        height: 48,
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
        position: 'relative',
    },
    filterBadgeInline: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    filterBadgeTextInline: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    listContent: {
        padding: 8,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 8,
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
    tabsWrapper: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tabActive: {
        backgroundColor: '#e6f3ff',
        borderColor: '#007AFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    tabTextActive: {
        color: '#007AFF',
    },
    tabWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        gap: 8,
    },
    tabWarningText: {
        flex: 1,
        fontSize: 13,
        color: '#856404',
        lineHeight: 18,
    },
});
