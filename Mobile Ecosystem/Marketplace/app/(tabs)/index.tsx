import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import LocationSelector from '../../components/LocationSelector';
import PartnershipBlock from '../../components/PartnershipBlock';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLocation } from '../../contexts/LocationContext';
import { useNotification } from '../../contexts/NotificationContext';
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
  const { selectedTuman, selectedViloyat, selectedMfy } = useLocation();
  const { addToCart, getCartItemQuantity } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const [featuredContragents, setFeaturedContragents] = useState<FeaturedContragent[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [tumanProducts, setTumanProducts] = useState<Product[]>([]);
  const [maxallaProducts, setMaxallaProducts] = useState<Product[]>([]);
  const [tumanProductsLoading, setTumanProductsLoading] = useState(true);
  const [maxallaProductsLoading, setMaxallaProductsLoading] = useState(true);


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

  const loadTumanProducts = useCallback(async () => {
    try {
      setTumanProductsLoading(true);
      const response = await apiService.getProducts({ page: 1, limit: 4, status: 'active' });
      let list = response.data || [];
      if (selectedTuman) {
        list = list.filter((p) => {
          if (!p.deliveryRegions?.length) return p.contragent?.tuman?._id === selectedTuman._id;
          return p.deliveryRegions.some((r) => r.tuman?._id === selectedTuman._id || (r.viloyat && selectedViloyat && r.viloyat._id === selectedViloyat._id));
        });
      }
      const userAge = calculateAge(user?.birthDate);
      if (userAge !== null && userAge < 18) {
        list = list.filter((p) => p.censored !== true);
      }
      setTumanProducts(list.map((p) => ({ ...p, productType: 'tuman' as const })));
    } catch (e) {
      setTumanProducts([]);
    } finally {
      setTumanProductsLoading(false);
    }
  }, [selectedTuman?._id, selectedViloyat?._id, user?.birthDate]);

  const loadMaxallaProducts = useCallback(async () => {
    try {
      setMaxallaProductsLoading(true);
      const response = await apiService.getMaxallaProducts({ page: 1, limit: 4, status: 'active' });
      let list = response.data || [];
      if (selectedMfy) {
        list = list.filter((p) => p.contragent?.mfy?._id === selectedMfy._id);
      } else {
        list = [];
      }
      const userAge = calculateAge(user?.birthDate);
      if (userAge !== null && userAge < 18) {
        list = list.filter((p) => p.censored !== true);
      }
      setMaxallaProducts(list.map((p) => ({ ...p, productType: 'maxalla' as const })));
    } catch (e) {
      setMaxallaProducts([]);
    } finally {
      setMaxallaProductsLoading(false);
    }
  }, [selectedMfy?._id, user?.birthDate]);


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
    loadFeaturedContragents();
  }, [loadFeaturedContragents]);

  useEffect(() => {
    loadTumanProducts();
  }, [loadTumanProducts]);

  useEffect(() => {
    loadMaxallaProducts();
  }, [loadMaxallaProducts]);

  const handleRefresh = useCallback(() => {
    loadFeaturedContragents();
    loadTumanProducts();
    loadMaxallaProducts();
  }, [loadFeaturedContragents, loadTumanProducts, loadMaxallaProducts]);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}` as any);
  };

  const { isAuthenticated } = useAuth();
  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      showError('Korzinkaga qo\'shish uchun tizimga kiring');
      return;
    }
    const productType = product.productType || 'tuman';
    if (productType === 'maxalla') {
      if (!selectedMfy) {
        showError('Maxalla mahsulotlari uchun MFY tanlang');
        return;
      }
      showError('Maxalla mahsulotini korzinkaga qo\'shish uchun Mahsulotlar sahifasidan dokon tanlang');
      return;
    }
    try {
      await addToCart(product._id, 1, productType);
      showSuccess(`${product.name} korzinkaga qo'shildi`);
    } catch (_) {}
  };

  const goToSearchWithTab = (tab: 'tuman' | 'maxalla') => {
    router.push({ pathname: '/(tabs)/search', params: { initialTab: tab } } as any);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';

  const renderHomeProductCard = (item: Product) => {
    const imageUri = item.images?.[0];
    const isInCart = getCartItemQuantity(item._id, item.productType || 'tuman') > 0;
    return (
      <TouchableOpacity
        key={item._id}
        style={styles.homeProductCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.homeProductImageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.homeProductImage} resizeMode="cover" />
          ) : (
            <View style={styles.homeProductImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#bbb" />
            </View>
          )}
        </View>
        <Text style={styles.homeProductName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.homeProductPrice}>{formatPrice(item.price)}</Text>
        <TouchableOpacity
          style={[styles.homeProductCartBtn, isInCart && styles.homeProductCartBtnActive]}
          onPress={(e) => { e.stopPropagation(); if (!isInCart) handleAddToCart(item); }}
          activeOpacity={0.8}
        >
          <Ionicons name={isInCart ? 'checkmark-circle' : 'cart-outline'} size={14} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTopContragents()}
        <PartnershipBlock />

        {/* Tumandagi sotuv block */}
        <View style={[styles.sectionBlock, styles.sectionBlockTuman]}>
          <Text style={styles.sectionBlockTitle}>Tumandagi sotuv</Text>
          <Text style={styles.sectionBlockDesc}>Tuman bo'ylab yetkazib beriladigan mahsulotlar</Text>
          {tumanProductsLoading ? (
            <View style={styles.sectionProductsLoading}><ActivityIndicator size="small" color="#007AFF" /></View>
          ) : (
            <View style={styles.sectionProductsRow}>
              {tumanProducts.slice(0, 4).map(renderHomeProductCard)}
            </View>
          )}
          <TouchableOpacity style={styles.sectionCta} onPress={() => goToSearchWithTab('tuman')} activeOpacity={0.8}>
            <Text style={styles.sectionCtaText}>Bunga o'tish</Text>
            <Ionicons name="arrow-forward" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Maxalladagi sotuv block */}
        <View style={[styles.sectionBlock, styles.sectionBlockMaxalla]}>
          <Text style={styles.sectionBlockTitle}>Maxalladagi sotuv</Text>
          <Text style={styles.sectionBlockDesc}>Maxalla do'konlaridagi mahsulotlar</Text>
          {maxallaProductsLoading ? (
            <View style={styles.sectionProductsLoading}><ActivityIndicator size="small" color="#0A7B4A" /></View>
          ) : (
            <View style={styles.sectionProductsRow}>
              {maxallaProducts.slice(0, 4).map(renderHomeProductCard)}
            </View>
          )}
          <TouchableOpacity style={styles.sectionCta} onPress={() => goToSearchWithTab('maxalla')} activeOpacity={0.8}>
            <Text style={styles.sectionCtaTextMaxalla}>Bunga o'tish</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A7B4A" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionBlock: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionBlockTuman: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
  },
  sectionBlockMaxalla: {
    backgroundColor: '#E6F7ED',
    borderWidth: 1,
    borderColor: 'rgba(10, 123, 74, 0.2)',
  },
  sectionBlockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionBlockDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionProductsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  sectionProductsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  sectionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  sectionCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  sectionCtaTextMaxalla: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A7B4A',
  },
  homeProductCard: {
    width: '23%',
    minWidth: 78,
    maxWidth: 88,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  homeProductImageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  homeProductImage: {
    width: '100%',
    height: '100%',
  },
  homeProductImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeProductName: {
    fontSize: 11,
    color: '#333',
    marginTop: 6,
    paddingHorizontal: 6,
    fontWeight: '500',
  },
  homeProductPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 2,
    paddingHorizontal: 6,
  },
  homeProductCartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
  },
  homeProductCartBtnActive: {
    backgroundColor: '#34C759',
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
  categoriesContainer: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoriesHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoriesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesLoading: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 120,
    marginRight: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryImageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  categoryImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  categoryImageStyle: {
    borderRadius: 16,
  },
  categoryImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  categoryGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  categoryPlaceholderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  censoredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  censoredBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  categoryInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 14,
    zIndex: 2,
  },
  categoryNameOverlay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 18,
  },
  categorySubcountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  categorySubcountOverlay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
