import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import RegionPicker from '../../components/ui/RegionPicker';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { Region } from '../../services/api';

export default function RegisterFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'erkak' as 'ayol' | 'erkak',
    viloyat: '',
    viloyatId: '',
    tuman: '',
    tumanId: '',
    mfy: '',
    mfyId: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const lastNameRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = 'Ism kamida 2 ta belgi va bo\'sh bo\'lmasligi kerak';
    } else if (!/^[A-Za-z\u0400-\u04FF' -]+$/.test(firstName)) {
      newErrors.firstName = 'Ism faqat harflardan iborat bo\'lishi kerak';
    }

    if (!lastName || lastName.length < 2) {
      newErrors.lastName = 'Familiya kamida 2 ta belgi va bo\'sh bo\'lmasligi kerak';
    } else if (!/^[A-Za-z\u0400-\u04FF' -]+$/.test(lastName)) {
      newErrors.lastName = 'Familiya faqat harflardan iborat bo\'lishi kerak';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Tug\'ilgan sana kiritilishi shart';
    } else {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      if (isNaN(birth.getTime())) {
        newErrors.birthDate = 'Tug\'ilgan sana noto\'g\'ri formatda';
      } else {
        if (birth > today) {
          newErrors.birthDate = 'Tug\'ilgan sana kelajakda bo\'lishi mumkin emas';
        }
      }
    }

    if (!formData.viloyatId || !formData.tumanId || !formData.mfyId) {
      newErrors.region = 'Viloyat, tuman va MFY tanlanishi shart';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Parol kamida 8 ta belgi bo\'lishi kerak';
    } else if (!/[0-9]/.test(formData.password) || !/[A-Za-z]/.test(formData.password)) {
      newErrors.password = 'Parolda kamida 1 ta harf va 1 ta raqam bo\'lishi kerak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Parolni tasdiqlash maydoni to\'ldirilishi shart';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendSmsCode = async () => {
    Keyboard.dismiss();

    if (!phone) {
      Alert.alert('Xatolik', 'Telefon raqami topilmadi, qaytadan urinib ko\'ring');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Send SMS code - this will check if phone is already registered
      await apiService.registerStep1(phone || '');
      
      // Save form data to pass to SMS verify screen
      const formDataString = JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        viloyat: formData.viloyatId,
        tuman: formData.tumanId,
        mfy: formData.mfyId,
        birthDate: formData.birthDate,
        password: formData.password,
      });

      // Navigate to SMS verification with form data
      router.push({
        pathname: '/(auth)/sms-verify',
        params: {
          phone,
          type: 'register',
          formData: formDataString,
        },
      });
    } catch (error: any) {
      // If error about phone already registered, redirect to login
      if (error.message?.includes('ro\'yxatdan o\'tgan') || error.message?.includes('already')) {
        Alert.alert(
          'Hisob mavjud',
          'Bu telefon raqami bilan allaqachon ro\'yxatdan o\'tilgan. Kirish sahifasiga o\'tishni xohlaysizmi?',
          [
            { text: 'Bekor qilish', style: 'cancel' },
            {
              text: 'Kirish',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Xatolik', error.message || 'Kod yuborishda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Card>
            <View style={styles.header}>
              <Text style={styles.stepText}>2 / 3-qadam</Text>
              <Text style={styles.title}>Ma'lumotlarni to'ldiring</Text>
              <Text style={styles.subtitle}>
                Ro'yxatdan o'tish uchun ma'lumotlarni diqqat bilan va to'liq kiriting
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>
            <Input
              label="Ism"
              placeholder="Ismingizni kiriting"
              value={formData.firstName}
              onChangeText={(text) => {
                setFormData({ ...formData, firstName: text });
                if (errors.firstName) setErrors({ ...errors, firstName: '' });
              }}
              error={errors.firstName}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={lastNameRef}
              label="Familiya"
              placeholder="Familiyangizni kiriting"
              value={formData.lastName}
              onChangeText={(text) => {
                setFormData({ ...formData, lastName: text });
                if (errors.lastName) setErrors({ ...errors, lastName: '' });
              }}
              error={errors.lastName}
              returnKeyType="next"
            />

            <View style={styles.genderContainer}>
              <Text style={styles.label}>Jins</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'erkak' && styles.genderButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'erkak' })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === 'erkak' && styles.genderTextActive,
                    ]}
                  >
                    Erkak
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'ayol' && styles.genderButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'ayol' })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === 'ayol' && styles.genderTextActive,
                    ]}
                  >
                    Ayol
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tug'ilgan sana</Text>
            <View style={styles.dateContainer}>
              <Text style={styles.label}>Tug'ilgan sana</Text>
              {Platform.OS === 'web' ? (
                React.createElement('input', {
                  type: 'date',
                  value: formData.birthDate,
                  max: new Date().toISOString().split('T')[0],
                  onChange: (e: { target: { value: string } }) => {
                    const v = e.target.value;
                    setFormData({ ...formData, birthDate: v });
                    if (errors.birthDate) setErrors({ ...errors, birthDate: '' });
                  },
                  style: {
                    width: '100%',
                    padding: 12,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: errors.birthDate ? '#dc3545' : '#ccc',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                  },
                })
              ) : (
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    errors.birthDate && styles.dateInputError,
                  ]}
                  onPress={() => {
                    if (formData.birthDate) {
                      const date = new Date(formData.birthDate);
                      if (!isNaN(date.getTime())) {
                        setSelectedDate(date);
                      } else {
                        setSelectedDate(new Date());
                      }
                    } else {
                      setSelectedDate(new Date());
                    }
                    setShowDatePicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      !formData.birthDate && styles.dateInputPlaceholder,
                    ]}
                  >
                    {formData.birthDate || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
              )}
              {errors.birthDate && (
                <Text style={styles.errorText}>{errors.birthDate}</Text>
              )}
            </View>
              </View>

              {showDatePicker && Platform.OS !== 'web' && (
              <>
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.modalCancel}>Bekor qilish</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              if (selectedDate) {
                                const formattedDate = selectedDate
                                  .toISOString()
                                  .split('T')[0];
                                setFormData({
                                  ...formData,
                                  birthDate: formattedDate,
                                });
                                if (errors.birthDate)
                                  setErrors({ ...errors, birthDate: '' });
                              }
                              setShowDatePicker(false);
                            }}
                          >
                            <Text style={styles.modalDone}>Tasdiqlash</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate || new Date()}
                          mode="date"
                          display="spinner"
                          maximumDate={new Date()}
                          onChange={(event, date) => {
                            if (date) {
                              setSelectedDate(date);
                            }
                          }}
                          style={styles.datePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (event.type === 'set' && date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        setFormData({
                          ...formData,
                          birthDate: formattedDate,
                        });
                        setSelectedDate(date);
                        if (errors.birthDate)
                          setErrors({ ...errors, birthDate: '' });
                      }
                    }}
                  />
                )}
              </>
            )}
            
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Manzil ma'lumotlari</Text>
            <RegionPicker
              label="Viloyat"
              value={formData.viloyatId}
              type="region"
              onSelect={(region: Region) => {
                setFormData({
                  ...formData,
                  viloyat: region.name,
                  viloyatId: region._id,
                  tuman: '',
                  tumanId: '',
                  mfy: '',
                  mfyId: '',
                });
                if (errors.region) setErrors({ ...errors, region: '' });
              }}
              error={errors.region}
            />

            <RegionPicker
              label="Tuman"
              value={formData.tumanId}
              type="district"
              parentId={formData.viloyatId}
              onSelect={(region: Region) => {
                setFormData({
                  ...formData,
                  tuman: region.name,
                  tumanId: region._id,
                  mfy: '',
                  mfyId: '',
                });
                if (errors.region) setErrors({ ...errors, region: '' });
              }}
              error={errors.region}
              disabled={!formData.viloyatId}
            />

            <RegionPicker
              label="MFY"
              value={formData.mfyId}
              type="mfy"
              parentId={formData.tumanId}
              onSelect={(region: Region) => {
                setFormData({
                  ...formData,
                  mfy: region.name,
                  mfyId: region._id,
                });
                if (errors.region) setErrors({ ...errors, region: '' });
              }}
              error={errors.region}
              disabled={!formData.tumanId}
            />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kirish ma'lumotlari</Text>
            <PasswordInput
              label="Parol"
              placeholder="Parol kiriting"
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              ref={passwordRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
              showRules={true}
            />

            <PasswordInput
              ref={confirmPasswordRef}
              label="Parolni tasdiqlash"
              placeholder="Parolni qayta kiriting"
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSendSmsCode}
            />
              </View>

            <Button
              title="Davom etish"
              onPress={handleSendSmsCode}
              loading={loading}
              style={styles.button}
            />
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginBottom: 12,
  },
  genderContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
    justifyContent: 'center',
  },
  dateInputError: {
    borderColor: '#ef4444',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  dateInputPlaceholder: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
  },
});

