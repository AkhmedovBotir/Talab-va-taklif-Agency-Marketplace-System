import { Button } from '@/components/Button';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/Input';
import { RegionPicker } from '@/components/RegionPicker';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Region } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterFormScreen() {
  const { phone, code } = useLocalSearchParams<{ phone: string; code: string }>();
  const { login } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [birthDate, setBirthDate] = useState('');
  const [viloyat, setViloyat] = useState<Region | null>(null);
  const [tuman, setTuman] = useState<Region | null>(null);
  const [mfy, setMfy] = useState<Region | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parol talablarini tekshirish
  const passwordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    const requirements = Object.values(passwordRequirements);
    const metCount = requirements.filter(Boolean).length;
    return {
      score: metCount,
      maxScore: requirements.length,
      percentage: (metCount / requirements.length) * 100,
    };
  }, [passwordRequirements]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Ismni kiriting';
    if (!lastName.trim()) newErrors.lastName = 'Familiyani kiriting';
    if (!password) {
      newErrors.password = 'Parolni kiriting';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 ta belgi bo\'lishi kerak';
    } else if (!passwordRequirements.hasUpperCase || !passwordRequirements.hasLowerCase || !passwordRequirements.hasNumber) {
      newErrors.password = 'Parol katta harf, kichik harf va raqamni o\'z ichiga olishi kerak';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Parolni tasdiqlang';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmadi';
    }
    if (!birthDate) newErrors.birthDate = 'Tug\'ilgan sanani kiriting';
    if (!viloyat) newErrors.viloyat = 'Viloyatni tanlang';
    if (!tuman) newErrors.tuman = 'Tumanni tanlang';
    if (!mfy) newErrors.mfy = 'MFY ni tanlang';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    if (!phone || !code) {
      Alert.alert('Xatolik', 'Ma\'lumotlar to\'liq emas');
      return;
    }

    setLoading(true);
    try {
      const { token, applicant } = await apiService.registerConfirm({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
        gender,
        birthDate,
        viloyat: viloyat!._id,
        tuman: tuman!._id,
        mfy: mfy!._id,
        password,
        code,
      });

      await login(token, applicant);
      router.replace('/(tabs)/vacancies');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18); // Minimum 18 years old
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100); // Maximum 100 years old

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Ma'lumotlarni kiriting</Text>
              <Text style={styles.subtitle}>
                Barcha maydonlarni to'ldiring
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Ism"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
                autoCapitalize="words"
                placeholder="Ismingizni kiriting"
              />

              <Input
                label="Familiya"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
                autoCapitalize="words"
                placeholder="Familiyangizni kiriting"
              />

              <DatePicker
                label="Tug'ilgan sana"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="Sana tanlang"
                error={errors.birthDate}
                maximumDate={maxDate}
                minimumDate={minDate}
              />

              <View style={styles.genderContainer}>
                <Text style={styles.label}>Jins</Text>
                <View style={styles.genderOptions}>
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderButton,
                        gender === g && styles.genderButtonActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          gender === g && styles.genderButtonTextActive,
                        ]}
                      >
                        {g === 'male' ? 'Erkak' : g === 'female' ? 'Ayol' : 'Boshqa'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <RegionPicker
                label="Viloyat"
                type="region"
                value={viloyat?._id}
                onSelect={(region) => {
                  setViloyat(region);
                  setTuman(null);
                  setMfy(null);
                }}
                error={errors.viloyat}
              />

              <RegionPicker
                label="Tuman"
                type="district"
                parentId={viloyat?._id}
                value={tuman?._id}
                onSelect={(region) => {
                  setTuman(region);
                  setMfy(null);
                }}
                disabled={!viloyat}
                error={errors.tuman}
              />

              <RegionPicker
                label="MFY"
                type="mfy"
                parentId={tuman?._id}
                value={mfy?._id}
                onSelect={setMfy}
                disabled={!tuman}
                error={errors.mfy}
              />

              <View style={styles.passwordSection}>
                <Input
                  label="Parol"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  showPasswordToggle
                  error={errors.password}
                  placeholder="Parolni kiriting"
                />
                
                {/* Parol kuchi ko'rsatkich */}
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      <View
                        style={[
                          styles.passwordStrengthFill,
                          {
                            width: `${passwordStrength.percentage}%`,
                            backgroundColor:
                              passwordStrength.percentage < 40
                                ? '#EF4444'
                                : passwordStrength.percentage < 70
                                ? '#F59E0B'
                                : '#10B981',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.passwordStrengthText}>
                      {passwordStrength.percentage < 40
                        ? 'Zaif'
                        : passwordStrength.percentage < 70
                        ? 'O\'rtacha'
                        : 'Kuchli'}
                    </Text>
                  </View>
                )}

                {/* Parol talablari */}
                {password.length > 0 && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.passwordRequirementsTitle}>Parol talablari:</Text>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={passwordRequirements.minLength ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={passwordRequirements.minLength ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRequirements.minLength && styles.requirementTextMet,
                        ]}
                      >
                        Kamida 6 ta belgi
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={passwordRequirements.hasUpperCase ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={passwordRequirements.hasUpperCase ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRequirements.hasUpperCase && styles.requirementTextMet,
                        ]}
                      >
                        Kamida 1 ta katta harf (A-Z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={passwordRequirements.hasLowerCase ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={passwordRequirements.hasLowerCase ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRequirements.hasLowerCase && styles.requirementTextMet,
                        ]}
                      >
                        Kamida 1 ta kichik harf (a-z)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={passwordRequirements.hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={passwordRequirements.hasNumber ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRequirements.hasNumber && styles.requirementTextMet,
                        ]}
                      >
                        Kamida 1 ta raqam (0-9)
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={passwordRequirements.hasSpecialChar ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={passwordRequirements.hasSpecialChar ? '#10B981' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          passwordRequirements.hasSpecialChar && styles.requirementTextMet,
                        ]}
                      >
                        Kamida 1 ta maxsus belgi (!@#$%...)
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Input
                label="Parolni tasdiqlash"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.confirmPassword}
                placeholder="Parolni qayta kiriting"
              />
              
              {/* Parol mos kelish ko'rsatkich */}
              {confirmPassword.length > 0 && password.length > 0 && (
                <View style={styles.passwordMatchContainer}>
                  <Ionicons
                    name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={password === confirmPassword ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.passwordMatchText,
                      password === confirmPassword && styles.passwordMatchTextSuccess,
                    ]}
                  >
                    {password === confirmPassword ? 'Parollar mos keladi' : 'Parollar mos kelmaydi'}
                  </Text>
                </View>
              )}

              <Button
                title="Ro'yxatdan o'tish"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  passwordSection: {
    marginBottom: 16,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'right',
  },
  passwordRequirements: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordRequirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  requirementTextMet: {
    color: '#10B981',
    fontWeight: '500',
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  passwordMatchText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  passwordMatchTextSuccess: {
    color: '#10B981',
  },
});
