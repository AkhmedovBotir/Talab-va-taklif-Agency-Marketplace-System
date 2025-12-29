import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Close, Delete, Warning } from '@mui/icons-material';
import { contragentTypeAPI } from '../../services/api';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DeleteContragentTypeModal = ({ open, onClose, onSuccess, contragentType }) => {
  const { showSuccess, showError } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await contragentTypeAPI.deleteContragentType(contragentType._id);
      if (response.success) {
        showSuccess(response.message || 'Kontragent turi muvaffaqiyatli o\'chirildi');
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMsg = err.message || 'Kontragent turi o\'chirishda xatolik yuz berdi';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!contragentType) return null;

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
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Warning className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">O'chirishni Tasdiqlash</h2>
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
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Quyidagi kontragent turini o'chirishni xohlaysizmi?
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">{contragentType.name}</p>
                    <p className="text-xs text-gray-600 mt-1 font-mono">{contragentType.icon}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Eslatma:</span> Bu kontragent turi o'chirilgandan keyin, 
                    bu turga tegishli kontragentlar o'zgartirilishi kerak bo'lishi mumkin.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                  >
                    <Delete className="w-4 h-4" />
                    {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteContragentTypeModal;




