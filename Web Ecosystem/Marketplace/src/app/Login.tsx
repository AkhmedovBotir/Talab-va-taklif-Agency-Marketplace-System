import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from '../components/ui/PhoneInput';
import apiService from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const digits = phone.replace(/\D/g, '');
  const fullPhone = digits.length === 9 ? `+998${digits}` : phone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!digits || digits.length !== 9) {
      setError("Telefon raqami to'liq kiritilishi shart (9 ta raqam)");
      return;
    }
    if (!password || password.length < 6) {
      setError('Parol kamida 6 belgi bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      await apiService.loginStep1(fullPhone, password);
      navigate('/sms-verify', { state: { phone: fullPhone, type: 'login' } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Kirish</h1>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 24 }}>
          Hisobingizga kirish uchun ma'lumotlaringizni kiriting
        </p>
        <form onSubmit={handleSubmit}>
          <PhoneInput
            label="Telefon raqami"
            value={phone}
            onChange={setPhone}
          />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Parol</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            style={{ width: '100%', padding: 12, marginBottom: 16, border: '1px solid var(--border)', borderRadius: 8 }}
          />
          {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Yuborilmoqda...' : 'Kirish'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password">Parolni unutdingizmi?</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/register">Hisobingiz yo'qmi? Ro'yxatdan o'tish</Link>
        </p>
      </div>
    </div>
  );
}
