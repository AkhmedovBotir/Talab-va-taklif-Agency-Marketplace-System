import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoPerson,
  IoPersonOutline,
  IoBusinessOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
} from 'react-icons/io5';
import { apiService } from '../services/api';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import {
  formatPhoneNumber,
  formatPhoneForApi,
  removeCountryCode,
  formatPhoneForDisplay,
} from '../utils/phoneFormatter';
import { AlertModal } from './AlertModal';
import { ConfirmModal } from './ConfirmModal';
import styles from './Profile.module.css';

export function Profile() {
  const { deliveryProvider, token, refreshProfile, logout } = useDeliveryProviderAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: deliveryProvider?.name ?? '',
    phone: deliveryProvider ? removeCountryCode(deliveryProvider.phone) : '',
    notes: deliveryProvider?.notes ?? '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (deliveryProvider) {
      setFormData({
        name: deliveryProvider.name,
        phone: removeCountryCode(deliveryProvider.phone),
        notes: deliveryProvider.notes ?? '',
      });
    }
  }, [deliveryProvider]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '');
    if (numbers.length <= 9) {
      setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(numbers) }));
    }
  };

  const showAlert = (title: string, message: string) => setAlertState({ open: true, title, message });

  const handleSave = async () => {
    if (!token) return;
    if (!formData.name.trim() || !formData.phone.trim()) {
      showAlert('Xatolik', 'Ism va telefon raqami majburiy');
      return;
    }
    const formattedPhone = formatPhoneForApi(formData.phone);
    if (formattedPhone.length < 13) {
      showAlert('Xatolik', 'Telefon raqam to\'liq emas');
      return;
    }
    setLoading(true);
    try {
      await apiService.updateMyProfile(token, {
        name: formData.name.trim(),
        phone: formattedPhone,
        notes: formData.notes.trim() || undefined,
      });
      await refreshProfile();
      setEditing(false);
      showAlert('Muvaffaqiyatli', 'Profil yangilandi');
    } catch (err) {
      showAlert('Xatolik', err instanceof Error ? err.message : 'Profilni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => setLogoutConfirmOpen(true);

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    logout().then(() => navigate('/login', { replace: true }));
  };

  if (!deliveryProvider) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AlertModal
        open={alertState.open}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
      />
      <ConfirmModal
        open={logoutConfirmOpen}
        title="Chiqish"
        message="Tizimdan chiqmoqchimisiz?"
        confirmLabel="Chiqish"
        cancelLabel="Bekor qilish"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
      <div className={styles.headerSection}>
        <div className={styles.avatarContainer}>
          <IoPerson size={40} color="#007AFF" />
        </div>
        <h1 className={styles.headerName}>{deliveryProvider.name}</h1>
        <p className={styles.headerPhone}>{formatPhoneForDisplay(deliveryProvider.phone)}</p>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoPersonOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Shaxsiy ma'lumotlar</h2>
        </div>
        <div className={styles.inputContainer}>
          <label className={styles.label}>Ism</label>
          {editing ? (
            <input
              className={styles.input}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ismingizni kiriting"
              disabled={loading}
            />
          ) : (
            <p className={styles.value}>{deliveryProvider.name}</p>
          )}
        </div>
        <div className={styles.inputContainer}>
          <label className={styles.label}>Telefon raqami</label>
          {editing ? (
            <div className={styles.phoneInputGroup}>
              <span className={styles.countryCode}>+998</span>
              <input
                className={styles.phoneInput}
                placeholder="90 123 45 67"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={13}
                disabled={loading}
              />
            </div>
          ) : (
            <p className={styles.value}>{formatPhoneForDisplay(deliveryProvider.phone)}</p>
          )}
        </div>
        <div className={styles.inputContainer}>
          <label className={styles.label}>Eslatmalar</label>
          {editing ? (
            <textarea
              className={[styles.input, styles.textArea].join(' ')}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Eslatmalar"
              rows={4}
              disabled={loading}
            />
          ) : (
            <p className={styles.value}>{deliveryProvider.notes || "Eslatmalar yo'q"}</p>
          )}
        </div>
        {editing ? (
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={[styles.button, styles.cancelButton].join(' ')}
              onClick={() => {
                setEditing(false);
                setFormData({
                  name: deliveryProvider.name,
                  phone: formatPhoneNumber(removeCountryCode(deliveryProvider.phone)),
                  notes: deliveryProvider.notes ?? '',
                });
              }}
              disabled={loading}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className={[styles.button, styles.saveButton].join(' ')}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        ) : (
          <button type="button" className={styles.button} onClick={() => setEditing(true)}>
            Tahrirlash
          </button>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoBusinessOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Kontragent ma'lumotlari</h2>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Kontragent nomi:</span>
          <span className={styles.value}>{deliveryProvider.contragent.name}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Telefon:</span>
          <span className={styles.value}>
            {formatPhoneForDisplay(deliveryProvider.contragent.phone)}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Manzil:</span>
          <span className={styles.value}>
            {deliveryProvider.contragent.viloyat.name}
            {deliveryProvider.contragent.tuman && `, ${deliveryProvider.contragent.tuman.name}`}
            {deliveryProvider.contragent.mfy && `, ${deliveryProvider.contragent.mfy.name}`}
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <IoShieldCheckmarkOutline size={20} color="#007AFF" />
          <h2 className={styles.sectionTitle}>Hisob holati</h2>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Holat:</span>
          <span
            className={styles.statusBadge}
            style={{
              backgroundColor: deliveryProvider.status === 'active' ? '#34C759' : '#FF9500',
            }}
          >
            {deliveryProvider.status === 'active' ? 'Faol' : 'Nofaol'}
          </span>
        </div>
      </section>

      <button type="button" className={styles.logoutButton} onClick={handleLogoutClick}>
        <IoLogOutOutline size={20} color="#fff" />
        <span>Chiqish</span>
      </button>
    </div>
  );
}
