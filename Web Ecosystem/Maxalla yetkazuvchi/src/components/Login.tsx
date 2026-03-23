import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPerson, IoEyeOff, IoEye } from 'react-icons/io5';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import { formatPhoneNumber, formatPhoneForApi } from '../utils/phoneFormatter';
import styles from './Login.module.css';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useDeliveryProviderAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '');
    if (numbers.length <= 9) setPhone(formatPhoneNumber(numbers));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password.trim()) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    const formattedPhone = formatPhoneForApi(phone);
    if (formattedPhone.length < 13) {
      setError('Telefon raqam to\'liq emas');
      return;
    }
    setLoading(true);
    try {
      await login(formattedPhone, password);
      navigate('/orders', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telefon raqami yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.iconWrap}>
            <IoPerson size={48} color="#007AFF" />
          </div>
          <h1 className={styles.title}>Yetkazib Beruvchi</h1>
          <p className={styles.subtitle}>Tizimga kirish</p>
        </header>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Telefon raqami</label>
            <div className={styles.inputWrap}>
              <span className={styles.prefix}>+998</span>
              <span className={styles.divider} />
              <input
                className={styles.input}
                type="tel"
                placeholder="90 123 45 67"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={13}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parol</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Parolni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                disabled={loading}
                aria-label={showPassword ? 'Yashirish' : 'Ko\'rsatish'}
              >
                {showPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Kiring...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
