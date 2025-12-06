import { Button } from '@/components/Button';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/Input';
import { RegionPicker } from '@/components/RegionPicker';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Region } from '@/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Ismni kiriting';
    if (!lastName.trim()) newErrors.lastName = 'Familiyani kiriting';
    if (!password) newErrors.password = 'Parolni kiriting';
    if (password.length < 6) newErrors.password = 'Parol kamida 6 ta belgi bo\'lishi kerak';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Parollar mos kelmadi';
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

              <Input
                label="Parol"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.password}
                placeholder="Kamida 6 ta belgi"
              />

              <Input
                label="Parolni tasdiqlash"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.confirmPassword}
                placeholder="Parolni qayta kiriting"
              />

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
});
