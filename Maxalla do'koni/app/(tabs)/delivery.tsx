import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DeliveryProvider } from '../../services/api';

export default function DeliveryScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<DeliveryProvider | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

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
        showSnackbar(error.message || 'Yetkazib beruvchilarni yuklashda xatolik');
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
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      showSnackbar('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      const response = await apiService.createDeliveryProvider(token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        note: note.trim() || undefined,
        password_setup_allowed: true,
      });

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        showSnackbar('Yetkazib beruvchi yaratildi', 'success');
        loadProviders();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Yetkazib beruvchi yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProvider || !firstName.trim() || !lastName.trim() || !phone.trim()) return;
    if (!token) return;

    setLoading(true);
    try {
      const providerId = String(selectedProvider.id || selectedProvider._id);
      const response = await apiService.updateDeliveryProvider(
        token,
        providerId,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          note: note.trim() || undefined,
          password_setup_allowed: true,
        }
      );

      if (response.success) {
        setShowEditModal(false);
        resetForm();
        showSnackbar('Yetkazib beruvchi yangilandi', 'success');
        loadProviders();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Yetkazib beruvchi yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (provider: DeliveryProvider) => {
    setProviderToDelete(provider);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!token || !providerToDelete) return;

    setLoading(true);
    try {
      const providerId = String(providerToDelete.id || providerToDelete._id);
      const response = await apiService.deleteDeliveryProvider(token, providerId);
      if (response.success) {
        setShowDeleteModal(false);
        setProviderToDelete(null);
        showSnackbar('Yetkazib beruvchi o\'chirildi', 'success');
        loadProviders();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Yetkazib beruvchi o\'chirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (provider: DeliveryProvider) => {
    setSelectedProvider(provider);
    setFirstName(provider.first_name || '');
    setLastName(provider.last_name || '');
    setPhone(provider.phone);
    setNote(provider.note || provider.notes || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setNote('');
    setSelectedProvider(null);
  };

  const renderProvider = ({ item }: { item: DeliveryProvider }) => (
    <View style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.providerPhone}>{item.phone}</Text>
          {(item.note || item.notes) && <Text style={styles.providerNotes}>{item.note || item.notes}</Text>}
        </View>
        <View style={[styles.statusBadge, item.status !== 'inactive' && styles.statusActive]}>
          <Text
            style={[styles.statusText, item.status !== 'inactive' && styles.statusTextActive]}>
            {item.status === 'inactive' ? 'Nofaol' : 'Faol'}
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
      <View style={[styles.pageContent, isWeb && styles.pageContentWeb]}>
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
            keyExtractor={(item) => String(item.id || item._id)}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            style={styles.list}
          />
        )}
      </View>

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
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Familiya (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kuryer familiyasi"
                  value={lastName}
                  onChangeText={setLastName}
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
                <Text style={styles.label}>Eslatmalar (ixtiyoriy)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Qo'shimcha eslatmalar"
                  value={note}
                  onChangeText={setNote}
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
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Familiya (majburiy)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kuryer familiyasi"
                  value={lastName}
                  onChangeText={setLastName}
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
                <Text style={styles.label}>Eslatmalar (ixtiyoriy)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Qo'shimcha eslatmalar"
                  value={note}
                  onChangeText={setNote}
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

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (loading) return;
          setShowDeleteModal(false);
          setProviderToDelete(null);
        }}>
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>O'chirish</Text>
            <Text style={styles.deleteModalText}>
              {providerToDelete
                ? `"${providerToDelete.name}" ni o'chirishni tasdiqlaysizmi?`
                : 'Kuryerni o\'chirishni tasdiqlaysizmi?'}
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setProviderToDelete(null);
                }}
                disabled={loading}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton, loading && styles.saveButtonDisabled]}
                onPress={confirmDelete}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>O'chirish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  pageContent: {
    flex: 1,
    width: '100%',
  },
  pageContentWeb: {
    maxWidth: 980,
    alignSelf: 'center',
  },
  list: {
    flex: 1,
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
    paddingHorizontal: 16,
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
    padding: 16,
    paddingBottom: 28,
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
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Platform.OS === 'web' ? 20 : 24,
    borderTopRightRadius: Platform.OS === 'web' ? 20 : 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 20 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 20 : 0,
    maxHeight: '90%',
    width: Platform.OS === 'web' ? '92%' : '100%',
    maxWidth: Platform.OS === 'web' ? 560 : undefined,
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
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 18,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteModalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f4f7',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#e5484d',
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
