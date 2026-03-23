import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Warning, Delete } from '@mui/icons-material';
import { baseProductAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteBaseProductModal = ({ open, onClose, onSuccess, baseProduct }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await baseProductAPI.deleteBaseProduct(baseProduct._id);
      if (response.success) {
        showSuccess(response.message || 'Shablon muvaffaqiyatli o\'chirildi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Shablon o\'chirishda xatolik yuz berdi';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  if (!baseProduct) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Warning className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Shablonni o'chirish</h2>
                      <p className="text-xs text-red-100 mt-0.5">
                        Bu amalni qaytarib bo'lmaydi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all disabled:opacity-50"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Warning className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">
                      Siz haqiqatan ham <span className="font-bold text-red-600">"{baseProduct.name}"</span>{' '}
                      shablonini o'chirmoqchimisiz?
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Agar shablon maxalla dokonlarida ishlatilayotgan bo'lsa, o'chirish mumkin emas.
                    </p>
                    <p className="text-sm text-gray-500">
                      Bu amalni qaytarib bo'lmaydi va barcha ma'lumotlar butunlay o'chiriladi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-md hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                >
                  <Delete className="w-4 h-4" />
                  {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteBaseProductModal;
