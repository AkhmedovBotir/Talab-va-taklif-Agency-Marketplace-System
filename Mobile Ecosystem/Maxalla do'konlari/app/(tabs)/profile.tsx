import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RegionPicker from '../../components/RegionPicker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, Region } from '../../services/api';

// DateTimePicker is native-only; avoid loading on web
const DateTimePicker = Platform.OS !== 'web'
  ? require('@react-native-community/datetimepicker').default
  : null;

export default function ProfileScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHoursOpen, setWorkingHoursOpen] = useState('');
  const [workingHoursClose, setWorkingHoursClose] = useState('');
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [openTimeDate, setOpenTimeDate] = useState(new Date());
  const [closeTimeDate, setCloseTimeDate] = useState(new Date());
  const [showServiceAreasModal, setShowServiceAreasModal] = useState(false);
  const [selectedTuman, setSelectedTuman] = useState<Region | null>(null);
  const [selectedMfys, setSelectedMfys] = useState<Region[]>([]);

  useEffect(() => {
    if (user?.workingHours) {
      setWorkingHoursOpen(user.workingHours.open || '');
      setWorkingHoursClose(user.workingHours.close || '');
      // Set date objects for time picker
      if (user.workingHours.open) {
        const [hours, minutes] = user.workingHours.open.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        setOpenTimeDate(date);
      }
      if (user.workingHours.close) {
        const [hours, minutes] = user.workingHours.close.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        setCloseTimeDate(date);
      }
    }
    if (user?.serviceAreas) {
      setSelectedTuman(null); // Will be loaded from API if needed
      setSelectedMfys([]); // Will be loaded from API if needed
    }
  }, [user]);

  // Initialize temp values when modal opens
  useEffect(() => {
    if (showServiceAreasModal) {
      const loadSavedServiceAreas = async () => {
        // Set default tuman from user data
        if (user?.tuman) {
          setSelectedTuman(user.tuman);
        } else {
          setSelectedTuman(null);
        }
        setSelectedMfys([]);

        // Load saved service areas if they exist
        if (user?.serviceAreas) {
          // Load tuman if it exists and is different from user.tuman
          if (user.serviceAreas.tuman) {
            // serviceAreas.tuman is now a Region object
            const serviceTuman = user.serviceAreas.tuman;
            
            if (serviceTuman._id && user.tuman?._id !== serviceTuman._id) {
              setSelectedTuman(serviceTuman);
            } else if (user.tuman) {
              setSelectedTuman(user.tuman);
            }
          } else if (user.tuman) {
            setSelectedTuman(user.tuman);
          }

          // Load MFYs - serviceAreas.mfys is now Region[] array
          if (user.serviceAreas.mfys && user.serviceAreas.mfys.length > 0) {
            setSelectedMfys(user.serviceAreas.mfys);
          }
        }
      };

      loadSavedServiceAreas();
    }
  }, [showServiceAreasModal, user]);

  if (!user || !token) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleOpenTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowOpenTimePicker(false);
    }
    if (selectedDate) {
      setOpenTimeDate(selectedDate);
      setWorkingHoursOpen(formatTime(selectedDate));
    }
  };

  const handleCloseTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCloseTimePicker(false);
    }
    if (selectedDate) {
      setCloseTimeDate(selectedDate);
      setWorkingHoursClose(formatTime(selectedDate));
    }
  };

  const handleUpdateWorkingHours = async () => {
    if (!workingHoursOpen && !workingHoursClose) {
      Alert.alert('Xatolik', 'Kamida bitta vaqt kiritilishi kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateWorkingHours(token, {
        open: workingHoursOpen || undefined,
        close: workingHoursClose || undefined,
      });

      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Ish vaqti yangilandi', [
          {
            text: 'OK',
            onPress: () => {
              setShowWorkingHoursModal(false);
              refreshUser();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Ish vaqtini yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleTumanSelect = (region: Region) => {
    setSelectedTuman(region);
    setSelectedMfys([]); // Clear MFYs when tuman changes
  };

  const handleMfySelect = (region: Region) => {
    setSelectedMfys((prev) => {
      const exists = prev.find((r) => r._id === region._id);
      if (exists) {
        return prev.filter((r) => r._id !== region._id);
      }
      return [...prev, region];
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleUpdateServiceAreas = async () => {
    if (selectedMfys.length === 0) {
      Alert.alert('Xatolik', 'Kamida bitta MFY tanlashingiz kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateServiceAreas(token, {
        tuman: selectedTuman?._id || undefined,
        mfys: selectedMfys.map((mfy) => mfy._id),
      });

      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Xizmat ko\'rsatish hududlari yangilandi', [
          {
            text: 'OK',
            onPress: () => {
              setShowServiceAreasModal(false);
              refreshUser();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Xizmat ko\'rsatish hududlarini yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Dokon Ma'lumotlari Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Dokon ma'lumotlari</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomi:</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>INN:</Text>
            <Text style={styles.infoValue}>{user.inn}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>

          {user.viloyat && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Viloyat:</Text>
              <Text style={styles.infoValue}>{user.viloyat.name}</Text>
            </View>
          )}

          {user.tuman && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tuman:</Text>
              <Text style={styles.infoValue}>{user.tuman.name}</Text>
            </View>
          )}

          {user.mfy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MFY:</Text>
              <Text style={styles.infoValue}>{user.mfy.name}</Text>
            </View>
          )}

          {user.activityType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Faoliyat turi:</Text>
              <Text style={styles.infoValue}>{user.activityType.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.statusBadge, user.status === 'active' && styles.statusActive]}>
              <Text
                style={[
                  styles.statusText,
                  user.status === 'active' && styles.statusTextActive,
                ]}>
                {user.status === 'active' ? 'Faol' : 'Nofaol'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ish Vaqti Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Ish vaqti</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowWorkingHoursModal(true)}
              activeOpacity={0.7}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {user.workingHours ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ochilish vaqti:</Text>
                <Text style={styles.infoValue}>
                  {user.workingHours.open || 'Belgilanmagan'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Yopilish vaqti:</Text>
                <Text style={styles.infoValue}>
                  {user.workingHours.close || 'Belgilanmagan'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Ish vaqti belgilanmagan</Text>
              <TouchableOpacity
                style={styles.setButton}
                onPress={() => setShowWorkingHoursModal(true)}
                activeOpacity={0.7}>
                <Text style={styles.setButtonText}>Belgilash</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Xizmat Ko'rsatish Hududlari Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Xizmat ko'rsatish hududlari</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowServiceAreasModal(true)}
              activeOpacity={0.7}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {user.serviceAreas ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tuman:</Text>
                <Text style={styles.infoValue}>
                  {user.serviceAreas.tuman?.name || 'Belgilanmagan'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MFYlar soni:</Text>
                <Text style={styles.infoValue}>
                  {user.serviceAreas.mfys?.length || 0} ta
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Xizmat ko'rsatish hududlari belgilanmagan</Text>
              <TouchableOpacity
                style={styles.setButton}
                onPress={() => setShowServiceAreasModal(true)}
                activeOpacity={0.7}>
                <Text style={styles.setButtonText}>Belgilash</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Working Hours Modal */}
      <Modal
        visible={showWorkingHoursModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWorkingHoursModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ish vaqtini yangilash</Text>
              <TouchableOpacity
                onPress={() => setShowWorkingHoursModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              {/* Open Time */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ochilish vaqti</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'time',
                    value: workingHoursOpen,
                    onChange: (e: any) => setWorkingHoursOpen(e.target.value || ''),
                    style: webTimeInputStyle,
                  })
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowOpenTimePicker(true)}
                      disabled={loading}>
                      <Text style={styles.timePickerText}>
                        {workingHoursOpen || 'Vaqtni tanlang'}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    {DateTimePicker && Platform.OS === 'ios' && showOpenTimePicker && (
                      <DateTimePicker
                        value={openTimeDate}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleOpenTimeChange}
                      />
                    )}
                    {DateTimePicker && Platform.OS === 'android' && showOpenTimePicker && (
                      <DateTimePicker
                        value={openTimeDate}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleOpenTimeChange}
                      />
                    )}
                  </>
                )}
              </View>

              {/* Close Time */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Yopilish vaqti</Text>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'time',
                    value: workingHoursClose,
                    onChange: (e: any) => setWorkingHoursClose(e.target.value || ''),
                    style: webTimeInputStyle,
                  })
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.timePickerButton}
                      onPress={() => setShowCloseTimePicker(true)}
                      disabled={loading}>
                      <Text style={styles.timePickerText}>
                        {workingHoursClose || 'Vaqtni tanlang'}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    {DateTimePicker && Platform.OS === 'ios' && showCloseTimePicker && (
                      <DateTimePicker
                        value={closeTimeDate}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleCloseTimeChange}
                      />
                    )}
                    {DateTimePicker && Platform.OS === 'android' && showCloseTimePicker && (
                      <DateTimePicker
                        value={closeTimeDate}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleCloseTimeChange}
                      />
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleUpdateWorkingHours}
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

      {/* Service Areas Modal */}
      <Modal
        visible={showServiceAreasModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceAreasModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xizmat ko'rsatish hududlarini yangilash</Text>
              <TouchableOpacity
                onPress={() => setShowServiceAreasModal(false)}
                style={styles.closeButton}
                disabled={loading}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled">
              {/* Tuman Selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tuman (ixtiyoriy)</Text>
                <RegionPicker
                  label="Tumanni tanlang"
                  value={selectedTuman?._id || ''}
                  type="district"
                  parentId={user.viloyat?._id}
                  onSelect={handleTumanSelect}
                  displayValue={selectedTuman?.name}
                />
                <Text style={styles.hintText}>
                  Tuman ixtiyoriy. Agar tanlanmasa, o'z tumani ishlatiladi.
                </Text>
              </View>

              {/* MFY Selector */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>MFYlar (majburiy)</Text>
                <RegionPicker
                  label="MFYlarni tanlang"
                  value=""
                  type="mfy"
                  parentId={selectedTuman?._id || user.tuman?._id}
                  onSelect={handleMfySelect}
                  displayValue={selectedMfys.length > 0 ? `${selectedMfys.length} ta MFY tanlandi` : 'MFYlarni tanlang'}
                  multiple={true}
                  selectedIds={selectedMfys.map(m => m._id)}
                />
                <Text style={styles.hintText}>
                  Kamida bitta MFY tanlashingiz kerak.
                </Text>
              </View>

              {/* Selected MFYs List */}
              {selectedMfys.length > 0 && (
                <View style={styles.selectedMfysContainer}>
                  <Text style={styles.selectedMfysTitle}>Tanlangan MFYlar:</Text>
                  <FlatList
                    data={selectedMfys}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <View style={styles.selectedMfyItem}>
                        <Text style={styles.selectedMfyText}>{item.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleMfySelect(item)}
                          style={styles.removeMfyButton}>
                          <Ionicons name="close-circle" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    )}
                    scrollEnabled={false}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveButton, (loading || selectedMfys.length === 0) && styles.saveButtonDisabled]}
                onPress={handleUpdateServiceAreas}
                disabled={loading || selectedMfys.length === 0}
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

// Web-only style for <input type="time"> (DOM)
const webTimeInputStyle: any = Platform.OS === 'web' ? {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e0e0e0',
  borderRadius: 12,
  backgroundColor: '#fafafa',
  color: '#333',
} : {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  editButton: {
    padding: 4,
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
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  setButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  setButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
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
    marginBottom: 10,
    marginLeft: 4,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  timePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  selectedMfysContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  selectedMfysTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  selectedMfyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  selectedMfyText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeMfyButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
