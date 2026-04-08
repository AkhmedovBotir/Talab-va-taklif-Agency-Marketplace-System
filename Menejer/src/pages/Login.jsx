import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  login as apiLogin,
  sendManagerCode,
  verifyManagerCode,
  resendManagerCode,
  setManagerPassword,
} from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: '',
  });
  const [setupForm, setSetupForm] = useState({
    phone: '',
    code: '',
    password: '',
  });
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSetupChange = (e) => {
    setSetupForm({
      ...setupForm,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const normalizePhone = (phone) => phone.trim();

  const handleSendCode = async (e) => {
    e.preventDefault();
    const phone = normalizePhone(setupForm.phone);
    if (!phone) {
      setError('Telefon raqami kiritilishi shart');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendManagerCode(phone);
      setSetupStep(2);
      setSuccess('SMS kod yuborildi. Kod 5 daqiqa amal qiladi.');
    } catch (err) {
      setError(err.message || 'Kodni yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const phone = normalizePhone(setupForm.phone);
    const code = setupForm.code.trim();

    if (!phone || !code) {
      setError('Telefon va kod majburiy');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyManagerCode(phone, code);
      setSetupStep(3);
      setSuccess('Kod tasdiqlandi. Endi parol o‘rnating.');
    } catch (err) {
      setError(err.message || 'Kod tasdiqlanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const phone = normalizePhone(setupForm.phone);
    if (!phone) {
      setError('Avval telefon raqamini kiriting');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await resendManagerCode(phone);
      setSuccess('Kod qayta yuborildi.');
    } catch (err) {
      setError(err.message || 'Kodni qayta yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    const phone = normalizePhone(setupForm.phone);
    const password = setupForm.password.trim();

    if (!phone || !password) {
      setError('Telefon va parol majburiy');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await setManagerPassword(phone, password);
      const userData = response?.manager || response?.data?.manager || response?.data || null;
      if (userData) {
        login(userData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Parol o‘rnatishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!loginForm.phone.trim()) {
      setError('Telefon raqami kiritilishi shart');
      setLoading(false);
      return;
    }

    if (!loginForm.password.trim()) {
      setError('Parol kiritilishi shart');
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin(loginForm.phone.trim(), loginForm.password.trim());
      
      const userData = response?.manager || response?.data?.manager || response?.data || null;
      if (userData) {
        login(userData);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login qilishda xatolik yuz berdi');
      }
    } catch (err) {
      setError(err.message || 'Login qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Viloyat Menejeri</h1>
          <p className="text-gray-600">{isSetupMode ? 'Parol o‘rnatish' : 'Hisobingizga kiring'}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(false);
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md text-sm font-medium transition ${!isSetupMode ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(true);
              setError('');
              setSuccess('');
            }}
            className={`py-2 rounded-md text-sm font-medium transition ${isSetupMode ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
          >
            Parol o‘rnatish
          </button>
        </div>

        <form onSubmit={isSetupMode ? (setupStep === 1 ? handleSendCode : setupStep === 2 ? handleVerifyCode : handleSetPassword) : handleLoginSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {isSetupMode && (
            <div className="text-xs text-gray-500">
              Qadam {setupStep}/3: {setupStep === 1 ? 'Kod yuborish' : setupStep === 2 ? 'Kod tasdiqlash' : 'Parol o‘rnatish'}
            </div>
          )}

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefon raqami
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={isSetupMode ? setupForm.phone : loginForm.phone}
              onChange={isSetupMode ? handleSetupChange : handleLoginChange}
              placeholder="+998901234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          {isSetupMode && setupStep === 2 && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                SMS kod
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={setupForm.code}
                onChange={handleSetupChange}
                placeholder="12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Kodni qayta yuborish
              </button>
            </div>
          )}

          {(!isSetupMode || setupStep === 3) && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parol
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={isSetupMode ? setupForm.password : loginForm.password}
                onChange={isSetupMode ? handleSetupChange : handleLoginChange}
                placeholder={isSetupMode ? 'Yangi parolni kiriting' : 'Parolni kiriting'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kirilmoqda...
              </span>
            ) : (
              isSetupMode ? (setupStep === 1 ? 'Kod yuborish' : setupStep === 2 ? 'Kodni tasdiqlash' : 'Parolni saqlash') : 'Kirish'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
