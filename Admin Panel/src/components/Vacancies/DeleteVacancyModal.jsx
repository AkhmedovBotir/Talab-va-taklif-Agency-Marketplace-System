import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close } from '@mui/icons-material';
import { vacancyAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteVacancyModal = ({ open, onClose, onSuccess, vacancy }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!vacancy) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await vacancyAPI.deleteVacancy(vacancy._id);
      if (response.success) {
        showSuccess(response.message || 'Vakansiya muvaffaqiyatli o\'chirildi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Vakansiyani o\'chirishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!vacancy) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Vakansiyani o'chirish</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Close />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <p className="text-gray-700 mb-4">
                  Siz haqiqatan ham <span className="font-semibold">"{vacancy.name}"</span> vakansiyasini
                  o'chirmoqchimisiz?
                </p>
                <p className="text-sm text-gray-500">
                  Bu amalni qaytarib bo'lmaydi. Vakansiya va unga tegishli barcha so'rovnomalar o'chiriladi.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteVacancyModal;




