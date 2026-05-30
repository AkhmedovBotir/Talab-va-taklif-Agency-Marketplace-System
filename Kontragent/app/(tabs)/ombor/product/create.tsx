import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuillEditor, { QuillEditorRef } from '../../../../components/QuillEditor';
import { ProductImagesField } from '../../../../components/ProductImagesField';
import { useSnackbar } from '../../../../components/AppSnackbar';
import { useResponsive } from '../../../../hooks/useResponsive';
import { apiService, Category, DeltaFormat } from '../../../../services/api';
import { formatApiError } from '../../../../utils/apiFeedback';
import { formatNumberInput, unformatNumber } from '../../../../utils/formatNumber';
import { ProductImageDraft, validateDraftsCount } from '../../../../utils/productImages';

export default function ProductCreateScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show: showSnackbar } = useSnackbar();
  const { maxPageWidth, pageGutter, isDesktopWeb, isWeb } = useResponsive();
  const horizontalPad = isWeb ? pageGutter : 16;

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState<DeltaFormat | null>(null);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageDrafts, setImageDrafts] = useState<ProductImageDraft[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'dona' | 'litr' | 'kg'>('dona');
  const [unitSize, setUnitSize] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [weight, setWeight] = useState('');
  const [kpiBonusPercent, setKpiBonusPercent] = useState('');
  const isInitialMount = useRef(true);
  const isModalOpen = useRef(false);
  const quillRef = useRef<QuillEditorRef>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDescription(null);
    if (quillRef.current) {
      quillRef.current.clear();
    }
    setPrice('');
    setOriginalPrice('');
    setImageDrafts([]);
    setCategoryId('');
    setSubcategoryId(null);
    setQuantity('');
    setUnit('dona');
    setUnitSize('');
    setLength('');
    setWidth('');
    setWeight('');
    setKpiBonusPercent('');
  }, []);

  const notifyError = useCallback(
    (message: string, title = 'Xatolik') => {
      showSnackbar(message, { title, variant: 'error', durationMs: 6000 });
    },
    [showSnackbar]
  );

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      // API dokumentatsiyasiga ko'ra, default holatda faqat active kategoriyalar qaytariladi
      // Lekin agar status parametri bilan muammo bo'lsa, status parametrisiz so'rov yuboramiz
      const response = await apiService.getCategories({ limit: 1000, status: 'active' });
      
      if (response && response.success && response.data) {
        if (response.data.length === 0) {
          const allResponse = await apiService.getCategories({ limit: 1000 });
          if (allResponse && allResponse.success && allResponse.data) {
            const activeCategories = allResponse.data.filter((cat) => cat.status === 'active');
            setCategories(activeCategories);
            if (activeCategories.length === 0) {
              notifyError('Faol kategoriyalar mavjud emas. Iltimos, admin bilan bog\'laning.', 'Ogohlantirish');
            }
          } else {
            setCategories([]);
            notifyError('Kategoriyalar mavjud emas. Iltimos, admin bilan bog\'laning.', 'Ogohlantirish');
          }
        } else {
          setCategories(response.data);
        }
      } else {
        notifyError('Kategoriyalarni yuklashda xatolik yuz berdi');
        setCategories([]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      notifyError(formatApiError(err) || `Kategoriyalarni yuklashda xatolik: ${err?.message || err?.status || ''}`);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const loadSubcategories = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    
    setLoadingSubcategories(true);
    try {
      // API dokumentatsiyasiga ko'ra, default holatda faqat active subcategorylar qaytariladi
      const response = await apiService.getSubcategories({ 
        parent: categoryId, 
        limit: 1000,
        status: 'active'
      });
      
      if (response && response.success && response.data) {
        // Agar bo'sh bo'lsa, status parametrisiz urinib ko'ramiz
        if (response.data.length === 0) {
          const allResponse = await apiService.getSubcategories({ 
            parent: categoryId, 
            limit: 1000
          });
          if (allResponse && allResponse.success && allResponse.data) {
            const activeSubcategories = allResponse.data.filter((sub) => sub.status === 'active');
            setSubcategories(activeSubcategories);
          } else {
            setSubcategories([]);
          }
        } else {
          setSubcategories(response.data);
        }
      } else {
        setSubcategories([]);
      }
    } catch (error: any) {
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialMount.current && !isModalOpen.current) {
        resetForm();
      } else {
        isInitialMount.current = false;
      }
      return () => {
        isModalOpen.current = false;
      };
    }, [resetForm])
  );

  // Save QuillEditor content before modal opens
  useEffect(() => {
    if (showCategoryModal || showSubcategoryModal) {
      if (quillRef.current) {
        quillRef.current.getContents().then((delta) => {
          if (delta) {
            setDescription(delta);
          }
        }).catch(() => {
          // Ignore errors
        });
      }
    }
  }, [showCategoryModal, showSubcategoryModal]);

  const handleCreate = async () => {
    if (!name.trim() || !price || !originalPrice || !categoryId || !subcategoryId || !quantity || !kpiBonusPercent) {
      notifyError('Barcha majburiy maydonlarni to\'ldiring (subkategoriya ham majburiy).');
      return;
    }

    const imageErr = validateDraftsCount(imageDrafts, { min: 1, max: 5 });
    if (imageErr) {
      notifyError(imageErr);
      return;
    }

    const uploads = imageDrafts.map((d) => d.upload).filter(Boolean) as NonNullable<ProductImageDraft['upload']>[];
    if (uploads.length !== imageDrafts.length) {
      notifyError('Barcha rasmlar fayl sifatida tanlanishi kerak.');
      return;
    }

    setSubmitting(true);
    try {
      let deltaContent: DeltaFormat | null = null;
      if (quillRef.current) {
        try {
          const delta = await quillRef.current.getContents();
          if (delta && delta.ops && delta.ops.length > 0) {
            const hasContent = delta.ops.some((op: { insert?: unknown }) => {
              const text = typeof op.insert === 'string' ? op.insert : '';
              return text && text.trim().length > 0;
            });
            if (hasContent) {
              deltaContent = delta;
            }
          }
        } catch {
          // Ignore Quill content errors
        }
      }

      await apiService.createProductWithImages(
        {
          name: name.trim(),
          description: deltaContent,
          price: parseFloat(price),
          originalPrice: parseFloat(originalPrice),
          category: categoryId,
          subcategory: subcategoryId,
          quantity: parseFloat(quantity),
          unit,
          unitSize: unitSize ? parseFloat(unitSize) : null,
          status: 'active',
          kpiBonusPercent: parseFloat(kpiBonusPercent),
        },
        uploads
      );

      resetForm();

      showSnackbar('Maxsulot muvaffaqiyatli yaratildi. Moderatsiyaga yuborildi.', {
        title: 'Muvaffaqiyatli',
        variant: 'success',
        durationMs: 4000,
      });
      router.replace('/ombor' as any);
    } catch (error: unknown) {
      notifyError(formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const selectedSubcategory = subcategories.find((s) => s._id === subcategoryId);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setSubcategoryId(null);
    }
  }, [categoryId, loadSubcategories]);

  // Category modal ochilganda API dan yangilash
  useEffect(() => {
    if (showCategoryModal) {
      loadCategories();
    }
  }, [showCategoryModal, loadCategories]);

  // Subcategory modal ochilganda API dan yangilash
  useEffect(() => {
    if (showSubcategoryModal && categoryId) {
      loadSubcategories(categoryId);
    }
  }, [showSubcategoryModal, categoryId, loadSubcategories]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.pageColumn,
          { maxWidth: maxPageWidth, paddingBottom: Platform.OS === 'web' ? 24 : 0 },
        ]}
      >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPad }]}>
        <TouchableOpacity
          onPress={() => router.replace('/ombor' as any)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yangi maxsulot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPad }]}
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
            key={`quill-${categoryId}`}
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
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              isModalOpen.current = true;
              setShowCategoryModal(true);
            }}
          >
            <Text style={[styles.selectButtonText, !categoryId && styles.selectButtonPlaceholder]}>
              {selectedCategory ? selectedCategory.name : 'Kategoriyani tanlang'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* Subcategory */}
          {categoryId && (
            <>
              <Text style={styles.label}>Sub kategoriya *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  isModalOpen.current = true;
                  setShowSubcategoryModal(true);
                }}
                disabled={loadingSubcategories}
              >
                {loadingSubcategories ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Text style={[styles.selectButtonText, !subcategoryId && styles.selectButtonPlaceholder]}>
                      {selectedSubcategory ? selectedSubcategory.name : 'Sub kategoriyani tanlang (ixtiyoriy)'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </>
                )}
              </TouchableOpacity>
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
            value={formatNumberInput(price)}
            onChangeText={(text) => setPrice(unformatNumber(text))}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Asl narx (so'm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Asl narx"
            value={formatNumberInput(originalPrice)}
            onChangeText={(text) => setOriginalPrice(unformatNumber(text))}
            keyboardType="numeric"
          />

          <Text style={styles.label}>KPI Bonus foizi (0-100) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Masalan: 5"
            value={kpiBonusPercent}
            onChangeText={(text) => {
              // Faqat raqamlar va nuqta qabul qilish
              const numericValue = text.replace(/[^0-9.]/g, '');
              // Maksimum 100 gacha cheklash
              if (numericValue === '' || (parseFloat(numericValue) >= 0 && parseFloat(numericValue) <= 100)) {
                setKpiBonusPercent(numericValue);
              }
            }}
            keyboardType="numeric"
            maxLength={3}
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
          <ProductImagesField
            drafts={imageDrafts}
            onChange={setImageDrafts}
            minImages={1}
            maxImages={5}
            onFeedback={showSnackbar}
            hint="JPEG, PNG, WebP yoki GIF. Har biri ≤ 4 MB. Kamida 1 ta, maksimal 5 ta rasm."
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Yaratish</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType={Platform.OS === 'web' && isDesktopWeb ? 'fade' : 'slide'}
        onRequestClose={() => {
          isModalOpen.current = false;
          setShowCategoryModal(false);
        }}
      >
        <View style={[styles.modalOverlay, isDesktopWeb && styles.modalOverlayDesktop]}>
          <View style={[styles.modalContent, isDesktopWeb && styles.modalContentDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategoriyani tanlang</Text>
              <TouchableOpacity
                onPress={() => {
                  isModalOpen.current = false;
                  setShowCategoryModal(false);
                  setCategorySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Kategoriyani qidirish..."
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
                placeholderTextColor="#999"
              />
              {categorySearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCategorySearchQuery('')}
                  style={styles.modalSearchClear}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={categories.filter((cat) =>
                cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    categoryId === item._id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    isModalOpen.current = false;
                    setCategoryId(item._id);
                    setSubcategoryId(null);
                    setShowCategoryModal(false);
                    setCategorySearchQuery('');
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <View style={styles.modalItemLeft}>
                      <Text
                        style={[
                          styles.modalItemText,
                          categoryId === item._id && styles.modalItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.modalItemBadges}>
                        {item.censored && (
                          <View style={styles.badgeCensored}>
                            <Ionicons name="warning" size={12} color="#FF6B6B" />
                            <Text style={styles.badgeCensoredText}>18+</Text>
                          </View>
                        )}
                        {item.status === 'inactive' && (
                          <View style={styles.badgeInactive}>
                            <Text style={styles.badgeInactiveText}>Nofaol</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {categoryId === item._id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Ionicons name="folder-outline" size={48} color="#ccc" />
                  <Text style={styles.modalEmptyText}>Kategoriyalar mavjud emas</Text>
                  <Text style={styles.modalEmptySubtext}>
                    Iltimos, admin bilan bog'laning yoki keyinroq urinib ko'ring
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubcategoryModal}
        transparent
        animationType={Platform.OS === 'web' && isDesktopWeb ? 'fade' : 'slide'}
        onRequestClose={() => {
          isModalOpen.current = false;
          setShowSubcategoryModal(false);
        }}
      >
        <View style={[styles.modalOverlay, isDesktopWeb && styles.modalOverlayDesktop]}>
          <View style={[styles.modalContent, isDesktopWeb && styles.modalContentDesktop]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sub kategoriyani tanlang</Text>
              <TouchableOpacity
                onPress={() => {
                  isModalOpen.current = false;
                  setShowSubcategoryModal(false);
                  setSubcategorySearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Sub kategoriyani qidirish..."
                value={subcategorySearchQuery}
                onChangeText={setSubcategorySearchQuery}
                placeholderTextColor="#999"
              />
              {subcategorySearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSubcategorySearchQuery('')}
                  style={styles.modalSearchClear}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={subcategories.filter((sub) =>
                sub.name.toLowerCase().includes(subcategorySearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    subcategoryId === item._id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    isModalOpen.current = false;
                    setSubcategoryId(item._id);
                    setShowSubcategoryModal(false);
                    setSubcategorySearchQuery('');
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <View style={styles.modalItemLeft}>
                      <Text
                        style={[
                          styles.modalItemText,
                          subcategoryId === item._id && styles.modalItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <View style={styles.modalItemBadges}>
                        {item.censored && (
                          <View style={styles.badgeCensored}>
                            <Ionicons name="warning" size={12} color="#FF6B6B" />
                            <Text style={styles.badgeCensoredText}>18+</Text>
                          </View>
                        )}
                        {item.status === 'inactive' && (
                          <View style={styles.badgeInactive}>
                            <Text style={styles.badgeInactiveText}>Nofaol</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {subcategoryId === item._id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>Sub kategoriyalar mavjud emas</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  pageColumn: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
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
    paddingTop: 8,
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    minHeight: 56,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    height: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalContentDesktop: {
    width: '100%',
    maxWidth: 520,
    maxHeight: 640,
    height: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  modalSearchClear: {
    marginLeft: 8,
    padding: 4,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemActive: {
    backgroundColor: '#E3F2FD',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalItemLeft: {
    flex: 1,
  },
  modalItemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  badgeCensored: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeCensoredText: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  badgeInactive: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeInactiveText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
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

