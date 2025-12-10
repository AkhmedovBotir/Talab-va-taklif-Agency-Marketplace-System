import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuillEditor, { QuillEditorRef } from '../../../../components/QuillEditor';
import { apiService, Category, DeliveryRegion, DeltaFormat, Product } from '../../../../services/api';

export default function ProductEditScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const params = useLocalSearchParams<{ selectedRegions?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState<DeltaFormat | null>(null);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'dona' | 'litr' | 'kg'>('dona');
  const [unitSize, setUnitSize] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [weight, setWeight] = useState('');
  const [kpiBonusPercent, setKpiBonusPercent] = useState('');
  const [deliveryRegions, setDeliveryRegions] = useState<DeliveryRegion[]>([]);
  const quillRef = useRef<QuillEditorRef>(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;

    try {
      const response = await apiService.getProductById(productId);
      const prod = response.data;
      setProduct(prod);
      setName(prod.name);
      setDescription(prod.description || null);
      setPrice(prod.price.toString());
      setOriginalPrice(prod.originalPrice.toString());
      setImages(prod.images || []);
      setCategoryId(prod.category._id);
      setSubcategoryId(prod.subcategory?._id || null);
      setQuantity(prod.quantity.toString());
      setUnit(prod.unit);
      setUnitSize(prod.unitSize?.toString() || '');
      setLength(prod.length?.toString() || '');
      setWidth(prod.width?.toString() || '');
      setWeight(prod.weight?.toString() || '');
      setKpiBonusPercent(prod.kpiBonusPercent.toString());
      
      // Load delivery regions
      if (prod.deliveryRegions && prod.deliveryRegions.length > 0) {
        const regions: DeliveryRegion[] = prod.deliveryRegions.map((dr: any) => ({
          viloyat: typeof dr.viloyat === 'string' ? dr.viloyat : dr.viloyat._id,
          tuman: dr.tuman ? (typeof dr.tuman === 'string' ? dr.tuman : dr.tuman._id) : null,
        }));
        setDeliveryRegions(regions);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Maxsulotni yuklashda xatolik');
      router.push('/(tabs)/ombor/' as any);
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories({ limit: 1000, status: 'active' });
      setCategories(response.data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  }, []);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [loadProduct, loadCategories]);

  // Set Quill editor content when product is loaded
  useEffect(() => {
    if (product && product.description && quillRef.current) {
      // Small delay to ensure Quill is ready
      setTimeout(() => {
        quillRef.current?.setContents(product.description!);
      }, 500);
    }
  }, [product]);

  useFocusEffect(
    useCallback(() => {
      // Get selected regions from params if coming back from region selection
      if (params?.selectedRegions) {
        try {
          const regions = JSON.parse(params.selectedRegions);
          setDeliveryRegions(regions);
        } catch (e) {
          console.error('Error parsing regions:', e);
        }
      }
    }, [params?.selectedRegions])
  );

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const status = await PermissionsAndroid.request(permission, {
      title: 'Ruxsat kerak',
      message: 'Rasmlarni tanlash uchun ruxsat kerak',
      buttonPositive: 'OK',
    });

    return status === PermissionsAndroid.RESULTS.GRANTED;
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Xatolik', 'Maksimal 5 ta rasm qo\'shish mumkin');
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Ruxsat kerak', 'Rasmlarni tanlash uchun ruxsat kerak');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      selectionLimit: 1,
      quality: 0.6,
    });

    if (!result.didCancel && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      const mimeType = asset.type || 'image/jpeg';
      const base64 = `data:${mimeType};base64,${asset.base64}`;
      setImages([...images, base64]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSelectRegions = () => {
    router.push({
      pathname: '/(tabs)/ombor/product/select-regions' as any,
      params: {
        selectedRegions: JSON.stringify(deliveryRegions),
        returnPath: `/(tabs)/ombor/product/edit?productId=${productId}`,
      },
    });
  };

  const handleUpdate = async () => {
    if (!product || !name.trim() || !price || !originalPrice || !quantity || !kpiBonusPercent) {
      Alert.alert('Xatolik', 'Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setSubmitting(true);
    try {
      // Get Delta content from Quill editor
      let deltaContent: DeltaFormat | null = null;
      if (quillRef.current) {
        try {
          const delta = await quillRef.current.getContents();
          if (delta && delta.ops && delta.ops.length > 0) {
            // Check if there's actual content (not just empty ops)
            const hasContent = delta.ops.some((op: any) => {
              const text = typeof op.insert === 'string' ? op.insert : '';
              return text && text.trim().length > 0;
            });
            if (hasContent) {
              deltaContent = delta;
            }
          }
        } catch (error) {
          console.error('Error getting Quill content:', error);
        }
      }

      await apiService.updateProduct(product._id, {
        name: name.trim(),
        description: deltaContent,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        images: images.length > 0 ? images : undefined,
        category: categoryId,
        subcategory: subcategoryId || null,
        quantity: parseFloat(quantity),
        unit,
        unitSize: unitSize ? parseFloat(unitSize) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        weight: weight ? parseFloat(weight) : null,
        kpiBonusPercent: parseFloat(kpiBonusPercent),
        deliveryRegions: deliveryRegions.length > 0 ? deliveryRegions : undefined,
      });
      Alert.alert('Muvaffaqiyat', 'Maxsulot muvaffaqiyatli yangilandi', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/(tabs)/ombor/' as any);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Maxsulot yangilashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Maxsulotni tahrirlash</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Asosiy ma'lumotlar blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Asosiy ma'lumotlar</Text>
          
          <Text style={styles.label}>Nomi *</Text>
          <TextInput
            style={styles.input}
            placeholder="Maxsulot nomi"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Tavsif (ixtiyoriy)</Text>
          <QuillEditor
            ref={quillRef}
            placeholder="Maxsulot tavsifini kiriting..."
            style={styles.quillEditor}
            initialDelta={description}
            onContentChange={(delta) => setDescription(delta)}
          />
        </View>

        {/* Kategoriya blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Kategoriya</Text>
          
          <Text style={styles.label}>Kategoriya *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.categoryChip,
                  categoryId === cat._id && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setCategoryId(cat._id);
                  setSubcategoryId(null);
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryId === cat._id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <>
              <Text style={styles.label}>Sub kategoriya</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    subcategoryId === null && styles.categoryChipActive,
                  ]}
                  onPress={() => setSubcategoryId(null)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      subcategoryId === null && styles.categoryChipTextActive,
                    ]}
                  >
                    Yo'q
                  </Text>
                </TouchableOpacity>
                {subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub._id}
                    style={[
                      styles.categoryChip,
                      subcategoryId === sub._id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSubcategoryId(sub._id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        subcategoryId === sub._id && styles.categoryChipTextActive,
                      ]}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Narx blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Narx ma'lumotlari</Text>
          
          <Text style={styles.label}>Narx (so'm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Narx"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Asl narx (so'm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Asl narx"
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>KPI Bonus foizi (0-100) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 5"
            value={kpiBonusPercent}
            onChangeText={setKpiBonusPercent}
            keyboardType="numeric"
          />
        </View>

        {/* Miqdor blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Miqdor ma'lumotlari</Text>
          
          <Text style={styles.label}>Miqdor *</Text>
          <TextInput
            style={styles.input}
            placeholder="Miqdor"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Birlik *</Text>
          <View style={styles.unitContainer}>
            {(['dona', 'litr', 'kg'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Birlik o'lchami (ixtiyoriy)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 1.5"
            value={unitSize}
            onChangeText={setUnitSize}
            keyboardType="numeric"
          />
        </View>

        {/* Fizik o'lchamlar blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Fizik o'lchamlar (ixtiyoriy)</Text>
          
          <Text style={styles.label}>Bo'yi (cm yoki m)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 30"
            value={length}
            onChangeText={setLength}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Eni (cm yoki m)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 10"
            value={width}
            onChangeText={setWidth}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Og'irligi (kg yoki g)</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 1.5"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        {/* Rasmlar blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Rasmlar</Text>
          <Text style={styles.label}>Rasmlar (maksimal 5 ta)</Text>
          <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="add" size={32} color="#007AFF" />
                <Text style={styles.addImageText}>Rasm qo'shish</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Yetkazib berish hududlari blok */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Yetkazib berish hududlari</Text>
          <TouchableOpacity style={styles.regionButton} onPress={handleSelectRegions}>
            <Ionicons name="location-outline" size={24} color="#007AFF" />
            <View style={styles.regionButtonTextContainer}>
              <Text style={styles.regionButtonText}>
                {deliveryRegions.length > 0
                  ? `${deliveryRegions.length} ta hudud tanlangan`
                  : 'Hududlarni tanlash'}
              </Text>
              {deliveryRegions.length > 0 && (
                <Text style={styles.regionButtonSubtext} numberOfLines={2}>
                  {deliveryRegions.length} ta hudud
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleUpdate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Saqlash</Text>
          )}
        </TouchableOpacity>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  block: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },
  quillEditor: {
    marginTop: 8,
  },
  quillToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  categoryScroll: {
    marginVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  unitContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  unitChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
  },
  regionButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  regionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  regionButtonSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
