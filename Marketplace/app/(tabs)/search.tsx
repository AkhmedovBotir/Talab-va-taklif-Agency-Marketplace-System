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
import FilterModal from '../../components/ui/FilterModal';
import ProductCard from '../../components/ui/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService, { Product } from '../../services/api';

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
    const { contragentId, contragentName } = useLocalSearchParams<{
        contragentId?: string;
        contragentName?: string;
    }>();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotification();
    const { user } = useAuth();
    const { selectedTuman } = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [contragentFilter, setContragentFilter] = useState<string | undefined>(contragentId || undefined);
    const [contragentFilterName, setContragentFilterName] = useState<string | undefined>(contragentName || undefined);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        category?: string;
        subcategory?: string;
    }>({});

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
                                console.log('SearchScreen: Censored product filtered out for user under 18:', product.name);
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
                                console.log('SearchScreen: Censored product filtered out for user under 18:', product.name);
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

                    console.log(response.results);
                    setPage(response.results.page);
                    setHasMore(response.results.page < response.results.totalPages);
                } else {
                    // Load all products
                    const response = await apiService.getProducts({
                        page: pageNum,
                        limit: 20,
                        status: 'active',
                    });

                    let allProducts = response.data || [];

                    // Filter products by selected tuman
                    if (selectedTuman) {
                        allProducts = allProducts.filter((product) => {
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
                        allProducts = allProducts.filter((product) => {
                            if (product.censored === true) {
                                console.log('SearchScreen: Censored product filtered out for user under 18:', product.name);
                                return false;
                            }
                            return true;
                        });
                    }

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
        [debouncedSearchQuery, contragentFilter, activeFilters, selectedTuman, user?.birthDate]
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

    // Reset search when coming from shops
    useEffect(() => {
        if (contragentId) {
            setContragentFilter(contragentId);
            setContragentFilterName(contragentName || undefined);
            setSearchQuery('');
            setDebouncedSearchQuery('');
        }
    }, [contragentId, contragentName]);

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

        try {
            await addToCart(product._id, 1);
            Alert.alert('Muvaffaqiyatli', `${product.name} korzinkaga qo'shildi`);
        } catch (error) {
            // Error is already shown in context
        }
    };

    const handleNotificationPress = () => {
        router.push('/notifications' as any);
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isInCart = getCartItemQuantity(item._id) > 0;
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

    return (
        <View style={styles.container}>
            <Header title="Mahsulotlar" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />

            {/* Search Bar with Filter Button */}
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
});
