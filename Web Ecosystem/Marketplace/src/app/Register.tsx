import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from '../components/ui/PhoneInput';
import apiService from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      setError("Telefon raqami 9 ta raqam bo'lishi kerak");
      return;
    }
    const fullPhone = `+998${digits}`;
    setLoading(true);
    try {
      await apiService.registerStep1(fullPhone);
      navigate('/register-form', { state: { phone: fullPhone } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Ro'yxatdan o'tish</h1>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 24 }}>
          Telefon raqamingizni kiriting
        </p>
        <form onSubmit={handleSubmit}>
          <PhoneInput
            label="Telefon raqami"
            value={phone}
            onChange={setPhone}
          />
          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Yuborilmoqda...' : 'Davom etish'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login">Allaqachon hisobingiz bormi? Kirish</Link>
        </p>
      </div>
    </div>
  );
}
