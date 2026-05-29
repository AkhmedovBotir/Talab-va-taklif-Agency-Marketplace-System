import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import ServicePeriodCard from '../../components/ServicePeriodCard';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useServiceAccess } from '../../contexts/ServiceAccessContext';
import { apiService, ServiceAreaMfy, WorkingHourDay } from '../../services/api';

const DateTimePicker = Platform.OS !== 'web'
  ? require('@react-native-community/datetimepicker').default
  : null;

export default function ProfileScreen() {
  const { user, token, refreshUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { refreshServiceAccess } = useServiceAccess();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [weeklyWorkingHours, setWeeklyWorkingHours] = useState<WorkingHourDay[]>([]);
  const [showServiceAreasModal, setShowServiceAreasModal] = useState(false);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState('');
  const [availableMfys, setAvailableMfys] = useState<ServiceAreaMfy[]>([]);
  const [selectedMfyIds, setSelectedMfyIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDay, setTimePickerDay] = useState<number | null>(null);
  const [timePickerField, setTimePickerField] = useState<'open_time' | 'close_time'>('open_time');

  const weekdays = [
    { weekday: 1, label: 'Dushanba' },
    { weekday: 2, label: 'Seshanba' },
    { weekday: 3, label: 'Chorshanba' },
    { weekday: 4, label: 'Payshanba' },
    { weekday: 5, label: 'Juma' },
    { weekday: 6, label: 'Shanba' },
    { weekday: 7, label: 'Yakshanba' },
  ];

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const loadServiceAreaMfys = async (silent = false) => {
    if (!token) return;
    try {
      const response = await apiService.getServiceAreaMfys(token);
      const data = response.data;
      const userDistrictId = Number((user as any)?.district_id || 0) || null;
      const nextDistrictId = userDistrictId || data?.district_id || null;
      setDistrictId(nextDistrictId);
      setAvailableMfys(data?.available_mfys || []);
      setSelectedMfyIds(data?.selected_mfy_ids || []);

      if (nextDistrictId) {
        const districts = await apiService.getRegions({
          type: 'district',
          page: 1,
          limit: 1000,
        });
        const found = districts.data.find((d) => Number(d._id) === Number(nextDistrictId));
        setDistrictName(found?.name || user?.tuman?.name || '');
      } else {
        setDistrictName(user?.tuman?.name || '');
      }
    } catch (error: any) {
      if (!silent) {
        showSnackbar(error.message || 'MFYlarni yuklashda xatolik');
      }
    }
  };

  useEffect(() => {
    const loadWorkingHours = async () => {
      if (!token) return;
      try {
        const response = await apiService.getWorkingHours(token);
        const received = (response.data?.working_hours || []).sort((a, b) => a.weekday - b.weekday);
        const map = new Map(received.map((item) => [item.weekday, item]));
        const normalized = weekdays.map(({ weekday }) => ({
          weekday,
          is_off: map.get(weekday)?.is_off ?? false,
          open_time: map.get(weekday)?.open_time || '09:00',
          close_time: map.get(weekday)?.close_time || '18:00',
        }));
        setWeeklyWorkingHours(normalized);
      } catch (error: any) {
        setWeeklyWorkingHours(
          weekdays.map(({ weekday }) => ({
            weekday,
            is_off: false,
            open_time: '09:00',
            close_time: '18:00',
          }))
        );
      }
    };
    loadWorkingHours();
  }, [token]);

  useEffect(() => {
    if (token) {
      loadServiceAreaMfys(true);
    }
  }, [token]);

  useEffect(() => {
    if (showServiceAreasModal) {
      loadServiceAreaMfys();
    }
  }, [showServiceAreasModal, token]);

  if (!user || !token) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const updateDay = (weekday: number, patch: Partial<WorkingHourDay>) => {
    setWeeklyWorkingHours((prev) =>
      prev.map((day) => {
        if (day.weekday !== weekday) return day;
        const next = { ...day, ...patch };
        if (patch.is_off === false) {
          next.open_time = next.open_time || '09:00';
          next.close_time = next.close_time || '18:00';
        }
        return next;
      })
    );
  };

  const parseTimeToDate = (timeValue?: string): Date => {
    const date = new Date();
    if (!timeValue || !timeValue.includes(':')) return date;
    const [h, m] = timeValue.split(':');
    date.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    return date;
  };

  const openTimePickerFor = (weekday: number, field: 'open_time' | 'close_time') => {
    setTimePickerDay(weekday);
    setTimePickerField(field);
    setShowTimePicker(true);
  };

  const handleNativeTimeChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (!selectedDate || !timePickerDay) return;
    const hh = String(selectedDate.getHours()).padStart(2, '0');
    const mm = String(selectedDate.getMinutes()).padStart(2, '0');
    updateDay(timePickerDay, { [timePickerField]: `${hh}:${mm}` } as Partial<WorkingHourDay>);
  };

  const handleUpdateWorkingHours = async () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const invalid = weeklyWorkingHours.find((day) => {
      if (day.is_off) return false;
      if (!day.open_time || !day.close_time) return true;
      if (!timeRegex.test(day.open_time) || !timeRegex.test(day.close_time)) return true;
      return day.close_time <= day.open_time;
    });
    if (invalid) {
      showSnackbar('Ish kunlarida vaqt HH:MM formatda bo\'lishi va yopilish ochilishdan keyin bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.updateWorkingHours(token, {
        working_hours: weeklyWorkingHours.map((day) =>
          day.is_off
            ? { weekday: day.weekday, is_off: true }
            : {
                weekday: day.weekday,
                is_off: false,
                open_time: day.open_time,
                close_time: day.close_time,
              }
        ),
      });

      if (response.success) {
        setShowWorkingHoursModal(false);
        setShowTimePicker(false);
        showSnackbar('Ish vaqti yangilandi', 'success');
        refreshUser();
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Ish vaqtini yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleMfyToggle = (mfyId: number) => {
    setSelectedMfyIds((prev) => {
      const exists = prev.includes(mfyId);
      if (exists) return prev.filter((id) => id !== mfyId);
      return [...prev, mfyId];
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), refreshServiceAccess()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateServiceAreas = async () => {
    setLoading(true);
    try {
      const response = await apiService.updateServiceAreaMfys(token, {
        mfy_ids: selectedMfyIds,
      });

      if (response.success) {
        setShowServiceAreasModal(false);
        showSnackbar('Xizmat ko\'rsatish hududlari yangilandi', 'success');
        setDistrictId(response.data?.district_id || districtId);
        setAvailableMfys(response.data?.available_mfys || availableMfys);
        setSelectedMfyIds(response.data?.selected_mfy_ids || selectedMfyIds);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Xizmat ko\'rsatish hududlarini yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const selectedMfyNames = availableMfys
    .filter((mfy) => selectedMfyIds.includes(mfy.id))
    .map((mfy) => mfy.name);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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

        <ServicePeriodCard />

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

          {weeklyWorkingHours.length > 0 ? (
            weekdays.map(({ weekday, label }) => {
              const day = weeklyWorkingHours.find((item) => item.weekday === weekday);
              return (
                <View style={styles.infoRow} key={weekday}>
                  <Text style={styles.infoLabel}>{label}:</Text>
                  <Text style={styles.infoValue}>
                    {day?.is_off ? 'Dam olish kuni' : `${day?.open_time || '--:--'} - ${day?.close_time || '--:--'}`}
                  </Text>
                </View>
              );
            })
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

          {selectedMfyIds.length > 0 ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MFYlar soni:</Text>
                <Text style={styles.infoValue}>
                  {selectedMfyIds.length} ta
                </Text>
              </View>
              <View style={styles.mfyNamesContainer}>
                <Text style={styles.mfyNamesLabel}>Tanlangan MFYlar:</Text>
                <Text style={styles.mfyNamesValue}>
                  {selectedMfyNames.length > 0
                    ? selectedMfyNames.join(', ')
                    : `${selectedMfyIds.length} ta MFY tanlangan`}
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

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => router.push('/notifications' as any)}>
          <View style={styles.notifNavRow}>
            <Ionicons name="notifications-outline" size={24} color="#007AFF" />
            <View style={styles.notifNavTextCol}>
              <Text style={styles.notifNavTitle}>Bildirishnomalar</Text>
              <Text style={styles.notifNavSub}>Integratsiya va umumiy e&apos;lonlar</Text>
            </View>
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={22} color="#C7C7CC" />
          </View>
        </TouchableOpacity>

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              {weekdays.map(({ weekday, label }) => {
                const day = weeklyWorkingHours.find((item) => item.weekday === weekday);
                if (!day) return null;
                return (
                  <View key={weekday} style={styles.weekdayCard}>
                    <View style={styles.weekdayHeader}>
                      <Text style={styles.weekdayTitle}>{label}</Text>
                      <TouchableOpacity
                        style={[styles.offBadge, day.is_off && styles.offBadgeActive]}
                        onPress={() => updateDay(weekday, { is_off: !day.is_off })}
                        disabled={loading}>
                        <Text style={[styles.offBadgeText, day.is_off && styles.offBadgeTextActive]}>
                          {day.is_off ? 'Dam olish' : 'Ish kuni'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {!day.is_off && (
                      <View style={styles.weekdayTimeRow}>
                        {Platform.OS === 'web' ? (
                          React.createElement('input', {
                            type: 'time',
                            value: day.open_time || '',
                            onChange: (e: any) => updateDay(weekday, { open_time: e.target.value || '' }),
                            style: webTimeInputStyle,
                            disabled: loading,
                          })
                        ) : (
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => openTimePickerFor(weekday, 'open_time')}
                            disabled={loading}>
                            <Text style={styles.timePickerText}>{day.open_time || '09:00'}</Text>
                            <Ionicons name="time-outline" size={18} color="#007AFF" />
                          </TouchableOpacity>
                        )}
                        <Text style={styles.timeDash}>-</Text>
                        {Platform.OS === 'web' ? (
                          React.createElement('input', {
                            type: 'time',
                            value: day.close_time || '',
                            onChange: (e: any) => updateDay(weekday, { close_time: e.target.value || '' }),
                            style: webTimeInputStyle,
                            disabled: loading,
                          })
                        ) : (
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => openTimePickerFor(weekday, 'close_time')}
                            disabled={loading}>
                            <Text style={styles.timePickerText}>{day.close_time || '18:00'}</Text>
                            <Ionicons name="time-outline" size={18} color="#007AFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              {DateTimePicker && showTimePicker && timePickerDay !== null && (
                <DateTimePicker
                  value={parseTimeToDate(
                    weeklyWorkingHours.find((day) => day.weekday === timePickerDay)?.[timePickerField]
                  )}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleNativeTimeChange}
                />
              )}

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tuman</Text>
                <Text style={styles.infoHintValue}>{districtName || user.tuman?.name || 'Belgilanmagan'}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>MFYlar</Text>
                <View style={styles.mfyListContainer}>
                  {availableMfys.length === 0 ? (
                    <Text style={styles.emptyStateText}>MFY topilmadi</Text>
                  ) : (
                    <ScrollView
                      style={styles.mfyList}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}>
                      {availableMfys.map((mfy) => {
                        const selected = selectedMfyIds.includes(mfy.id);
                        return (
                          <TouchableOpacity
                            key={mfy.id}
                            style={[styles.mfyOption, selected && styles.mfyOptionSelected]}
                            onPress={() => handleMfyToggle(mfy.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.mfyOptionText, selected && styles.mfyOptionTextSelected]}>
                              {mfy.name}
                            </Text>
                            <Ionicons
                              name={selected ? 'checkbox' : 'square-outline'}
                              size={20}
                              color={selected ? '#007AFF' : '#999'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleUpdateServiceAreas}
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
      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const webTimeInputStyle: any =
  Platform.OS === 'web'
    ? {
        width: '100%',
        padding: 10,
        fontSize: 15,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: '#e0e0e0',
        borderRadius: 10,
        backgroundColor: '#fff',
        color: '#1a1a1a',
        textAlign: 'center',
      }
    : {};

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
  notifNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifNavTextCol: {
    flex: 1,
    minWidth: 0,
  },
  notifNavTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  notifNavSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  notifBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    maxHeight: Platform.OS === 'web' ? '88%' : '80%',
    width: Platform.OS === 'web' ? '92%' : '100%',
    maxWidth: Platform.OS === 'web' ? 760 : undefined,
    paddingBottom: 28,
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
    paddingBottom: 26,
  },
  weekdayCard: {
    borderWidth: 1,
    borderColor: '#e7e7e7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekdayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  offBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e8f3ff',
  },
  offBadgeActive: {
    backgroundColor: '#eef1f4',
  },
  offBadgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  offBadgeTextActive: {
    color: '#6b7280',
  },
  weekdayTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  timeDash: {
    marginHorizontal: 6,
    color: '#666',
    fontWeight: '700',
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
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 50,
  },
  timePickerText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
  },
  infoHintValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mfyListContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    maxHeight: 320,
    overflow: 'hidden',
  },
  mfyList: {
    maxHeight: 300,
  },
  mfyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mfyOptionSelected: {
    backgroundColor: '#eef6ff',
  },
  mfyOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  mfyOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  mfyNamesContainer: {
    paddingTop: 10,
  },
  mfyNamesLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  mfyNamesValue: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
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
