import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnackbar } from '../contexts/SnackbarContext';
import { apiService } from '../services/api';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { showSnackbar } = useSnackbar();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const horizontalPad = Math.max(16, Math.min(24, windowWidth * 0.05));
  const formMaxWidth = Math.min(Math.max(windowWidth - horizontalPad * 2, 280), 480);
  const isWide = windowWidth >= 600;

  useEffect(() => {
    if (visible) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = async () => {
    if (!oldPassword.trim()) {
      showSnackbar('Joriy parolni kiriting', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar('Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('Yangi parollar mos kelmaydi', 'error');
      return;
    }
    if (oldPassword === newPassword) {
      showSnackbar('Yangi parol joriy paroldan farq qilishi kerak', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.changePunktPassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showSnackbar(res.message || 'Parol muvaffaqiyatli yangilandi', 'success');
      onClose();
    } catch {
      /* Xato `api.ts` snackbar notifier orqali */
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <View
      style={[
        styles.sheetInner,
        Platform.OS === 'web' && styles.sheetInnerWeb,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={[styles.modalHeader, { paddingHorizontal: horizontalPad }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Parolni almashtirish</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPad,
            paddingTop: isWide ? 24 : 16,
            maxWidth: formMaxWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
      >
        <Text style={styles.hint}>
          Joriy parolingizni va yangi parolni kiriting (kamida 6 belgi).
        </Text>

        <PasswordField
          label="Joriy parol"
          value={oldPassword}
          onChangeText={setOldPassword}
          secure={!showOld}
          onToggleSecure={() => setShowOld(!showOld)}
          editable={!loading}
        />
        <PasswordField
          label="Yangi parol"
          value={newPassword}
          onChangeText={setNewPassword}
          secure={!showNew}
          onToggleSecure={() => setShowNew(!showNew)}
          editable={!loading}
        />
        <PasswordField
          label="Yangi parol (tasdiqlash)"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure={!showConfirm}
          onToggleSecure={() => setShowConfirm(!showConfirm)}
          editable={!loading}
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Saqlash</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
      transparent={Platform.OS === 'web'}
    >
      {Platform.OS === 'web' ? (
        <View style={styles.webOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
            disabled={loading}
          />
          <KeyboardAvoidingView
            behavior={undefined}
            style={[styles.webCardWrap, { maxWidth: formMaxWidth + horizontalPad * 2 }]}
          >
            {body}
          </KeyboardAvoidingView>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={[styles.nativeRoot, { paddingTop: insets.top }]}
          behavior={
            Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
          }
        >
          {body}
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  secure,
  onToggleSecure,
  editable,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure: boolean;
  onToggleSecure: () => void;
  editable: boolean;
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          placeholder="••••••"
          placeholderTextColor="#999"
          onSubmitEditing={onSubmitEditing}
        />
        <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn} disabled={!editable}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  webCardWrap: {
    width: '100%',
    maxHeight: '90%',
    zIndex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nativeRoot: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  sheetInner: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    minHeight: 200,
  },
  sheetInnerWeb: {
    maxHeight: 640,
    borderRadius: 16,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 12px 48px rgba(0,0,0,0.25)' } as object)
      : null),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  closeBtn: {
    padding: 4,
    width: 40,
  },
  headerSpacer: {
    width: 40,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
