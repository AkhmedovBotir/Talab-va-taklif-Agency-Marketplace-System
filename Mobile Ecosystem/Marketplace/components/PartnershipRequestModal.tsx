import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import api, { CreatePartnershipRequest, Region, ContragentType } from '../services/api';
import { useSnackbar } from '../contexts/SnackbarContext';
import RegionPicker from './ui/RegionPicker';
import ActivityTypePicker from './ui/ActivityTypePicker';
import PhoneInput from './ui/PhoneInput';

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
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const managerPhoneInputRef = useRef<TextInput>(null);
  const [formData, setFormData] = useState<CreatePartnershipRequest>({
    companyName: '',
    inn: '',
    mfo: '',
    accountNumber: '',
    viloyat: '',
    tuman: '',
    mfy: '',
    activityType: '',
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
    if (!formData.activityType) {
      newErrors.activityType = 'Faoliyat turi tanlanishi shart';
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
        showSuccess('Hamkorlik so\'rovi muvaffaqiyatli yuborildi');
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
          activityType: '',
          managerFirstName: '',
          managerLastName: '',
          managerPhone: '',
        });
        setErrors({});
      }
    } catch (error: any) {
      showError(error.message || 'Hamkorlik so\'rovini yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => (
    <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Hamkorlik so'rovi</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.modalBody}
        contentContainerStyle={styles.modalBodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        bounces={false}
        keyboardDismissMode="interactive"
      >
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
          <ActivityTypePicker
            label="Faoliyat turi *"
            value={formData.activityType}
            onSelect={(activityType: ContragentType) => {
              setFormData({ ...formData, activityType: activityType._id });
              if (errors.activityType) setErrors({ ...errors, activityType: '' });
            }}
            error={errors.activityType}
          />
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
          <PhoneInput
            ref={managerPhoneInputRef}
            label="Rahbar telefon raqami *"
            value={formData.managerPhone}
            onChangeText={(text) => {
              setFormData({ ...formData, managerPhone: text });
              if (errors.managerPhone) setErrors({ ...errors, managerPhone: '' });
            }}
            error={errors.managerPhone}
            onFocus={() => {
              // Ensure the input is visible when keyboard appears
              // KeyboardAvoidingView will handle most of the positioning
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
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
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {renderModalContent()}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
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
    flexGrow: 1,
  },
  modalBodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100, // Extra padding for keyboard visibility
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
