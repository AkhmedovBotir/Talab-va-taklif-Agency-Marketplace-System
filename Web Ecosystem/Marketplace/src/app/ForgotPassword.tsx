import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from '../components/ui/PhoneInput';
import apiService from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length !== 9) {
      setError("Telefon raqami to'liq kiritilishi shart (9 ta raqam)");
      return;
    }
    const fullPhone = `+998${digits}`;
    setError('');
    setLoading(true);
    try {
      await apiService.forgotPasswordStep1(fullPhone);
      navigate('/sms-verify', {
        state: { phone: fullPhone, type: 'forgot_password' },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kod yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Parolni tiklash</h1>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 24 }}>
          Parolni tiklash uchun telefon raqamingizga tasdiqlash kodi yuboriladi
        </p>
        <form onSubmit={handleSubmit}>
          <PhoneInput
            label="Telefon raqami"
            value={phone}
            onChange={setPhone}
            error={error}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Yuborilmoqda...' : 'Kodni olish'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login">Parolingizni eslaysizmi? Kirish</Link>
        </p>
      </div>
    </div>
  );
}

