import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getFirstAllowedPath } from '../utils/permissions';
import { useSnackbar } from '../contexts/SnackbarContext';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Login as LoginIcon,
} from '@mui/icons-material';

const Login = () => {
  const { showSuccess, showError } = useSnackbar();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading, admin, authError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && admin) {
      const target = getFirstAllowedPath(admin) || '/dashboard';
      navigate(target);
    }
  }, [isAuthenticated, authLoading, admin, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-300 border-t-white rounded-full"
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      showSuccess('Muvaffaqiyatli kirildi');
      const stored = localStorage.getItem('adminData');
      let target = '/dashboard';
      try {
        if (stored) target = getFirstAllowedPath(JSON.parse(stored)) || '/dashboard';
      } catch {
        /* ignore */
      }
      navigate(target);
    } else {
      const errorMsg = result.error || "Username yoki parol noto'g'ri";
      setError(errorMsg);
      showError(errorMsg);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 bg-indigo-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-indigo-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <AdminPanelSettings className="text-white" style={{ fontSize: 48 }} />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold mb-4"
          >
            Admin Panel
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-indigo-200 text-lg"
          >
            Boshqaruv tizimiga xush kelibsiz
          </motion.p>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex justify-center gap-4"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                className="w-3 h-3 bg-indigo-400 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="lg:hidden flex justify-center mb-8"
          >
            <div className="w-16 h-16 bg-indigo-900 rounded-xl flex items-center justify-center shadow-lg">
              <AdminPanelSettings className="text-white" style={{ fontSize: 32 }} />
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tizimga kirish</h2>
            <p className="text-gray-500">Ma'lumotlaringizni kiriting</p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
          {error && (
            <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
                <p className="text-sm text-red-600 text-center">{error}</p>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Login Form */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Person style={{ fontSize: 20 }} />
                </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                  placeholder="Username kiriting"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parol
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock style={{ fontSize: 20 }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Parol kiriting"
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <VisibilityOff style={{ fontSize: 20 }} />
                  ) : (
                    <Visibility style={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full bg-indigo-900 text-white py-3.5 px-4 rounded-xl font-medium hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>Kirilmoqda...</span>
                </>
              ) : (
                <>
                  <LoginIcon style={{ fontSize: 20 }} />
                  <span>Kirish</span>
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-sm text-gray-400"
          >
            © 2024 Admin Panel. Barcha huquqlar himoyalangan.
          </motion.p>
        </motion.div>
        </div>

    </div>
  );
};

export default Login;
