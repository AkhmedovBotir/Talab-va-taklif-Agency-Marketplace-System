import React, { useState } from 'react';
import { IoEyeOff, IoEye } from 'react-icons/io5';
import { apiService } from '../services/api';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import { AlertModal } from './AlertModal';
import styles from './Settings.module.css';

export function Settings() {
  const { token } = useDeliveryProviderAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => setAlertState({ open: true, title, message });
  const closeAlert = () => setAlertState((s) => ({ ...s, open: false }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert('Xatolik', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Xatolik', 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Xatolik', 'Yangi parol va tasdiqlash paroli mos kelmaydi');
      return;
    }
    if (currentPassword === newPassword) {
      showAlert('Xatolik', 'Yangi parol joriy paroldan farq qilishi kerak');
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      await apiService.changePassword(token, { currentPassword, newPassword });
      showAlert('Muvaffaqiyatli', 'Parol muvaffaqiyatli o\'zgartirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showAlert('Xatolik', err instanceof Error ? err.message : 'Parolni o\'zgartirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <AlertModal
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Parolni o'zgartirish</h2>
        <p className={styles.description}>
          Xavfsizlik uchun parolingizni muntazam ravishda o'zgartirishni tavsiya qilamiz.
        </p>

        <form onSubmit={handleChangePassword}>
          <div className={styles.inputContainer}>
            <label className={styles.label}>Joriy parol</label>
            <div className={styles.passwordInputGroup}>
              <input
                className={styles.passwordInput}
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Joriy parolni kiriting"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowCurrentPassword((v) => !v)}
                disabled={loading}
                aria-label={showCurrentPassword ? 'Yashirish' : 'Ko\'rsatish'}
              >
                {showCurrentPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Yangi parol</label>
            <div className={styles.passwordInputGroup}>
              <input
                className={styles.passwordInput}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Yangi parolni kiriting (min. 6 belgi)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowNewPassword((v) => !v)}
                disabled={loading}
              >
                {showNewPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
              </button>
            </div>
            <p className={styles.hint}>Kamida 6 belgidan iborat bo'lishi kerak</p>
          </div>

          <div className={styles.inputContainer}>
            <label className={styles.label}>Yangi parolni tasdiqlash</label>
            <div className={styles.passwordInputGroup}>
              <input
                className={styles.passwordInput}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Yangi parolni qayta kiriting"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword((v) => !v)}
                disabled={loading}
              >
                {showConfirmPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Kutilmoqda...' : "Parolni o'zgartirish"}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Xavfsizlik tavsiyalari</h2>
        <div className={styles.tipContainer}>
          <p className={styles.tipText}>• Parolni hech kimga bermang</p>
          <p className={styles.tipText}>• Parolni muntazam o'zgartiring</p>
          <p className={styles.tipText}>• Kuchli parol ishlating (harflar, raqamlar, belgilar)</p>
          <p className={styles.tipText}>• Boshqa saytlarda ishlatilgan parollardan foydalanmang</p>
        </div>
      </section>
    </div>
  );
}
