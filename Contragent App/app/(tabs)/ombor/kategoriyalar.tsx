import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { apiService, Category } from '../../../services/api';

export default function KategoriyalarScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories({ limit: 100 });
      setCategories(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Xatolik', 'Kategoriya nomi kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createCategory({ name: categoryName.trim() });
      setShowCreateModal(false);
      setCategoryName('');
      loadCategories();
      Alert.alert('Muvaffaqiyat', 'Kategoriya muvaffaqiyatli yaratildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kategoriya yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!categoryName.trim() || !selectedCategory) {
      Alert.alert('Xatolik', 'Kategoriya nomi kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.updateCategory(selectedCategory._id, {
        name: categoryName.trim(),
      });
      setShowEditModal(false);
      setSelectedCategory(null);
      setCategoryName('');
      loadCategories();
      Alert.alert('Muvaffaqiyat', 'Kategoriya muvaffaqiyatli yangilandi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kategoriya yangilashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'O\'chirish',
      `"${category.name}" kategoriyasini o'chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteCategory(category._id);
              loadCategories();
              Alert.alert('Muvaffaqiyat', 'Kategoriya muvaffaqiyatli o\'chirildi');
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Kategoriya o\'chirishda xatolik');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (category: Category, value: boolean) => {
    try {
      await apiService.updateCategoryStatus(category._id, {
        status: value ? 'active' : 'inactive',
      });
      loadCategories();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Status yangilashda xatolik');
    }
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/(tabs)/ombor/subcategory',
      params: { categoryId: category._id, categoryName: category.name },
    });
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
          placeholder="Kategoriya nomi bo'yicha qidirish..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Kategoriya topilmadi' : 'Kategoriyalar mavjud emas'}
            </Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <Text style={styles.subcategoryCount}>
                      {category.subcategories.length} ta sub kategoriya
                    </Text>
                  )}
                </View>
                <View style={styles.categoryActions}>
                  <Switch
                    value={category.status === 'active'}
                    onValueChange={(value) => handleStatusChange(category, value)}
                    trackColor={{ false: '#ccc', true: '#34C759' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(category)}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Tahrirlash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(category)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    O'chirish
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yangi kategoriya</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Kategoriya nomi"
              value={categoryName}
              onChangeText={setCategoryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Yaratish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategoriyani tahrirlash</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Kategoriya nomi"
              value={categoryName}
              onChangeText={setCategoryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                  setCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Saqlash</Text>
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
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subcategoryCount: {
    fontSize: 14,
    color: '#666',
  },
  categoryActions: {
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffebeb',
  },
  actionButtonText: {
    fontSize: 14,
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
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

