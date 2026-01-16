import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import ImageViewer from '../../../../components/ImageViewer';
import { apiService, Product } from '../../../../services/api';
import { formatNumberDisplay } from '../../../../utils/formatNumber';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductViewScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<FlatList>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  // Autoplay for carousel (only if more than 1 image)
  useEffect(() => {
    const images = product?.images || [];
    if (images.length > 1) {
      // Clear existing timer
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }

      // Set up autoplay
      autoplayTimerRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % images.length;
          // Scroll carousel to next image
          if (carouselRef.current) {
            carouselRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          }
          return nextIndex;
        });
      }, 3000); // Change image every 3 seconds

      return () => {
        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current);
        }
      };
    } else {
      // Clear timer if only one image
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    }
  }, [product?.images]);

  const loadProduct = async () => {
    if (!productId) return;

    try {
      const response = await apiService.getProductById(productId);
      setProduct(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Maxsulotni yuklashda xatolik');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (value: boolean) => {
    if (!product) return;

    try {
      await apiService.updateProductStatus(product._id, {
        status: value ? 'active' : 'inactive',
      });
      loadProduct();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Status yangilashda xatolik');
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/ombor/product/edit',
      params: { productId: product?._id },
    });
  };

  const handleImagePress = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  const handleCarouselScroll = useCallback((event: any) => {
    const images = product?.images || [];
    const slideSize = SCREEN_WIDTH - 32; // Account for padding
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentImageIndex && index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  }, [product?.images, currentImageIndex]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Maxsulot topilmadi</Text>
      </View>
    );
  }

  const images = product.images || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/ombor/' as any)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maxsulot ma'lumotlari</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Images */}
        {images.length > 0 ? (
          <View style={styles.imageContainer}>
            {images.length === 1 ? (
              // Single image - simple display
              <TouchableOpacity
                onPress={() => handleImagePress(0)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: images[0] }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              // Multiple images - carousel with autoplay
              <>
                <FlatList
                  ref={carouselRef}
                  data={images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `image-${index}`}
                  onMomentumScrollEnd={handleCarouselScroll}
                  onScrollBeginDrag={() => {
                    // Pause autoplay when user starts scrolling
                    if (autoplayTimerRef.current) {
                      clearInterval(autoplayTimerRef.current);
                    }
                  }}
                  onScrollEndDrag={() => {
                    // Resume autoplay after user stops scrolling
                    const timer = setInterval(() => {
                      setCurrentImageIndex((prevIndex) => {
                        const nextIndex = (prevIndex + 1) % images.length;
                        if (carouselRef.current) {
                          carouselRef.current.scrollToIndex({
                            index: nextIndex,
                            animated: true,
                          });
                        }
                        return nextIndex;
                      });
                    }, 3000);
                    autoplayTimerRef.current = timer;
                  }}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleImagePress(index)}
                      activeOpacity={0.9}
                      style={styles.carouselImageWrapper}
                    >
                      <Image
                        source={{ uri: item }}
                        style={styles.mainImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH - 32,
                    offset: (SCREEN_WIDTH - 32) * index,
                    index,
                  })}
                />
                <View style={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        currentImageIndex === index && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color="#ccc" />
            <Text style={styles.imagePlaceholderText}>Rasm mavjud emas</Text>
          </View>
        )}

        {/* ImageViewer Modal */}
        {images.length > 0 && (
          <ImageViewer
            visible={imageViewerVisible}
            images={images}
            initialIndex={imageViewerIndex}
            onClose={() => setImageViewerVisible(false)}
          />
        )}

        {/* Product Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Asosiy ma'lumotlar</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Holat:</Text>
              <Switch
                value={product.status === 'active'}
                onValueChange={handleStatusChange}
                trackColor={{ false: '#ccc', true: '#34C759' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {(product.censored || product.moderationStatus) && (
            <View style={styles.moderationContainer}>
              <View style={styles.moderationHeader}>
                <Text style={styles.moderationLabel}>Holat:</Text>
                <View style={styles.badgesContainer}>
                  {product.censored && (
                    <View style={styles.censoredBadge}>
                      <Ionicons name="warning" size={14} color="#FF6B6B" />
                      <Text style={styles.censoredBadgeText}>18+</Text>
                    </View>
                  )}
                  {product.moderationStatus && (
                    <View style={[
                      styles.moderationBadge,
                      product.moderationStatus === 'approved' && styles.moderationBadgeApproved,
                      product.moderationStatus === 'rejected' && styles.moderationBadgeRejected,
                      product.moderationStatus === 'pending' && styles.moderationBadgePending,
                    ]}>
                      <Text style={[
                        styles.moderationBadgeText,
                        product.moderationStatus === 'approved' && styles.moderationBadgeTextApproved,
                        product.moderationStatus === 'rejected' && styles.moderationBadgeTextRejected,
                        product.moderationStatus === 'pending' && styles.moderationBadgeTextPending,
                      ]}>
                        {product.moderationStatus === 'approved' ? 'Tasdiqlangan' :
                          product.moderationStatus === 'rejected' ? 'Rad etilgan' :
                            'Kutilmoqda'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {product.moderationStatus && (
                <>
                  {product.moderatedAt && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tekshirilgan vaqti</Text>
                      <Text style={styles.infoValue}>
                        {new Date(product.moderatedAt).toLocaleString('uz-UZ')}
                      </Text>
                    </View>
                  )}
                  {product.rejectionReason && (
                    <View style={styles.rejectionReasonContainer}>
                      <Text style={styles.rejectionReasonLabel}>Rad etish sababi:</Text>
                      <Text style={styles.rejectionReasonText}>{product.rejectionReason}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomi</Text>
            <Text style={styles.infoValue}>{product.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kod</Text>
            <Text style={styles.infoValue}>{product.productCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kategoriya</Text>
            <Text style={styles.infoValue}>
              {product.category.name}
              {product.subcategory && ` / ${product.subcategory.name}`}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        {product.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tavsif</Text>
            <View style={styles.descriptionContainer}>
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
                        <style>
                          body {
                            margin: 0;
                            padding: 16px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          }
                          #editor-container {
                            border: none;
                          }
                          .ql-editor {
                            padding: 0;
                            font-size: 15px;
                            line-height: 22px;
                            color: #666;
                          }
                          .ql-editor.ql-blank::before {
                            color: #999;
                            font-style: normal;
                          }
                        </style>
                      </head>
                      <body>
                        <div id="editor-container"></div>
                        <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
                        <script>
                          var quill = new Quill('#editor-container', {
                            theme: 'snow',
                            readOnly: true,
                            modules: {
                              toolbar: false
                            }
                          });
                          var delta = ${JSON.stringify(product.description)};
                          quill.setContents(delta);
                        </script>
                      </body>
                    </html>
                  `,
                }}
                style={styles.descriptionWebView}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        )}

        {/* Price Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Narx ma'lumotlari</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Narx</Text>
            <Text style={[styles.infoValue, styles.priceValue]}>
              {formatNumberDisplay(product.price)} so'm
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Asl narx</Text>
            <Text style={styles.infoValue}>
              {formatNumberDisplay(product.originalPrice)} so'm
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>KPI Bonus</Text>
            <Text style={[styles.infoValue, styles.bonusValue]}>
              {product.kpiBonusPercent}%
            </Text>
          </View>
        </View>

        {/* Quantity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Miqdor ma'lumotlari</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Miqdor</Text>
            <Text style={styles.infoValue}>
              {product.quantity} {product.unit}
            </Text>
          </View>

          {product.unitSize && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Birlik o'lchami</Text>
              <Text style={styles.infoValue}>
                {product.unitSize} {product.unit}
              </Text>
            </View>
          )}
        </View>

        {/* Fizik o'lchamlar Card */}
        {(product.length || product.width || product.weight) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fizik o'lchamlar</Text>

            {product.length && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bo'yi</Text>
                <Text style={styles.infoValue}>
                  {product.length}
                </Text>
              </View>
            )}

            {product.width && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Eni</Text>
                <Text style={styles.infoValue}>
                  {product.width}
                </Text>
              </View>
            )}

            {product.weight && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Og'irligi</Text>
                <Text style={styles.infoValue}>
                  {product.weight}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Delivery Regions Card */}
        {product.deliveryRegions && product.deliveryRegions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yetkazib berish hududlari</Text>
            {product.deliveryRegions.map((region, index) => (
              <View key={index} style={styles.deliveryRegion}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={styles.deliveryRegionText}>
                  {region.viloyat.name}
                  {region.tuman && `, ${region.tuman.name}`}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
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
    backgroundColor: '#EDEDED',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  mainImage: {
    width: SCREEN_WIDTH - 32,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  carouselImageWrapper: {
    width: SCREEN_WIDTH - 32,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavButtonLeft: {
    left: 12,
  },
  imageNavButtonRight: {
    right: 12,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginTop: 8,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  descriptionWebView: {
    backgroundColor: 'transparent',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bonusValue: {
    color: '#34C759',
    fontWeight: '600',
  },
  deliveryRegion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  deliveryRegionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  moderationContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  moderationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  censoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  censoredBadgeText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  moderationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  moderationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    fontSize: 12,
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
  rejectionReasonContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  rejectionReasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#842029',
    marginBottom: 6,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});

