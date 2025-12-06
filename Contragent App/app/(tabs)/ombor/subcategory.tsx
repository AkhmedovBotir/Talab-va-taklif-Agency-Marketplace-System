import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, Category } from '../../../services/api';

export default function SubcategoryScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadSubcategories = useCallback(async () => {
    if (!categoryId) return;
    
    try {
      const response = await apiService.getSubcategories({
        parent: categoryId,
        limit: 100,
      });
      setSubcategories(response.data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Sub kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadSubcategories();
  }, [loadSubcategories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSubcategories();
  };

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!categoryId || !subcategoryName.trim()) {
      Alert.alert('Xatolik', 'Sub kategoriya nomi kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createSubcategory({
        name: subcategoryName.trim(),
        parent: categoryId,
      });
      setShowCreateModal(false);
      setSubcategoryName('');
      loadSubcategories();
      Alert.alert('Muvaffaqiyat', 'Sub kategoriya muvaffaqiyatli yaratildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Sub kategoriya yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subcategory: Category) => {
    setSelectedSubcategory(subcategory);
    setSubcategoryName(subcategory.name);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!subcategoryName.trim() || !selectedSubcategory) {
      Alert.alert('Xatolik', 'Sub kategoriya nomi kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.updateSubcategory(selectedSubcategory._id, {
        name: subcategoryName.trim(),
      });
      setShowEditModal(false);
      setSelectedSubcategory(null);
      setSubcategoryName('');
      loadSubcategories();
      Alert.alert('Muvaffaqiyat', 'Sub kategoriya muvaffaqiyatli yangilandi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Sub kategoriya yangilashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (subcategory: Category) => {
    Alert.alert(
      'O\'chirish',
      `"${subcategory.name}" sub kategoriyasini o'chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteSubcategory(subcategory._id);
              loadSubcategories();
              Alert.alert('Muvaffaqiyat', 'Sub kategoriya muvaffaqiyatli o\'chirildi');
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Sub kategoriya o\'chirishda xatolik');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (subcategory: Category, value: boolean) => {
    try {
      await apiService.updateSubcategoryStatus(subcategory._id, {
        status: value ? 'active' : 'inactive',
      });
      loadSubcategories();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Status yangilashda xatolik');
    }
  };

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
        <TouchableOpacity onPress={() => router.push('/(tabs)/ombor')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Sub kategoriyalar'}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Sub kategoriya nomi bo'yicha qidirish..."
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

      {/* Subcategories List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredSubcategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Sub kategoriya topilmadi' : 'Sub kategoriyalar mavjud emas'}
            </Text>
          </View>
        ) : (
          filteredSubcategories.map((subcategory) => (
            <View key={subcategory._id} style={styles.subcategoryCard}>
              <View style={styles.subcategoryContent}>
                <View style={styles.subcategoryInfo}>
                  <Text style={styles.subcategoryName}>{subcategory.name}</Text>
                </View>
                <View style={styles.subcategoryActions}>
                  <Switch
                    value={subcategory.status === 'active'}
                    onValueChange={(value) => handleStatusChange(subcategory, value)}
                    trackColor={{ false: '#ccc', true: '#34C759' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(subcategory)}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Tahrirlash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(subcategory)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    O'chirish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
            <Text style={styles.modalTitle}>Yangi sub kategoriya</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Sub kategoriya nomi"
              value={subcategoryName}
              onChangeText={setSubcategoryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setSubcategoryName('');
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
            <Text style={styles.modalTitle}>Sub kategoriyani tahrirlash</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Sub kategoriya nomi"
              value={subcategoryName}
              onChangeText={setSubcategoryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedSubcategory(null);
                  setSubcategoryName('');
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
  subcategoryCard: {
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
  subcategoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subcategoryInfo: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subcategoryActions: {
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

