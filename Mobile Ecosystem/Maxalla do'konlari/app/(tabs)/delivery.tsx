import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
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
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DeliveryProvider } from '../../services/api';

export default function DeliveryScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (token) {
      loadProviders();
    }
  }, [token]);

  const loadProviders = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await apiService.getDeliveryProviders(token);
      if (response.success && response.data) {
        setProviders(response.data);
      }
    } catch (error: any) {
      if (!isRefresh) {
        Alert.alert('Xatolik', error.message || 'Yetkazib beruvchilarni yuklashda xatolik');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadProviders(true);
  };

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Xatolik', 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      const response = await apiService.createDeliveryProvider(token, {
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Yetkazib beruvchi yaratildi', [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateModal(false);
              resetForm();
              loadProviders();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Yetkazib beruvchi yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProvider || !name.trim() || !phone.trim()) return;
    if (!token) return;

    if (password.trim() && password.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateDeliveryProvider(
        token,
        selectedProvider._id,
        {
          name: name.trim(),
          phone: phone.trim(),
          status,
          ...(password.trim() && { password: password.trim() }),
          notes: notes.trim() || undefined,
        }
      );

      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Yetkazib beruvchi yangilandi', [
          {
            text: 'OK',
            onPress: () => {
              setShowEditModal(false);
              resetForm();
              loadProviders();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Yetkazib beruvchi yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (provider: DeliveryProvider) => {
    Alert.alert(
      'O\'chirish',
      `"${provider.name}" ni o'chirishni tasdiqlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setLoading(true);
            try {
              const response = await apiService.deleteDeliveryProvider(token, provider._id);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', 'Yetkazib beruvchi o\'chirildi');
                loadProviders();
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.message || 'Yetkazib beruvchi o\'chirishda xatolik');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (provider: DeliveryProvider) => {
    setSelectedProvider(provider);
    setName(provider.name);
    setPhone(provider.phone);
    setStatus(provider.status);
    setNotes(provider.notes || '');
    setPassword(''); // Parolni tozalamiz (yangilashda ixtiyoriy)
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setPassword('');
    setNotes('');
    setStatus('active');
    setSelectedProvider(null);
  };

  const renderProvider = ({ item }: { item: DeliveryProvider }) => (
    <View style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.providerPhone}>{item.phone}</Text>
          {item.notes && <Text style={styles.providerNotes}>{item.notes}</Text>}
        </View>
        <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive]}>
          <Text
            style={[styles.statusText, item.status === 'active' && styles.statusTextActive]}>
            {item.status === 'active' ? 'Faol' : 'Nofaol'}
          </Text>
        </View>
      </View>

      <View style={styles.providerActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color="#007AFF" />
          <Text style={styles.editButtonText}>Tahrirlash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>O'chirish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.title}>Kuryerlar</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && providers.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : providers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>Hozircha kuryer yo'q</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            activeOpacity={0.7}>
            <Text style={styles.emptyStateButtonText}>Qo'shish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi kuryer</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ism (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kuryer ismi"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Telefon (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+998901234567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Parol (majburiy, min 6 belgi)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Parol kiriting"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Eslatmalar (ixtiyoriy)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Qo'shimcha eslatmalar"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCreate}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>Saqlash</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kuryerni tahrirlash</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ism (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kuryer ismi"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Telefon (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+998901234567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Parol (ixtiyoriy, yangilash uchun)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Parolni o'zgartirish uchun kiriting"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Holat</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, status === 'active' && styles.statusButtonActive]}
                    onPress={() => setStatus('active')}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === 'active' && styles.statusButtonTextActive,
                      ]}>
                      Faol
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, status === 'inactive' && styles.statusButtonActive]}
                    onPress={() => setStatus('inactive')}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === 'inactive' && styles.statusButtonTextActive,
                      ]}>
                      Nofaol
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Eslatmalar (ixtiyoriy)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Qo'shimcha eslatmalar"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleUpdate}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>Saqlash</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  providerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  providerNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  providerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordButton: {
    backgroundColor: '#FFF3E0',
  },
  passwordButtonText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  statusButtonTextActive: {
    color: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
