import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SmsCodeInput from '../components/ui/SmsCodeInput';
import apiService from '../services/api';

export default function SmsVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as {
    phone?: string;
    type?: 'login' | 'register' | 'forgot_password';
    formData?: string;
  };
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = state.phone;
  if (!phone) {
    navigate('/login');
    return null;
  }

  const handleVerify = async (code: string) => {
    if (!phone) return;
    setError('');
    setLoading(true);
    try {
      if (state.type === 'register' && state.formData) {
        const formData = JSON.parse(state.formData) as {
          firstName: string;
          lastName: string;
          gender: 'ayol' | 'erkak';
          viloyat: string;
          tuman: string;
          mfy: string;
          birthDate: string;
          password: string;
        };
        const res = await apiService.registerStep2(
          formData.firstName,
          formData.lastName,
          phone,
          formData.gender,
          formData.viloyat,
          formData.tuman,
          formData.mfy,
          formData.birthDate,
          formData.password,
          code
        );
        if (res.data?.token && res.data?.user) {
          await login(res.data.token, res.data.user);
          navigate('/');
        } else {
          setError('Javob xato');
        }
      } else if (state.type === 'forgot_password') {
        navigate('/reset-password', { state: { phone, code } });
      } else {
        const res = await apiService.loginStep2(phone, code);
        if (res.data?.token && res.data?.user) {
          await login(res.data.token, res.data.user);
          navigate('/');
        } else {
          setError('Javob xato');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tasdiqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout" style={{ justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>
          {state.type === 'register'
            ? "Ro'yxatdan o'tish"
            : state.type === 'forgot_password'
            ? 'Parolni tiklash'
            : 'Kirish'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 24 }}>
          {phone} raqamiga yuborilgan 5 raqamli kodni kiriting
        </p>
        <SmsCodeInput length={5} onComplete={handleVerify} error={error} />
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
          onClick={() => {
            // Fallback submit if user filled partially
            // SmsCodeInput already calls onComplete when full
          }}
        >
          {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>
      </div>
    </div>
  );
}
