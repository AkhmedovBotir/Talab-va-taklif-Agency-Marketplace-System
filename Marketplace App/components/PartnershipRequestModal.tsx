import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { CreatePartnershipRequest, Region } from '../services/api';
import RegionPicker from './ui/RegionPicker';

interface PartnershipRequestModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export default function PartnershipRequestModal({
  visible,
  onClose,
  token,
  onSuccess,
}: PartnershipRequestModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePartnershipRequest>({
    companyName: '',
    inn: '',
    mfo: '',
    accountNumber: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    activity: '',
    managerFirstName: '',
    managerLastName: '',
    managerPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim() || formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Kompaniya nomi kamida 2 ta belgi bo\'lishi kerak';
    }
    if (!formData.inn.trim() || !/^\d{9}$|^\d{12}$/.test(formData.inn.trim())) {
      newErrors.inn = 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak';
    }
    if (!formData.mfo.trim()) {
      newErrors.mfo = 'MFO raqami kiritilishi shart';
    }
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Hisob raqami kiritilishi shart';
    }
    if (!formData.viloyat) {
      newErrors.viloyat = 'Viloyat tanlanishi shart';
    }
    if (!formData.tuman) {
      newErrors.tuman = 'Tuman tanlanishi shart';
    }
    if (!formData.mfy) {
      newErrors.mfy = 'MFY tanlanishi shart';
    }
    if (!formData.activity.trim() || formData.activity.trim().length > 500) {
      newErrors.activity = 'Faoliyat turi kiritilishi shart (maksimal 500 belgi)';
    }
    if (!formData.managerFirstName.trim() || formData.managerFirstName.trim().length < 2) {
      newErrors.managerFirstName = 'Rahbar ismi kamida 2 ta belgi bo\'lishi kerak';
    }
    if (!formData.managerLastName.trim() || formData.managerLastName.trim().length < 2) {
      newErrors.managerLastName = 'Rahbar familiyasi kamida 2 ta belgi bo\'lishi kerak';
    }
    if (!formData.managerPhone.trim()) {
      newErrors.managerPhone = 'Rahbar telefon raqami kiritilishi shart';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.createPartnershipRequest(formData, token);
      if (response.success) {
        Alert.alert('Muvaffaqiyatli', 'Hamkorlik so\'rovi muvaffaqiyatli yuborildi');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          companyName: '',
          inn: '',
          mfo: '',
          accountNumber: '',
          viloyat: '',
          tuman: '',
          mfy: '',
          activity: '',
          managerFirstName: '',
          managerLastName: '',
          managerPhone: '',
        });
        setErrors({});
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Hamkorlik so\'rovini yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hamkorlik so'rovi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Kompaniya ma'lumotlari</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kompaniya nomi *</Text>
              <TextInput
                style={[styles.input, errors.companyName && styles.inputError]}
                placeholder="Kompaniya nomini kiriting"
                value={formData.companyName}
                onChangeText={(text) => {
                  setFormData({ ...formData, companyName: text });
                  if (errors.companyName) setErrors({ ...errors, companyName: '' });
                }}
              />
              {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>INN *</Text>
              <TextInput
                style={[styles.input, errors.inn && styles.inputError]}
                placeholder="INN raqamini kiriting (9 yoki 12 raqam)"
                value={formData.inn}
                onChangeText={(text) => {
                  setFormData({ ...formData, inn: text.replace(/\D/g, '') });
                  if (errors.inn) setErrors({ ...errors, inn: '' });
                }}
                keyboardType="numeric"
                maxLength={12}
              />
              {errors.inn && <Text style={styles.errorText}>{errors.inn}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MFO *</Text>
              <TextInput
                style={[styles.input, errors.mfo && styles.inputError]}
                placeholder="MFO raqamini kiriting"
                value={formData.mfo}
                onChangeText={(text) => {
                  setFormData({ ...formData, mfo: text });
                  if (errors.mfo) setErrors({ ...errors, mfo: '' });
                }}
              />
              {errors.mfo && <Text style={styles.errorText}>{errors.mfo}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hisob raqami (XR) *</Text>
              <TextInput
                style={[styles.input, errors.accountNumber && styles.inputError]}
                placeholder="Hisob raqamini kiriting"
                value={formData.accountNumber}
                onChangeText={(text) => {
                  setFormData({ ...formData, accountNumber: text });
                  if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                }}
              />
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Manzil</Text>

            <View style={styles.inputGroup}>
              <RegionPicker
                label="Viloyat *"
                value={formData.viloyat}
                type="region"
                onSelect={(region: Region) => {
                  setFormData({
                    ...formData,
                    viloyat: region._id,
                    tuman: '',
                    mfy: '',
                  });
                  if (errors.viloyat) setErrors({ ...errors, viloyat: '' });
                }}
              />
              {errors.viloyat && <Text style={styles.errorText}>{errors.viloyat}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <RegionPicker
                label="Tuman *"
                value={formData.tuman}
                type="district"
                parentId={formData.viloyat}
                onSelect={(region: Region) => {
                  setFormData({
                    ...formData,
                    tuman: region._id,
                    mfy: '',
                  });
                  if (errors.tuman) setErrors({ ...errors, tuman: '' });
                }}
                disabled={!formData.viloyat}
              />
              {errors.tuman && <Text style={styles.errorText}>{errors.tuman}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <RegionPicker
                label="MFY *"
                value={formData.mfy}
                type="mfy"
                parentId={formData.tuman}
                onSelect={(region: Region) => {
                  setFormData({ ...formData, mfy: region._id });
                  if (errors.mfy) setErrors({ ...errors, mfy: '' });
                }}
                disabled={!formData.tuman}
              />
              {errors.mfy && <Text style={styles.errorText}>{errors.mfy}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Faoliyat</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Faoliyat turi *</Text>
              <TextInput
                style={[styles.textArea, errors.activity && styles.inputError]}
                placeholder="Faoliyat turini kiriting (maksimal 500 belgi)"
                value={formData.activity}
                onChangeText={(text) => {
                  if (text.length <= 500) {
                    setFormData({ ...formData, activity: text });
                    if (errors.activity) setErrors({ ...errors, activity: '' });
                  }
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{formData.activity.length}/500</Text>
              {errors.activity && <Text style={styles.errorText}>{errors.activity}</Text>}
            </View>

            <Text style={styles.sectionTitle}>Rahbar ma'lumotlari</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rahbar ismi *</Text>
              <TextInput
                style={[styles.input, errors.managerFirstName && styles.inputError]}
                placeholder="Rahbar ismini kiriting"
                value={formData.managerFirstName}
                onChangeText={(text) => {
                  setFormData({ ...formData, managerFirstName: text });
                  if (errors.managerFirstName) setErrors({ ...errors, managerFirstName: '' });
                }}
              />
              {errors.managerFirstName && (
                <Text style={styles.errorText}>{errors.managerFirstName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rahbar familiyasi *</Text>
              <TextInput
                style={[styles.input, errors.managerLastName && styles.inputError]}
                placeholder="Rahbar familiyasini kiriting"
                value={formData.managerLastName}
                onChangeText={(text) => {
                  setFormData({ ...formData, managerLastName: text });
                  if (errors.managerLastName) setErrors({ ...errors, managerLastName: '' });
                }}
              />
              {errors.managerLastName && (
                <Text style={styles.errorText}>{errors.managerLastName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rahbar telefon raqami *</Text>
              <TextInput
                style={[styles.input, errors.managerPhone && styles.inputError]}
                placeholder="+998901234567"
                value={formData.managerPhone}
                onChangeText={(text) => {
                  setFormData({ ...formData, managerPhone: text });
                  if (errors.managerPhone) setErrors({ ...errors, managerPhone: '' });
                }}
                keyboardType="phone-pad"
              />
              {errors.managerPhone && <Text style={styles.errorText}>{errors.managerPhone}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Yuborish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e5e7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});




