import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { phone?: string; code?: string };
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = state.phone;
  const code = state.code;

  if (!phone || !code) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!password || password.length < 6) {
      errs.push("Parol kamida 6 belgi bo'lishi kerak");
    }
    if (password !== confirmPassword) {
      errs.push('Parollar mos kelmaydi');
    }
    if (errs.length) {
      setError(errs.join('. '));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiService.forgotPasswordStep2(phone, code, password);
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Parolni yangilashda xatolik yuz berdi'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Yangi parol</h1>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 24 }}>
          Yangi parolingizni kiriting
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Yangi parol
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kamida 6 belgi"
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 12,
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Parolni tasdiqlash
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Parolni qayta kiriting"
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 12,
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Yuborilmoqda...' : 'Parolni yangilash'}
          </button>
        </form>
      </div>
    </div>
  );
}

