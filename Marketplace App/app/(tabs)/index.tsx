import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import LocationSelector from '../../components/LocationSelector';
import PartnershipBlock from '../../components/PartnershipBlock';
import ProductCard from '../../components/ui/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLocation } from '../../contexts/LocationContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { FeaturedContragent, Product } from '../../services/api';

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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { autoOpenLocation } = useLocalSearchParams<{ autoOpenLocation?: string }>();
  const { unreadCount } = useNotification();
  const { user } = useAuth();
  const { selectedViloyat, selectedTuman } = useLocation();
  const { showSuccess, showError } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [featuredContragents, setFeaturedContragents] = useState<FeaturedContragent[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  const loadProducts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
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
      });

      // Filter products by selected tuman
      let filteredProducts = response.data;
      if (selectedTuman) {
        filteredProducts = response.data.filter((product) => {
          if (!product.deliveryRegions || product.deliveryRegions.length === 0) {
            // Show products without delivery regions if no tuman is selected
            return false;
          }
          // Check if product is deliverable to selected tuman
          const matches = product.deliveryRegions.some((region) => {
            // If region has tuman, check if it matches selected tuman
            if (region.tuman) {
              return region.tuman._id === selectedTuman._id;
            }
            // If region has viloyat but no tuman, check if viloyat matches selected viloyat
            if (region.viloyat && selectedViloyat) {
              return region.viloyat._id === selectedViloyat._id;
            }
            return false;
          });
          if (!matches) {
            console.log('HomeScreen: Product filtered out:', product.name, 'deliveryRegions:', product.deliveryRegions.map(r => `${r.viloyat?.name || 'no viloyat'}${r.tuman ? `, ${r.tuman.name}` : ''}`).join(' | '));
          }
          return matches;
        });
      } else {
        console.log('HomeScreen: No tuman selected, showing all products');
      }

      // Filter censored products for users under 18
      const userAge = calculateAge(user?.birthDate);
      if (userAge !== null && userAge < 18) {
        filteredProducts = filteredProducts.filter((product) => {
          if (product.censored === true) {
            console.log('HomeScreen: Censored product filtered out for user under 18:', product.name);
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

      setPage(response.page);
      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      console.error('Error loading products:', error);
      showError(error.message || 'Mahsulotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedTuman, user?.birthDate]);

  const loadFeaturedContragents = useCallback(async () => {
    try {
      setFeaturedLoading(true);
      const response = await apiService.getFeaturedContragents();
      if (response.success && Array.isArray(response.data)) {
        setFeaturedContragents(response.data);
        setCurrentFeaturedIndex(0);
      } else {
        setFeaturedContragents([]);
      }
    } catch (error) {
      console.error('Error loading featured contragents:', error);
      setFeaturedContragents([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  // Autoplay carousel
  useEffect(() => {
    if (featuredContragents.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => {
        const next = prev + 1;
        if (next >= featuredContragents.length) {
          return 0;
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [featuredContragents]);

  useEffect(() => {
    loadProducts(1, false);
    loadFeaturedContragents();
  }, [loadProducts, loadFeaturedContragents]);

  // Reload products when location changes
  useEffect(() => {
    if (selectedTuman) {
    setPage(1);
    setHasMore(true);
    loadProducts(1, false);
    }
  }, [selectedTuman?._id, loadProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadProducts(1, false);
    loadFeaturedContragents();
  }, [loadProducts, loadFeaturedContragents]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadProducts(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadProducts]);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}` as any);
  };

  const { isAuthenticated } = useAuth();
  const { addToCart, getCartItemQuantity } = useCart();

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      showError('Korzinkaga qo\'shish uchun tizimga kiring', 3000, {
        label: 'Kirish',
        onPress: () => router.push('/(auth)/login'),
      });
      return;
    }

    try {
      await addToCart(product._id, 1);
      showSuccess(`${product.name} korzinkaga qo'shildi`);
    } catch (error) {
      // Error is already shown in context
    }
  };

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  const handleFeaturedContragentPress = (contragent: FeaturedContragent) => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        contragentId: contragent._id,
        contragentName: contragent.name,
      },
    } as any);
  };

  const handlePrevFeatured = () => {
    if (!featuredContragents.length) return;
    setCurrentFeaturedIndex((prev) =>
      prev === 0 ? featuredContragents.length - 1 : prev - 1
    );
  };

  const handleNextFeatured = () => {
    if (!featuredContragents.length) return;
    setCurrentFeaturedIndex((prev) =>
      prev === featuredContragents.length - 1 ? 0 : prev + 1
    );
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
        <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
      </View>
    );
  };

  const renderTopContragents = () => {
    if (featuredLoading && featuredContragents.length === 0) {
      return (
        <View style={styles.topContragentsLoading}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }

    if (!featuredContragents.length) return null;

    const current =
      featuredContragents[currentFeaturedIndex] || featuredContragents[0];

    return (
      <View style={styles.topContragentsContainer}>
        <View style={styles.topContragentsHeader}>
          <View>
            <Text style={styles.topContragentsTitle}>TOP do'konlar</Text>
            <Text style={styles.topContragentsSubtitle}>
              Eng ishonchli hamkorlarimiz
            </Text>
          </View>
          <View style={styles.topContragentsControls}>
            <TouchableOpacity
              style={styles.carouselControlButton}
              onPress={handlePrevFeatured}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.carouselControlButton}
              onPress={handleNextFeatured}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={18} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.topContragentCard}
          activeOpacity={0.95}
          onPress={() => handleFeaturedContragentPress(current)}
        >
          <View style={styles.topContragentAvatar}>
            {current.logo ? (
              <Image
                source={{ uri: current.logo }}
                style={styles.topContragentLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.topContragentInitials}>
                <Text style={styles.topContragentInitialsText}>
                  {current.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.topContragentInfo}>
            <Text style={styles.topContragentName} numberOfLines={2}>
              {current.name}
            </Text>
            <Text style={styles.topContragentActionText}>
              Do'konni ko'rish
            </Text>
          </View>
        </TouchableOpacity>

        {featuredContragents.length > 1 && (
          <View style={styles.carouselDotsContainer}>
            {featuredContragents.map((item, index) => (
              <View
                key={item._id}
                style={[
                  styles.carouselDot,
                  index === currentFeaturedIndex && styles.carouselDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Marketplace" 
        onNotificationPress={handleNotificationPress} 
        unreadCount={unreadCount}
      />
      <LocationSelector autoOpen={autoOpenLocation === 'true'} />
      
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
          ListHeaderComponent={
            <View>
              {renderTopContragents()}
              <PartnershipBlock />
            </View>
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
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
  },
  topContragentsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topContragentsHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topContragentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  topContragentsSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  topContragentsList: {
    paddingVertical: 4,
  },
  topContragentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  topContragentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topContragentLogo: {
    width: '100%',
    height: '100%',
  },
  topContragentInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topContragentInitialsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  topContragentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  topContragentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topContragentActionText: {
    marginTop: 4,
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  topContragentsLoading: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topContragentsControls: {
    flexDirection: 'row',
    gap: 8,
  },
  carouselControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  carouselDotActive: {
    width: 16,
    backgroundColor: '#2563EB',
  },
});
