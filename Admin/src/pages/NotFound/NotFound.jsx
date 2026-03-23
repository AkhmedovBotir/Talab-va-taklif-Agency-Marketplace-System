import { motion } from 'framer-motion';
import { Home, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="py-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-indigo-600 drop-shadow-lg">
            404
          </h1>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Sahifa topilmadi
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Kechirasiz, siz qidiryotgan sahifa mavjud emas.
          </p>
          <p className="text-base text-gray-500">
            Sahifa o'chirilgan, nomi o'zgartirilgan yoki vaqtincha mavjud emas bo'lishi mumkin.
          </p>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="w-64 h-64 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
            <svg
              className="w-40 h-40 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <Home />
            <span>Bosh sahifaga qaytish</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-medium shadow-lg hover:bg-indigo-50 transition-colors"
          >
            <ArrowBack />
            <span>Orqaga qaytish</span>
          </motion.button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-sm text-gray-500"
        >
          <p>
            Agar bu muammo davom etsa, iltimos{' '}
            <a href="mailto:support@example.com" className="text-indigo-600 hover:underline">
              qo'llab-quvvatlash xizmati
            </a>
            {' '}bilan bog'laning.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;


